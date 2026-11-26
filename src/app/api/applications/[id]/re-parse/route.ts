import { NextResponse } from "next/server";
import { reparseApplicationCv, isDalError, toHttpErrorResponse } from "@/server/dal";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const applicationId = Number(params.id);
    const updatedApp = await reparseApplicationCv(applicationId);

    return NextResponse.json({
      success: true,
      message: "Đã phân tích lại CV bằng AI thành công!",
      data: updatedApp,
    });
  } catch (error: any) {
    if (isDalError(error)) return toHttpErrorResponse(error, req);
    console.error("Re-parse API error:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi hệ thống khi phân tích lại CV" },
      { status: 500 }
    );
  }
}
