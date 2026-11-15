import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// POST: Đặt hoặc cập nhật lịch phỏng vấn & Tạo mẫu thư mời phỏng vấn tự động
export async function POST(req: Request) {
  try {
    const sessionUser = getSessionUser();
    if (!sessionUser) {
      return NextResponse.json(
        { success: false, error: "Yêu cầu đăng nhập tài khoản nội bộ để lên lịch phỏng vấn" },
        { status: 401 }
      );
    }

    // RBAC: Hiring Manager chỉ xem lịch, chỉ HR và Admin được xếp lịch
    if (sessionUser.role === "HIRING_MANAGER") {
      return NextResponse.json(
        {
          success: false,
          error: "Quản lý chuyên môn (Hiring Manager) chỉ có quyền xem lịch, không được xếp lịch phỏng vấn theo quy chuẩn RBAC.",
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      applicationId,
      interviewDate,
      interviewFormat,
      interviewLocation,
      interviewNotes,
      moveToInterviewStage,
    } = body;

    if (!applicationId) {
      return NextResponse.json(
        { success: false, error: "Thiếu mã hồ sơ ứng tuyển" },
        { status: 400 }
      );
    }

    if (!interviewDate) {
      return NextResponse.json(
        { success: false, error: "Vui lòng chọn ngày và giờ diễn ra phỏng vấn" },
        { status: 400 }
      );
    }

    const parsedDate = new Date(interviewDate);
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        { success: false, error: "Định dạng thời gian phỏng vấn không hợp lệ" },
        { status: 400 }
      );
    }

    if (!interviewLocation || !interviewLocation.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Vui lòng nhập Link phòng họp trực tuyến (Google Meet/Zoom) hoặc Phòng họp thực tế",
        },
        { status: 400 }
      );
    }

    // 1. Tìm Application
    const app = await prisma.application.findUnique({
      where: { id: Number(applicationId) },
      include: {
        candidate: true,
        job: true,
      },
    });

    if (!app) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy hồ sơ ứng tuyển này" },
        { status: 404 }
      );
    }

    const format = interviewFormat === "OFFLINE" ? "OFFLINE" : "ONLINE";
    const location = interviewLocation.trim();
    const notes = interviewNotes ? String(interviewNotes).trim() : null;

    // 2. Chuyển sang INTERVIEW nếu được yêu cầu và hiện tại đang ở NEW/SCREENING
    const targetStage =
      moveToInterviewStage && app.currentStage !== "INTERVIEW"
        ? "INTERVIEW"
        : app.currentStage;

    // 3. Cập nhật Application và ghi nhận AuditLog trong Transaction
    const [updatedApp] = await prisma.$transaction([
      prisma.application.update({
        where: { id: app.id },
        data: {
          interviewDate: parsedDate,
          interviewFormat: format,
          interviewLocation: location,
          interviewNotes: notes,
          currentStage: targetStage,
          stageUpdatedAt: targetStage !== app.currentStage ? new Date() : app.stageUpdatedAt,
        },
        include: {
          candidate: true,
          job: true,
          evaluations: true,
        },
      }),
      prisma.auditLog.create({
        data: {
          applicationId: app.id,
          userId: sessionUser.id,
          fromStage: app.currentStage,
          toStage: targetStage,
          action: "INTERVIEW_SCHEDULED",
        },
      }),
    ]);

    // 4. Sinh mẫu Thư mời phỏng vấn tự động (Email Invitation Template)
    const formattedTime = parsedDate.toLocaleString("vi-VN", {
      dateStyle: "full",
      timeStyle: "short",
    });

    const emailTemplate = `
Kính gửi bạn ${app.candidate.fullName},

Ban Tuyển dụng ReCoverX Career trân trọng chúc mừng hồ sơ của bạn đã vượt qua vòng sơ loại tiêu chuẩn cho vị trí "${app.job.title}".

Chúng tôi trân trọng kính mời bạn tham dự buổi Phỏng vấn Chuyên môn với Hội đồng Tuyển dụng:
• Vị trí ứng tuyển: ${app.job.title} (${app.job.department})
• Thời gian phỏng vấn: ${formattedTime}
• Hình thức: ${format === "ONLINE" ? "Phỏng vấn Trực tuyến (Online)" : "Phỏng vấn Trực tiếp (Tại văn phòng)"}
• Địa điểm / Đường dẫn: ${location}
${notes ? `• Ghi chú chuẩn bị: ${notes}` : ""}

Vui lòng xác nhận sự hiện diện của bạn bằng cách phản hồi email này trước 24 giờ.
Nếu cần hỗ trợ điều chỉnh lịch hẹn, bạn có thể liên hệ trực tiếp với chuyên viên tuyển dụng ${sessionUser.fullName}.

Trân trọng,
Ban Tuyển dụng ReCoverX Career
    `.trim();

    return NextResponse.json({
      success: true,
      message: `Đã lên lịch phỏng vấn cho ứng viên ${app.candidate.fullName} thành công!`,
      data: {
        application: updatedApp,
        formattedTime,
        emailTemplate,
      },
    });
  } catch (error: any) {
    console.error("Schedule interview error:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi hệ thống khi lên lịch phỏng vấn: " + error.message },
      { status: 500 }
    );
  }
}

