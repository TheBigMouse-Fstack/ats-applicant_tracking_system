import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { validateStageTransition } from "@/lib/stage-rules";

export async function POST(req: Request) {
  try {
    const sessionUser = getSessionUser();
    if (!sessionUser) {
      return NextResponse.json(
        {
          success: false,
          error: "Yêu cầu đăng nhập tài khoản nội bộ để luân chuyển trạng thái hồ sơ.",
        },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { applicationId, toStage, rejectionReason, note } = body;

    if (!applicationId || !toStage) {
      return NextResponse.json(
        { success: false, error: "Thiếu ID hồ sơ hoặc trạng thái đích" },
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

    // 2. KIỂM TRA TOÀN BỘ RULE CHUYỂN TRẠNG THÁI (State Machine + RBAC + BRL-06 + BRL-11)
    const hasPassingEvaluation = app.evaluations.some(
      (ev) => ev.recommendation === "HIRE" || ev.recommendation === "STRONG_HIRE"
    );

    const validation = validateStageTransition({
      fromStage,
      toStage,
      role: sessionUser.role,
      evaluationsCount: app.evaluations.length,
      hasPassingEvaluation: app.evaluations.length > 0 ? hasPassingEvaluation : undefined,
      rejectionReason,
    });

    if (!validation.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error,
          rule: validation.rule,
        },
        { status: validation.statusCode || 400 }
      );
    }

    // 3. KIỂM TRA BRL-05: DELAY BUFFER CHO EMAIL TỪ CHỐI & LÝ DO TỪ CHỐI (BRL-11)
    let emailScheduledAt: Date | null = app.emailScheduledAt;
    let isEmailSent = app.isEmailSent;
    let savedRejectionReason: string | null = app.rejectionReason;
    let auditReason: string | null = note ? String(note).trim() : null;

    if (toStage === "REJECTED") {
      // Hẹn giờ sau 12 tiếng nếu chuyển sang REJECTED
      emailScheduledAt = new Date(Date.now() + 12 * 60 * 60 * 1000);
      isEmailSent = false;
      savedRejectionReason = String(rejectionReason).trim();
      auditReason = `Lý do từ chối: ${savedRejectionReason}`;
    } else if (fromStage === "REJECTED" && toStage !== "REJECTED") {
      // BRL-05 Exception: Nếu kéo thẻ rời khỏi cột REJECTED, tự động hủy lịch gửi email từ chối
      emailScheduledAt = null;
      isEmailSent = false;
      savedRejectionReason = null;
      auditReason = auditReason || "Phục hồi hồ sơ từ cột Từ chối (tự động hủy lịch gửi email từ chối)";
    }

    // 4. Cập nhật Application và tạo AuditLog trong 1 Transaction
    const [updatedApp] = await prisma.$transaction([
      prisma.application.update({
        where: { id: app.id },
        data: {
          currentStage: toStage,
          stageUpdatedAt: new Date(),
          emailScheduledAt,
          isEmailSent,
          rejectionReason: savedRejectionReason,
          isViewed: true,
          viewedAt: app.viewedAt || new Date(),
        },
      }),
      prisma.auditLog.create({
        data: {
          applicationId: app.id,
          userId: sessionUser.id,
          fromStage,
          toStage,
          action: "STAGE_CHANGE",
          reason: auditReason,
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
