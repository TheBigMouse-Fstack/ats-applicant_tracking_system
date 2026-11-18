import { NextResponse } from "next/server";
import { extractTextFromCv } from "@/lib/ai-parser";
import { extractContactsFromCvText } from "@/lib/dedup-and-contact";

export const dynamic = "force-dynamic";

/**
 * POST /api/applications/preview-cv
 * Đọc nhanh tệp CV ngay khi ứng viên vừa kéo thả lên Cổng tuyển dụng:
 * - Kiểm tra định dạng (.pdf/.docx), dung lượng <= 10MB và cấu trúc tệp gốc hợp lệ
 * - Trích xuất Họ tên, Email, SĐT để tự động điền sẵn (Auto-fill) cho ứng viên kiểm tra lại
 * - Cảnh báo sớm nếu tệp không đọc được chữ (ảnh chụp / tệp trống)
 */
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("cvFile") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "Vui lòng chọn tệp CV cần kiểm tra." },
        { status: 400 }
      );
    }

    const fileName = file.name || "cv.pdf";
    const fileExt = fileName.slice(fileName.lastIndexOf(".")).toLowerCase();
    const validExtensions = [".pdf", ".docx"];

    if (!validExtensions.includes(fileExt)) {
      return NextResponse.json(
        {
          success: false,
          error: "Chỉ chấp nhận tệp định dạng PDF hoặc DOCX.",
        },
        { status: 400 }
      );
    }

    const maxSizeBytes = 10 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return NextResponse.json(
        {
          success: false,
          error: `Dung lượng tệp (${(file.size / (1024 * 1024)).toFixed(1)}MB) vượt quá giới hạn tối đa 10MB.`,
        },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Kiểm tra tính xác thực của tệp gốc (chống tệp đổi đuôi giả mạo)
    if (fileExt === ".pdf") {
      const isPdf =
        buffer.length >= 4 &&
        buffer[0] === 0x25 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x44 &&
        buffer[3] === 0x46;
      if (!isPdf) {
        return NextResponse.json(
          {
            success: false,
            error: "Nội dung tệp không phải định dạng PDF hợp lệ. Vui lòng kiểm tra lại tệp CV.",
          },
          { status: 400 }
        );
      }
    } else if (fileExt === ".docx") {
      const isDocx = buffer.length >= 2 && buffer[0] === 0x50 && buffer[1] === 0x4b;
      if (!isDocx) {
        return NextResponse.json(
          {
            success: false,
            error: "Nội dung tệp không phải định dạng DOCX hợp lệ. Vui lòng kiểm tra lại tệp CV.",
          },
          { status: 400 }
        );
      }
    }

    const cvRawText = await extractTextFromCv(buffer, fileName);
    const extracted = extractContactsFromCvText(cvRawText);

    return NextResponse.json({
      success: true,
      data: {
        fullName: extracted.fullName,
        email: extracted.email,
        phone: extracted.phone,
        isUnreadable: extracted.isUnreadable,
        warning: extracted.isUnreadable
          ? "Tệp này chưa đọc được nội dung chữ (có thể là ảnh chụp hoặc tệp trống). Bạn vẫn có thể điền trực tiếp thông tin liên hệ bên dưới để nộp hồ sơ."
          : null,
      },
    });
  } catch (error: any) {
    console.error("POST /api/applications/preview-cv error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Không thể đọc nhanh tệp CV lúc này. Bạn vẫn có thể điền thông tin trực tiếp bên dưới.",
      },
      { status: 500 }
    );
  }
}
