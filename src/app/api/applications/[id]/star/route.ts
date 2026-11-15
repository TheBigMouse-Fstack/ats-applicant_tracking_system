import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// POST / PATCH: Bật/tắt gắn sao hồ sơ ứng viên (Star / Favorite như Gmail)
export async function POST(
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

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      select: { id: true, isStarred: true, currentStage: true, candidate: { select: { fullName: true } } },
    });

    if (!application) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy hồ sơ ứng tuyển này" },
        { status: 404 }
      );
    }

    // Toggle trạng thái gắn sao
    const newStarred = !application.isStarred;

    const updated = await prisma.application.update({
      where: { id: applicationId },
      data: { isStarred: newStarred },
      select: { id: true, isStarred: true },
    });

    // Ghi nhận nhật ký kiểm toán AuditLog
    await prisma.auditLog.create({
      data: {
        applicationId,
        userId: sessionUser.id,
        action: newStarred ? "STARRED" : "UNSTARRED",
        fromStage: application.currentStage,
        toStage: application.currentStage,
      },
    });

    return NextResponse.json({
      success: true,
      isStarred: updated.isStarred,
      message: updated.isStarred
        ? `Đã gắn sao ứng viên ${application.candidate?.fullName}`
        : `Đã bỏ gắn sao ứng viên ${application.candidate?.fullName}`,
    });
  } catch (error: any) {
    console.error("Star toggle error:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi hệ thống khi cập nhật trạng thái gắn sao" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  return POST(req, { params });
}
