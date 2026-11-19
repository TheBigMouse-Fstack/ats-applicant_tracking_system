import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { dispatchN8NInterviewWebhook, N8NInterviewPayload } from "@/lib/n8n";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const sessionUser = getSessionUser();
    if (!sessionUser) {
      return NextResponse.json(
        { success: false, error: "Yêu cầu đăng nhập tài khoản nội bộ để kích hoạt gửi thư tự động." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { applicationId, customWebhookUrl } = body;

    if (!applicationId) {
      return NextResponse.json(
        { success: false, error: "Thiếu mã hồ sơ ứng tuyển." },
        { status: 400 }
      );
    }

    const app = await prisma.application.findUnique({
      where: { id: Number(applicationId) },
      include: {
        candidate: true,
        job: true,
      },
    });

    if (!app) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy hồ sơ ứng tuyển này." },
        { status: 404 }
      );
    }

    if (!app.interviewDate) {
      return NextResponse.json(
        { success: false, error: "Hồ sơ ứng viên chưa có lịch phỏng vấn để kích hoạt gửi thư tự động." },
        { status: 400 }
      );
    }

    const formattedTime = new Date(app.interviewDate).toLocaleString("vi-VN", {
      dateStyle: "full",
      timeStyle: "short",
    });

    const payload: N8NInterviewPayload = {
      event: "INTERVIEW_SCHEDULED",
      applicationId: app.id,
      candidate: {
        fullName: app.candidate.fullName,
        email: app.candidate.email,
        phone: app.candidate.phone,
      },
      job: {
        title: app.job.title,
        department: app.job.department,
      },
      interview: {
        date: new Date(app.interviewDate).toISOString(),
        formattedTime,
        format: app.interviewFormat === "OFFLINE" ? "OFFLINE" : "ONLINE",
        location: app.interviewLocation || "Chưa xác định",
        notes: app.interviewNotes,
      },
      interviewer: {
        name: sessionUser.fullName,
        email: sessionUser.email,
      },
      emailOption: app.interviewEmailOption || "AUTO_N8N",
      timestamp: new Date().toISOString(),
    };

    const n8nResult = await dispatchN8NInterviewWebhook(payload, customWebhookUrl);

    if (n8nResult.success) {
      const updatedApp = await prisma.application.update({
        where: { id: app.id },
        data: {
          isInterviewInviteSent: true,
        },
        include: {
          candidate: true,
          job: true,
        },
      });

      await prisma.auditLog.create({
        data: {
          applicationId: app.id,
          userId: sessionUser.id,
          fromStage: app.currentStage,
          toStage: app.currentStage,
          action: "INTERVIEW_INVITE_SENT_AUTO",
          reason: `Kích hoạt thành công gửi thư tự động`,
        },
      });

      return NextResponse.json({
        success: true,
        n8nResult,
        message: `Đã gửi thư mời tự động và đồng bộ lịch hẹn cho ứng viên ${app.candidate.fullName}!`,
        data: updatedApp,
      });
    } else {
      return NextResponse.json({
        success: false,
        n8nResult,
        error: n8nResult.message,
        message: n8nResult.message || "Dịch vụ gửi thư tự động đang trong hàng đợi xử lý.",
      });
    }
  } catch (error: any) {
    console.error("Trigger automation error:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi hệ thống khi gửi thư tự động: " + error.message },
      { status: 500 }
    );
  }
}
