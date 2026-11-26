import { NextResponse } from "next/server";
import { movePipelineApplication, isDalError, toHttpErrorResponse } from "@/server/dal";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await movePipelineApplication(body || {});

    if (result.unchanged) {
      return NextResponse.json({ success: true, data: result.data });
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      jobAutoClosed: result.jobAutoClosed,
      headcountMetrics: result.headcountMetrics,
      data: result.data,
    });
  } catch (error) {
    if (isDalError(error)) return toHttpErrorResponse(error, req);
    console.error("Move application error:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi hệ thống khi chuyển trạng thái hồ sơ" },
      { status: 500 }
    );
  }
}
