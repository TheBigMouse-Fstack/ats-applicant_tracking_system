import "server-only";
import { prisma } from "@/lib/prisma";
import { computeJobHeadcountMetrics } from "@/lib/headcount-rules";
import { requirePermission } from "./auth";
import { DalError } from "./errors";
import {
  assertCanActivateJobStatus,
  assertCanApproveRequisition,
  assertCanCloseJobStatus,
} from "./gates";

export async function listJobsWithMetrics() {
  await requirePermission("jobs:read");

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

  return jobs.map(({ applications, ...job }) => {
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
}

export async function createJobRequisition(body: Record<string, any>) {
  const sessionUser = await requirePermission("jobs:write", {
    vi: "Quản lý chuyên môn chỉ có quyền xem tin tuyển dụng, không có quyền tạo mới.",
    en: "Hiring Managers have read-only access to job requisitions.",
  });

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

  if (!title || !String(title).trim()) {
    fieldErrors.title = "Tiêu đề vị trí tuyển dụng không được để trống";
  }
  if (!department || !String(department).trim()) {
    fieldErrors.department = "Vui lòng nhập hoặc chọn phòng ban";
  }
  if (!requirementsJd || !String(requirementsJd).trim()) {
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
    throw new DalError("BAD_REQUEST", {
      messageVi:
        "Dữ liệu tạo tin tuyển dụng chưa đầy đủ. Vui lòng kiểm tra lại các trường được đánh dấu đỏ.",
      messageEn: "Incomplete job requisition data. Please check the highlighted fields.",
      extra: { fieldErrors },
    });
  }

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

  // BRL-17: HR tạo tin mặc định PENDING_APPROVAL (hoặc DRAFT); Admin có thể mở ACTIVE trực tiếp
  let resolvedStatus = "ACTIVE";
  if (sessionUser.role === "HR") {
    resolvedStatus = initialStatus === "DRAFT" ? "DRAFT" : "PENDING_APPROVAL";
  } else if (initialStatus === "DRAFT" || initialStatus === "PENDING_APPROVAL") {
    resolvedStatus = initialStatus;
  }

  const job = await prisma.job.create({
    data: {
      creatorId: sessionUser.id,
      title: String(title).trim(),
      department: String(department).trim(),
      location: location ? String(location).trim() : "Hồ Chí Minh",
      employmentType: employmentType ? String(employmentType).trim() : "Toàn thời gian",
      minExperienceYears: Number(minExperienceYears) || 0,
      requiredSkills: formattedSkills,
      requirementsJd: String(requirementsJd).trim(),
      targetHeadcount: parsedHeadcount,
      maxActiveInterviews: parsedMaxInterviews,
      screeningQuestions: formattedQuestions,
      status: resolvedStatus,
      ...(resolvedStatus === "ACTIVE"
        ? { approvedById: sessionUser.id, approvedAt: new Date() }
        : {}),
    },
  });

  const message =
    resolvedStatus === "PENDING_APPROVAL"
      ? `Đã gửi yêu cầu phê duyệt tin tuyển dụng "${job.title}".`
      : resolvedStatus === "DRAFT"
      ? `Đã lưu bản nháp tin tuyển dụng "${job.title}".`
      : `Tạo tin tuyển dụng "${job.title}" thành công!`;

  return { job, message };
}

export async function updateJobRequisition(jobId: number, body: Record<string, any>) {
  const sessionUser = await requirePermission("jobs:write", {
    vi: "Quản lý chuyên môn chỉ có quyền xem tin tuyển dụng, không có quyền thay đổi chỉ tiêu hay trạng thái tin.",
    en: "Hiring Managers have read-only access to job requisitions.",
  });

  if (!Number.isInteger(jobId) || jobId <= 0) {
    throw new DalError("BAD_REQUEST", {
      messageVi: "Mã tin tuyển dụng không hợp lệ.",
      messageEn: "Invalid job ID.",
    });
  }

  const existingJob = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      applications: { select: { currentStage: true } },
    },
  });

  if (!existingJob) {
    throw new DalError("NOT_FOUND", {
      messageVi: "Không tìm thấy tin tuyển dụng này.",
      messageEn: "Job requisition not found.",
    });
  }

  const hiredCount = existingJob.applications.filter((a) => a.currentStage === "HIRED").length;
  const activeInterviewCount = existingJob.applications.filter(
    (a) => a.currentStage === "INTERVIEW"
  ).length;

  const nextTargetHeadcount =
    body.targetHeadcount !== undefined
      ? Number(body.targetHeadcount)
      : existingJob.targetHeadcount;

  if (!Number.isInteger(nextTargetHeadcount) || nextTargetHeadcount < 1 || nextTargetHeadcount > 100) {
    throw new DalError("BAD_REQUEST", {
      messageVi: "Số lượng cần tuyển phải là số nguyên từ 1 đến 100.",
      messageEn: "Target headcount must be an integer between 1 and 100.",
      extra: { fieldErrors: { targetHeadcount: "Nhập số nguyên từ 1 đến 100" } },
    });
  }

  if (nextTargetHeadcount < hiredCount) {
    throw new DalError("BAD_REQUEST", {
      messageVi: `Vị trí này đã tuyển ${hiredCount} nhân sự, nên số lượng cần tuyển không thể thấp hơn ${hiredCount}.`,
      messageEn: `This position already has ${hiredCount} hired candidates; target headcount cannot be lower.`,
      extra: { fieldErrors: { targetHeadcount: `Tối thiểu ${hiredCount} (đã tuyển)` } },
    });
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
    throw new DalError("BAD_REQUEST", {
      messageVi: `Giới hạn phỏng vấn cùng lúc phải từ ${nextTargetHeadcount} đến 300.`,
      messageEn: `Max active interviews must be between ${nextTargetHeadcount} and 300.`,
      extra: {
        fieldErrors: {
          maxActiveInterviews: `Phải tối thiểu bằng số lượng cần tuyển (${nextTargetHeadcount})`,
        },
      },
    });
  }

  let nextStatus = existingJob.status;
  if (body.status === "ACTIVE" || body.status === "CLOSED") {
    // P0-03 (BRL-17): Chặn HR tự kích hoạt hoặc tự đóng tin DRAFT/PENDING_APPROVAL/approvedById == null
    if (body.status === "ACTIVE") {
      assertCanActivateJobStatus(sessionUser, existingJob, body.status);
    } else if (body.status === "CLOSED") {
      assertCanCloseJobStatus(sessionUser, existingJob);
    }

    if (body.status === "ACTIVE" && hiredCount >= nextTargetHeadcount) {
      throw new DalError("BAD_REQUEST", {
        messageVi: `Vị trí này đã tuyển đủ ${hiredCount}/${nextTargetHeadcount} nhân sự. Vui lòng tăng số lượng cần tuyển trước khi mở lại tin.`,
        messageEn: `This position has reached its target headcount (${hiredCount}/${nextTargetHeadcount}). Increase headcount before reopening.`,
      });
    }
    nextStatus = body.status;
  } else if (nextTargetHeadcount > hiredCount && existingJob.status === "CLOSED") {
    assertCanActivateJobStatus(sessionUser, existingJob, "ACTIVE");
    nextStatus = "ACTIVE";
  } else if (nextTargetHeadcount === hiredCount && existingJob.status === "ACTIVE") {
    nextStatus = "CLOSED";
  }

  const updated = await prisma.job.update({
    where: { id: jobId },
    data: {
      targetHeadcount: nextTargetHeadcount,
      maxActiveInterviews: nextMaxActiveInterviews,
      status: nextStatus,
      ...(nextStatus === "ACTIVE" && !existingJob.approvedById && sessionUser.role === "ADMIN"
        ? { approvedById: sessionUser.id, approvedAt: new Date() }
        : {}),
    },
  });

  const headcountMetrics = computeJobHeadcountMetrics({
    targetHeadcount: updated.targetHeadcount,
    maxActiveInterviews: updated.maxActiveInterviews,
    hiredCount,
    activeInterviewCount,
    status: updated.status,
  });

  return {
    updated,
    headcountMetrics,
  };
}

export async function approveJobRequisition(
  jobId: number,
  body: { action?: unknown; approvalNote?: unknown }
) {
  const sessionUser = await requirePermission("jobs:approve", {
    vi: "Chỉ Quản lý chuyên môn hoặc Quản trị viên mới có quyền phê duyệt tin tuyển dụng.",
    en: "Only Hiring Managers or Administrators can approve job requisitions.",
  });
  assertCanApproveRequisition(sessionUser);

  if (!Number.isInteger(jobId) || jobId <= 0) {
    throw new DalError("BAD_REQUEST", {
      messageVi: "Mã tin tuyển dụng không hợp lệ.",
      messageEn: "Invalid job ID.",
    });
  }

  const action = body.action === "REJECT" ? "REJECT" : "APPROVE";
  const approvalNote = typeof body.approvalNote === "string" ? body.approvalNote.trim() : "";

  if (action === "REJECT" && approvalNote.length < 5) {
    throw new DalError("BAD_REQUEST", {
      messageVi: "Vui lòng nhập ghi chú lý do yêu cầu chỉnh sửa (tối thiểu 5 ký tự).",
      messageEn: "Please enter a revision reason (at least 5 characters).",
    });
  }

  const existing = await prisma.job.findUnique({ where: { id: jobId } });
  if (!existing) {
    throw new DalError("NOT_FOUND", {
      messageVi: "Không tìm thấy tin tuyển dụng.",
      messageEn: "Job requisition not found.",
    });
  }

  const updated = await prisma.job.update({
    where: { id: jobId },
    data: {
      status: action === "APPROVE" ? "ACTIVE" : "DRAFT",
      approvedById: action === "APPROVE" ? sessionUser.id : null,
      approvedAt: action === "APPROVE" ? new Date() : null,
      approvalNote: approvalNote || null,
    },
  });

  return {
    action,
    updated,
  };
}
