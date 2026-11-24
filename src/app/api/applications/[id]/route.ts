import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const sessionUser = getSessionUser();
    if (!sessionUser) {
      return NextResponse.json(
        { success: false, error: "Yêu cầu đăng nhập tài khoản nội bộ để xem chi tiết hồ sơ" },
        { status: 401 }
      );
    }

    const applicationId = Number(params.id);
    if (!applicationId) {
      return NextResponse.json(
        { success: false, error: "ID hồ sơ không hợp lệ" },
        { status: 400 }
      );
    }

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        candidate: {
          include: {
            applications: {
              where: { id: { not: applicationId } },
              include: { job: { select: { id: true, title: true, department: true } } },
              orderBy: { createdAt: "desc" },
            },
          },
        },
        job: {
          select: {
            id: true,
            title: true,
            department: true,
            requirementsJd: true,
            requiredSkills: true,
            minExperienceYears: true,
          },
        },
        evaluations: {
          include: {
            evaluator: {
              select: { id: true, fullName: true, email: true, role: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        auditLogs: {
          include: {
            user: {
              select: { id: true, fullName: true, role: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!application) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy hồ sơ ứng tuyển này" },
        { status: 404 }
      );
    }

    // Tự động đánh dấu đã xem nếu đây là lần đầu HR mở hồ sơ
    if (!application.isViewed) {
      await prisma.application.update({
        where: { id: applicationId },
        data: {
          isViewed: true,
          viewedAt: new Date(),
        },
      });
      application.isViewed = true;
      application.viewedAt = new Date();
    }

    // BRL-15: Blind Scorecard (Chống thiên kiến mỏ neo)
    // Giám khảo (HM / HR) chưa tự nộp phiếu đánh giá sẽ không thấy chi tiết phiếu của người khác
    const totalEvaluationsCount = application.evaluations.length;
    const hasPassingScorecard = application.evaluations.some(
      (ev) => ev.recommendation === "HIRE" || ev.recommendation === "STRONG_HIRE"
    );
    const hasSubmittedOwnScorecard = application.evaluations.some(
      (ev) => ev.evaluatorId === sessionUser.id
    );
    const blindScorecardLocked =
      sessionUser.role !== "ADMIN" &&
      totalEvaluationsCount > 0 &&
      !hasSubmittedOwnScorecard;

    return NextResponse.json({
      success: true,
      data: {
        ...application,
        evaluations: blindScorecardLocked ? [] : application.evaluations,
        blindScorecardLocked,
        hiddenEvaluationsCount: blindScorecardLocked ? totalEvaluationsCount : 0,
        totalEvaluationsCount,
        hasPassingScorecard,
      },
    });
  } catch (error) {
    console.error("Fetch application detail error:", error);
    return NextResponse.json(
      { success: false, error: "Không thể lấy chi tiết hồ sơ ứng viên" },
      { status: 500 }
    );
  }
}

// PATCH: Cập nhật trạng thái xem hoặc gắn sao ứng viên
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const sessionUser = getSessionUser();
    if (!sessionUser) {
      return NextResponse.json(
        { success: false, error: "Yêu cầu đăng nhập tài khoản nội bộ" },
        { status: 401 }
      );
    }

    const applicationId = Number(params.id);
    if (!applicationId) {
      return NextResponse.json(
        { success: false, error: "ID hồ sơ không hợp lệ" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const updateData: any = {};

    if (typeof body.isStarred === "boolean") {
      updateData.isStarred = body.isStarred;
    }
    if (typeof body.isViewed === "boolean") {
      updateData.isViewed = body.isViewed;
      if (body.isViewed) {
        updateData.viewedAt = new Date();
      }
    }

    const updated = await prisma.application.update({
      where: { id: applicationId },
      data: updateData,
      select: {
        id: true,
        isStarred: true,
        isViewed: true,
        viewedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error: any) {
    console.error("PATCH application error:", error);
    return NextResponse.json(
      { success: false, error: "Không thể cập nhật hồ sơ ứng viên" },
      { status: 500 }
    );
  }
}

