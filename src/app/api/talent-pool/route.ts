import { NextResponse } from "next/server";
import {
  listTalentPool,
  repoolCandidate,
  isDalError,
  toHttpErrorResponse,
  type TalentPoolStatus,
} from "@/server/dal";

export const dynamic = "force-dynamic";
export type { TalentPoolStatus };

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const enriched = await listTalentPool(searchParams);
    return NextResponse.json({ success: true, data: enriched });
  } catch (error) {
    if (isDalError(error)) return toHttpErrorResponse(error, req);
    console.error("GET /api/talent-pool error:", error);
    return NextResponse.json(
      { success: false, error: "Không thể lấy danh sách kho nhân tài" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await repoolCandidate(body || {});
    return NextResponse.json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    if (isDalError(error)) return toHttpErrorResponse(error, req);
    console.error("POST /api/talent-pool repool error:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi hệ thống khi tái sử dụng hồ sơ ứng viên" },
      { status: 500 }
    );
  }
}
