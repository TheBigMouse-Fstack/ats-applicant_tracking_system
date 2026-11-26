import "server-only";
import { readFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { extractTextFromCv, parseAndScoreCv } from "@/lib/ai-parser";
import { requirePermission } from "./auth";
import { DalError } from "./errors";
import { maskApplicationBlindScorecard } from "./gates";

export async function listApplications(searchParams: URLSearchParams) {
  const sessionUser = await requirePermission("applications:read");

  const jobId = searchParams.get("jobId");
  const stage = searchParams.get("stage");
  const source = searchParams.get("source");
  const search = searchParams.get("search");
  const sortBy = searchParams.get("sortBy") || "NEWEST";
  const starredOnly = searchParams.get("starred") === "true";
  const unviewedOnly = searchParams.get("unviewed") === "true";
  const unevaluatedOnly = searchParams.get("unevaluated") === "true";

  const where: any = {};
  if (jobId && jobId !== "ALL") where.jobId = Number(jobId);
  if (stage && stage !== "ALL") where.currentStage = stage;
  if (source && source !== "ALL") where.source = source;
  if (starredOnly) where.isStarred = true;
  if (unviewedOnly) where.isViewed = false;
  if (unevaluatedOnly) where.evaluations = { none: {} };

  if (search && search.trim()) {
    const q = search.trim();
    where.OR = [
      { candidate: { fullName: { contains: q } } },
      { candidate: { email: { contains: q } } },
      { candidate: { phone: { contains: q } } },
      { candidate: { parsedSkills: { contains: q } } },
      { job: { title: { contains: q } } },
    ];
  }

  let orderBy: any = { createdAt: "desc" };
  if (sortBy === "OLDEST") {
    orderBy = { createdAt: "asc" };
  } else if (sortBy === "NAME_ASC") {
    orderBy = { candidate: { fullName: "asc" } };
  }

  const applications = await prisma.application.findMany({
    where,
    select: {
      id: true,
      candidateId: true,
      jobId: true,
      source: true,
      currentStage: true,
      aiMatchScore: true,
      aiMatchRationale: true,
      isStarred: true,
      isViewed: true,
      viewedAt: true,
      interviewDate: true,
      interviewFormat: true,
      interviewLocation: true,
      isInterviewInviteSent: true,
      knockoutFailed: true,
      stageUpdatedAt: true,
      createdAt: true,
      candidate: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          experienceYears: true,
          parsedSkills: true,
          cvFileUrl: true,
          createdAt: true,
        },
      },
      job: {
        select: {
          id: true,
          title: true,
          department: true,
          status: true,
        },
      },
      evaluations: {
        select: {
          id: true,
          evaluatorId: true,
          overallScore: true,
          recommendation: true,
        },
      },
    },
    orderBy,
  });

  // P0-02 (BRL-15): Áp dụng Blind Scorecard trên danh sách applications
  const masked = applications.map((app) => maskApplicationBlindScorecard(sessionUser, app));

  if (sortBy === "STARRED_FIRST") {
    masked.sort((a, b) => {
      if (a.isStarred !== b.isStarred) return b.isStarred ? 1 : -1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  } else if (sortBy === "UNVIEWED_FIRST") {
    masked.sort((a, b) => {
      if (a.isViewed !== b.isViewed) return a.isViewed ? 1 : -1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  } else if (sortBy === "UNEVALUATED_FIRST") {
    masked.sort((a, b) => {
      const aHasEval = a.totalEvaluationsCount > 0;
      const bHasEval = b.totalEvaluationsCount > 0;
      if (aHasEval !== bHasEval) return aHasEval ? 1 : -1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  return masked;
}

export async function getApplicationDetail(applicationId: number) {
  const sessionUser = await requirePermission("applications:read");

  if (!Number.isInteger(applicationId) || applicationId <= 0) {
    throw new DalError("BAD_REQUEST", {
      messageVi: "ID hồ sơ không hợp lệ",
      messageEn: "Invalid application ID.",
    });
  }

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      candidate: {
        include: {
          applications: {
            where: { id: { not: applicationId } },
            include: { job: { select: { id: true, title: true, department: true } } },
            orderBy: { createdAt: "desc" },
          },
        },
      },
      job: {
        select: {
          id: true,
          title: true,
          department: true,
          requirementsJd: true,
          requiredSkills: true,
          minExperienceYears: true,
        },
      },
      evaluations: {
        include: {
          evaluator: {
            select: { id: true, fullName: true, email: true, role: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      auditLogs: {
        include: {
          user: {
            select: { id: true, fullName: true, role: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!application) {
    throw new DalError("NOT_FOUND", {
      messageVi: "Không tìm thấy hồ sơ ứng tuyển này",
      messageEn: "Application not found.",
    });
  }

  if (!application.isViewed) {
    const viewedAt = new Date();
    await prisma.application.update({
      where: { id: applicationId },
      data: { isViewed: true, viewedAt },
    });
    application.isViewed = true;
    application.viewedAt = viewedAt;
  }

  const hasPassingScorecard = application.evaluations.some(
    (ev) => ev.recommendation === "HIRE" || ev.recommendation === "STRONG_HIRE"
  );
  const masked = maskApplicationBlindScorecard(sessionUser, application);

  return {
    ...masked,
    hasPassingScorecard,
  };
}

export async function patchApplicationFlags(
  applicationId: number,
  body: { isStarred?: unknown; isViewed?: unknown }
) {
  await requirePermission("applications:read");

  if (!Number.isInteger(applicationId) || applicationId <= 0) {
    throw new DalError("BAD_REQUEST", {
      messageVi: "ID hồ sơ không hợp lệ",
      messageEn: "Invalid application ID.",
    });
  }

  const updateData: Record<string, unknown> = {};
  if (typeof body.isStarred === "boolean") {
    updateData.isStarred = body.isStarred;
  }
  if (typeof body.isViewed === "boolean") {
    updateData.isViewed = body.isViewed;
    if (body.isViewed) {
      updateData.viewedAt = new Date();
    }
  }

  return prisma.application.update({
    where: { id: applicationId },
    data: updateData,
    select: {
      id: true,
      isStarred: true,
      isViewed: true,
      viewedAt: true,
    },
  });
}

export async function toggleApplicationStar(applicationId: number) {
  const sessionUser = await requirePermission("applications:star");

  if (!Number.isInteger(applicationId) || applicationId <= 0) {
    throw new DalError("BAD_REQUEST", {
      messageVi: "ID hồ sơ không hợp lệ",
      messageEn: "Invalid application ID.",
    });
  }

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    select: {
      id: true,
      isStarred: true,
      currentStage: true,
      candidate: { select: { fullName: true } },
    },
  });

  if (!application) {
    throw new DalError("NOT_FOUND", {
      messageVi: "Không tìm thấy hồ sơ ứng tuyển này",
      messageEn: "Application not found.",
    });
  }

  const newStarred = !application.isStarred;

  const [updated] = await prisma.$transaction([
    prisma.application.update({
      where: { id: applicationId },
      data: { isStarred: newStarred },
      select: { id: true, isStarred: true },
    }),
    prisma.auditLog.create({
      data: {
        applicationId,
        userId: sessionUser.id,
        action: newStarred ? "STARRED" : "UNSTARRED",
        fromStage: application.currentStage,
        toStage: application.currentStage,
      },
    }),
  ]);

  return {
    isStarred: updated.isStarred,
    candidateFullName: application.candidate?.fullName || "",
  };
}

export async function updateApplicationProfile(
  applicationId: number,
  body: Record<string, any>
) {
  const sessionUser = await requirePermission("applications:profile:write", {
    vi: "Quản lý chuyên môn chỉ có quyền xem hồ sơ và đánh giá; quyền chuẩn hóa dữ liệu trích xuất CV thuộc bộ phận HR.",
    en: "Hiring Managers have read-only access to candidate profiles; CV data editing is restricted to HR and Admin.",
  });

  if (!Number.isInteger(applicationId) || applicationId <= 0) {
    throw new DalError("BAD_REQUEST", {
      messageVi: "ID hồ sơ không hợp lệ",
      messageEn: "Invalid application ID.",
    });
  }

  const app = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { candidate: true, job: true },
  });

  if (!app) {
    throw new DalError("NOT_FOUND", {
      messageVi: "Không tìm thấy hồ sơ ứng tuyển",
      messageEn: "Application not found.",
    });
  }

  const { fullName, email, phone, experienceYears, skills, education, experience } = body;

  const nextFullName =
    typeof fullName === "string" ? fullName.trim() : app.candidate.fullName;
  const nextEmail =
    typeof email === "string" ? email.trim().toLowerCase() : app.candidate.email;
  const nextPhone =
    typeof phone === "string" ? phone.trim() : app.candidate.phone;

  if (!nextFullName || nextFullName.length < 2) {
    throw new DalError("BAD_REQUEST", {
      messageVi: "Họ và tên ứng viên phải có ít nhất 2 ký tự.",
      messageEn: "Candidate full name must be at least 2 characters.",
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!nextEmail || !emailRegex.test(nextEmail)) {
    throw new DalError("BAD_REQUEST", {
      messageVi: "Địa chỉ Email không đúng định dạng hợp lệ.",
      messageEn: "Invalid email format.",
    });
  }

  const nextExpYears =
    experienceYears !== undefined && experienceYears !== null
      ? Math.max(0, Math.min(50, Number(experienceYears)))
      : app.candidate.experienceYears;

  if (isNaN(nextExpYears)) {
    throw new DalError("BAD_REQUEST", {
      messageVi: "Số năm kinh nghiệm phải là một số hợp lệ.",
      messageEn: "Years of experience must be a valid number.",
    });
  }

  let nextSkills: string[] = [];
  if (Array.isArray(skills)) {
    const seen = new Set<string>();
    for (const raw of skills) {
      const s = String(raw).trim();
      if (s && !seen.has(s.toLowerCase())) {
        seen.add(s.toLowerCase());
        nextSkills.push(s);
      }
    }
  } else {
    try {
      nextSkills = JSON.parse(app.candidate.parsedSkills || "[]");
    } catch {
      nextSkills = [];
    }
  }

  if (nextEmail !== app.candidate.email || nextPhone !== app.candidate.phone) {
    const conflict = await prisma.candidate.findFirst({
      where: {
        id: { not: app.candidateId },
        email: nextEmail,
        phone: nextPhone,
      },
    });
    if (conflict) {
      throw new DalError("CONFLICT", {
        status: 400,
        messageVi: "Cặp Email và Số điện thoại này đã thuộc về một ứng viên khác trong hệ thống.",
        messageEn: "This email and phone pair already belongs to another candidate.",
      });
    }
  }

  let requiredSkills: string[] = [];
  try {
    requiredSkills = JSON.parse(app.job.requiredSkills || "[]");
  } catch {
    requiredSkills = [];
  }

  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  requiredSkills.forEach((reqSkill) => {
    const reqLower = reqSkill.toLowerCase();
    const matched = nextSkills.some(
      (s) =>
        s.toLowerCase() === reqLower ||
        s.toLowerCase().includes(reqLower) ||
        reqLower.includes(s.toLowerCase())
    );
    if (matched) matchedSkills.push(reqSkill);
    else missingSkills.push(reqSkill);
  });

  const skillScore =
    requiredSkills.length > 0 ? (matchedSkills.length / requiredSkills.length) * 100 : 60;
  const minExp = app.job.minExperienceYears || 1;
  const expScore = Math.min(1.0, nextExpYears / minExp) * 100;
  const recalculatedMatchScore = Math.round(skillScore * 0.6 + expScore * 0.4);

  const changedFields: string[] = [];
  if (nextFullName !== app.candidate.fullName) changedFields.push("Họ tên");
  if (nextEmail !== app.candidate.email) changedFields.push("Email");
  if (nextPhone !== app.candidate.phone) changedFields.push("SĐT");
  if (nextExpYears !== app.candidate.experienceYears) changedFields.push("Kinh nghiệm");
  if (Array.isArray(skills)) changedFields.push("Kỹ năng");
  if (Array.isArray(education)) changedFields.push("Học vấn");
  if (Array.isArray(experience)) changedFields.push("Lịch sử công tác");

  const candidateUpdateData: any = {
    fullName: nextFullName,
    email: nextEmail,
    phone: nextPhone,
    experienceYears: nextExpYears,
    parsedSkills: JSON.stringify(nextSkills),
  };

  if (Array.isArray(education)) {
    candidateUpdateData.parsedEducation = JSON.stringify(education);
  }
  if (Array.isArray(experience)) {
    candidateUpdateData.parsedExperience = JSON.stringify(experience);
  }

  await prisma.$transaction([
    prisma.candidate.update({
      where: { id: app.candidateId },
      data: candidateUpdateData,
    }),
    prisma.application.update({
      where: { id: app.id },
      data: {
        aiMatchScore: recalculatedMatchScore,
        aiMatchedSkills: JSON.stringify(matchedSkills),
        aiMissingSkills: JSON.stringify(missingSkills),
      },
    }),
    prisma.auditLog.create({
      data: {
        applicationId: app.id,
        userId: sessionUser.id,
        fromStage: app.currentStage,
        toStage: app.currentStage,
        action: "PROFILE_EDITED",
        reason:
          changedFields.length > 0
            ? `Chỉnh sửa thủ công: ${changedFields.join(", ")}`
            : "Cập nhật thông tin hồ sơ ứng viên",
      },
    }),
  ]);

  const updatedApplication = await prisma.application.findUnique({
    where: { id: app.id },
    include: {
      candidate: {
        include: {
          applications: {
            where: { id: { not: app.id } },
            include: { job: { select: { id: true, title: true, department: true } } },
            orderBy: { createdAt: "desc" },
          },
        },
      },
      job: {
        select: {
          id: true,
          title: true,
          department: true,
          requirementsJd: true,
          requiredSkills: true,
          minExperienceYears: true,
        },
      },
      evaluations: {
        include: {
          evaluator: {
            select: { id: true, fullName: true, email: true, role: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      auditLogs: {
        include: {
          user: {
            select: { id: true, fullName: true, role: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!updatedApplication) {
    throw new DalError("NOT_FOUND");
  }

  // P0-02 (BRL-15): Áp dụng Blind Scorecard trên dữ liệu trả về sau khi sửa profile
  return maskApplicationBlindScorecard(sessionUser, updatedApplication);
}

export async function reparseApplicationCv(applicationId: number) {
  const sessionUser = await requirePermission("applications:reparse", {
    vi: "Chỉ Chuyên viên HR và Quản trị viên mới có quyền phân tích lại CV.",
    en: "Only HR Specialists and Administrators can re-analyze CVs.",
  });

  if (!Number.isInteger(applicationId) || applicationId <= 0) {
    throw new DalError("BAD_REQUEST", {
      messageVi: "Mã hồ sơ không hợp lệ",
      messageEn: "Invalid application ID.",
    });
  }

  const app = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { candidate: true, job: true },
  });

  if (!app || !app.candidate || !app.job) {
    throw new DalError("NOT_FOUND", {
      messageVi: "Không tìm thấy hồ sơ hoặc vị trí tuyển dụng",
      messageEn: "Application or job not found.",
    });
  }

  let cvText = app.candidate.cvText || "";
  if (app.candidate.cvFileUrl) {
    try {
      const filePath = path.join(
        process.cwd(),
        "public",
        app.candidate.cvFileUrl.replace(/^\//, "")
      );
      const buffer = await readFile(filePath);
      cvText = await extractTextFromCv(buffer, path.basename(filePath));
    } catch {
      // fallback to existing cvText
    }
  }

  let requiredSkillsArray: string[] = [];
  try {
    requiredSkillsArray = JSON.parse(app.job.requiredSkills || "[]");
  } catch {
    requiredSkillsArray = [];
  }

  const aiResult = await parseAndScoreCv(cvText, {
    title: app.job.title,
    requirementsJd: app.job.requirementsJd,
    requiredSkills: requiredSkillsArray,
    minExperienceYears: app.job.minExperienceYears,
  });

  const [, updatedApp] = await prisma.$transaction([
    prisma.candidate.update({
      where: { id: app.candidate.id },
      data: {
        experienceYears: aiResult.experienceYears,
        parsedSkills: JSON.stringify(aiResult.skills),
        parsedEducation: JSON.stringify(aiResult.education),
        parsedExperience: JSON.stringify(aiResult.experience),
        cvText: cvText.slice(0, 10000),
      },
    }),
    prisma.application.update({
      where: { id: app.id },
      data: {
        aiMatchScore: aiResult.matchScore,
        aiMatchRationale: aiResult.rationale,
        aiMatchedSkills: JSON.stringify(aiResult.matchedSkills),
        aiMissingSkills: JSON.stringify(aiResult.missingSkills),
      },
      include: {
        candidate: true,
        job: true,
        evaluations: true,
        auditLogs: true,
      },
    }),
  ]);

  // P0-02 (BRL-15): Áp dụng Blind Scorecard trên dữ liệu trả về sau re-parse
  return maskApplicationBlindScorecard(sessionUser, updatedApp);
}
