import "server-only";
import { prisma } from "@/lib/prisma";
import { computeJobHeadcountMetrics, evaluateHeadcountGate } from "@/lib/headcount-rules";
import { dispatchN8NRejectionEmail } from "@/lib/n8n";
import { requirePermission } from "./auth";
import { DalError } from "./errors";
import { assertStageTransitionAllowed, maskApplicationBlindScorecard } from "./gates";

export async function getPipelineBoard(searchParams: URLSearchParams) {
  const sessionUser = await requirePermission("pipeline:read");

  const jobIdParam = searchParams.get("jobId");
  const searchParam = searchParams.get("search")?.trim().toLowerCase() || "";
  const sortByParam = searchParams.get("sortBy") || "NEWEST";
  const starredOnly = searchParams.get("starred") === "true";
  const unviewedOnly = searchParams.get("unviewed") === "true";
  const slaOnly = searchParams.get("slaOnly") === "true";
  const highMatchOnly = searchParams.get("highMatch") === "true";
  const limitPerStageParam = searchParams.get("limitPerStage");
  const limitPerStage = limitPerStageParam ? parseInt(limitPerStageParam, 10) : undefined;

  const rawJobs = await prisma.job.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      department: true,
      status: true,
      targetHeadcount: true,
      maxActiveInterviews: true,
      applications: {
        select: { currentStage: true },
      },
    },
  });

  const jobs = rawJobs.map(({ applications, ...job }) => {
    const hiredCount = applications.filter((a) => a.currentStage === "HIRED").length;
    const activeInterviewCount = applications.filter(
      (a) => a.currentStage === "INTERVIEW"
    ).length;
    return {
      ...job,
      headcountMetrics: computeJobHeadcountMetrics({
        targetHeadcount: job.targetHeadcount,
        maxActiveInterviews: job.maxActiveInterviews,
        hiredCount,
        activeInterviewCount,
        status: job.status,
      }),
    };
  });

  const whereClause: any = {};
  if (jobIdParam && jobIdParam !== "ALL") {
    whereClause.jobId = Number(jobIdParam);
  }
  if (starredOnly) whereClause.isStarred = true;
  if (unviewedOnly) whereClause.isViewed = false;
  if (highMatchOnly) whereClause.aiMatchScore = { gte: 75 };

  if (searchParam && searchParam.length >= 2) {
    whereClause.candidate = {
      OR: [
        { fullName: { contains: searchParam } },
        { email: { contains: searchParam } },
        { phone: { contains: searchParam } },
        { parsedSkills: { contains: searchParam } },
      ],
    };
  }

  const applications = await prisma.application.findMany({
    where: whereClause,
    include: {
      candidate: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          experienceYears: true,
          parsedSkills: true,
        },
      },
      job: {
        select: {
          id: true,
          title: true,
          department: true,
          minExperienceYears: true,
          requiredSkills: true,
        },
      },
      evaluations: {
        select: { id: true, evaluatorId: true, overallScore: true, recommendation: true },
      },
      auditLogs: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
    orderBy: { stageUpdatedAt: "desc" },
  });

  const now = Date.now();
  const columns: Record<string, any[]> = {
    NEW: [],
    SCREENING: [],
    INTERVIEW: [],
    OFFER: [],
    HIRED: [],
    REJECTED: [],
  };

  applications.forEach((app) => {
    const stage = app.currentStage in columns ? app.currentStage : "NEW";
    const hoursInStage = (now - new Date(app.stageUpdatedAt).getTime()) / (1000 * 60 * 60);
    let isSlaBreached = false;
    let slaMessage = "";

    if (stage === "NEW" && hoursInStage > 48) {
      isSlaBreached = true;
      slaMessage = `Tồn đọng ${Math.floor(hoursInStage)}h (Quá hạn 48h)`;
    } else if (stage === "SCREENING" && hoursInStage > 72) {
      isSlaBreached = true;
      slaMessage = `Sàng lọc ${Math.floor(hoursInStage)}h (Quá hạn 72h)`;
    }

    if (slaOnly && !isSlaBreached) return;

    // P0-02 (BRL-15): Ẩn chi tiết phiếu đánh giá đồng nghiệp trên Kanban cards khi người xem chưa tự đánh giá
    const maskedApp = maskApplicationBlindScorecard(sessionUser, app);

    columns[stage].push({
      ...maskedApp,
      hoursInStage: Math.floor(hoursInStage),
      isSlaBreached,
      slaMessage,
    });
  });

  const sortFn = (a: any, b: any) => {
    if (sortByParam === "OLDEST") {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    if (sortByParam === "STARRED_FIRST") {
      if (a.isStarred !== b.isStarred) return b.isStarred ? 1 : -1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sortByParam === "UNVIEWED_FIRST") {
      if (a.isViewed !== b.isViewed) return a.isViewed ? 1 : -1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sortByParam === "UNEVALUATED_FIRST") {
      const aHasEval = (a.totalEvaluationsCount ?? a.evaluations?.length ?? 0) > 0;
      const bHasEval = (b.totalEvaluationsCount ?? b.evaluations?.length ?? 0) > 0;
      if (aHasEval !== bHasEval) return aHasEval ? 1 : -1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    return (
      new Date(b.stageUpdatedAt || b.createdAt).getTime() -
      new Date(a.stageUpdatedAt || a.createdAt).getTime()
    );
  };

  Object.keys(columns).forEach((key) => columns[key].sort(sortFn));

  const stats = {
    total: applications.length,
    new: columns.NEW.length,
    screening: columns.SCREENING.length,
    interview: columns.INTERVIEW.length,
    offer: columns.OFFER.length,
    hired: columns.HIRED.length,
    rejected: columns.REJECTED.length,
  };

  const stagePagination: Record<string, { total: number; loaded: number; hasMore: boolean }> = {};
  Object.keys(columns).forEach((key) => {
    const total = columns[key].length;
    if (limitPerStage && limitPerStage > 0 && total > limitPerStage) {
      columns[key] = columns[key].slice(0, limitPerStage);
    }
    stagePagination[key] = {
      total,
      loaded: columns[key].length,
      hasMore: total > columns[key].length,
    };
  });

  return { jobs, columns, stagePagination, stats };
}

export async function movePipelineApplication(body: Record<string, any>) {
  const sessionUser = await requirePermission("pipeline:move");

  const {
    applicationId,
    toStage,
    rejectionReason,
    note,
    forceInterviewCapOverride,
  } = body;

  if (!applicationId || !toStage) {
    throw new DalError("BAD_REQUEST", {
      messageVi: "Thiếu ID hồ sơ hoặc trạng thái đích",
      messageEn: "Missing application ID or target stage.",
    });
  }

  const app = await prisma.application.findUnique({
    where: { id: Number(applicationId) },
    include: {
      candidate: true,
      job: true,
      evaluations: true,
    },
  });

  if (!app) {
    throw new DalError("NOT_FOUND", {
      messageVi: "Không tìm thấy hồ sơ ứng tuyển",
      messageEn: "Application not found.",
    });
  }

  const fromStage = app.currentStage;
  if (fromStage === toStage) {
    return {
      unchanged: true,
      data: maskApplicationBlindScorecard(sessionUser, app),
    };
  }

  const hasPassingEvaluation = app.evaluations.some(
    (ev) => ev.recommendation === "HIRE" || ev.recommendation === "STRONG_HIRE"
  );

  // Kiểm tra State Machine + RBAC Stage Authority + BRL-06 + BRL-11 tập trung tại DAL
  assertStageTransitionAllowed(sessionUser, {
    fromStage,
    toStage,
    evaluationsCount: app.evaluations.length,
    hasPassingEvaluation: app.evaluations.length > 0 ? hasPassingEvaluation : undefined,
    rejectionReason,
  });

  const [hiredCount, activeInterviewCount] = await Promise.all([
    prisma.application.count({ where: { jobId: app.jobId, currentStage: "HIRED" } }),
    prisma.application.count({ where: { jobId: app.jobId, currentStage: "INTERVIEW" } }),
  ]);

  const headcountCheck = evaluateHeadcountGate({
    jobTitle: app.job.title,
    fromStage,
    toStage,
    targetHeadcount: app.job.targetHeadcount,
    maxActiveInterviews: app.job.maxActiveInterviews,
    hiredCount,
    activeInterviewCount,
    forceOverride: Boolean(forceInterviewCapOverride),
  });

  if (!headcountCheck.allowed) {
    throw new DalError("BAD_REQUEST", {
      status: headcountCheck.statusCode || 400,
      messageVi: headcountCheck.error,
      messageEn: headcountCheck.error,
      extra: {
        requiresOverride: Boolean(headcountCheck.requiresOverride),
        headcountMetrics: headcountCheck.metrics,
      },
    });
  }

  let emailScheduledAt: Date | null = app.emailScheduledAt;
  let isEmailSent = app.isEmailSent;
  let savedRejectionReason: string | null = app.rejectionReason;
  let auditReason: string | null = note ? String(note).trim() : null;

  if (toStage === "REJECTED") {
    emailScheduledAt = new Date(Date.now() + 12 * 60 * 60 * 1000);
    isEmailSent = false;
    savedRejectionReason = String(rejectionReason).trim();
    auditReason = `Lý do từ chối: ${savedRejectionReason}`;
  } else if (fromStage === "REJECTED" && toStage !== "REJECTED") {
    emailScheduledAt = null;
    isEmailSent = false;
    savedRejectionReason = null;
    auditReason =
      auditReason || "Phục hồi hồ sơ từ cột Từ chối (tự động hủy lịch gửi email từ chối)";
  } else if (
    toStage === "INTERVIEW" &&
    forceInterviewCapOverride &&
    headcountCheck.metrics.isInterviewAtCap
  ) {
    auditReason =
      auditReason ||
      `Xác nhận vượt hạn mức phỏng vấn cùng lúc (${activeInterviewCount + 1}/${headcountCheck.metrics.effectiveInterviewCap})`;
  } else if (headcountCheck.willAutoCloseJob) {
    auditReason =
      auditReason ||
      `Hoàn thành chỉ tiêu tuyển dụng (${hiredCount + 1}/${headcountCheck.metrics.targetHeadcount}) — tự động đóng tin nhận hồ sơ`;
  }

  const txOps: any[] = [
    prisma.application.update({
      where: { id: app.id },
      data: {
        currentStage: toStage,
        stageUpdatedAt: new Date(),
        emailScheduledAt,
        isEmailSent,
        rejectionReason: savedRejectionReason,
        isViewed: true,
        viewedAt: app.viewedAt || new Date(),
      },
    }),
    prisma.auditLog.create({
      data: {
        applicationId: app.id,
        userId: sessionUser.id,
        fromStage,
        toStage,
        action: "STAGE_CHANGE",
        reason: auditReason,
      },
    }),
  ];

  if (headcountCheck.willAutoCloseJob) {
    txOps.push(
      prisma.job.update({
        where: { id: app.jobId },
        data: { status: "CLOSED" },
      })
    );
  }

  const [updatedApp] = await prisma.$transaction(txOps);

  if (toStage === "REJECTED" && emailScheduledAt) {
    try {
      await dispatchN8NRejectionEmail({
        event: "REJECTION_SCHEDULED",
        applicationId: app.id,
        candidate: { fullName: app.candidate.fullName, email: app.candidate.email },
        job: { title: app.job.title, department: app.job.department },
        rejectionReason: savedRejectionReason || "Chưa phù hợp ở thời điểm hiện tại",
        scheduledSendAt: emailScheduledAt.toISOString(),
        delayHours: 12,
        timestamp: new Date().toISOString(),
      });
    } catch (rejErr) {
      console.warn("Auto Rejection webhook warning:", rejErr);
    }
  } else if (fromStage === "REJECTED" && toStage !== "REJECTED") {
    try {
      await dispatchN8NRejectionEmail({
        event: "REJECTION_CANCELLED",
        applicationId: app.id,
        candidate: { fullName: app.candidate.fullName, email: app.candidate.email },
        job: { title: app.job.title, department: app.job.department },
        rejectionReason: "",
        scheduledSendAt: "",
        delayHours: 0,
        timestamp: new Date().toISOString(),
      });
    } catch (rejErr) {
      console.warn("Auto Rejection cancel webhook warning:", rejErr);
    }
  }

  return {
    unchanged: false,
    message: headcountCheck.willAutoCloseJob
      ? `Đã xác nhận Tuyển chọn (${hiredCount + 1}/${headcountCheck.metrics.targetHeadcount}). Tin tuyển dụng "${app.job.title}" đã tự động đóng nhận hồ sơ mới.`
      : `Đã chuyển hồ sơ sang cột ${toStage}`,
    jobAutoClosed: Boolean(headcountCheck.willAutoCloseJob),
    headcountMetrics: headcountCheck.metrics,
    data: updatedApp,
  };
}
