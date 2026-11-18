import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export type TalentPoolStatus =
  | "SILVER_MEDALIST"
  | "IN_PIPELINE_WATCH"
  | "ARCHIVED_RESERVE";

/**
 * Phân loại trạng thái nghiệp vụ chuẩn cho hồ sơ trong Kho Nhân Tài:
 * - Không bao gồm NEW (CV chưa qua sơ loại) và HIRED (đã trở thành nhân viên công ty).
 * - SILVER_MEDALIST (Ứng viên Tiềm năng / Dự bị): Đã kết thúc đợt cũ (REJECTED) nhưng có đánh giá tốt
 *   (Gắn sao ưu tiên, AI >= 60%, hoặc có Scorecard trung bình >= 3.5/5 — VD: bộ phận cũ đã đủ người).
 * - IN_PIPELINE_WATCH (Đang chờ ở đợt tuyển khác): Đang ở vòng SCREENING/INTERVIEW ở một vị trí khác,
 *   có thể cân nhắc luân chuyển chéo sang phòng ban phù hợp hơn.
 * - ARCHIVED_RESERVE (Lưu trữ dự phòng 180 ngày): Hồ sơ REJECTED còn lại được lưu tối đa 180 ngày (BRL-10).
 */
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

// GET: Lấy danh sách ứng viên trong Kho nhân tài (SCR-07 / UC-06)
export async function GET(req: Request) {
  try {
    const sessionUser = getSessionUser();
    if (!sessionUser) {
      return NextResponse.json(
        { success: false, error: "Yêu cầu đăng nhập tài khoản nội bộ để truy cập Kho nhân tài" },
        { status: 401 }
      );
    }

    if (sessionUser.role === "HIRING_MANAGER") {
      return NextResponse.json(
        {
          success: false,
          error: "Chỉ Chuyên viên HR và Quản trị viên mới có quyền truy cập Kho nhân tài",
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim().toLowerCase() || "";
    const jobId = searchParams.get("jobId");
    const poolStatusFilter = searchParams.get("poolStatus") || "ALL";
    const sortBy = searchParams.get("sortBy") || "MATCH_DESC";
    const starredOnly = searchParams.get("starred") === "true";

    // Kho Nhân Tài CHỈ gồm hồ sơ đã qua sàng lọc / lưu trữ dự phòng (LOẠI TRỪ NEW & HIRED)
    const where: Record<string, unknown> = {
      currentStage: {
        in: ["REJECTED", "SCREENING", "INTERVIEW"],
      },
    };

    if (jobId && jobId !== "ALL") where.jobId = Number(jobId);
    if (starredOnly) where.isStarred = true;

    if (search) {
      where.candidate = {
        OR: [
          { fullName: { contains: search } },
          { email: { contains: search } },
          { phone: { contains: search } },
          { parsedSkills: { contains: search } },
        ],
      };
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
        const poolStatus = classifyTalentPoolStatus(app);
        const daysSinceUpdated = Math.max(
          0,
          Math.floor((nowMs - new Date(app.stageUpdatedAt).getTime()) / (1000 * 60 * 60 * 24))
        );
        const retentionDaysLeft =
          app.currentStage === "REJECTED" ? Math.max(0, 180 - daysSinceUpdated) : null;

        return {
          ...app,
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

    // Sắp xếp phù hợp nghiệp vụ săn tìm nhân tài dự bị
    enriched.sort((a, b) => {
      if (sortBy === "MATCH_DESC") {
        return (b.aiMatchScore ?? -1) - (a.aiMatchScore ?? -1);
      }
      if (sortBy === "STARRED_FIRST") {
        if (a.isStarred !== b.isStarred) return a.isStarred ? -1 : 1;
        return (b.aiMatchScore ?? -1) - (a.aiMatchScore ?? -1);
      }
      if (sortBy === "OLDEST") {
        return new Date(a.stageUpdatedAt).getTime() - new Date(b.stageUpdatedAt).getTime();
      }
      return new Date(b.stageUpdatedAt).getTime() - new Date(a.stageUpdatedAt).getTime();
    });

    return NextResponse.json({ success: true, data: enriched });
  } catch (error) {
    console.error("GET /api/talent-pool error:", error);
    return NextResponse.json(
      { success: false, error: "Không thể lấy danh sách kho nhân tài" },
      { status: 500 }
    );
  }
}

// POST: Tái sử dụng ứng viên / Khôi phục hồ sơ (Re-pooling UC-06)
export async function POST(req: Request) {
  try {
    const sessionUser = getSessionUser();
    if (!sessionUser || sessionUser.role === "HIRING_MANAGER") {
      return NextResponse.json(
        {
          success: false,
          error: "Chỉ Chuyên viên HR và Admin mới có quyền luân chuyển ứng viên trong Kho nhân tài",
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { candidateId, targetJobId } = body;

    if (!candidateId || !targetJobId) {
      return NextResponse.json(
        { success: false, error: "Thiếu mã ứng viên hoặc mã vị trí chuyển tuyển" },
        { status: 400 }
      );
    }

    const candidate = await prisma.candidate.findUnique({
      where: { id: Number(candidateId) },
    });
    if (!candidate) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy hồ sơ ứng viên này" },
        { status: 404 }
      );
    }

    const targetJob = await prisma.job.findUnique({
      where: { id: Number(targetJobId) },
    });
    if (!targetJob) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy vị trí tuyển dụng đích" },
        { status: 404 }
      );
    }

    const previousApp = await prisma.application.findFirst({
      where: { candidateId: candidate.id },
      orderBy: { createdAt: "desc" },
    });

    const userId = sessionUser ? sessionUser.id : null;

    // Tạo Application mới ở trạng thái SCREENING (vì nhân tài đã qua sơ loại)
    const newApp = await prisma.application.create({
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

    await prisma.auditLog.create({
      data: {
        applicationId: newApp.id,
        userId,
        fromStage: previousApp?.currentStage || "TALENT_POOL",
        toStage: "SCREENING",
        action: "TALENT_REPOOL",
        reason: `Khôi phục từ Kho nhân tài sang vị trí ${targetJob.title}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Đã khôi phục và chuyển ứng viên ${candidate.fullName} sang vị trí "${targetJob.title}" thành công.`,
      data: newApp,
    });
  } catch (error) {
    console.error("POST /api/talent-pool repool error:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi hệ thống khi tái sử dụng hồ sơ ứng viên" },
      { status: 500 }
    );
  }
}
