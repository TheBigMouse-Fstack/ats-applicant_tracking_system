import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * POST /api/jobs/[id]/approve — BRL-17: Phê duyệt hoặc yêu cầu chỉnh sửa tin tuyển dụng
 * Chỉ HIRING_MANAGER và ADMIN được phép duyệt Requisition (PENDING_APPROVAL / DRAFT -> ACTIVE hoặc trả về DRAFT).
 */
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const sessionUser = getSessionUser();
    if (!sessionUser) {
      return NextResponse.json(
        { success: false, error: "Yêu cầu đăng nhập tài khoản nội bộ." },
        { status: 401 }
      );
    }

    if (sessionUser.role !== "ADMIN" && sessionUser.role !== "HIRING_MANAGER") {
      return NextResponse.json(
        {
          success: false,
          error: "Chỉ Quản lý chuyên môn hoặc Quản trị viên mới có quyền phê duyệt tin tuyển dụng.",
        },
        { status: 403 }
      );
    }

    const jobId = Number(params.id);
    if (!jobId) {
      return NextResponse.json(
        { success: false, error: "Mã tin tuyển dụng không hợp lệ." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const action = body.action === "REJECT" ? "REJECT" : "APPROVE";
    const approvalNote = typeof body.approvalNote === "string" ? body.approvalNote.trim() : "";

    if (action === "REJECT" && approvalNote.length < 5) {
      return NextResponse.json(
        {
          success: false,
          error: "Vui lòng nhập ghi chú lý do yêu cầu chỉnh sửa (tối thiểu 5 ký tự).",
        },
        { status: 400 }
      );
    }

    const existing = await prisma.job.findUnique({ where: { id: jobId } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy tin tuyển dụng." },
        { status: 404 }
      );
    }

    const updated = await prisma.job.update({
      where: { id: jobId },
      data: {
        status: action === "APPROVE" ? "ACTIVE" : "DRAFT",
        approvedById: action === "APPROVE" ? sessionUser.id : null,
        approvedAt: action === "APPROVE" ? new Date() : null,
        approvalNote: approvalNote || null,
      } as any,
    });

    return NextResponse.json({
      success: true,
      message:
        action === "APPROVE"
          ? `Đã phê duyệt và công khai vị trí "${updated.title}".`
          : `Đã trả vị trí "${updated.title}" về Bản nháp để chỉnh sửa.`,
      data: updated,
    });
  } catch (error: any) {
    console.error("POST /api/jobs/[id]/approve error:", error);
    return NextResponse.json(
      { success: false, error: "Không thể xử lý phê duyệt tin tuyển dụng." },
      { status: 500 }
    );
  }
}
