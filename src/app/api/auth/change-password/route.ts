import { NextResponse } from "next/server";
import {
  requirePermission,
  changeOwnPassword,
  isDalError,
  toHttpErrorResponse,
} from "@/server/dal";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request) {
  try {
    const sessionUser = await requirePermission("auth:change-password");
    const body = await req.json();
    await changeOwnPassword(sessionUser, body || {});

    return NextResponse.json({
      success: true,
      message: "Đổi mật khẩu thành công.",
      messageEn: "Password updated successfully.",
    });
  } catch (error) {
    if (isDalError(error)) return toHttpErrorResponse(error, req);
    console.error("Change password error:", error instanceof Error ? error.message : "unknown");
    return NextResponse.json(
      {
        success: false,
        error: "Không thể cập nhật mật khẩu. Vui lòng thử lại.",
        messageEn: "Unable to update password. Please try again.",
      },
      { status: 500 }
    );
  }
}
