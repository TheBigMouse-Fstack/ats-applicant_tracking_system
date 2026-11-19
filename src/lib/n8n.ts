/**
 * =========================================================================
 * RECOVERX ATS — N8N WORKFLOW AUTOMATION INTEGRATION (INFRASTRUCTURE LAYER)
 * =========================================================================
 * Hệ thống kết nối Webhook trực tiếp sang máy chủ n8n thực tế:
 * Cấu hình tại file .env ở tầng hạ tầng:
 * - N8N_INTERVIEW_WEBHOOK_URL / N8N_WEBHOOK_URL : Workflow 1 (Thư mời PV & Google Calendar)
 * - N8N_TELEGRAM_WEBHOOK_URL                   : Workflow 2 (Báo tin Telegram HR @Rec_Hr_rBot)
 * - N8N_REJECTION_WEBHOOK_URL                  : Workflow 3 (Bộ đệm hoãn 12h thư từ chối BRL-05)
 */

export interface N8NDispatchResult {
  triggered: boolean;
  success: boolean;
  statusCode?: number;
  message: string;
  webhookUrl?: string;
  error?: string;
}

// -------------------------------------------------------------------------
// 1. WORKFLOW 1: THƯ MỜI PHỎNG VẤN & GOOGLE CALENDAR (N8N)
// -------------------------------------------------------------------------
export interface N8NInterviewPayload {
  event: "INTERVIEW_SCHEDULED" | "INTERVIEW_RESCHEDULED" | "INTERVIEW_CANCELLED";
  applicationId: number;
  candidate: {
    fullName: string;
    email: string;
    phone: string;
  };
  job: {
    title: string;
    department: string;
  };
  interview: {
    date: string;
    formattedTime: string;
    format: "ONLINE" | "OFFLINE";
    location: string;
    notes?: string | null;
  };
  interviewer?: {
    name: string;
    email: string;
  };
  emailOption: string;
  timestamp: string;
}

export async function dispatchN8NInterviewWebhook(
  payload: N8NInterviewPayload,
  customWebhookUrl?: string
): Promise<N8NDispatchResult> {
  const webhookUrl =
    (customWebhookUrl && customWebhookUrl.trim()) ||
    process.env.N8N_INTERVIEW_WEBHOOK_URL ||
    process.env.N8N_WEBHOOK_URL;

  if (!webhookUrl || !webhookUrl.trim()) {
    return {
      triggered: false,
      success: false,
      message: "Chưa cấu hình N8N_WEBHOOK_URL trong biến môi trường (.env) ở tầng hạ tầng.",
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000); // 7s timeout

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "RecoverX-ATS-Engine/1.0",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      return {
        triggered: true,
        success: true,
        statusCode: res.status,
        webhookUrl,
        message: `Kích hoạt tiến trình gửi thư tự động thành công (Mã phản hồi HTTP ${res.status}).`,
      };
    } else {
      const errText = await res.text().catch(() => "");
      return {
        triggered: true,
        success: false,
        statusCode: res.status,
        webhookUrl,
        error: `Cổng tự động phản hồi mã ${res.status}: ${errText.slice(0, 150)}`,
        message: `Hệ thống tự động đã kết nối nhưng quy trình gửi thư chưa được bật (Active). Vui lòng gạt nút Active trên quy trình tự động.`,
      };
    }
  } catch (err: any) {
    const isTimeout = err.name === "AbortError";
    const errorMsg = isTimeout
      ? "Quá thời gian chờ phản hồi (Timeout 7 giây)"
      : "Không thể kết nối đến máy chủ gửi thư tự động";

    return {
      triggered: true,
      success: false,
      webhookUrl,
      error: errorMsg,
      message: `Chưa kết nối được cổng gửi thư tự động (${errorMsg}). Lịch hẹn vẫn được lưu an toàn trên hệ thống.`,
    };
  }
}

// -------------------------------------------------------------------------
// 2. WORKFLOW 2: THÔNG BÁO TỨC THÌ CHO HR QUA TELEGRAM (@Rec_Hr_rBot)
// -------------------------------------------------------------------------
export interface N8NTelegramPayload {
  event: "NEW_APPLICATION" | "STAGE_CHANGED" | "CANDIDATE_HIRED";
  applicationId: number;
  candidate: {
    fullName: string;
    email: string;
    phone: string;
  };
  job: {
    title: string;
    department: string;
  };
  aiMatchScore?: number | null;
  skills?: string[];
  currentStage: string;
  botChannel: string;
  messageText: string;
  timestamp: string;
}

export async function dispatchN8NTelegramAlert(
  payload: N8NTelegramPayload
): Promise<N8NDispatchResult> {
  const webhookUrl =
    process.env.N8N_TELEGRAM_WEBHOOK_URL ||
    process.env.TELEGRAM_WEBHOOK_URL;

  if (!webhookUrl || !webhookUrl.trim()) {
    return {
      triggered: false,
      success: false,
      message: "Chưa cấu hình N8N_TELEGRAM_WEBHOOK_URL trong biến môi trường (.env).",
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "RecoverX-ATS-Engine/1.0",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      return {
        triggered: true,
        success: true,
        statusCode: res.status,
        webhookUrl,
        message: `Kích hoạt n8n gửi thông báo Telegram cho HR (@Rec_Hr_rBot) thành công.`,
      };
    } else {
      const errText = await res.text().catch(() => "");
      return {
        triggered: true,
        success: false,
        statusCode: res.status,
        webhookUrl,
        error: `n8n phản hồi lỗi HTTP ${res.status}: ${errText.slice(0, 150)}`,
        message: `Webhook n8n Telegram phản hồi mã lỗi HTTP ${res.status}.`,
      };
    }
  } catch (err: any) {
    const isTimeout = err.name === "AbortError";
    const errorMsg = isTimeout
      ? "Quá thời gian chờ phản hồi từ n8n (Timeout 7 giây)"
      : err.message || "Không thể kết nối đến địa chỉ webhook n8n Telegram";

    return {
      triggered: true,
      success: false,
      webhookUrl,
      error: errorMsg,
      message: `Lỗi kết nối n8n Telegram (${errorMsg}).`,
    };
  }
}

// -------------------------------------------------------------------------
// 3. WORKFLOW 3: ĐỆM HOÃN 12 GIỜ THƯ TỪ CHỐI & TALENT POOL (BRL-05)
// -------------------------------------------------------------------------
export interface N8NRejectionPayload {
  event: "REJECTION_SCHEDULED" | "REJECTION_CANCELLED";
  applicationId: number;
  candidate: {
    fullName: string;
    email: string;
  };
  job: {
    title: string;
    department: string;
  };
  rejectionReason: string;
  scheduledSendAt: string;
  delayHours: number;
  timestamp: string;
}

export async function dispatchN8NRejectionEmail(
  payload: N8NRejectionPayload
): Promise<N8NDispatchResult> {
  const webhookUrl =
    process.env.N8N_REJECTION_WEBHOOK_URL ||
    process.env.REJECTION_WEBHOOK_URL;

  if (!webhookUrl || !webhookUrl.trim()) {
    return {
      triggered: false,
      success: false,
      message: "Chưa cấu hình N8N_REJECTION_WEBHOOK_URL trong biến môi trường (.env).",
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "RecoverX-ATS-Engine/1.0",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      return {
        triggered: true,
        success: true,
        statusCode: res.status,
        webhookUrl,
        message: payload.event === "REJECTION_CANCELLED"
          ? `Kích hoạt n8n hủy lịch gửi thư từ chối thành công.`
          : `Kích hoạt n8n bộ đệm hoãn 12 giờ gửi thư từ chối thành công.`,
      };
    } else {
      const errText = await res.text().catch(() => "");
      return {
        triggered: true,
        success: false,
        statusCode: res.status,
        webhookUrl,
        error: `n8n phản hồi lỗi HTTP ${res.status}: ${errText.slice(0, 150)}`,
        message: `Webhook n8n Thư từ chối phản hồi mã lỗi HTTP ${res.status}.`,
      };
    }
  } catch (err: any) {
    const isTimeout = err.name === "AbortError";
    const errorMsg = isTimeout
      ? "Quá thời gian chờ phản hồi từ n8n (Timeout 7 giây)"
      : err.message || "Không thể kết nối đến địa chỉ webhook n8n Thư từ chối";

    return {
      triggered: true,
      success: false,
      webhookUrl,
      error: errorMsg,
      message: `Lỗi kết nối n8n Thư từ chối (${errorMsg}).`,
    };
  }
}
