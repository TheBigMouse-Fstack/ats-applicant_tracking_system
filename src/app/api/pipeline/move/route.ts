import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { applicationId, toStage } = body;

    if (!applicationId || !toStage) {
      return NextResponse.json(
        { success: false, error: "Thiếu ID hồ sơ hoặc trạng thái đích" },
        { status: 400 }
      );
    }

    const validStages = ["NEW", "SCREENING", "INTERVIEW", "HIRED", "REJECTED"];
    if (!validStages.includes(toStage)) {
      return NextResponse.json(
        { success: false, error: `Trạng thái "${toStage}" không hợp lệ` },
        { status: 400 }
      );
    }

    // 1. Tìm hồ sơ ứng tuyển
    const app = await prisma.application.findUnique({
      where: { id: Number(applicationId) },
      include: {
        candidate: true,
        job: true,
        evaluations: true,
      },
    });

    if (!app) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy hồ sơ ứng tuyển này" },
        { status: 404 }
      );
    }

    const fromStage = app.currentStage;

    // Không chuyển nếu cùng trạng thái
    if (fromStage === toStage) {
      return NextResponse.json({ success: true, data: app });
    }

    // 2. KIỂM TRA BRL-06: STAGE GATE RULE TRƯỚC KHI HIRED
    if (toStage === "HIRED") {
      if (app.evaluations.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Chưa thể tuyển chọn: Cần có ít nhất 01 phiếu đánh giá Scorecard hoàn tất từ người phỏng vấn chuyên môn trước khi xác nhận tuyển.",
            rule: "BRL-06",
          },
          { status: 400 }
        );
      }
    }

    // 4. Lấy thông tin người thực hiện từ session & KIỂM TRA PHÂN QUYỀN RBAC
    const sessionUser = getSessionUser();
    const userId = sessionUser ? sessionUser.id : null;

    // RBAC: Hiring Manager tuyệt đối cấm kéo - thả chuyển cột trạng thái (Mục 13 RBAC Matrix)
    if (sessionUser && sessionUser.role === "HIRING_MANAGER") {
      return NextResponse.json(
        {
          success: false,
          error:
            "Quản lý chuyên môn (Hiring Manager) chỉ có quyền xem hồ sơ và đánh giá Scorecard; quyền luân chuyển trạng thái do bộ phận Tuyển dụng (HR) phụ trách.",
          rule: "RBAC-MGR-BLOCK",
        },
        { status: 403 }
      );
    }

    // 3. KIỂM TRA BRL-05: DELAY BUFFER CHO EMAIL TỪ CHỐI & HỦY NẾU RỜI KHỎI REJECTED
    let emailScheduledAt: Date | null = app.emailScheduledAt;
    let isEmailSent = app.isEmailSent;

    if (toStage === "REJECTED") {
      // Hẹn giờ sau 12 tiếng nếu chuyển sang REJECTED
      emailScheduledAt = new Date(Date.now() + 12 * 60 * 60 * 1000);
      isEmailSent = false;
    } else if (fromStage === "REJECTED" && toStage !== "REJECTED") {
      // BRL-05 Exception: Nếu HR can thiệp kéo thẻ rời khỏi cột REJECTED, tự động hủy lịch gửi email từ chối
      emailScheduledAt = null;
      isEmailSent = false;
    }

    // 5. Cập nhật Application và tạo AuditLog trong 1 Transaction
    const [updatedApp] = await prisma.$transaction([
      prisma.application.update({
        where: { id: app.id },
        data: {
          currentStage: toStage,
          stageUpdatedAt: new Date(),
          emailScheduledAt,
          isEmailSent,
        },
      }),
      prisma.auditLog.create({
        data: {
          applicationId: app.id,
          userId,
          fromStage,
          toStage,
          action: "STAGE_CHANGE",
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: `Đã chuyển hồ sơ sang cột ${toStage}`,
      data: updatedApp,
    });
  } catch (error) {
    console.error("Move application error:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi hệ thống khi chuyển trạng thái hồ sơ" },
      { status: 500 }
    );
  }
}

