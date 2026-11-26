import { NextResponse } from "next/server";
import { signInInternalUser, isDalError, toHttpErrorResponse } from "@/server/dal";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const sessionUser = await signInInternalUser({
      email: body?.email,
      password: body?.password,
      reqHeaders: req.headers,
    });

    return NextResponse.json({
      success: true,
      message: "Đăng nhập thành công",
      messageEn: "Signed in successfully.",
      user: sessionUser,
    });
  } catch (error) {
    if (isDalError(error)) return toHttpErrorResponse(error, req);
    console.error("Login API error:", error instanceof Error ? error.message : "unknown");
    return NextResponse.json(
      {
        success: false,
        code: "AUTH_SERVICE_UNAVAILABLE",
        error: "Dịch vụ xác thực tạm thời gián đoạn. Vui lòng thử lại sau giây lát.",
        messageEn: "Authentication service is temporarily unavailable. Please try again shortly.",
      },
      { status: 500 }
    );
  }
}
