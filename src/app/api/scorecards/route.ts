import { NextResponse } from "next/server";
import {
  listScorecards,
  createScorecard,
  isDalError,
  toHttpErrorResponse,
} from "@/server/dal";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const result = await listScorecards(searchParams.get("applicationId"));

    return NextResponse.json({
      success: true,
      data: result.data,
      blindScorecardLocked: result.blindScorecardLocked,
      hiddenEvaluationsCount: result.hiddenEvaluationsCount,
    });
  } catch (error: any) {
    if (isDalError(error)) return toHttpErrorResponse(error, req);
    console.error("GET /api/scorecards error:", error);
    return NextResponse.json(
      { success: false, error: "Không thể lấy danh sách phiếu đánh giá" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { evaluation, overallScore } = await createScorecard(body || {});

    return NextResponse.json({
      success: true,
      message: `Đã lưu phiếu đánh giá Scorecard thành công (${overallScore}/5.0★)`,
      data: evaluation,
    });
  } catch (error: any) {
    if (isDalError(error)) return toHttpErrorResponse(error, req);
    console.error("POST /api/scorecards error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Lỗi hệ thống khi lưu phiếu đánh giá: " + (error.message || "Unknown error"),
      },
      { status: 500 }
    );
  }
}
