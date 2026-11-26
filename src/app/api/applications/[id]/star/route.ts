import { NextResponse } from "next/server";
import { toggleApplicationStar, isDalError, toHttpErrorResponse } from "@/server/dal";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const applicationId = Number(params.id);
    const { isStarred, candidateFullName } = await toggleApplicationStar(applicationId);

    return NextResponse.json({
      success: true,
      isStarred,
      message: isStarred
        ? `Đã gắn sao ứng viên ${candidateFullName}`
        : `Đã bỏ gắn sao ứng viên ${candidateFullName}`,
    });
  } catch (error: any) {
    if (isDalError(error)) return toHttpErrorResponse(error, req);
    console.error("Star toggle error:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi hệ thống khi cập nhật trạng thái gắn sao" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  return POST(req, { params });
}
