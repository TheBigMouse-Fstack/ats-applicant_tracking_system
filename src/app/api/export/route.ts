import { NextResponse } from "next/server";
import { exportApplicationsCsv, isDalError, toHttpErrorResponse } from "@/server/dal";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { csvContent, dateStr } = await exportApplicationsCsv();

    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="ats_candidates_report_${dateStr}.csv"`,
      },
    });
  } catch (error: any) {
    if (isDalError(error)) return toHttpErrorResponse(error, req);
    console.error("GET /api/export error:", error);
    return NextResponse.json(
      { success: false, error: "Không thể xuất báo cáo CSV" },
      { status: 500 }
    );
  }
}
