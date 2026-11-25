import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { computeJobHeadcountMetrics } from "@/lib/headcount-rules";

export const dynamic = "force-dynamic";

// GET: Lấy toàn bộ danh sách tin tuyển dụng nội bộ kèm tiến độ chỉ tiêu & trần phỏng vấn
export async function GET(req: Request) {
  try {
    const sessionUser = getSessionUser();
    if (!sessionUser) {
      return NextResponse.json(
        { success: false, error: "Yêu cầu đăng nhập tài khoản nội bộ để xem danh sách tin tuyển dụng." },
        { status: 401 }
      );
    }

    const jobs = await prisma.job.findMany({
      include: {
        creator: {
          select: { id: true, fullName: true, role: true },
        },
        applications: {
          select: { currentStage: true },
        },
        _count: {
          select: { applications: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const enrichedJobs = jobs.map(({ applications, ...job }) => {
      const hiredCount = applications.filter((a) => a.currentStage === "HIRED").length;
      const activeInterviewCount = applications.filter(
        (a) => a.currentStage === "INTERVIEW"
      ).length;
      const headcountMetrics = computeJobHeadcountMetrics({
        targetHeadcount: job.targetHeadcount,
        maxActiveInterviews: job.maxActiveInterviews,
        hiredCount,
        activeInterviewCount,
        status: job.status,
      });

      return {
        ...job,
        headcountMetrics,
      };
    });

    return NextResponse.json({ success: true, data: enrichedJobs });
  } catch (error: any) {
    console.error("GET /api/jobs error:", error);
    return NextResponse.json(
      { success: false, error: "Không thể lấy danh sách tin tuyển dụng" },
      { status: 500 }
    );
  }
}

// POST: Tạo tin tuyển dụng mới (HR và Admin; Hiring Manager chỉ đọc)
export async function POST(req: Request) {
  try {
    const sessionUser = getSessionUser();
    if (!sessionUser) {
      return NextResponse.json(
        { success: false, error: "Yêu cầu đăng nhập tài khoản nội bộ để tạo tin tuyển dụng." },
        { status: 401 }
      );
    }
    if (sessionUser.role === "HIRING_MANAGER") {
      return NextResponse.json(
        {
          success: false,
          error: "Quản lý chuyên môn (Hiring Manager) chỉ có quyền xem tin tuyển dụng, không có quyền tạo mới.",
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      title,
      department,
      location,
      employmentType,
      minExperienceYears,
      requiredSkills,
      requirementsJd,
      targetHeadcount,
      maxActiveInterviews,
      screeningQuestions,
      initialStatus,
    } = body;

    const fieldErrors: Record<string, string> = {};

    if (!title || !title.trim()) {
      fieldErrors.title = "Tiêu đề vị trí tuyển dụng không được để trống";
    }
    if (!department || !department.trim()) {
      fieldErrors.department = "Vui lòng nhập hoặc chọn phòng ban";
    }
    if (!requirementsJd || !requirementsJd.trim()) {
      fieldErrors.requirementsJd = "Mô tả chi tiết và yêu cầu JD bắt buộc phải có";
    }

    const parsedHeadcount =
      targetHeadcount === undefined || targetHeadcount === "" || targetHeadcount === null
        ? 1
        : Number(targetHeadcount);
    if (!Number.isInteger(parsedHeadcount) || parsedHeadcount < 1 || parsedHeadcount > 100) {
      fieldErrors.targetHeadcount = "Số lượng cần tuyển phải là số nguyên từ 1 đến 100";
    }

    const defaultCap = Math.max(1, Number.isInteger(parsedHeadcount) ? parsedHeadcount * 3 : 3);
    const parsedMaxInterviews =
      maxActiveInterviews === undefined || maxActiveInterviews === "" || maxActiveInterviews === null
        ? defaultCap
        : Number(maxActiveInterviews);
    if (
      !Number.isInteger(parsedMaxInterviews) ||
      parsedMaxInterviews < Math.max(1, parsedHeadcount || 1) ||
      parsedMaxInterviews > 300
    ) {
      fieldErrors.maxActiveInterviews = `Giới hạn phỏng vấn cùng lúc phải lớn hơn hoặc bằng số lượng cần tuyển (${Math.max(1, parsedHeadcount || 1)})`;
    }

    if (Object.keys(fieldErrors).length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Dữ liệu tạo tin tuyển dụng chưa đầy đủ. Vui lòng kiểm tra lại các trường được đánh dấu đỏ.",
          fieldErrors,
        },
        { status: 400 }
      );
    }

    const creatorId = sessionUser.id;

    // Xử lý skills mảng thành JSON string
    let formattedSkills = "[]";
    if (Array.isArray(requiredSkills)) {
      formattedSkills = JSON.stringify(requiredSkills.filter(Boolean));
    } else if (typeof requiredSkills === "string") {
      const parsed = requiredSkills
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean);
      formattedSkills = JSON.stringify(parsed);
    }

    // BRL-16: Chuẩn hóa danh sách câu hỏi sàng lọc (Knock-out Questions)
    let formattedQuestions = "[]";
    if (Array.isArray(screeningQuestions)) {
      const cleaned = screeningQuestions
        .filter((q: any) => q && typeof q.question === "string" && q.question.trim().length > 0)
        .slice(0, 5)
        .map((q: any, idx: number) => ({
          id: String(q.id || `q_${idx + 1}`),
          question: String(q.question).trim(),
          expectedAnswer: q.expectedAnswer === "NO" ? "NO" : "YES",
          isKnockout: Boolean(q.isKnockout),
        }));
      formattedQuestions = JSON.stringify(cleaned);
    }

    // BRL-17: Phê duyệt tin tuyển dụng (Requisition Approval)
    // HR tạo tin -> mặc định PENDING_APPROVAL (hoặc DRAFT); Admin có thể mở ACTIVE trực tiếp
    let resolvedStatus = "ACTIVE";
    if (sessionUser?.role === "HR") {
      resolvedStatus = initialStatus === "DRAFT" ? "DRAFT" : "PENDING_APPROVAL";
    } else if (initialStatus === "DRAFT" || initialStatus === "PENDING_APPROVAL") {
      resolvedStatus = initialStatus;
    }

    const job = await prisma.job.create({
      data: {
        creatorId,
        title: title.trim(),
        department: department.trim(),
        location: location?.trim() || "Hồ Chí Minh",
        employmentType: employmentType?.trim() || "Toàn thời gian",
        minExperienceYears: Number(minExperienceYears) || 0,
        requiredSkills: formattedSkills,
        requirementsJd: requirementsJd.trim(),
        targetHeadcount: parsedHeadcount,
        maxActiveInterviews: parsedMaxInterviews,
        screeningQuestions: formattedQuestions,
        status: resolvedStatus,
        ...(resolvedStatus === "ACTIVE" && sessionUser
          ? { approvedById: sessionUser.id, approvedAt: new Date() }
          : {}),
      } as any,
    });

    return NextResponse.json({
      success: true,
      message:
        resolvedStatus === "PENDING_APPROVAL"
          ? `Đã gửi yêu cầu phê duyệt tin tuyển dụng "${job.title}".`
          : resolvedStatus === "DRAFT"
          ? `Đã lưu bản nháp tin tuyển dụng "${job.title}".`
          : `Tạo tin tuyển dụng "${job.title}" thành công!`,
      data: job,
    });
  } catch (error: any) {
    console.error("POST /api/jobs error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Lỗi hệ thống khi tạo vị trí tuyển dụng: " + (error.message || "Unknown error"),
      },
      { status: 500 }
    );
  }
}

