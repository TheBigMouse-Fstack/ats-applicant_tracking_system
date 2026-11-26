import "server-only";
import { NextResponse } from "next/server";

export type DalErrorCode =
  | "AUTH_UNAUTHORIZED"
  | "AUTH_INVALID_CREDENTIALS"
  | "AUTH_ACCOUNT_DISABLED"
  | "AUTH_FORBIDDEN"
  | "AUTH_VALIDATION_ERROR"
  | "AUTH_PASSWORD_WEAK"
  | "AUTH_PASSWORD_MISMATCH"
  | "AUTH_PASSWORD_UNCHANGED"
  | "AUTH_RATE_LIMITED"
  | "AUTH_SERVICE_UNAVAILABLE"
  | "SELF_LOCKOUT_PREVENTED"
  | "NOT_FOUND"
  | "CONFLICT"
  | "BAD_REQUEST";

interface ErrorMessagePair {
  status: number;
  vi: string;
  en: string;
}

/**
 * Bảng thông điệp lỗi chuẩn VI & EN (Zero technical codes: không chứa BRL-*, NFR-*, RBAC).
 */
export const DAL_ERROR_CATALOG: Record<DalErrorCode, ErrorMessagePair> = {
  AUTH_UNAUTHORIZED: {
    status: 401,
    vi: "Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.",
    en: "Your session has expired or is invalid. Please sign in again.",
  },
  AUTH_INVALID_CREDENTIALS: {
    status: 401,
    vi: "Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.",
    en: "Incorrect email or password. Please check your credentials.",
  },
  AUTH_ACCOUNT_DISABLED: {
    status: 403,
    vi: "Tài khoản của bạn hiện đang tạm khóa. Vui lòng liên hệ quản trị viên.",
    en: "Your account is currently suspended. Please contact an administrator.",
  },
  AUTH_FORBIDDEN: {
    status: 403,
    vi: "Bạn không có quyền thực hiện thao tác này.",
    en: "You do not have permission to perform this action.",
  },
  AUTH_VALIDATION_ERROR: {
    status: 400,
    vi: "Thông tin đầu vào chưa hợp lệ. Vui lòng kiểm tra lại các trường bắt buộc.",
    en: "Invalid input data. Please check the required fields.",
  },
  AUTH_PASSWORD_WEAK: {
    status: 400,
    vi: "Mật khẩu mới phải có ít nhất 8 ký tự.",
    en: "New password must be at least 8 characters long.",
  },
  AUTH_PASSWORD_MISMATCH: {
    status: 400,
    vi: "Xác nhận mật khẩu mới không khớp.",
    en: "New password confirmation does not match.",
  },
  AUTH_PASSWORD_UNCHANGED: {
    status: 400,
    vi: "Mật khẩu mới không được trùng với mật khẩu hiện tại.",
    en: "New password must be different from your current password.",
  },
  AUTH_RATE_LIMITED: {
    status: 429,
    vi: "Bạn đã thử đăng nhập quá nhiều lần. Vui lòng thử lại sau ít phút.",
    en: "Too many sign-in attempts. Please try again in a few minutes.",
  },
  AUTH_SERVICE_UNAVAILABLE: {
    status: 503,
    vi: "Dịch vụ xác thực tạm thời gián đoạn. Vui lòng thử lại sau giây lát.",
    en: "Authentication service is temporarily unavailable. Please try again shortly.",
  },
  SELF_LOCKOUT_PREVENTED: {
    status: 400,
    vi: "Bạn không thể tự khóa hoặc tự hạ quyền tài khoản Quản trị viên của chính mình.",
    en: "You cannot suspend or downgrade your own Administrator account.",
  },
  NOT_FOUND: {
    status: 404,
    vi: "Không tìm thấy dữ liệu yêu cầu.",
    en: "The requested resource was not found.",
  },
  CONFLICT: {
    status: 409,
    vi: "Dữ liệu bị trùng lặp với bản ghi hiện có.",
    en: "The data conflicts with an existing record.",
  },
  BAD_REQUEST: {
    status: 400,
    vi: "Yêu cầu không hợp lệ. Vui lòng kiểm tra lại dữ liệu.",
    en: "Invalid request. Please check your input.",
  },
};

export class DalError extends Error {
  public readonly code: DalErrorCode;
  public readonly status: number;
  public readonly messageVi: string;
  public readonly messageEn: string;
  public readonly field?: string;
  public readonly extra?: Record<string, unknown>;

  constructor(
    code: DalErrorCode,
    options?: {
      status?: number;
      messageVi?: string;
      messageEn?: string;
      field?: string;
      extra?: Record<string, unknown>;
    }
  ) {
    const entry = DAL_ERROR_CATALOG[code];
    const messageVi = options?.messageVi || entry.vi;
    const messageEn = options?.messageEn || entry.en;
    super(messageVi);
    this.name = "DalError";
    this.code = code;
    this.status = options?.status ?? entry.status;
    this.messageVi = messageVi;
    this.messageEn = messageEn;
    this.field = options?.field;
    this.extra = options?.extra;
  }
}

export function isDalError(err: unknown): err is DalError {
  return err instanceof DalError;
}

export function resolvePreferredLocale(req?: Request): "vi" | "en" {
  if (!req) return "vi";
  const localeHeader = req.headers.get("x-locale") || req.headers.get("accept-language") || "";
  if (localeHeader.toLowerCase().startsWith("en")) {
    return "en";
  }
  return "vi";
}

export function toHttpErrorResponse(err: unknown, req?: Request): NextResponse {
  if (isDalError(err)) {
    const locale = resolvePreferredLocale(req);
    const primaryMessage = locale === "en" ? err.messageEn : err.messageVi;
    return NextResponse.json(
      {
        success: false,
        code: err.code,
        error: primaryMessage,
        messageVi: err.messageVi,
        messageEn: err.messageEn,
        ...(err.field ? { field: err.field } : {}),
        ...(err.extra || {}),
      },
      { status: err.status }
    );
  }

  return NextResponse.json(
    {
      success: false,
      code: "INTERNAL_ERROR",
      error: "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.",
      messageEn: "An unexpected system error occurred. Please try again later.",
    },
    { status: 500 }
  );
}
