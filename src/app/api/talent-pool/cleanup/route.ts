import { NextResponse } from "next/server";
import { cleanupExpiredTalentPool, isDalError, toHttpErrorResponse } from "@/server/dal";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const result = await cleanupExpiredTalentPool(body || {});
    return NextResponse.json(result);
  } catch (error: any) {
    if (isDalError(error)) return toHttpErrorResponse(error, req);
    console.error("Lỗi khi thực hiện dọn dẹp Talent Pool:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi hệ thống khi dọn dẹp dữ liệu: " + error.message },
      { status: 500 }
    );
  }
}
