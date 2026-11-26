import "server-only";
import { prisma } from "@/lib/prisma";
import { evaluateHeadcountGate } from "@/lib/headcount-rules";
import {
  dispatchN8NInterviewWebhook,
  type N8NInterviewPayload,
  type N8NDispatchResult,
} from "@/lib/n8n";
import { requireSession, requirePermission, assertRole } from "./auth";
import { DalError } from "./errors";
import { assertStageTransitionAllowed, maskApplicationBlindScorecard } from "./gates";

export async function scheduleOrUpdateInterview(body: Record<string, any>) {
  const sessionUser = await requireSession();

  const {
    applicationId,
    interviewDate,
    interviewFormat,
    interviewLocation,
    interviewNotes,
    interviewInterviewerNotes,
    interviewPostNotes,
    interviewEmailOption = "AUTO_N8N",
    customEmailSubject,
    customEmailBody,
    moveToInterviewStage,
    isQuickNotesUpdate,
    forceInterviewCapOverride,
  } = body;

  if (!isQuickNotesUpdate) {
    assertRole(sessionUser, ["ADMIN", "HIRING_MANAGER"], {
      vi: "Chuyên viên HR chuyển hồ sơ tối đa đến vòng Sàng lọc. Quyền xếp lịch và duyệt Phỏng vấn thuộc thẩm quyền Quản lý chuyên môn.",
      en: "HR Specialists can screen candidates; scheduling interviews is restricted to Hiring Managers and Administrators.",
    });
  }

  if (!applicationId) {
    throw new DalError("BAD_REQUEST", {
      messageVi: "Thiếu mã hồ sơ ứng tuyển",
      messageEn: "Missing application ID.",
    });
  }

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
    throw new DalError("NOT_FOUND", {
      messageVi: "Không tìm thấy hồ sơ ứng tuyển này",
      messageEn: "Application not found.",
    });
  }

  if (isQuickNotesUpdate) {
    const [updatedApp] = await prisma.$transaction([
      prisma.application.update({
        where: { id: app.id },
        data: {
          interviewNotes:
            interviewNotes !== undefined
              ? interviewNotes
                ? String(interviewNotes).trim()
                : null
              : app.interviewNotes,
          interviewInterviewerNotes:
            interviewInterviewerNotes !== undefined
              ? interviewInterviewerNotes
                ? String(interviewInterviewerNotes).trim()
                : null
              : app.interviewInterviewerNotes,
          interviewPostNotes:
            interviewPostNotes !== undefined
              ? interviewPostNotes
                ? String(interviewPostNotes).trim()
                : null
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
      }),
      prisma.auditLog.create({
        data: {
          applicationId: app.id,
          userId: sessionUser.id,
          fromStage: app.currentStage,
          toStage: app.currentStage,
          action: "INTERVIEW_NOTES_UPDATED",
        },
      }),
    ]);

    return {
      isQuickNotes: true,
      message: "Đã lưu ghi chú phỏng vấn thành công!",
      data: maskApplicationBlindScorecard(sessionUser, updatedApp),
    };
  }

  if (!interviewDate) {
    throw new DalError("BAD_REQUEST", {
      messageVi: "Vui lòng chọn ngày và giờ diễn ra phỏng vấn",
      messageEn: "Please select an interview date and time.",
    });
  }

  const parsedDate = new Date(interviewDate);
  if (isNaN(parsedDate.getTime())) {
    throw new DalError("BAD_REQUEST", {
      messageVi: "Định dạng thời gian phỏng vấn không hợp lệ",
      messageEn: "Invalid interview date format.",
    });
  }

  if (!interviewLocation || !String(interviewLocation).trim()) {
    throw new DalError("BAD_REQUEST", {
      messageVi: "Vui lòng nhập link phòng họp trực tuyến hoặc địa chỉ phòng họp trực tiếp",
      messageEn: "Please enter an online meeting link or office room address.",
    });
  }

  const isRescheduling = Boolean(app.interviewDate);
  const format = interviewFormat === "OFFLINE" ? "OFFLINE" : "ONLINE";
  const location = String(interviewLocation).trim();
  const notes = interviewNotes ? String(interviewNotes).trim() : null;
  const interviewerNotes = interviewInterviewerNotes
    ? String(interviewInterviewerNotes).trim()
    : null;
  const postNotes = interviewPostNotes ? String(interviewPostNotes).trim() : null;

  if (app.currentStage === "NEW" || app.currentStage === "HIRED") {
    throw new DalError("BAD_REQUEST", {
      messageVi:
        app.currentStage === "NEW"
          ? "Hồ sơ đang ở vòng Mới nộp, cần được HR chuyển sang Sàng lọc tiêu chuẩn trước khi xếp lịch phỏng vấn."
          : "Hồ sơ đã ở trạng thái Tuyển chọn, không thể lên lịch phỏng vấn mới.",
      messageEn:
        app.currentStage === "NEW"
          ? "New applications must pass HR Screening before scheduling an interview."
          : "Hired applications cannot be scheduled for a new interview.",
    });
  }

  const targetStage =
    moveToInterviewStage && app.currentStage !== "INTERVIEW"
      ? "INTERVIEW"
      : app.currentStage;

  // P1-01: Bắt buộc gọi assertStageTransitionAllowed tại DAL cho luồng chuyển sang INTERVIEW
  if (targetStage !== app.currentStage) {
    assertStageTransitionAllowed(sessionUser, {
      fromStage: app.currentStage,
      toStage: targetStage,
      evaluationsCount: app.evaluations.length,
    });
  }

  if (targetStage === "INTERVIEW" && app.currentStage !== "INTERVIEW") {
    const [hiredCount, activeInterviewCount] = await Promise.all([
      prisma.application.count({ where: { jobId: app.jobId, currentStage: "HIRED" } }),
      prisma.application.count({ where: { jobId: app.jobId, currentStage: "INTERVIEW" } }),
    ]);
    const headcountCheck = evaluateHeadcountGate({
      jobTitle: app.job.title,
      fromStage: app.currentStage,
      toStage: "INTERVIEW",
      targetHeadcount: app.job.targetHeadcount,
      maxActiveInterviews: app.job.maxActiveInterviews,
      hiredCount,
      activeInterviewCount,
      forceOverride: Boolean(forceInterviewCapOverride),
    });
    if (!headcountCheck.allowed) {
      throw new DalError("BAD_REQUEST", {
        status: headcountCheck.statusCode || 400,
        messageVi: headcountCheck.error,
        messageEn: headcountCheck.error,
        extra: {
          requiresOverride: Boolean(headcountCheck.requiresOverride),
          headcountMetrics: headcountCheck.metrics,
        },
      });
    }
  }

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
        interviewEmailOption,
        customEmailSubject:
          interviewEmailOption === "MANUAL_CUSTOM" ? customEmailSubject || null : null,
        customEmailBody:
          interviewEmailOption === "MANUAL_CUSTOM" ? customEmailBody || null : null,
        isInterviewInviteSent: interviewEmailOption === "AUTO_N8N" ? false : true,
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
        action: isRescheduling
          ? "INTERVIEW_RESCHEDULED"
          : interviewEmailOption === "MANUAL_CUSTOM"
          ? "INTERVIEW_SCHEDULED_CUSTOM_EMAIL"
          : interviewEmailOption === "NONE"
          ? "INTERVIEW_SCHEDULED_NO_EMAIL"
          : "INTERVIEW_SCHEDULED_AUTO_EMAIL",
        reason:
          interviewEmailOption === "MANUAL_CUSTOM"
            ? "Tự soạn thư mời và lưu trữ trên hệ thống"
            : interviewEmailOption === "NONE"
            ? "Không gửi email (đã liên hệ trực tiếp)"
            : "Kích hoạt gửi thư mời tự động kèm lịch hẹn",
      },
    }),
  ]);

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

  let n8nResult: N8NDispatchResult | null = null;
  if (interviewEmailOption === "AUTO_N8N") {
    const payload: N8NInterviewPayload = {
      event: isRescheduling ? "INTERVIEW_RESCHEDULED" : "INTERVIEW_SCHEDULED",
      applicationId: app.id,
      candidate: {
        fullName: app.candidate.fullName,
        email: app.candidate.email,
        phone: app.candidate.phone,
      },
      job: { title: app.job.title, department: app.job.department },
      interview: {
        date: parsedDate.toISOString(),
        formattedTime,
        format,
        location,
        notes,
      },
      interviewer: { name: sessionUser.fullName, email: sessionUser.email },
      emailOption: interviewEmailOption,
      timestamp: new Date().toISOString(),
    };

    n8nResult = await dispatchN8NInterviewWebhook(payload);
    if (n8nResult.success) {
      await prisma.application.update({
        where: { id: app.id },
        data: { isInterviewInviteSent: true },
      });
      (updatedApp as any).isInterviewInviteSent = true;
    }
  }

  let responseMessage = isRescheduling
    ? `Đã cập nhật lịch phỏng vấn cho ứng viên ${app.candidate.fullName} thành công!`
    : `Đã lên lịch phỏng vấn cho ứng viên ${app.candidate.fullName} thành công!`;

  if (interviewEmailOption === "AUTO_N8N") {
    if (n8nResult?.success) {
      responseMessage += ` Đã tự động gửi thư mời và đồng bộ lịch hẹn cho ứng viên.`;
    } else if (n8nResult && !n8nResult.success) {
      responseMessage += ` (Thư mời tự động đang trong hàng đợi xử lý).`;
    }
  }

  // P0-02 (BRL-15): Áp dụng Blind Scorecard cho evaluations trả về
  const maskedApp = maskApplicationBlindScorecard(sessionUser, updatedApp);

  return {
    isQuickNotes: false,
    message: responseMessage,
    n8nResult,
    data: {
      application: maskedApp,
      formattedTime,
      emailSubject,
      emailTemplate,
    },
  };
}

export async function cancelInterview(applicationId: number) {
  const sessionUser = await requirePermission("interviews:schedule", {
    vi: "Chỉ Quản lý chuyên môn hoặc Quản trị viên mới có quyền hủy lịch phỏng vấn.",
    en: "Only Hiring Managers or Administrators can cancel interviews.",
  });

  if (!Number.isInteger(applicationId) || applicationId <= 0) {
    throw new DalError("BAD_REQUEST", {
      messageVi: "Thiếu mã hồ sơ ứng tuyển",
      messageEn: "Missing application ID.",
    });
  }

  const app = await prisma.application.findUnique({
    where: { id: applicationId },
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
    throw new DalError("NOT_FOUND", {
      messageVi: "Không tìm thấy hồ sơ ứng tuyển này",
      messageEn: "Application not found.",
    });
  }

  const prevDate = app.interviewDate
    ? new Date(app.interviewDate).toLocaleString("vi-VN", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "";

  const [updatedApp] = await prisma.$transaction([
    prisma.application.update({
      where: { id: app.id },
      data: {
        interviewDate: null,
        interviewLocation: null,
        isInterviewInviteSent: false,
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
        reason: `Hủy lịch phỏng vấn (${prevDate || "đã xếp"})`,
      },
    }),
  ]);

  let cancelNotice = "";
  if (app.interviewDate) {
    const cancelPayload: N8NInterviewPayload = {
      event: "INTERVIEW_CANCELLED",
      applicationId: app.id,
      candidate: {
        fullName: app.candidate.fullName,
        email: app.candidate.email,
        phone: app.candidate.phone,
      },
      job: { title: app.job.title, department: app.job.department },
      interview: {
        date: new Date(app.interviewDate).toISOString(),
        formattedTime: prevDate,
        format: app.interviewFormat === "OFFLINE" ? "OFFLINE" : "ONLINE",
        location: app.interviewLocation || "Chưa xác định",
        notes: app.interviewNotes,
      },
      interviewer: { name: sessionUser.fullName, email: sessionUser.email },
      emailOption: app.interviewEmailOption || "AUTO_N8N",
      timestamp: new Date().toISOString(),
    };

    try {
      const n8nResult = await dispatchN8NInterviewWebhook(cancelPayload);
      if (n8nResult.success) {
        cancelNotice = " Đã tự động gửi thông báo hủy lịch phỏng vấn cho ứng viên qua n8n.";
      }
    } catch (err: any) {
      console.warn("Lỗi kích hoạt webhook n8n hủy lịch:", err?.message);
    }
  }

  return {
    message: `Đã hủy lịch phỏng vấn (${prevDate || "đã xếp"}) của ứng viên ${app.candidate.fullName} thành công!${cancelNotice}`,
    data: maskApplicationBlindScorecard(sessionUser, updatedApp),
  };
}

/**
 * P1-04 (Chống SSRF & rò rỉ N8N_WEBHOOK_SECRET):
 * Tuyệt đối KHÔNG nhận `customWebhookUrl` từ client body; chỉ gửi tới webhook env cấu hình trên server.
 */
export async function triggerInterviewAutomation(applicationId: number) {
  const sessionUser = await requirePermission("interviews:trigger-n8n");

  if (!Number.isInteger(applicationId) || applicationId <= 0) {
    throw new DalError("BAD_REQUEST", {
      messageVi: "Thiếu mã hồ sơ ứng tuyển.",
      messageEn: "Missing application ID.",
    });
  }

  const app = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { candidate: true, job: true },
  });

  if (!app) {
    throw new DalError("NOT_FOUND", {
      messageVi: "Không tìm thấy hồ sơ ứng tuyển này.",
      messageEn: "Application not found.",
    });
  }

  if (!app.interviewDate) {
    throw new DalError("BAD_REQUEST", {
      messageVi: "Hồ sơ ứng viên chưa có lịch phỏng vấn để kích hoạt gửi thư tự động.",
      messageEn: "This application does not have an interview scheduled yet.",
    });
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
    job: { title: app.job.title, department: app.job.department },
    interview: {
      date: new Date(app.interviewDate).toISOString(),
      formattedTime,
      format: app.interviewFormat === "OFFLINE" ? "OFFLINE" : "ONLINE",
      location: app.interviewLocation || "Chưa xác định",
      notes: app.interviewNotes,
    },
    interviewer: { name: sessionUser.fullName, email: sessionUser.email },
    emailOption: app.interviewEmailOption || "AUTO_N8N",
    timestamp: new Date().toISOString(),
  };

  // Chỉ sử dụng URL từ biến môi trường server (không nhận customWebhookUrl)
  const n8nResult = await dispatchN8NInterviewWebhook(payload);

  if (n8nResult.success) {
    const [updatedApp] = await prisma.$transaction([
      prisma.application.update({
        where: { id: app.id },
        data: { isInterviewInviteSent: true },
        include: { candidate: true, job: true },
      }),
      prisma.auditLog.create({
        data: {
          applicationId: app.id,
          userId: sessionUser.id,
          fromStage: app.currentStage,
          toStage: app.currentStage,
          action: "INTERVIEW_INVITE_SENT_AUTO",
          reason: "Kích hoạt thành công gửi thư tự động",
        },
      }),
    ]);

    return {
      success: true,
      n8nResult,
      message: `Đã gửi thư mời tự động và đồng bộ lịch hẹn cho ứng viên ${app.candidate.fullName}!`,
      data: updatedApp,
    };
  }

  return {
    success: false,
    n8nResult,
    error: n8nResult.message,
    message: n8nResult.message || "Dịch vụ gửi thư tự động đang trong hàng đợi xử lý.",
  };
}
