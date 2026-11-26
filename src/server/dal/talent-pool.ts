import "server-only";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "./auth";
import { DalError } from "./errors";
import { maskApplicationBlindScorecard } from "./gates";

export type TalentPoolStatus =
  | "SILVER_MEDALIST"
  | "IN_PIPELINE_WATCH"
  | "ARCHIVED_RESERVE";

function classifyTalentPoolStatus(app: {
  currentStage: string;
  isStarred: boolean;
  aiMatchScore: number | null;
  evaluations: { overallScore: number | null }[];
}): TalentPoolStatus {
  if (app.currentStage === "SCREENING" || app.currentStage === "INTERVIEW") {
    return "IN_PIPELINE_WATCH";
  }

  const hasGoodScorecard = app.evaluations.some(
    (ev) => ev.overallScore !== null && ev.overallScore >= 3.5
  );
  const isHighPotential =
    app.isStarred ||
    (app.aiMatchScore !== null && app.aiMatchScore >= 60) ||
    hasGoodScorecard;

  return isHighPotential ? "SILVER_MEDALIST" : "ARCHIVED_RESERVE";
}

export async function listTalentPool(searchParams: URLSearchParams) {
  const sessionUser = await requirePermission("talent-pool:read", {
    vi: "Chỉ Chuyên viên HR và Quản trị viên mới có quyền truy cập Kho nhân tài.",
    en: "Only HR Specialists and Administrators can access the Talent Pool.",
  });

  const search = searchParams.get("search")?.trim().toLowerCase() || "";
  const jobId = searchParams.get("jobId");
  const poolStatusFilter = searchParams.get("poolStatus") || "ALL";
  const sortBy = searchParams.get("sortBy") || "MATCH_DESC";
  const starredOnly = searchParams.get("starred") === "true";

  const where: Record<string, unknown> = {
    currentStage: { in: ["REJECTED", "SCREENING", "INTERVIEW"] },
  };
  if (jobId && jobId !== "ALL") {
    where.jobId = Number(jobId);
  }
  if (starredOnly) {
    where.isStarred = true;
  }
  if (search) {
    where.OR = [
      { candidate: { fullName: { contains: search } } },
      { candidate: { email: { contains: search } } },
      { candidate: { phone: { contains: search } } },
      { candidate: { parsedSkills: { contains: search } } },
      { job: { title: { contains: search } } },
    ];
  }

  const applications = await prisma.application.findMany({
    where,
    include: {
      candidate: true,
      job: true,
      evaluations: true,
    },
    orderBy: { stageUpdatedAt: "desc" },
  });

  const nowMs = Date.now();
  const enriched = applications
    .map((app) => {
      // P0-02 (BRL-15): Áp dụng Blind Scorecard trước khi phân loại và trả về dữ liệu Kho nhân tài
      const maskedApp = maskApplicationBlindScorecard(sessionUser, app);
      const poolStatus = classifyTalentPoolStatus(maskedApp);
      const daysSinceUpdated = Math.max(
        0,
        Math.floor((nowMs - new Date(app.stageUpdatedAt).getTime()) / (1000 * 60 * 60 * 24))
      );
      const retentionDaysLeft =
        app.currentStage === "REJECTED" ? Math.max(0, 180 - daysSinceUpdated) : null;

      return {
        ...maskedApp,
        poolStatus,
        daysInPool: daysSinceUpdated,
        retentionDaysLeft,
      };
    })
    .filter((item) => {
      if (poolStatusFilter !== "ALL" && item.poolStatus !== poolStatusFilter) {
        return false;
      }
      return true;
    });

  enriched.sort((a, b) => {
    if (sortBy === "MATCH_DESC") return (b.aiMatchScore ?? -1) - (a.aiMatchScore ?? -1);
    if (sortBy === "STARRED_FIRST") {
      if (a.isStarred !== b.isStarred) return a.isStarred ? -1 : 1;
      return (b.aiMatchScore ?? -1) - (a.aiMatchScore ?? -1);
    }
    if (sortBy === "OLDEST") {
      return new Date(a.stageUpdatedAt).getTime() - new Date(b.stageUpdatedAt).getTime();
    }
    return new Date(b.stageUpdatedAt).getTime() - new Date(a.stageUpdatedAt).getTime();
  });

  return enriched;
}

export async function repoolCandidate(body: { candidateId?: unknown; targetJobId?: unknown }) {
  const sessionUser = await requirePermission("talent-pool:write", {
    vi: "Chỉ Chuyên viên HR và Quản trị viên mới có quyền luân chuyển ứng viên trong Kho nhân tài.",
    en: "Only HR Specialists and Administrators can re-pool candidates.",
  });

  const candidateId = Number(body.candidateId);
  const targetJobId = Number(body.targetJobId);

  if (!Number.isInteger(candidateId) || candidateId <= 0 || !Number.isInteger(targetJobId) || targetJobId <= 0) {
    throw new DalError("BAD_REQUEST", {
      messageVi: "Thiếu mã ứng viên hoặc mã vị trí chuyển tuyển",
      messageEn: "Missing candidate ID or target job ID.",
    });
  }

  const candidate = await prisma.candidate.findUnique({ where: { id: candidateId } });
  if (!candidate) {
    throw new DalError("NOT_FOUND", {
      messageVi: "Không tìm thấy hồ sơ ứng viên này",
      messageEn: "Candidate not found.",
    });
  }

  const targetJob = await prisma.job.findUnique({ where: { id: targetJobId } });
  if (!targetJob) {
    throw new DalError("NOT_FOUND", {
      messageVi: "Không tìm thấy vị trí tuyển dụng đích",
      messageEn: "Target job not found.",
    });
  }

  const previousApp = await prisma.application.findFirst({
    where: { candidateId: candidate.id },
    orderBy: { createdAt: "desc" },
  });

  const newApp = await prisma.$transaction(async (tx) => {
    const created = await tx.application.create({
      data: {
        candidateId: candidate.id,
        jobId: targetJob.id,
        currentStage: "SCREENING",
        isViewed: true,
        viewedAt: new Date(),
        repooledFromId: previousApp ? previousApp.id : null,
        aiMatchScore: previousApp?.aiMatchScore ?? 70,
        aiMatchRationale: `Hồ sơ được khôi phục từ Kho nhân tài và luân chuyển sang vị trí ${targetJob.title} bởi chuyên viên tuyển dụng.`,
      },
    });
    await tx.auditLog.create({
      data: {
        applicationId: created.id,
        userId: sessionUser.id,
        fromStage: previousApp?.currentStage || "TALENT_POOL",
        toStage: "SCREENING",
        action: "TALENT_REPOOL",
        reason: `Khôi phục từ Kho nhân tài sang vị trí ${targetJob.title}`,
      },
    });
    return created;
  });

  return {
    message: `Đã khôi phục và chuyển ứng viên ${candidate.fullName} sang vị trí "${targetJob.title}" thành công.`,
    data: newApp,
  };
}

export async function cleanupExpiredTalentPool(body: { days?: unknown; dryRun?: unknown }) {
  const sessionUser = await requirePermission("talent-pool:cleanup", {
    vi: "Chỉ Quản trị viên mới có quyền dọn dẹp hồ sơ quá hạn lưu trữ.",
    en: "Only Administrators can purge expired archived records.",
  });

  const days = typeof body.days === "number" && body.days >= 0 ? body.days : 180;
  const dryRun = Boolean(body.dryRun);
  const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const expiredApps = await prisma.application.findMany({
    where: {
      currentStage: "REJECTED",
      stageUpdatedAt: { lte: cutoffDate },
    },
    include: {
      candidate: { select: { id: true, fullName: true, email: true } },
      job: { select: { id: true, title: true } },
    },
  });

  const summaryItems = expiredApps.map((app) => ({
    applicationId: app.id,
    candidateId: app.candidateId,
    candidateName: app.candidate.fullName,
    candidateEmail: app.candidate.email,
    jobTitle: app.job.title,
    stageUpdatedAt: app.stageUpdatedAt,
    daysInPool: Math.floor(
      (Date.now() - new Date(app.stageUpdatedAt).getTime()) / (1000 * 60 * 60 * 24)
    ),
  }));

  if (dryRun) {
    return {
      success: true,
      dryRun: true,
      retentionDays: days,
      cutoffDate: cutoffDate.toISOString(),
      eligibleCount: expiredApps.length,
      items: summaryItems,
      message: `Tìm thấy ${expiredApps.length} hồ sơ đã từ chối lưu trữ quá ${days} ngày đủ điều kiện dọn dẹp.`,
    };
  }

  const appIds = expiredApps.map((a) => a.id);
  let deletedAppsCount = 0;
  let deletedCandidatesCount = 0;

  if (appIds.length > 0) {
    const deleteResult = await prisma.application.deleteMany({
      where: { id: { in: appIds } },
    });
    deletedAppsCount = deleteResult.count;

    const candidateIds = Array.from(new Set(expiredApps.map((a) => a.candidateId)));
    for (const cId of candidateIds) {
      const remaining = await prisma.application.count({ where: { candidateId: cId } });
      if (remaining === 0) {
        await prisma.candidate.delete({ where: { id: cId } }).catch(() => {});
        deletedCandidatesCount++;
      }
    }
  }

  console.log(
    `[DATA RETENTION AUDIT] Admin userId=${sessionUser.id} purged ${deletedAppsCount} applications, ${deletedCandidatesCount} orphan candidates older than ${days} days.`
  );

  return {
    success: true,
    dryRun: false,
    retentionDays: days,
    cutoffDate: cutoffDate.toISOString(),
    purgedApplicationsCount: deletedAppsCount,
    purgedCandidatesCount: deletedCandidatesCount,
    items: summaryItems,
    message: `Đã xóa vĩnh viễn ${deletedAppsCount} hồ sơ quá thời hạn lưu trữ ${days} ngày khỏi hệ thống.`,
  };
}
