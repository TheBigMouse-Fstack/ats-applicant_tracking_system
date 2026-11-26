import "server-only";
import { headers, cookies } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/better-auth";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";
import type { UserRole } from "@/types";
import { DalError } from "./errors";
import { hasPermission, type Permission, UserRoleSchema } from "./permissions";

export const VerifiedSessionUserSchema = z.object({
  id: z.number().int().positive(),
  fullName: z.string().min(1).max(120),
  email: z.string().email(),
  role: UserRoleSchema,
  isActive: z.literal(true),
  sessionId: z.string().min(1),
});

export type VerifiedSessionUser = z.infer<typeof VerifiedSessionUserSchema>;

export const LoginInputSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(1).max(128),
});

export const ChangePasswordInputSchema = z
  .object({
    currentPassword: z.string().min(1).max(128),
    newPassword: z.string().min(8).max(128),
    confirmPassword: z.string().min(8).max(128),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "PASSWORD_CONFIRM_MISMATCH",
  })
  .refine((d) => d.currentPassword !== d.newPassword, {
    path: ["newPassword"],
    message: "PASSWORD_UNCHANGED",
  });

type SessionResolution =
  | { status: "AUTHENTICATED"; user: VerifiedSessionUser }
  | { status: "UNAUTHENTICATED" }
  | { status: "DISABLED" };

export function isValidPbkdf2Hash(hash: string | null | undefined): boolean {
  if (!hash || !hash.startsWith("pbkdf2$")) return false;
  const parts = hash.split("$");
  if (parts.length !== 4) return false;
  const iterations = parseInt(parts[1], 10);
  return (
    Number.isFinite(iterations) &&
    iterations >= 10000 &&
    parts[2].length >= 16 &&
    parts[3].length >= 64
  );
}

/**
 * Thu hồi tức thì toàn bộ phiên đăng nhập của người dùng trên Neon PostgreSQL.
 */
export async function revokeUserSessions(
  userId: number,
  exceptSessionId?: string | number
): Promise<void> {
  const numericExcept =
    exceptSessionId !== undefined && Number.isFinite(Number(exceptSessionId))
      ? Number(exceptSessionId)
      : undefined;

  await prisma.authSession.deleteMany({
    where: {
      userId,
      ...(numericExcept !== undefined ? { id: { not: numericExcept } } : {}),
    },
  });
}

/**
 * Đồng bộ mật khẩu hash (PBKDF2-SHA512 hợp lệ) vào bảng Better Auth `auth_accounts`.
 */
export async function syncUserCredentialAccount(
  userId: number,
  passwordHash: string
): Promise<void> {
  if (!isValidPbkdf2Hash(passwordHash)) {
    throw new DalError("BAD_REQUEST", {
      messageVi: "Định dạng mật khẩu mã hóa không hợp lệ.",
      messageEn: "Invalid password hash format.",
    });
  }
  const accountId = String(userId);
  await prisma.authAccount.upsert({
    where: {
      providerId_accountId: {
        providerId: "credential",
        accountId,
      },
    },
    update: { password: passwordHash },
    create: {
      userId,
      accountId,
      providerId: "credential",
      password: passwordHash,
    },
  });
}

/**
 * Dùng cho native Better Auth `/api/auth/sign-in/email`: kiểm tra `isActive` và đồng bộ credential hash hợp lệ.
 */
export async function syncCredentialByEmailIfValid(
  email: string
): Promise<"OK" | "DISABLED" | "NOT_FOUND"> {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    select: { id: true, isActive: true, passwordHash: true },
  });
  if (!user) return "NOT_FOUND";
  if (!user.isActive) return "DISABLED";
  if (isValidPbkdf2Hash(user.passwordHash)) {
    await syncUserCredentialAccount(user.id, user.passwordHash);
  }
  return "OK";
}

/**
 * Luồng đăng nhập nội bộ chuẩn qua DAL + Better Auth (P1-03):
 * - Thống nhất lỗi AUTH_INVALID_CREDENTIALS (không tiết lộ email tồn tại hay không).
 * - Chặn tài khoản bị khóa (HTTP 403 AUTH_ACCOUNT_DISABLED).
 */
export async function signInInternalUser(params: {
  email: string;
  password: string;
  reqHeaders: Headers;
}) {
  const email = typeof params.email === "string" ? params.email.toLowerCase().trim() : "";
  const password = typeof params.password === "string" ? params.password : "";

  if (!email) {
    throw new DalError("AUTH_VALIDATION_ERROR", {
      messageVi: "Vui lòng nhập địa chỉ Email.",
      messageEn: "Please enter your email address.",
      field: "email",
    });
  }

  if (!password) {
    throw new DalError("AUTH_VALIDATION_ERROR", {
      messageVi: "Vui lòng nhập mật khẩu.",
      messageEn: "Please enter your password.",
      field: "password",
    });
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new DalError("AUTH_INVALID_CREDENTIALS");
  }

  if (!user.isActive) {
    throw new DalError("AUTH_ACCOUNT_DISABLED");
  }

  const isMatch = verifyPassword(password, user.passwordHash);
  if (!isMatch) {
    throw new DalError("AUTH_INVALID_CREDENTIALS");
  }

  await syncUserCredentialAccount(user.id, user.passwordHash);

  // Thu hồi phiên cũ cùng trình duyệt trước khi tạo phiên mới (ví dụ chuyển vai trò nhanh trên DemoRoleBar)
  try {
    await auth.api.signOut({ headers: params.reqHeaders });
  } catch {
    // ignore if no prior session
  }

  await auth.api.signInEmail({
    body: { email: user.email, password },
    headers: params.reqHeaders,
  });

  try {
    cookies().delete("ats_user_session");
  } catch {
    // ignore
  }

  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role as UserRole,
  };
}

/**
 * Đổi mật khẩu tài khoản hiện tại qua DAL (đồng bộ auth_accounts + thu hồi mọi phiên thiết bị khác).
 */
export async function changeOwnPassword(
  sessionUser: VerifiedSessionUser,
  body: {
    currentPassword?: unknown;
    newPassword?: unknown;
    confirmPassword?: unknown;
  }
): Promise<void> {
  const { currentPassword, newPassword, confirmPassword } = body || {};

  if (!currentPassword || typeof currentPassword !== "string") {
    throw new DalError("AUTH_VALIDATION_ERROR", {
      messageVi: "Vui lòng nhập mật khẩu hiện tại.",
      messageEn: "Please enter your current password.",
      field: "currentPassword",
    });
  }

  if (!newPassword || typeof newPassword !== "string" || newPassword.length < 8) {
    throw new DalError("AUTH_PASSWORD_WEAK", { field: "newPassword" });
  }

  if (newPassword !== confirmPassword) {
    throw new DalError("AUTH_PASSWORD_MISMATCH", { field: "confirmPassword" });
  }

  if (currentPassword === newPassword) {
    throw new DalError("AUTH_PASSWORD_UNCHANGED", { field: "newPassword" });
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { id: true, passwordHash: true, isActive: true },
  });

  if (!dbUser || !dbUser.isActive) {
    throw new DalError("AUTH_ACCOUNT_DISABLED");
  }

  const isCurrentValid = verifyPassword(currentPassword, dbUser.passwordHash);
  if (!isCurrentValid) {
    throw new DalError("AUTH_VALIDATION_ERROR", {
      messageVi: "Mật khẩu hiện tại không chính xác.",
      messageEn: "Current password is incorrect.",
      field: "currentPassword",
    });
  }

  const nextHash = hashPassword(newPassword);
  const numericExcept = Number.isFinite(Number(sessionUser.sessionId))
    ? Number(sessionUser.sessionId)
    : undefined;

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: dbUser.id },
      data: { passwordHash: nextHash },
    });
    await tx.authAccount.upsert({
      where: {
        providerId_accountId: {
          providerId: "credential",
          accountId: String(dbUser.id),
        },
      },
      update: { password: nextHash },
      create: {
        userId: dbUser.id,
        accountId: String(dbUser.id),
        providerId: "credential",
        password: nextHash,
      },
    });
    await tx.authSession.deleteMany({
      where: {
        userId: dbUser.id,
        ...(numericExcept !== undefined ? { id: { not: numericExcept } } : {}),
      },
    });
  });
}

/**
 * Đọc và xác thực phiên trực tiếp từ Better Auth + Neon PostgreSQL.
 * Fail-closed: lỗi kết nối DB sẽ ném DalError(503) thay vì cho qua.
 */
async function resolveCurrentSession(): Promise<SessionResolution> {
  let reqHeaders: Headers;
  try {
    reqHeaders = headers();
  } catch {
    return { status: "UNAUTHENTICATED" };
  }

  let betterSession: Awaited<ReturnType<typeof auth.api.getSession>> = null;
  try {
    betterSession = await auth.api.getSession({
      headers: reqHeaders,
    });
  } catch (err) {
    console.error(
      "[DAL] Auth session verification error:",
      err instanceof Error ? err.message : "unknown"
    );
    throw new DalError("AUTH_SERVICE_UNAVAILABLE");
  }

  if (!betterSession?.user || !betterSession?.session) {
    return { status: "UNAUTHENTICATED" };
  }

  const userId = Number(betterSession.user.id);
  if (!Number.isInteger(userId) || userId <= 0) {
    return { status: "UNAUTHENTICATED" };
  }

  let dbUser: {
    id: number;
    fullName: string;
    email: string;
    role: string;
    isActive: boolean;
  } | null = null;

  try {
    dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        isActive: true,
      },
    });
  } catch (err) {
    console.error(
      "[DAL] Live user lookup failed:",
      err instanceof Error ? err.message : "unknown"
    );
    throw new DalError("AUTH_SERVICE_UNAVAILABLE");
  }

  if (!dbUser) {
    return { status: "UNAUTHENTICATED" };
  }

  if (!dbUser.isActive) {
    await revokeUserSessions(dbUser.id).catch(() => {});
    return { status: "DISABLED" };
  }

  const parsedRole = UserRoleSchema.safeParse(dbUser.role);
  if (!parsedRole.success) {
    return { status: "UNAUTHENTICATED" };
  }

  const verified = VerifiedSessionUserSchema.parse({
    id: dbUser.id,
    fullName: dbUser.fullName,
    email: dbUser.email,
    role: parsedRole.data,
    isActive: true,
    sessionId: String(betterSession.session.id),
  });

  return { status: "AUTHENTICATED", user: verified };
}

export async function getCurrentSession(): Promise<VerifiedSessionUser | null> {
  try {
    const result = await resolveCurrentSession();
    return result.status === "AUTHENTICATED" ? result.user : null;
  } catch {
    return null;
  }
}

export async function requireSession(): Promise<VerifiedSessionUser> {
  const result = await resolveCurrentSession();
  if (result.status === "DISABLED") {
    throw new DalError("AUTH_ACCOUNT_DISABLED");
  }
  if (result.status !== "AUTHENTICATED") {
    throw new DalError("AUTH_UNAUTHORIZED");
  }
  return result.user;
}

export async function requirePermission(
  permission: Permission,
  customForbiddenMessage?: { vi?: string; en?: string }
): Promise<VerifiedSessionUser> {
  const user = await requireSession();
  if (!hasPermission(user.role, permission)) {
    throw new DalError("AUTH_FORBIDDEN", {
      messageVi: customForbiddenMessage?.vi,
      messageEn: customForbiddenMessage?.en,
    });
  }
  return user;
}

export function assertRole(
  user: VerifiedSessionUser,
  allowedRoles: readonly UserRole[],
  customForbiddenMessage?: { vi?: string; en?: string }
): void {
  if (!allowedRoles.includes(user.role)) {
    throw new DalError("AUTH_FORBIDDEN", {
      messageVi: customForbiddenMessage?.vi,
      messageEn: customForbiddenMessage?.en,
    });
  }
}
