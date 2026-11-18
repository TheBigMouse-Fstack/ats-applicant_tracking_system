import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { validateStageTransition } from "@/lib/stage-rules";
import { evaluateHeadcountGate } from "@/lib/headcount-rules";

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
    const {
      applicationId,
      toStage,
      rejectionReason,
      note,
      forceInterviewCapOverride,
    } = body;

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

    // 2.5. KIỂM TRA CHỈ TIÊU TUYỂN DỤNG & TRẦN PHỎNG VẤN CÙNG LÚC (BRL-13: Chống phỏng vấn dư & Tự đóng tin)
    const [hiredCount, activeInterviewCount] = await Promise.all([
      prisma.application.count({
        where: { jobId: app.jobId, currentStage: "HIRED" },
      }),
      prisma.application.count({
        where: { jobId: app.jobId, currentStage: "INTERVIEW" },
      }),
    ]);

    const headcountCheck = evaluateHeadcountGate({
      jobTitle: app.job.title,
      fromStage,
      toStage,
      targetHeadcount: app.job.targetHeadcount,
      maxActiveInterviews: app.job.maxActiveInterviews,
      hiredCount,
      activeInterviewCount,
      forceOverride: Boolean(forceInterviewCapOverride),
    });

    if (!headcountCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: headcountCheck.error,
          rule: headcountCheck.rule,
          requiresOverride: Boolean(headcountCheck.requiresOverride),
          headcountMetrics: headcountCheck.metrics,
        },
        { status: headcountCheck.statusCode || 400 }
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
    } else if (toStage === "INTERVIEW" && forceInterviewCapOverride && headcountCheck.metrics.isInterviewAtCap) {
      auditReason =
        auditReason ||
        `Xác nhận vượt hạn mức phỏng vấn cùng lúc (${activeInterviewCount + 1}/${headcountCheck.metrics.effectiveInterviewCap})`;
    } else if (headcountCheck.willAutoCloseJob) {
      auditReason =
        auditReason ||
        `Hoàn thành chỉ tiêu tuyển dụng (${hiredCount + 1}/${headcountCheck.metrics.targetHeadcount}) — tự động đóng tin nhận hồ sơ`;
    }

    // 4. Cập nhật Application, AuditLog và tự đóng Job nếu tuyển đủ suất cuối trong 1 Transaction
    const txOps: any[] = [
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
    ];

    if (headcountCheck.willAutoCloseJob) {
      txOps.push(
        prisma.job.update({
          where: { id: app.jobId },
          data: { status: "CLOSED" },
        })
      );
    }

    const [updatedApp] = await prisma.$transaction(txOps);

    return NextResponse.json({
      success: true,
      message: headcountCheck.willAutoCloseJob
        ? `Đã xác nhận Tuyển chọn (${hiredCount + 1}/${headcountCheck.metrics.targetHeadcount}). Tin tuyển dụng "${app.job.title}" đã tự động đóng nhận hồ sơ mới.`
        : `Đã chuyển hồ sơ sang cột ${toStage}`,
      jobAutoClosed: Boolean(headcountCheck.willAutoCloseJob),
      headcountMetrics: headcountCheck.metrics,
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
