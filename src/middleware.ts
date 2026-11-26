import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const LEGACY_SESSION_COOKIE_NAME = "ats_user_session";

function hasBetterAuthSessionCookie(request: NextRequest): boolean {
  return (
    request.cookies.has("better-auth.session_token") ||
    request.cookies.has("__Secure-better-auth.session_token")
  );
}

/**
 * Next.js Edge Middleware — Lightweight UX Redirect Hint ONLY (BRL-AUTH-05).
 * KHÔNG cấp quyền API, KHÔNG giải mã secret hard-coded, KHÔNG gắn x-user-* headers.
 * 100% xác thực mật mã, đối soát Neon Postgres và kiểm tra RBAC nằm trong `src/server/dal/`.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = hasBetterAuthSessionCookie(request);

  if (pathname === "/admin/login") {
    if (hasSession) {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    if (!hasSession) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      const response = NextResponse.redirect(loginUrl);
      if (request.cookies.has(LEGACY_SESSION_COOKIE_NAME)) {
        response.cookies.delete(LEGACY_SESSION_COOKIE_NAME);
      }
      return response;
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-pathname", pathname);
    // Xóa triệt để mọi header giả mạo nếu client cố tình gửi lên
    requestHeaders.delete("x-user-id");
    requestHeaders.delete("x-user-role");
    requestHeaders.delete("x-user-email");
    requestHeaders.delete("x-user-name");

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
