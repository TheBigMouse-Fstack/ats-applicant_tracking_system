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

/**
 * Làm sạch URL webhook: loại bỏ triệt để ký tự Byte Order Mark (\uFEFF / BOM),
 * zero-width spaces (\u200B, \u200C, \u200D), khoảng trắng và dấu ngoặc kép thừa
 * từ biến môi trường của Vercel hoặc Windows.
 */
export function sanitizeWebhookUrl(rawUrl?: string | null): string {
  if (!rawUrl) return "";
  return rawUrl.replace(/^[\uFEFF\u200B\u200C\u200D\s"']+|[\uFEFF\u200B\u200C\u200D\s"']+$/g, "").trim();
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
  payload: N8NInterviewPayload
): Promise<N8NDispatchResult> {
  // P1-04: Chỉ sử dụng webhook URL từ biến môi trường server, tuyệt đối không nhận URL từ client
  const webhookUrl = sanitizeWebhookUrl(
    process.env.N8N_INTERVIEW_WEBHOOK_URL ||
    process.env.N8N_WEBHOOK_URL
  );

  if (!webhookUrl) {
    return {
      triggered: false,
      success: false,
      message: "Chưa cấu hình cổng gửi thư tự động.",
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
        ...(process.env.N8N_WEBHOOK_SECRET
          ? { "X-Webhook-Secret": process.env.N8N_WEBHOOK_SECRET }
          : {}),
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const resJson = await res.json().catch(() => null);
      if (resJson && (resJson.error || resJson.success === false)) {
        const detailErr = typeof resJson.error === "string" ? resJson.error : JSON.stringify(resJson.error);
        return {
          triggered: true,
          success: false,
          statusCode: res.status,
          webhookUrl,
          error: detailErr || "Tiến trình gửi thư trong n8n gặp sự cố",
          message: detailErr?.includes("access token")
            ? "Tài khoản Gmail/Google Calendar trong n8n chưa được đăng nhập cấp quyền (thiếu access token)."
            : "Hệ thống tự động n8n đã tiếp nhận nhưng tiến trình gửi thư bị lỗi.",
        };
      }

      return {
        triggered: true,
        success: true,
        statusCode: res.status,
        webhookUrl,
        message: "Kích hoạt tiến trình gửi thư tự động thành công.",
      };
    } else {
      const errText = await res.text().catch(() => "");
      return {
        triggered: true,
        success: false,
        statusCode: res.status,
        webhookUrl,
        error: `Cổng tự động phản hồi mã ${res.status}: ${errText.slice(0, 150)}`,
        message: "Hệ thống tự động đã kết nối nhưng tiến trình gửi thư chưa được kích hoạt.",
      };
    }
  } catch (err: any) {
    const isTimeout = err.name === "AbortError";
    const errorMsg = isTimeout
      ? "Quá thời gian chờ phản hồi"
      : "Không thể kết nối đến máy chủ gửi thư tự động";

    return {
      triggered: true,
      success: false,
      webhookUrl,
      error: errorMsg,
      message: "Chưa thể gửi thư tự động lúc này. Lịch hẹn vẫn được lưu an toàn trên hệ thống.",
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
  const webhookUrl = sanitizeWebhookUrl(
    process.env.N8N_TELEGRAM_WEBHOOK_URL ||
    process.env.TELEGRAM_WEBHOOK_URL
  );

  if (!webhookUrl) {
    return {
      triggered: false,
      success: false,
      message: "Chưa cấu hình cổng thông báo Telegram.",
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
        ...(process.env.N8N_WEBHOOK_SECRET
          ? { "X-Webhook-Secret": process.env.N8N_WEBHOOK_SECRET }
          : {}),
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const resJson = await res.json().catch(() => null);
      if (resJson && (resJson.error || resJson.success === false)) {
        const detailErr = typeof resJson.error === "string" ? resJson.error : JSON.stringify(resJson.error);
        return {
          triggered: true,
          success: false,
          statusCode: res.status,
          webhookUrl,
          error: detailErr,
          message: "Tiến trình gửi thông báo Telegram bị lỗi trong n8n.",
        };
      }

      return {
        triggered: true,
        success: true,
        statusCode: res.status,
        webhookUrl,
        message: "Gửi thông báo Telegram cho chuyên viên tuyển dụng thành công.",
      };
    } else {
      const errText = await res.text().catch(() => "");
      return {
        triggered: true,
        success: false,
        statusCode: res.status,
        webhookUrl,
        error: `Cổng thông báo phản hồi mã ${res.status}: ${errText.slice(0, 150)}`,
        message: "Tiến trình gửi thông báo Telegram chưa được kích hoạt.",
      };
    }
  } catch (err: any) {
    const isTimeout = err.name === "AbortError";
    const errorMsg = isTimeout
      ? "Quá thời gian chờ phản hồi"
      : "Không thể kết nối đến cổng thông báo Telegram";

    return {
      triggered: true,
      success: false,
      webhookUrl,
      error: errorMsg,
      message: "Chưa thể gửi thông báo Telegram lúc này.",
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
  const webhookUrl = sanitizeWebhookUrl(
    process.env.N8N_REJECTION_WEBHOOK_URL ||
    process.env.REJECTION_WEBHOOK_URL
  );

  if (!webhookUrl) {
    return {
      triggered: false,
      success: false,
      message: "Chưa cấu hình cổng gửi thư từ chối tự động.",
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
        ...(process.env.N8N_WEBHOOK_SECRET
          ? { "X-Webhook-Secret": process.env.N8N_WEBHOOK_SECRET }
          : {}),
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const resJson = await res.json().catch(() => null);
      if (resJson && (resJson.error || resJson.success === false)) {
        const detailErr = typeof resJson.error === "string" ? resJson.error : JSON.stringify(resJson.error);
        return {
          triggered: true,
          success: false,
          statusCode: res.status,
          webhookUrl,
          error: detailErr,
          message: "Tiến trình đệm hoãn thư từ chối bị lỗi trong n8n.",
        };
      }

      return {
        triggered: true,
        success: true,
        statusCode: res.status,
        webhookUrl,
        message: payload.event === "REJECTION_CANCELLED"
          ? "Đã hủy lịch gửi thư từ chối thành công."
          : "Đã kích hoạt bộ đệm hoãn gửi thư từ chối thành công.",
      };
    } else {
      const errText = await res.text().catch(() => "");
      return {
        triggered: true,
        success: false,
        statusCode: res.status,
        webhookUrl,
        error: `Cổng thư từ chối phản hồi mã ${res.status}: ${errText.slice(0, 150)}`,
        message: "Tiến trình gửi thư từ chối chưa được kích hoạt.",
      };
    }
  } catch (err: any) {
    const isTimeout = err.name === "AbortError";
    const errorMsg = isTimeout
      ? "Quá thời gian chờ phản hồi"
      : "Không thể kết nối đến máy chủ gửi thư từ chối";

    return {
      triggered: true,
      success: false,
      webhookUrl,
      error: errorMsg,
      message: "Chưa thể gửi thư từ chối lúc này.",
    };
  }
}
