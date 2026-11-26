import { NextResponse } from "next/server";
import { approveJobRequisition, isDalError, toHttpErrorResponse } from "@/server/dal";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = Number(params.id);
    const body = await req.json();
    const { action, updated } = await approveJobRequisition(jobId, body || {});

    return NextResponse.json({
      success: true,
      message:
        action === "APPROVE"
          ? `Đã phê duyệt và công khai vị trí "${updated.title}".`
          : `Đã trả vị trí "${updated.title}" về Bản nháp để chỉnh sửa.`,
      data: updated,
    });
  } catch (error: any) {
    if (isDalError(error)) return toHttpErrorResponse(error, req);
    console.error("POST /api/jobs/[id]/approve error:", error);
    return NextResponse.json(
      { success: false, error: "Không thể xử lý phê duyệt tin tuyển dụng." },
      { status: 500 }
    );
  }
}
