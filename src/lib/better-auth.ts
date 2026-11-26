import "server-only";
import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";

const DEV_FALLBACK_SECRET =
  "local_dev_only_ats_better_auth_secret_32chars_min_do_not_use_in_prod";

function resolveAuthSecret(): string {
  const secret = process.env.BETTER_AUTH_SECRET || process.env.SESSION_SECRET;
  if (secret && secret.length >= 16) {
    return secret;
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "FATAL SECURITY ERROR: BETTER_AUTH_SECRET (or SESSION_SECRET) must be set in production."
    );
  }
  return DEV_FALLBACK_SECRET;
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  secret: resolveAuthSecret(),
  baseURL:
    process.env.BETTER_AUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000",
  trustedOrigins: [
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    "http://localhost:3000",
  ],
  emailAndPassword: {
    enabled: true,
    // P0-01: Cấm hoàn toàn đăng ký tài khoản nội bộ công khai
    disableSignUp: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    autoSignIn: false,
    password: {
      hash: async (password) => hashPassword(password),
      verify: async ({ hash, password }) => verifyPassword(password, hash),
    },
  },
  databaseHooks: {
    session: {
      create: {
        // P1-03: Chặn tuyệt đối tạo phiên cho tài khoản bị tạm khóa (isActive = false) trên cả native route
        before: async (session) => {
          const userId = Number(session.userId);
          if (!Number.isInteger(userId) || userId <= 0) {
            throw new APIError("UNAUTHORIZED", {
              message: "Phiên đăng nhập không hợp lệ.",
            });
          }
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, isActive: true },
          });
          if (!user || !user.isActive) {
            throw new APIError("FORBIDDEN", {
              message: "Tài khoản của bạn hiện đang tạm khóa. Vui lòng liên hệ quản trị viên.",
            });
          }
          return { data: session };
        },
      },
    },
  },
  user: {
    modelName: "user",
    fields: {
      name: "fullName",
    },
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "HR",
        input: false,
      },
      isActive: {
        type: "boolean",
        defaultValue: true,
        input: false,
      },
      phone: {
        type: "string",
        required: false,
        input: false,
      },
    },
  },
  session: {
    modelName: "authSession",
    expiresIn: 60 * 60 * 24 * 7, // 7 ngày
    updateAge: 60 * 60 * 24, // Sliding refresh mỗi 24 giờ
  },
  account: {
    modelName: "authAccount",
  },
  verification: {
    modelName: "authVerification",
  },
  advanced: {
    database: {
      generateId: "serial",
    },
    useSecureCookies: process.env.NODE_ENV === "production",
    defaultCookieAttributes: {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
    },
  },
  plugins: [nextCookies()],
});
