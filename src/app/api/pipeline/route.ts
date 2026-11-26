import { NextResponse } from "next/server";
import { getPipelineBoard, isDalError, toHttpErrorResponse } from "@/server/dal";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const board = await getPipelineBoard(searchParams);

    return NextResponse.json({
      success: true,
      ...board,
    });
  } catch (error) {
    if (isDalError(error)) return toHttpErrorResponse(error, req);
    console.error("Pipeline API error:", error);
    return NextResponse.json(
      { success: false, error: "Không thể lấy dữ liệu Pipeline tuyển dụng" },
      { status: 500 }
    );
  }
}
