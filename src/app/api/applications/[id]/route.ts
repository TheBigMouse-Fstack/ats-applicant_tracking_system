import { NextResponse } from "next/server";
import {
  getApplicationDetail,
  patchApplicationFlags,
  isDalError,
  toHttpErrorResponse,
} from "@/server/dal";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const applicationId = Number(params.id);
    const detail = await getApplicationDetail(applicationId);

    return NextResponse.json({
      success: true,
      data: {
        ...detail,
        blindScorecardLocked: detail.blindScorecardLocked,
        hiddenEvaluationsCount: detail.hiddenEvaluationsCount,
      },
    });
  } catch (error) {
    if (isDalError(error)) return toHttpErrorResponse(error, req);
    console.error("Fetch application detail error:", error);
    return NextResponse.json(
      { success: false, error: "Không thể lấy chi tiết hồ sơ ứng viên" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const applicationId = Number(params.id);
    const body = await req.json();
    const updated = await patchApplicationFlags(applicationId, body || {});

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error: any) {
    if (isDalError(error)) return toHttpErrorResponse(error, req);
    console.error("PATCH application error:", error);
    return NextResponse.json(
      { success: false, error: "Không thể cập nhật hồ sơ ứng viên" },
      { status: 500 }
    );
  }
}
