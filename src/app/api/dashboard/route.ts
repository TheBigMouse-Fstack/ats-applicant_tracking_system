import { NextResponse } from "next/server";
import { getDashboardOverview, isDalError, toHttpErrorResponse } from "@/server/dal";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const data = await getDashboardOverview();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (isDalError(error)) return toHttpErrorResponse(error, req);
    console.error("GET /api/dashboard error:", error);
    return NextResponse.json(
      { success: false, error: "Không thể tải dữ liệu Bảng điều khiển Tổng quan" },
      { status: 500 }
    );
  }
}
