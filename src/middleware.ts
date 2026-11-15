import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE_NAME = "ats_user_session";
const SESSION_SECRET =
  process.env.SESSION_SECRET ||
  "recoverx_career_ats_enterprise_security_secret_key_2026_super_safe";

// Chuyển đổi chuỗi base64url sang Uint8Array an toàn trên Next.js Edge Runtime
function base64UrlToBytes(str: string): Uint8Array {
  let b64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4) b64 += "=";
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Xác thực chữ ký số HMAC-SHA256 chuẩn NIST bằng Web Crypto API (Tương thích Edge)
async function verifyTokenEdge(token: string): Promise<any | null> {
  if (!token || !token.includes(".")) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payloadB64, sigB64] = parts;

  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(SESSION_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const sigBytes = base64UrlToBytes(sigB64);
    const dataBytes = encoder.encode(payloadB64);
    const isValid = await crypto.subtle.verify("HMAC", key, sigBytes as any, dataBytes as any);
    if (!isValid) return null;

    const decodedStr = new TextDecoder().decode(base64UrlToBytes(payloadB64));
    const user = JSON.parse(decodedStr);

    if (user.exp && user.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return user;
  } catch {
    return null;
  }
}

/**
 * Next.js Edge Middleware — Phòng thủ Biên Server (Zero-Trust Edge Gatekeeper)
 * Ngăn chặn tuyệt đối hiện tượng "Flash of Unauthenticated Content" (FOUC).
 * Mọi yêu cầu chưa xác thực sẽ bị chuyển hướng ngay ở cấp HTTP Request trước khi mã HTML/React được gửi về trình duyệt.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const user = sessionCookie ? await verifyTokenEdge(sessionCookie) : null;

  // 1. Nếu đang truy cập trang Login: /admin/login
  if (pathname === "/admin/login") {
    // Nếu người dùng ĐÃ có phiên đăng nhập hợp lệ, chuyển hướng thẳng vào Pipeline
    if (user) {
      return NextResponse.redirect(new URL("/admin/pipeline", request.url));
    }
    return NextResponse.next();
  }

  // 2. Bảo vệ tất cả các trang nội bộ: /admin/* (pipeline, jobs, talent-pool, users)
  if (pathname.startsWith("/admin")) {
    if (!user) {
      // Chưa đăng nhập -> Chuyển hướng ngay lập tức về /admin/login ở cấp Server
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      const response = NextResponse.redirect(loginUrl);
      if (sessionCookie) {
        response.cookies.delete(SESSION_COOKIE_NAME);
      }
      return response;
    }

    // 3. Phân quyền RBAC tại tầng Edge: Trang Quản trị User chỉ dành cho ADMIN
    if (pathname.startsWith("/admin/users") && user.role !== "ADMIN") {
      const pipelineUrl = new URL("/admin/pipeline", request.url);
      pipelineUrl.searchParams.set("error", "forbidden");
      return NextResponse.redirect(pipelineUrl);
    }

    // Đã xác thực thành công -> Bổ sung thông tin xác thực vào Request Headers cho Server Components
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-pathname", pathname);
    requestHeaders.set("x-user-id", String(user.id));
    requestHeaders.set("x-user-role", user.role);
    requestHeaders.set("x-user-email", user.email);
    requestHeaders.set("x-user-name", encodeURIComponent(user.fullName || ""));

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next();
}

// Cấu hình Matcher chỉ kiểm soát các route /admin/:path*
export const config = {
  matcher: ["/admin/:path*"],
};
