import { NextResponse } from "next/server";
import {
  scheduleOrUpdateInterview,
  cancelInterview,
  isDalError,
  toHttpErrorResponse,
} from "@/server/dal";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await scheduleOrUpdateInterview(body || {});

    if (result.isQuickNotes) {
      return NextResponse.json({
        success: true,
        message: result.message,
        data: result.data,
      });
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      n8nResult: result.n8nResult,
      data: result.data,
    });
  } catch (error: any) {
    if (isDalError(error)) return toHttpErrorResponse(error, req);
    console.error("Schedule interview error:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi hệ thống khi lên lịch phỏng vấn: " + error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const appId = Number(searchParams.get("applicationId"));
    const result = await cancelInterview(appId);

    return NextResponse.json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error: any) {
    if (isDalError(error)) return toHttpErrorResponse(error, req);
    console.error("Cancel interview error:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi hệ thống khi hủy lịch phỏng vấn: " + error.message },
      { status: 500 }
    );
  }
}
