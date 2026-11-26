import "server-only";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "./auth";
import { DalError } from "./errors";
import { filterEvaluationsBlind } from "./gates";

export async function listScorecards(applicationIdParam?: string | null) {
  const sessionUser = await requirePermission("scorecards:read");

  const where: Record<string, unknown> = {};
  if (applicationIdParam) {
    const appId = Number(applicationIdParam);
    if (Number.isInteger(appId) && appId > 0) {
      where.applicationId = appId;
    }
  }

  const evaluations = await prisma.evaluation.findMany({
    where,
    include: {
      evaluator: {
        select: { id: true, fullName: true, email: true, role: true },
      },
      application: {
        include: {
          candidate: true,
          job: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // P0-02 (BRL-15): Áp dụng Blind Scorecard trên MỌI truy vấn (kể cả không truyền applicationId)
  const { visibleEvaluations, hiddenEvaluationsCount, blindScorecardLocked } =
    filterEvaluationsBlind(sessionUser, evaluations);

  return {
    data: visibleEvaluations,
    blindScorecardLocked,
    hiddenEvaluationsCount,
  };
}

export async function createScorecard(body: Record<string, any>) {
  const sessionUser = await requirePermission("scorecards:write");

  const {
    applicationId,
    round,
    technicalScore,
    communicationScore,
    culturalFitScore,
    levelRecommendation,
    strengths,
    weaknesses,
    technicalNotes,
    communicationNotes,
    cultureNotes,
    hireReason,
    comments,
    recommendation,
  } = body;

  const fieldErrors: Record<string, string> = {};

  if (!applicationId) {
    fieldErrors.applicationId = "Thiếu mã hồ sơ ứng tuyển";
  }

  const tech = Number(technicalScore);
  const comm = Number(communicationScore);
  const cult = Number(culturalFitScore);

  if (isNaN(tech) || tech < 1 || tech > 5) {
    fieldErrors.technicalScore = "Điểm kỹ năng chuyên môn phải từ 1 đến 5 sao";
  }
  if (isNaN(comm) || comm < 1 || comm > 5) {
    fieldErrors.communicationScore = "Điểm kỹ năng giao tiếp phải từ 1 đến 5 sao";
  }
  if (isNaN(cult) || cult < 1 || cult > 5) {
    fieldErrors.culturalFitScore = "Điểm độ phù hợp văn hóa phải từ 1 đến 5 sao";
  }

  if (!recommendation) {
    fieldErrors.recommendation = "Vui lòng chọn khuyến nghị tuyển dụng";
  }

  if (Object.keys(fieldErrors).length > 0) {
    throw new DalError("BAD_REQUEST", {
      messageVi:
        "Dữ liệu đánh giá chưa hợp lệ. Vui lòng kiểm tra lại các trường được đánh dấu đỏ.",
      messageEn: "Invalid scorecard data. Please check the highlighted fields.",
      extra: { fieldErrors },
    });
  }

  const app = await prisma.application.findUnique({
    where: { id: Number(applicationId) },
    include: { candidate: true, job: true },
  });

  if (!app) {
    throw new DalError("NOT_FOUND", {
      messageVi: "Không tìm thấy hồ sơ ứng tuyển này",
      messageEn: "Application not found.",
    });
  }

  // BRL-08: Chuyên môn (40%) + Giao tiếp (30%) + Văn hóa (30%)
  const overallScore = Number((tech * 0.4 + comm * 0.3 + cult * 0.3).toFixed(2));
  const evaluatorId = sessionUser.id;

  const [evaluation] = await prisma.$transaction([
    prisma.evaluation.create({
      data: {
        applicationId: app.id,
        evaluatorId,
        round: round ? String(round).trim() : "Vòng 1 — Đánh giá Chuyên môn",
        technicalScore: tech,
        communicationScore: comm,
        culturalFitScore: cult,
        overallScore,
        levelRecommendation: levelRecommendation ? String(levelRecommendation).trim() : "MIDDLE",
        strengths: strengths ? String(strengths).trim() : null,
        weaknesses: weaknesses ? String(weaknesses).trim() : null,
        technicalNotes: technicalNotes ? String(technicalNotes).trim() : null,
        communicationNotes: communicationNotes ? String(communicationNotes).trim() : null,
        cultureNotes: cultureNotes ? String(cultureNotes).trim() : null,
        hireReason: hireReason ? String(hireReason).trim() : null,
        comments: comments ? String(comments).trim() : null,
        recommendation: String(recommendation || "HIRE"),
      },
      include: {
        evaluator: {
          select: { id: true, fullName: true, role: true },
        },
      },
    }),
    prisma.auditLog.create({
      data: {
        applicationId: app.id,
        userId: evaluatorId,
        fromStage: app.currentStage,
        toStage: app.currentStage,
        action: "SCORECARD_EVALUATE",
      },
    }),
  ]);

  return { evaluation, overallScore };
}
