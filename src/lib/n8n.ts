/**
 * n8n Workflow Automation Integration Module
 * Chịu trách nhiệm gửi Webhook sự kiện phỏng vấn sang n8n Engine
 * để tự động hóa gửi Gmail HTML & tạo sự kiện Google Calendar
 */

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

export interface N8NDispatchResult {
  triggered: boolean;
  success: boolean;
  statusCode?: number;
  message: string;
  webhookUrl?: string;
  error?: string;
}

/**
 * Gửi Webhook sự kiện phỏng vấn sang n8n
 */
export async function dispatchN8NInterviewWebhook(
  payload: N8NInterviewPayload,
  customWebhookUrl?: string
): Promise<N8NDispatchResult> {
  const webhookUrl =
    (customWebhookUrl && customWebhookUrl.trim()) ||
    process.env.N8N_INTERVIEW_WEBHOOK_URL ||
    process.env.N8N_WEBHOOK_URL;

  if (!webhookUrl) {
    return {
      triggered: false,
      success: false,
      message: "Chưa cấu hình N8N_WEBHOOK_URL trong biến môi trường (.env) hoặc giao diện.",
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
        message: `Kích hoạt n8n thành công (Mã phản hồi HTTP ${res.status}).`,
      };
    } else {
      const errText = await res.text().catch(() => "");
      return {
        triggered: true,
        success: false,
        statusCode: res.status,
        webhookUrl,
        error: `n8n phản hồi lỗi HTTP ${res.status}: ${errText.slice(0, 150)}`,
        message: `Webhook n8n phản hồi lỗi HTTP ${res.status}. Vui lòng kiểm tra workflow trong n8n.`,
      };
    }
  } catch (err: any) {
    const isTimeout = err.name === "AbortError";
    const errorMsg = isTimeout
      ? "Quá thời gian chờ phản hồi từ n8n (Timeout 7 giây)"
      : err.message || "Không thể kết nối đến địa chỉ webhook n8n";

    return {
      triggered: true,
      success: false,
      webhookUrl,
      error: errorMsg,
      message: `Lỗi kết nối n8n: ${errorMsg}`,
    };
  }
}
