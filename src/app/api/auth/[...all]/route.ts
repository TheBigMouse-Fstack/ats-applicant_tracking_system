import { NextResponse } from "next/server";
import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/better-auth";
import { syncCredentialByEmailIfValid } from "@/server/dal";

export const dynamic = "force-dynamic";

const handler = toNextJsHandler(auth);

function isSignUpPath(urlStr: string): boolean {
  try {
    const pathname = new URL(urlStr).pathname.toLowerCase();
    return pathname.includes("/sign-up");
  } catch {
    return true;
  }
}

function isEmailSignInPath(urlStr: string): boolean {
  try {
    const pathname = new URL(urlStr).pathname.toLowerCase();
    return pathname.endsWith("/sign-in/email");
  } catch {
    return false;
  }
}

export async function GET(req: Request) {
  if (isSignUpPath(req.url)) {
    return NextResponse.json(
      {
        success: false,
        code: "AUTH_FORBIDDEN",
        error: "Không cho phép tự đăng ký tài khoản nội bộ.",
        messageEn: "Public self-registration is disabled for internal accounts.",
      },
      { status: 403 }
    );
  }
  return handler.GET(req);
}

export async function POST(req: Request) {
  // P0-01: Chặn cứng mọi endpoint /sign-up ở tầng route handler
  if (isSignUpPath(req.url)) {
    return NextResponse.json(
      {
        success: false,
        code: "AUTH_FORBIDDEN",
        error: "Không cho phép tự đăng ký tài khoản nội bộ.",
        messageEn: "Public self-registration is disabled for internal accounts.",
      },
      { status: 403 }
    );
  }

  // P1-03: Tự động đồng bộ PBKDF2 hash & kiểm tra isActive nếu gọi native /api/auth/sign-in/email
  if (isEmailSignInPath(req.url)) {
    try {
      const cloned = req.clone();
      const body = await cloned.json().catch(() => null);
      if (body && typeof body.email === "string" && body.email.trim()) {
        const status = await syncCredentialByEmailIfValid(body.email.toLowerCase().trim());
        if (status === "DISABLED") {
          return NextResponse.json(
            {
              success: false,
              code: "AUTH_ACCOUNT_DISABLED",
              error: "Tài khoản của bạn hiện đang tạm khóa. Vui lòng liên hệ quản trị viên.",
              messageEn: "Your account is currently suspended. Please contact an administrator.",
            },
            { status: 403 }
          );
        }
      }
    } catch {
      // Để Better Auth tự xử lý lỗi payload nếu body không hợp lệ
    }
  }

  return handler.POST(req);
}
