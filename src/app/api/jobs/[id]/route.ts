import { NextResponse } from "next/server";
import { updateJobRequisition, isDalError, toHttpErrorResponse } from "@/server/dal";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = Number(params.id);
    const body = await req.json();
    const { updated, headcountMetrics } = await updateJobRequisition(jobId, body || {});

    return NextResponse.json({
      success: true,
      message: `Đã cập nhật chỉ tiêu tuyển dụng cho vị trí "${updated.title}".`,
      data: {
        ...updated,
        headcountMetrics,
      },
    });
  } catch (error: any) {
    if (isDalError(error)) return toHttpErrorResponse(error, req);
    console.error("PATCH /api/jobs/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Không thể cập nhật tin tuyển dụng lúc này." },
      { status: 500 }
    );
  }
}
