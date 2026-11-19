import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getCvFile } from "@/lib/storage";

export async function GET(
  req: NextRequest,
  { params }: { params: { key: string[] } }
) {
  try {
    // 1. Phân quyền: Kiểm tra phiên đăng nhập nội bộ (HR, Hiring Manager, Admin)
    const user = await getSessionUser();
    
    // Nếu không có phiên nội bộ, cho phép kiểm tra qua token truy cập hồ sơ (hoặc referrer từ trang tracker)
    const isTrackerReferrer = req.headers.get("referer")?.includes("/jobs/tracker");
    if (!user && !isTrackerReferrer) {
      return NextResponse.json(
        { success: false, error: "Bạn không có quyền truy cập tệp hồ sơ này." },
        { status: 401 }
      );
    }

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
    console.error("Lỗi khi đọc tệp lưu trữ:", err);
    return NextResponse.json(
      { success: false, error: "Lỗi hệ thống khi tải tệp: " + err.message },
      { status: 500 }
    );
  }
}
