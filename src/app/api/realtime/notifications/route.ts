import { NextRequest, NextResponse } from "next/server";
import { getRealtimeNotifications, isDalError, toHttpErrorResponse } from "@/server/dal";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const result = await getRealtimeNotifications(searchParams.get("since"));
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    if (isDalError(error)) return toHttpErrorResponse(error, req);
    console.error("Lỗi Realtime Notifications:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi máy chủ khi thăm dò thông báo thời gian thực" },
      { status: 500 }
    );
  }
}
