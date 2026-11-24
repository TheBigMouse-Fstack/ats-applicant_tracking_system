import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

interface QueueCandidateItem {
  id: number;
  candidateName: string;
  email: string;
  jobId: number;
  jobTitle: string;
  department: string;
  currentStage: string;
  experienceYears: number;
  skills: string[];
  aiMatchScore: number | null;
  hoursInStage: number;
  isSlaBreached: boolean;
  slaMessage: string;
  isViewed: boolean;
  isStarred: boolean;
  evaluationsCount: number;
  interviewDate: string | null;
  interviewFormat: string | null;
  interviewLocation: string | null;
  createdAt: string;
}

function safeParseSkills(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, 5).map(String) : [];
  } catch {
    return [];
  }
}

/**
 * GET /api/dashboard
 * Bảng điều khiển Tổng quan Vận hành phân quyền theo vai trò (Least Privilege + JTBD):
 * - ADMIN: Toàn cảnh 360° (Funnel, SLA HR vs HM, Jobs, Upcoming Interviews, User Stats, BRL-10 Purge, AuditLog)
 * - HR: Đầu phễu tuyển dụng (Funnel, CV NEW chưa xem, SLA >48h, Active Jobs)
 * - HIRING_MANAGER: Giai đoạn chuyên môn (Funnel, Chờ duyệt PV ở SCREENING, Thiếu Scorecard ở INTERVIEW, Lịch PV sắp tới)
 */
export async function GET() {
  try {
    const sessionUser = getSessionUser();
    if (!sessionUser) {
      return NextResponse.json(
        {
          success: false,
          error: "Yêu cầu đăng nhập tài khoản nội bộ để truy cập Dashboard Tổng quan",
        },
        { status: 401 }
      );
    }

    const role = sessionUser.role;
    const nowMs = Date.now();
    const purgeThresholdDate = new Date(nowMs - 180 * 24 * 60 * 60 * 1000);

    // 1. Tải song song dữ liệu cốt lõi (tối ưu tốc độ < 1s theo NFR-PER-01)
    const [jobs, applications] = await Promise.all([
      prisma.job.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          department: true,
          location: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.application.findMany({
        include: {
          candidate: {
            select: {
              id: true,
              fullName: true,
              email: true,
              experienceYears: true,
              parsedSkills: true,
            },
          },
          job: {
            select: {
              id: true,
              title: true,
              department: true,
            },
          },
          evaluations: {
            select: {
              id: true,
              overallScore: true,
              recommendation: true,
            },
          },
        },
        orderBy: { stageUpdatedAt: "desc" },
      }),
    ]);

    // 2. Tính phễu 6 trạng thái & cảnh báo SLA (BRL-07)
    const funnel = {
      total: applications.length,
      NEW: 0,
      SCREENING: 0,
      INTERVIEW: 0,
      OFFER: 0,
      HIRED: 0,
      REJECTED: 0,
    };

    const jobBreakdownMap = new Map<
      number,
      {
        id: number;
        title: string;
        department: string;
        location: string;
        status: string;
        total: number;
        NEW: number;
        SCREENING: number;
        INTERVIEW: number;
        HIRED: number;
        REJECTED: number;
      }
    >();

    for (const job of jobs) {
      jobBreakdownMap.set(job.id, {
        id: job.id,
        title: job.title,
        department: job.department,
        location: job.location,
        status: job.status,
        total: 0,
        NEW: 0,
        SCREENING: 0,
        INTERVIEW: 0,
        HIRED: 0,
        REJECTED: 0,
      });
    }

    let newBreachCount = 0;
    let screeningBreachCount = 0;
    let unviewedNewCount = 0;
    let starredCount = 0;
    let pendingScorecardCount = 0;
    let purgeEligibleCount = 0;

    const mappedItems: QueueCandidateItem[] = [];

    for (const app of applications) {
      const stage = app.currentStage as keyof typeof funnel;
      if (stage in funnel && stage !== "total") {
        funnel[stage] += 1;
      }

      const jobStat = jobBreakdownMap.get(app.jobId);
      if (jobStat) {
        jobStat.total += 1;
        if (app.currentStage === "NEW") jobStat.NEW += 1;
        else if (app.currentStage === "SCREENING") jobStat.SCREENING += 1;
        else if (app.currentStage === "INTERVIEW") jobStat.INTERVIEW += 1;
        else if (app.currentStage === "HIRED") jobStat.HIRED += 1;
        else if (app.currentStage === "REJECTED") jobStat.REJECTED += 1;
      }

      const hoursInStage = Math.max(
        0,
        Math.floor((nowMs - new Date(app.stageUpdatedAt).getTime()) / (1000 * 60 * 60))
      );

      let isSlaBreached = false;
      let slaMessage = "";
      if (app.currentStage === "NEW" && hoursInStage > 48) {
        isSlaBreached = true;
        newBreachCount += 1;
        slaMessage = `Chờ sơ loại ${hoursInStage}h (Quá hạn 48h)`;
      } else if (app.currentStage === "SCREENING" && hoursInStage > 72) {
        isSlaBreached = true;
        screeningBreachCount += 1;
        slaMessage = `Chờ duyệt PV ${hoursInStage}h (Quá hạn 72h)`;
      }

      if (app.currentStage === "NEW" && !app.isViewed) {
        unviewedNewCount += 1;
      }
      if (app.isStarred) {
        starredCount += 1;
      }
      if (app.currentStage === "INTERVIEW" && app.evaluations.length === 0) {
        pendingScorecardCount += 1;
      }
      if (
        app.currentStage === "REJECTED" &&
        new Date(app.stageUpdatedAt).getTime() < purgeThresholdDate.getTime()
      ) {
        purgeEligibleCount += 1;
      }

      mappedItems.push({
        id: app.id,
        candidateName: app.candidate.fullName,
        email: app.candidate.email,
        jobId: app.job.id,
        jobTitle: app.job.title,
        department: app.job.department,
        currentStage: app.currentStage,
        experienceYears: app.candidate.experienceYears ?? 0,
        skills: safeParseSkills(app.candidate.parsedSkills),
        aiMatchScore: app.aiMatchScore,
        hoursInStage,
        isSlaBreached,
        slaMessage,
        isViewed: app.isViewed,
        isStarred: app.isStarred,
        evaluationsCount: app.evaluations.length,
        interviewDate: app.interviewDate ? app.interviewDate.toISOString() : null,
        interviewFormat: app.interviewFormat || "ONLINE",
        interviewLocation: app.interviewLocation || null,
        createdAt: app.createdAt.toISOString(),
      });
    }

    const upcomingInterviews = mappedItems
      .filter((item) => item.currentStage === "INTERVIEW" && item.interviewDate !== null)
      .sort(
        (a, b) =>
          new Date(a.interviewDate as string).getTime() -
          new Date(b.interviewDate as string).getTime()
      )
      .slice(0, 8);

    const activeJobs = Array.from(jobBreakdownMap.values())
      .filter((j) => j.status === "ACTIVE")
      .sort((a, b) => b.total - a.total);

    const closedJobsCount = jobs.filter((j) => j.status !== "ACTIVE").length;
    const hireRatePercent =
      funnel.total > 0 ? Math.round((funnel.HIRED / funnel.total) * 100) : 0;

    // 3. Payload chung an toàn cho tất cả vai trò nội bộ
    const basePayload: Record<string, unknown> = {
      role,
      userName: sessionUser.fullName,
      generatedAt: new Date().toISOString(),
      funnel,
      sla: {
        newBreachCount,
        screeningBreachCount,
        totalBreaches: newBreachCount + screeningBreachCount,
      },
      summary: {
        activeJobsCount: activeJobs.length,
        closedJobsCount,
        totalJobsCount: jobs.length,
        unviewedNewCount,
        starredCount,
        pendingScorecardCount,
        upcomingInterviewsCount: upcomingInterviews.length,
        hireRatePercent,
      },
      activeJobs,
    };

    // 4. Phân tách dữ liệu chặt chẽ theo Vai trò (RBAC-DASH-SCOPE)
    if (role === "HR") {
      basePayload.hrUnviewedQueue = mappedItems
        .filter((item) => item.currentStage === "NEW" && !item.isViewed)
        .sort((a, b) => b.hoursInStage - a.hoursInStage)
        .slice(0, 10);

      basePayload.hrSlaBreachQueue = mappedItems
        .filter((item) => item.currentStage === "NEW" && item.isSlaBreached)
        .sort((a, b) => b.hoursInStage - a.hoursInStage)
        .slice(0, 10);

      basePayload.hrRecentNewQueue = mappedItems
        .filter((item) => item.currentStage === "NEW")
        .sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 10);
    } else if (role === "HIRING_MANAGER") {
      basePayload.hmScreeningQueue = mappedItems
        .filter((item) => item.currentStage === "SCREENING")
        .sort((a, b) => {
          if (a.isSlaBreached !== b.isSlaBreached) return a.isSlaBreached ? -1 : 1;
          return (b.aiMatchScore ?? 0) - (a.aiMatchScore ?? 0);
        })
        .slice(0, 10);

      basePayload.hmMissingScorecardQueue = mappedItems
        .filter((item) => item.currentStage === "INTERVIEW" && item.evaluationsCount === 0)
        .sort((a, b) => b.hoursInStage - a.hoursInStage)
        .slice(0, 10);

      basePayload.upcomingInterviews = upcomingInterviews;
    } else if (role === "ADMIN") {
      const [users, recentAuditLogs] = await Promise.all([
        prisma.user.findMany({
          select: { id: true, role: true, isActive: true },
        }),
        prisma.auditLog.findMany({
          orderBy: { createdAt: "desc" },
          take: 12,
          include: {
            user: { select: { fullName: true, role: true } },
            application: {
              select: {
                id: true,
                candidate: { select: { fullName: true } },
                job: { select: { title: true } },
              },
            },
          },
        }),
      ]);

      basePayload.slaBreachQueue = mappedItems
        .filter((item) => item.isSlaBreached)
        .sort((a, b) => b.hoursInStage - a.hoursInStage)
        .slice(0, 10);

      basePayload.upcomingInterviews = upcomingInterviews;

      basePayload.adminStats = {
        totalUsers: users.length,
        activeUsers: users.filter((u) => u.isActive).length,
        hrCount: users.filter((u) => u.role === "HR" && u.isActive).length,
        managerCount: users.filter((u) => u.role === "HIRING_MANAGER" && u.isActive).length,
        adminCount: users.filter((u) => u.role === "ADMIN" && u.isActive).length,
        purgeEligibleCount,
      };

      basePayload.recentAuditLogs = recentAuditLogs.map((log) => ({
        id: log.id,
        applicationId: log.applicationId,
        candidateName: log.application.candidate.fullName,
        jobTitle: log.application.job.title,
        actorName: log.user?.fullName || "Hệ thống tự động",
        actorRole: log.user?.role || "SYSTEM",
        action: log.action,
        fromStage: log.fromStage,
        toStage: log.toStage,
        reason: log.reason,
        createdAt: log.createdAt.toISOString(),
      }));
    }

    return NextResponse.json({
      success: true,
      data: basePayload,
    });
  } catch (error) {
    console.error("GET /api/dashboard error:", error);
    return NextResponse.json(
      { success: false, error: "Không thể tải dữ liệu Bảng điều khiển Tổng quan" },
      { status: 500 }
    );
  }
}
