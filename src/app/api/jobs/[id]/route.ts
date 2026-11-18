import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { computeJobHeadcountMetrics } from "@/lib/headcount-rules";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/jobs/[id]
 * Cho phép HR / Admin cập nhật số lượng cần tuyển (Headcount), giới hạn phỏng vấn cùng lúc hoặc mở/đóng tin
 */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const sessionUser = getSessionUser();
    if (!sessionUser) {
      return NextResponse.json(
        { success: false, error: "Yêu cầu đăng nhập tài khoản nội bộ để cập nhật tin tuyển dụng." },
        { status: 401 }
      );
    }

    if (sessionUser.role === "HIRING_MANAGER") {
      return NextResponse.json(
        {
          success: false,
          error: "Quản lý chuyên môn chỉ có quyền xem tin tuyển dụng, không có quyền thay đổi chỉ tiêu hay trạng thái tin.",
        },
        { status: 403 }
      );
    }

    const jobId = Number(params.id);
    if (isNaN(jobId)) {
      return NextResponse.json(
        { success: false, error: "Mã tin tuyển dụng không hợp lệ." },
        { status: 400 }
      );
    }

    const existingJob = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        applications: {
          select: { currentStage: true },
        },
      },
    });

    if (!existingJob) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy tin tuyển dụng này." },
        { status: 404 }
      );
    }

    const body = await req.json();
    const hiredCount = existingJob.applications.filter((a) => a.currentStage === "HIRED").length;
    const activeInterviewCount = existingJob.applications.filter(
      (a) => a.currentStage === "INTERVIEW"
    ).length;

    const nextTargetHeadcount =
      body.targetHeadcount !== undefined
        ? Number(body.targetHeadcount)
        : existingJob.targetHeadcount;

    if (!Number.isInteger(nextTargetHeadcount) || nextTargetHeadcount < 1 || nextTargetHeadcount > 100) {
      return NextResponse.json(
        {
          success: false,
          error: "Số lượng cần tuyển phải là số nguyên từ 1 đến 100.",
          fieldErrors: { targetHeadcount: "Nhập số nguyên từ 1 đến 100" },
        },
        { status: 400 }
      );
    }

    if (nextTargetHeadcount < hiredCount) {
      return NextResponse.json(
        {
          success: false,
          error: `Vị trí này đã tuyển ${hiredCount} nhân sự, nên số lượng cần tuyển không thể thấp hơn ${hiredCount}.`,
          fieldErrors: { targetHeadcount: `Tối thiểu ${hiredCount} (đã tuyển)` },
        },
        { status: 400 }
      );
    }

    const nextMaxActiveInterviews =
      body.maxActiveInterviews !== undefined
        ? Number(body.maxActiveInterviews)
        : body.targetHeadcount !== undefined
        ? Math.max(nextTargetHeadcount, nextTargetHeadcount * 3)
        : existingJob.maxActiveInterviews;

    if (
      !Number.isInteger(nextMaxActiveInterviews) ||
      nextMaxActiveInterviews < nextTargetHeadcount ||
      nextMaxActiveInterviews > 300
    ) {
      return NextResponse.json(
        {
          success: false,
          error: `Giới hạn phỏng vấn cùng lúc phải từ ${nextTargetHeadcount} đến 300.`,
          fieldErrors: { maxActiveInterviews: `Phải tối thiểu bằng số lượng cần tuyển (${nextTargetHeadcount})` },
        },
        { status: 400 }
      );
    }

    let nextStatus = existingJob.status;
    if (body.status === "ACTIVE" || body.status === "CLOSED") {
      if (body.status === "ACTIVE" && hiredCount >= nextTargetHeadcount) {
        return NextResponse.json(
          {
            success: false,
            error: `Vị trí này đã tuyển đủ ${hiredCount}/${nextTargetHeadcount} nhân sự. Vui lòng tăng số lượng cần tuyển trước khi mở lại tin.`,
          },
          { status: 400 }
        );
      }
      nextStatus = body.status;
    } else if (nextTargetHeadcount > hiredCount && existingJob.status === "CLOSED") {
      // Tự động mở lại khi HR tăng chỉ tiêu tuyển thêm
      nextStatus = "ACTIVE";
    } else if (nextTargetHeadcount === hiredCount) {
      nextStatus = "CLOSED";
    }

    const updated = await prisma.job.update({
      where: { id: jobId },
      data: {
        targetHeadcount: nextTargetHeadcount,
        maxActiveInterviews: nextMaxActiveInterviews,
        status: nextStatus,
      },
    });

    const headcountMetrics = computeJobHeadcountMetrics({
      targetHeadcount: updated.targetHeadcount,
      maxActiveInterviews: updated.maxActiveInterviews,
      hiredCount,
      activeInterviewCount,
      status: updated.status,
    });

    return NextResponse.json({
      success: true,
      message: `Đã cập nhật chỉ tiêu tuyển dụng cho vị trí "${updated.title}".`,
      data: {
        ...updated,
        headcountMetrics,
      },
    });
  } catch (error: any) {
    console.error("PATCH /api/jobs/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Không thể cập nhật tin tuyển dụng lúc này." },
      { status: 500 }
    );
  }
}
