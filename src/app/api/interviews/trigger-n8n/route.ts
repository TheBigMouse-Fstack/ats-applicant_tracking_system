import { NextResponse } from "next/server";
import { triggerInterviewAutomation, isDalError, toHttpErrorResponse } from "@/server/dal";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // P1-04: Tuyệt đối không chấp nhận customWebhookUrl từ client (chống SSRF & lộ secret)
    const result = await triggerInterviewAutomation(Number(body?.applicationId));

    return NextResponse.json(result);
  } catch (error: any) {
    if (isDalError(error)) return toHttpErrorResponse(error, req);
    console.error("Trigger automation error:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi hệ thống khi gửi thư tự động: " + error.message },
      { status: 500 }
    );
  }
}
