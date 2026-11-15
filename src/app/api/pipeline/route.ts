import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET: Lấy toàn bộ dữ liệu Pipeline theo 5 cột Kanban và danh sách Jobs để lọc
export async function GET(req: Request) {
  try {
    const sessionUser = getSessionUser();
    if (!sessionUser) {
      return NextResponse.json(
        { success: false, error: "Yêu cầu đăng nhập tài khoản nội bộ để truy cập Pipeline" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const jobIdParam = searchParams.get("jobId");
    const searchParam = searchParams.get("search")?.trim().toLowerCase() || "";
    const sortByParam = searchParams.get("sortBy") || "NEWEST";
    const starredOnly = searchParams.get("starred") === "true";
    const unviewedOnly = searchParams.get("unviewed") === "true";

    // 1. Lấy danh sách Jobs đang hoạt động để làm bộ lọc
    const jobs = await prisma.job.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        department: true,
        status: true,
        _count: {
          select: { applications: true },
        },
      },
    });

    // 2. Điều kiện lọc Application
    const whereClause: any = {};
    if (jobIdParam && jobIdParam !== "ALL") {
      whereClause.jobId = Number(jobIdParam);
    }
    if (starredOnly) {
      whereClause.isStarred = true;
    }
    if (unviewedOnly) {
      whereClause.isViewed = false;
    }

    if (searchParam) {
      whereClause.candidate = {
        OR: [
          { fullName: { contains: searchParam } },
          { email: { contains: searchParam } },
          { phone: { contains: searchParam } },
          { parsedSkills: { contains: searchParam } },
        ],
      };
    }

    // 3. Lấy toàn bộ Application kèm thông tin Candidate, Job, Evaluations và AuditLogs
    const applications = await prisma.application.findMany({
      where: whereClause,
      include: {
        candidate: true,
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
          select: { id: true, overallScore: true, recommendation: true },
        },
        auditLogs: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
      orderBy: { stageUpdatedAt: "desc" },
    });

    // 4. Phân loại theo 5 cột chuẩn Kanban (BRL-07 tính SLA)
    const now = new Date().getTime();
    const columns: Record<string, any[]> = {
      NEW: [],
      SCREENING: [],
      INTERVIEW: [],
      HIRED: [],
      REJECTED: [],
    };

    applications.forEach((app) => {
      const stage = app.currentStage in columns ? app.currentStage : "NEW";

      // Kiểm tra BRL-07: Tính toán vi phạm SLA
      // Cột NEW > 48h, Cột SCREENING > 72h
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

      columns[stage].push({
        ...app,
        hoursInStage: Math.floor(hoursInStage),
        isSlaBreached,
        slaMessage,
      });
    });

    // 5. Sắp xếp các thẻ trong từng cột Kanban theo tiêu chuẩn lọc
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
        const aHasEval = a.evaluations && a.evaluations.length > 0;
        const bHasEval = b.evaluations && b.evaluations.length > 0;
        if (aHasEval !== bHasEval) return aHasEval ? 1 : -1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      // Mặc định: NEWEST (Mới nhất lên đầu)
      return new Date(b.stageUpdatedAt || b.createdAt).getTime() - new Date(a.stageUpdatedAt || a.createdAt).getTime();
    };

    Object.keys(columns).forEach((key) => {
      columns[key].sort(sortFn);
    });

    const stats = {
      total: applications.length,
      new: columns.NEW.length,
      screening: columns.SCREENING.length,
      interview: columns.INTERVIEW.length,
      hired: columns.HIRED.length,
      rejected: columns.REJECTED.length,
    };

    return NextResponse.json({
      success: true,
      jobs,
      columns,
      stats,
    });
  } catch (error) {
    console.error("Pipeline API error:", error);
    return NextResponse.json(
      { success: false, error: "Không thể lấy dữ liệu Pipeline tuyển dụng" },
      { status: 500 }
    );
  }
}
