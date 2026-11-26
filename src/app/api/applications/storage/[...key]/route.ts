import { NextRequest, NextResponse } from "next/server";
import { requirePermission, isDalError, toHttpErrorResponse } from "@/server/dal";
import { getCvFile } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { key: string[] } }
) {
  try {
    // 1. Xác thực & phân quyền tập trung qua server-only DAL (không chấp nhận Referer giả mạo)
    await requirePermission("applications:cv:read");

    const rawKey = params.key.join("/");
    const storageKey = decodeURIComponent(rawKey);

    // Chặn tấn công vượt cấp thư mục (Path Traversal Protection)
    if (storageKey.includes("..") || storageKey.includes("\\")) {
      return NextResponse.json(
        { success: false, error: "Đường dẫn tệp không hợp lệ." },
        { status: 400 }
      );
    }

    const fileData = await getCvFile(storageKey);
    if (!fileData) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy tệp hồ sơ trên hệ thống lưu trữ." },
        { status: 404 }
      );
    }

    const fileName = storageKey.split("/").pop() || "candidate_cv.pdf";

    return new NextResponse(fileData.buffer as any, {
      status: 200,
      headers: {
        "Content-Type": fileData.contentType,
        "Content-Disposition": `inline; filename="${fileName}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err: any) {
    if (isDalError(err)) return toHttpErrorResponse(err, req);
    console.error("Lỗi khi đọc tệp lưu trữ:", err);
    return NextResponse.json(
      { success: false, error: "Lỗi hệ thống khi tải tệp: " + err.message },
      { status: 500 }
    );
  }
}
