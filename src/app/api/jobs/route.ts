import { NextResponse } from "next/server";
import {
  listJobsWithMetrics,
  createJobRequisition,
  isDalError,
  toHttpErrorResponse,
} from "@/server/dal";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const enrichedJobs = await listJobsWithMetrics();
    return NextResponse.json({ success: true, data: enrichedJobs });
  } catch (error: any) {
    if (isDalError(error)) return toHttpErrorResponse(error, req);
    console.error("GET /api/jobs error:", error);
    return NextResponse.json(
      { success: false, error: "Không thể lấy danh sách tin tuyển dụng" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { job, message } = await createJobRequisition(body || {});
    return NextResponse.json({
      success: true,
      message,
      data: job,
    });
  } catch (error: any) {
    if (isDalError(error)) return toHttpErrorResponse(error, req);
    console.error("POST /api/jobs error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Lỗi hệ thống khi tạo vị trí tuyển dụng: " + (error.message || "Unknown error"),
      },
      { status: 500 }
    );
  }
}
