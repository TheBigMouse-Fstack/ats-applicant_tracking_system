import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// POST: Đặt, cập nhật lịch phỏng vấn hoặc lưu ghi chú trước / sau phỏng vấn
export async function POST(req: Request) {
  try {
    const sessionUser = getSessionUser();
    if (!sessionUser) {
      return NextResponse.json(
        { success: false, error: "Yêu cầu đăng nhập tài khoản nội bộ để thao tác lịch phỏng vấn" },
        { status: 401 }
      );
    }

    // RBAC: Hiring Manager chỉ xem lịch, chỉ HR và Admin được xếp/sửa lịch
    if (sessionUser.role === "HIRING_MANAGER") {
      return NextResponse.json(
        {
          success: false,
          error: "Quản lý chuyên môn (Hiring Manager) chỉ có quyền xem lịch và đánh giá, không được xếp/sửa lịch phỏng vấn theo quy chuẩn RBAC.",
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
      interviewInterviewerNotes,
      interviewPostNotes,
      moveToInterviewStage,
      isQuickNotesUpdate,
    } = body;

    if (!applicationId) {
      return NextResponse.json(
        { success: false, error: "Thiếu mã hồ sơ ứng tuyển" },
        { status: 400 }
      );
    }

    // 1. Tìm Application
    const app = await prisma.application.findUnique({
      where: { id: Number(applicationId) },
      include: {
        candidate: true,
        job: true,
        evaluations: {
          include: {
            evaluator: {
              select: { id: true, fullName: true, email: true, role: true },
            },
          },
        },
      },
    });

    if (!app) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy hồ sơ ứng tuyển này" },
        { status: 404 }
      );
    }

    // Trường hợp 1: Chỉ cập nhật nhanh Ghi chú Trước hoặc Sau phỏng vấn (không thay đổi ngày giờ/địa điểm)
    if (isQuickNotesUpdate) {
      const updatedApp = await prisma.application.update({
        where: { id: app.id },
        data: {
          interviewNotes: interviewNotes !== undefined ? (interviewNotes ? String(interviewNotes).trim() : null) : app.interviewNotes,
          interviewInterviewerNotes:
            interviewInterviewerNotes !== undefined
              ? (interviewInterviewerNotes ? String(interviewInterviewerNotes).trim() : null)
              : app.interviewInterviewerNotes,
          interviewPostNotes:
            interviewPostNotes !== undefined
              ? (interviewPostNotes ? String(interviewPostNotes).trim() : null)
              : app.interviewPostNotes,
        },
        include: {
          candidate: true,
          job: true,
          evaluations: {
            include: {
              evaluator: {
                select: { id: true, fullName: true, email: true, role: true },
              },
            },
          },
        },
      });

      await prisma.auditLog.create({
        data: {
          applicationId: app.id,
          userId: sessionUser.id,
          fromStage: app.currentStage,
          toStage: app.currentStage,
          action: "INTERVIEW_NOTES_UPDATED",
        },
      });

      return NextResponse.json({
        success: true,
        message: "Đã lưu ghi chú phỏng vấn thành công!",
        data: updatedApp,
      });
    }

    // Trường hợp 2: Lên lịch mới hoặc Sửa lịch hẹn
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
          error: "Vui lòng nhập link phòng họp trực tuyến hoặc địa chỉ phòng họp trực tiếp",
        },
        { status: 400 }
      );
    }

    const isRescheduling = Boolean(app.interviewDate);
    const format = interviewFormat === "OFFLINE" ? "OFFLINE" : "ONLINE";
    const location = interviewLocation.trim();
    const notes = interviewNotes ? String(interviewNotes).trim() : null;
    const interviewerNotes = interviewInterviewerNotes
      ? String(interviewInterviewerNotes).trim()
      : null;
    const postNotes = interviewPostNotes ? String(interviewPostNotes).trim() : null;

    // Chuyển sang INTERVIEW nếu được yêu cầu và hiện tại đang ở NEW/SCREENING
    const targetStage =
      moveToInterviewStage && app.currentStage !== "INTERVIEW"
        ? "INTERVIEW"
        : app.currentStage;

    // Cập nhật Application và ghi nhận AuditLog trong Transaction
    const [updatedApp] = await prisma.$transaction([
      prisma.application.update({
        where: { id: app.id },
        data: {
          interviewDate: parsedDate,
          interviewFormat: format,
          interviewLocation: location,
          interviewNotes: notes,
          interviewInterviewerNotes: interviewerNotes,
          interviewPostNotes: postNotes,
          currentStage: targetStage,
          stageUpdatedAt: targetStage !== app.currentStage ? new Date() : app.stageUpdatedAt,
        },
        include: {
          candidate: true,
          job: true,
          evaluations: {
            include: {
              evaluator: {
                select: { id: true, fullName: true, email: true, role: true },
              },
            },
          },
        },
      }),
      prisma.auditLog.create({
        data: {
          applicationId: app.id,
          userId: sessionUser.id,
          fromStage: app.currentStage,
          toStage: targetStage,
          action: isRescheduling ? "INTERVIEW_RESCHEDULED" : "INTERVIEW_SCHEDULED",
        },
      }),
    ]);

    // Sinh mẫu Thư mời hoặc Thư đính chính phỏng vấn tự động
    const formattedTime = parsedDate.toLocaleString("vi-VN", {
      dateStyle: "full",
      timeStyle: "short",
    });

    const emailSubject = isRescheduling
      ? `[RecoverX] THÔNG BÁO ĐIỀU CHỈNH LỊCH PHỎNG VẤN — Vị trí ${app.job.title}`
      : `[RecoverX] THƯ MỜI PHỎNG VẤN CHUYÊN MÔN — Vị trí ${app.job.title}`;

    const emailTemplate = `
Kính gửi bạn ${app.candidate.fullName},

${
  isRescheduling
    ? `Ban Tuyển dụng RecoverX xin gửi thông báo điều chỉnh lịch hẹn Phỏng vấn Chuyên môn cho vị trí "${app.job.title}".`
    : `Ban Tuyển dụng RecoverX trân trọng chúc mừng hồ sơ của bạn đã vượt qua vòng sơ loại tiêu chuẩn cho vị trí "${app.job.title}".`
}

Thông tin lịch hẹn phỏng vấn cập nhật như sau:
• Vị trí ứng tuyển: ${app.job.title} (${app.job.department})
• Thời gian phỏng vấn: ${formattedTime}
• Hình thức: ${format === "ONLINE" ? "Phỏng vấn Trực tuyến (Online)" : "Phỏng vấn Trực tiếp (Tại văn phòng)"}
• Địa điểm / Đường dẫn: ${location}
${notes ? `• Ghi chú chuẩn bị cho ứng viên: ${notes}` : ""}

Vui lòng xác nhận sự hiện diện của bạn bằng cách phản hồi email này trước 24 giờ.
Nếu cần hỗ trợ điều chỉnh lịch hẹn, bạn có thể liên hệ trực tiếp với chuyên viên tuyển dụng ${sessionUser.fullName}.

Trân trọng,
Ban Tuyển dụng RecoverX
    `.trim();

    return NextResponse.json({
      success: true,
      message: isRescheduling
        ? `Đã cập nhật lịch phỏng vấn cho ứng viên ${app.candidate.fullName} thành công!`
        : `Đã lên lịch phỏng vấn cho ứng viên ${app.candidate.fullName} thành công!`,
      data: {
        application: updatedApp,
        formattedTime,
        emailSubject,
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

// DELETE: Hủy lịch phỏng vấn đã xếp
export async function DELETE(req: Request) {
  try {
    const sessionUser = getSessionUser();
    if (!sessionUser) {
      return NextResponse.json(
        { success: false, error: "Yêu cầu đăng nhập tài khoản nội bộ để hủy lịch phỏng vấn" },
        { status: 401 }
      );
    }

    if (sessionUser.role === "HIRING_MANAGER") {
      return NextResponse.json(
        {
          success: false,
          error: "Quản lý chuyên môn (Hiring Manager) chỉ có quyền xem lịch, không được hủy lịch phỏng vấn theo quy chuẩn RBAC.",
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const appId = Number(searchParams.get("applicationId"));

    if (!appId) {
      return NextResponse.json(
        { success: false, error: "Thiếu mã hồ sơ ứng tuyển" },
        { status: 400 }
      );
    }

    const app = await prisma.application.findUnique({
      where: { id: appId },
      include: {
        candidate: true,
        job: true,
        evaluations: {
          include: {
            evaluator: {
              select: { id: true, fullName: true, email: true, role: true },
            },
          },
        },
      },
    });

    if (!app) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy hồ sơ ứng tuyển này" },
        { status: 404 }
      );
    }

    const prevDate = app.interviewDate
      ? new Date(app.interviewDate).toLocaleString("vi-VN")
      : "";

    // Xóa lịch phỏng vấn và ghi AuditLog
    const [updatedApp] = await prisma.$transaction([
      prisma.application.update({
        where: { id: app.id },
        data: {
          interviewDate: null,
          interviewFormat: null,
          interviewLocation: null,
          interviewNotes: null,
          interviewInterviewerNotes: null,
          interviewPostNotes: null,
        },
        include: {
          candidate: true,
          job: true,
          evaluations: {
            include: {
              evaluator: {
                select: { id: true, fullName: true, email: true, role: true },
              },
            },
          },
        },
      }),
      prisma.auditLog.create({
        data: {
          applicationId: app.id,
          userId: sessionUser.id,
          fromStage: app.currentStage,
          toStage: app.currentStage,
          action: "INTERVIEW_CANCELLED",
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: `Đã hủy lịch phỏng vấn (${prevDate || "đã xếp"}) của ứng viên ${app.candidate.fullName} thành công!`,
      data: updatedApp,
    });
  } catch (error: any) {
    console.error("Cancel interview error:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi hệ thống khi hủy lịch phỏng vấn: " + error.message },
      { status: 500 }
    );
  }
}
