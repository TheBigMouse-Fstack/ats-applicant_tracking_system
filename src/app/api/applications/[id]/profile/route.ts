import { NextResponse } from "next/server";
import { updateApplicationProfile, isDalError, toHttpErrorResponse } from "@/server/dal";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const applicationId = Number(params.id);
    const body = await req.json();
    const updatedApplication = await updateApplicationProfile(applicationId, body || {});

    return NextResponse.json({
      success: true,
      message: "Đã lưu chỉnh sửa thông tin hồ sơ và cập nhật đối chiếu JD thành công.",
      data: updatedApplication,
    });
  } catch (error: any) {
    if (isDalError(error)) return toHttpErrorResponse(error, req);
    console.error("PATCH /api/applications/[id]/profile error:", error);
    return NextResponse.json(
      { success: false, error: "Không thể cập nhật thông tin hồ sơ: " + error.message },
      { status: 500 }
    );
  }
}
