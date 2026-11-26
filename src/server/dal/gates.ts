import "server-only";
import { validateStageTransition, type StageTransitionContext } from "@/lib/stage-rules";
import type { VerifiedSessionUser } from "./auth";
import { DalError } from "./errors";

/**
 * Tập trung kiểm tra Stage Gates (BRL-06, BRL-11, RBAC Stage Authority) tại tầng DAL.
 */
export function assertStageTransitionAllowed(
  user: VerifiedSessionUser,
  ctx: Omit<StageTransitionContext, "role">
): void {
  const result = validateStageTransition({
    ...ctx,
    role: user.role,
  });

  if (!result.allowed) {
    const code = result.statusCode === 403 ? "AUTH_FORBIDDEN" : "AUTH_VALIDATION_ERROR";
    throw new DalError(code, {
      status: result.statusCode || 400,
      messageVi: result.error,
      messageEn:
        result.statusCode === 403
          ? "You do not have permission to perform this stage transition."
          : "This stage transition does not satisfy the required criteria.",
    });
  }
}

/**
 * BRL-15 (Blind Scorecard): Xác định xem người dùng có bị ẩn phiếu đánh giá của đồng nghiệp hay không.
 */
export function shouldMaskPeerEvaluations(
  user: VerifiedSessionUser,
  evaluations: ReadonlyArray<{ evaluatorId: number }>
): boolean {
  if (user.role === "ADMIN") return false;
  if (evaluations.length === 0) return false;
  return !evaluations.some((ev) => ev.evaluatorId === user.id);
}

/**
 * BRL-15: Áp dụng bộ lọc Blind Scorecard trên một danh sách phiếu đánh giá thuộc nhiều hồ sơ khác nhau.
 * Dùng cho GET /api/scorecards kể cả khi không truyền applicationId.
 */
export function filterEvaluationsBlind<
  T extends { applicationId: number; evaluatorId: number }
>(
  user: VerifiedSessionUser,
  evaluations: readonly T[]
): {
  visibleEvaluations: T[];
  hiddenEvaluationsCount: number;
  blindScorecardLocked: boolean;
} {
  if (user.role === "ADMIN" || evaluations.length === 0) {
    return {
      visibleEvaluations: [...evaluations],
      hiddenEvaluationsCount: 0,
      blindScorecardLocked: false,
    };
  }

  // Tập hợp các applicationId mà người xem hiện tại ĐÃ tự nộp ít nhất 1 phiếu đánh giá
  const evaluatedAppIds = new Set<number>();
  for (const ev of evaluations) {
    if (ev.evaluatorId === user.id) {
      evaluatedAppIds.add(ev.applicationId);
    }
  }

  const visibleEvaluations: T[] = [];
  let hiddenEvaluationsCount = 0;

  for (const ev of evaluations) {
    if (evaluatedAppIds.has(ev.applicationId)) {
      visibleEvaluations.push(ev);
    } else {
      hiddenEvaluationsCount++;
    }
  }

  return {
    visibleEvaluations,
    hiddenEvaluationsCount,
    blindScorecardLocked: hiddenEvaluationsCount > 0,
  };
}

/**
 * BRL-15: Áp dụng Blind Scorecard trên một đối tượng Application bất kỳ có mảng `evaluations`.
 * Bảo vệ đồng nhất trên applications, profile, re-parse, interviews/schedule, talent-pool, export, pipeline.
 */
export function maskApplicationBlindScorecard<
  E extends { evaluatorId: number },
  A extends { evaluations: E[] }
>(
  user: VerifiedSessionUser,
  app: A
): A & {
  blindScorecardLocked: boolean;
  hiddenEvaluationsCount: number;
  totalEvaluationsCount: number;
} {
  const totalEvaluationsCount = app.evaluations.length;
  const locked = shouldMaskPeerEvaluations(user, app.evaluations);
  return {
    ...app,
    evaluations: locked ? [] : app.evaluations,
    blindScorecardLocked: locked,
    hiddenEvaluationsCount: locked ? totalEvaluationsCount : 0,
    totalEvaluationsCount,
  };
}

/**
 * BRL-17 (Requisition Approval): Chỉ ADMIN hoặc HIRING_MANAGER được phép phê duyệt tin tuyển dụng.
 */
export function assertCanApproveRequisition(user: VerifiedSessionUser): void {
  if (user.role !== "ADMIN" && user.role !== "HIRING_MANAGER") {
    throw new DalError("AUTH_FORBIDDEN", {
      messageVi: "Chỉ Quản lý chuyên môn hoặc Quản trị viên mới có quyền phê duyệt tin tuyển dụng.",
      messageEn: "Only Hiring Managers or Administrators can approve job requisitions.",
    });
  }
}

/**
 * BRL-17 (P0-03): Cấm HR tự kích hoạt hoặc đóng tin tuyển dụng chưa được phê duyệt.
 * Chặn tuyệt đối cả đường thẳng (DRAFT/PENDING_APPROVAL -> ACTIVE) lẫn đường vòng 2 bước
 * (DRAFT/PENDING_APPROVAL -> CLOSED -> ACTIVE) khi `approvedById == null`.
 */
export function assertCanActivateJobStatus(
  user: VerifiedSessionUser,
  existingJob: { status: string; approvedById: number | null },
  requestedStatus: string
): void {
  if (requestedStatus !== "ACTIVE") return;
  if (user.role === "ADMIN" || user.role === "HIRING_MANAGER") return;

  const isUnapproved =
    existingJob.approvedById == null ||
    existingJob.status === "DRAFT" ||
    existingJob.status === "PENDING_APPROVAL";

  if (isUnapproved) {
    throw new DalError("AUTH_FORBIDDEN", {
      messageVi:
        "Tin tuyển dụng chưa được Quản lý chuyên môn phê duyệt nên không thể tự chuyển sang trạng thái Đang mở.",
      messageEn:
        "Unapproved job requisitions cannot be activated before Hiring Manager or Administrator approval.",
    });
  }
}

export function assertCanCloseJobStatus(
  user: VerifiedSessionUser,
  existingJob: { status: string; approvedById: number | null }
): void {
  if (user.role === "ADMIN" || user.role === "HIRING_MANAGER") return;

  const isUnapproved =
    existingJob.approvedById == null ||
    existingJob.status === "DRAFT" ||
    existingJob.status === "PENDING_APPROVAL";

  if (isUnapproved) {
    throw new DalError("AUTH_FORBIDDEN", {
      messageVi:
        "Tin tuyển dụng đang chờ duyệt hoặc chưa được phê duyệt nên không thể chuyển sang trạng thái Đã đóng.",
      messageEn:
        "Unapproved or pending job requisitions cannot be closed before approval.",
    });
  }
}
