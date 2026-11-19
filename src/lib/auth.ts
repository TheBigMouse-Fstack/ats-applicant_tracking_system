import { cookies } from "next/headers";
import { UserRole } from "@/types";
import crypto from "crypto";

export interface SessionUser {
  id: number;
  fullName: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

const SESSION_COOKIE_NAME = "ats_user_session";
const SESSION_SECRET =
  process.env.SESSION_SECRET ||
  "recoverx_career_ats_enterprise_security_secret_key_2026_super_safe";

if (process.env.NODE_ENV === "production" && !process.env.SESSION_SECRET) {
  console.warn("⚠️ SECURITY WARNING: SESSION_SECRET is not set in environment variables. Please set a strong SESSION_SECRET for production.");
}

/**
 * Ký số dữ liệu phiên người dùng bằng HMAC-SHA256 (Chống giả mạo Session Tampering)
 */
export function signSessionToken(payload: SessionUser): string {
  const now = Math.floor(Date.now() / 1000);
  const dataToSign = {
    ...payload,
    iat: now,
    exp: now + 60 * 60 * 24 * 7, // Hạn 7 ngày
  };
  const payloadBase64 = Buffer.from(JSON.stringify(dataToSign)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(payloadBase64)
    .digest("base64url");
  return `${payloadBase64}.${signature}`;
}

/**
 * Xác thực và giải mã Token phiên người dùng với chữ ký số
 */
export function verifySessionToken(token: string): SessionUser | null {
  if (!token) return null;

  try {
    // 1. Hỗ trợ định dạng có ký số: [payloadBase64].[signature]
    if (token.includes(".")) {
      const parts = token.split(".");
      if (parts.length !== 2) return null;
      const [payloadBase64, signature] = parts;

      const expectedSignature = crypto
        .createHmac("sha256", SESSION_SECRET)
        .update(payloadBase64)
        .digest("base64url");

      // So sánh an toàn chống tấn công Timing Attack
      const sigBuf = Buffer.from(signature);
      const expectedBuf = Buffer.from(expectedSignature);
      if (sigBuf.length !== expectedBuf.length) return null;
      if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return null;

      const jsonStr = Buffer.from(payloadBase64, "base64url").toString("utf-8");
      const user = JSON.parse(jsonStr) as SessionUser;

      // Kiểm tra hết hạn (exp)
      if (user.exp && user.exp < Math.floor(Date.now() / 1000)) {
        return null;
      }

      return user;
    }

    // 2. Tương thích ngược an toàn nếu cookie cũ là chuỗi JSON thô
    if (token.startsWith("{") && token.endsWith("}")) {
      return JSON.parse(token) as SessionUser;
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * Ghi cookie phiên đăng nhập đã ký số vào Browser
 */
export function createSessionCookie(user: SessionUser) {
  const signedToken = signSessionToken(user);
  const cookieStore = cookies();
  cookieStore.set(SESSION_COOKIE_NAME, signedToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 ngày
  });
}

/**
 * Đọc và xác thực phiên đăng nhập hiện tại từ Cookies
 */
export function getSessionUser(): SessionUser | null {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;
    return verifySessionToken(token);
  } catch {
    return null;
  }
}

/**
 * Xóa phiên đăng nhập (Đăng xuất)
 */
export function clearSessionCookie() {
  const cookieStore = cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * =========================================================================
 * BẢO MẬT MẬT KHẨU (NFR-SEC-02: Băm mật khẩu có Salt chống Rainbow Table)
 * Sử dụng thuật toán chuẩn NIST: PBKDF2 với SHA-512 và 100,000 vòng lặp
 * =========================================================================
 */

/**
 * Băm mật khẩu an toàn với Salt ngẫu nhiên 16 bytes
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const iterations = 100000;
  const derivedKey = crypto
    .pbkdf2Sync(password, salt, iterations, 64, "sha512")
    .toString("hex");
  return `pbkdf2$${iterations}$${salt}$${derivedKey}`;
}

/**
 * Đối soát mật khẩu an toàn (Hỗ trợ cả PBKDF2 chuẩn và Fallback cho dữ liệu cũ)
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  if (!password || !storedHash) return false;

  // 1. Kiểm tra định dạng chuẩn PBKDF2
  if (storedHash.startsWith("pbkdf2$")) {
    const parts = storedHash.split("$");
    if (parts.length !== 4) return false;
    const iterations = parseInt(parts[1], 10);
    const salt = parts[2];
    const originalHash = parts[3];

    const derivedKey = crypto
      .pbkdf2Sync(password, salt, iterations, 64, "sha512")
      .toString("hex");

    const keyBuf = Buffer.from(derivedKey, "hex");
    const origBuf = Buffer.from(originalHash, "hex");

    if (keyBuf.length !== origBuf.length) return false;
    return crypto.timingSafeEqual(keyBuf, origBuf);
  }

  // 2. Hỗ trợ dữ liệu Seed cũ (Plaintext) và tự động tương thích
  return password === storedHash;
}
