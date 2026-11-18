export type PipelineStage = "NEW" | "SCREENING" | "INTERVIEW" | "HIRED" | "REJECTED";
export type InternalRole = "ADMIN" | "HR" | "HIRING_MANAGER";

export interface StageTransitionContext {
  fromStage: string;
  toStage: string;
  role: string;
  evaluationsCount?: number;
  hasPassingEvaluation?: boolean;
  rejectionReason?: string | null;
}

export interface StageTransitionValidationResult {
  allowed: boolean;
  statusCode?: number;
  rule?: string;
  error?: string;
}

export const VALID_STAGES: PipelineStage[] = [
  "NEW",
  "SCREENING",
  "INTERVIEW",
  "HIRED",
  "REJECTED",
];

export const STAGE_LABELS: Record<PipelineStage, string> = {
  NEW: "Mới tiếp nhận (NEW)",
  SCREENING: "Sàng lọc tiêu chuẩn (SCREENING)",
  INTERVIEW: "Phỏng vấn (INTERVIEW)",
  HIRED: "Tuyển chọn (HIRED)",
  REJECTED: "Từ chối (REJECTED)",
};

export const REJECTION_REASON_PRESETS: string[] = [
  "Chưa đáp ứng kỹ năng chuyên môn cốt lõi theo JD",
  "Chưa đủ số năm kinh nghiệm tối thiểu của vị trí",
  "Chưa phù hợp định hướng công việc hoặc văn hóa đội ngũ",
  "Không đạt yêu cầu chuyên môn sau vòng phỏng vấn",
  "Mức lương kỳ vọng vượt ngân sách dự kiến của vị trí",
  "Ứng viên chủ động rút hồ sơ / Không liên hệ được",
];

/**
 * Ma trận chuyển trạng thái hợp lệ về mặt quy trình (State Machine Order)
 * Cấm nhảy cóc giai đoạn: NEW -> INTERVIEW, NEW -> HIRED, SCREENING -> HIRED, REJECTED -> HIRED
 */
export const ALLOWED_STAGE_FLOW: Record<PipelineStage, PipelineStage[]> = {
  NEW: ["SCREENING", "REJECTED"],
  SCREENING: ["NEW", "INTERVIEW", "REJECTED"],
  INTERVIEW: ["SCREENING", "HIRED", "REJECTED"],
  HIRED: [], // Terminal State — Trạng thái kết thúc, không cho kéo ngược tùy tiện
  REJECTED: ["NEW", "SCREENING", "INTERVIEW"],
};

/**
 * Kiểm tra quyền hạn chuyển trạng thái theo vai trò (RBAC Stage Authority)
 * - HR: Chuyển tối đa đến SCREENING (NEW <-> SCREENING, NEW/SCREENING -> REJECTED, REJECTED -> NEW/SCREENING).
 *       KHÔNG được phép chuyển sang INTERVIEW, HIRED hoặc thao tác hồ sơ đang ở INTERVIEW/HIRED.
 * - HIRING_MANAGER: Phụ trách từ SCREENING trở đi (SCREENING -> INTERVIEW, SCREENING/INTERVIEW -> REJECTED,
 *       INTERVIEW -> HIRED, INTERVIEW -> SCREENING, REJECTED -> INTERVIEW).
 *       KHÔNG được chuyển hồ sơ ở vòng NEW (vòng sơ loại thuộc trách nhiệm HR).
 * - ADMIN: Toàn quyền thực thi mọi chuyển đổi hợp lệ theo State Machine.
 */
export function isRoleAuthorizedForTransition(
  fromStage: PipelineStage,
  toStage: PipelineStage,
  role: string
): { authorized: boolean; error?: string; rule?: string } {
  if (role === "ADMIN") {
    return { authorized: true };
  }

  if (role === "HR") {
    // HR tuyệt đối không được chuyển hồ sơ sang Phỏng vấn hoặc Tuyển chọn
    if (toStage === "INTERVIEW" || toStage === "HIRED") {
      return {
        authorized: false,
        rule: "RBAC-STAGE-LIMIT",
        error:
          "Phân quyền HR: Chuyên viên HR chỉ được chuyển hồ sơ tối đa đến vòng Sàng lọc tiêu chuẩn (SCREENING). Quyền duyệt Phỏng vấn (INTERVIEW) và Tuyển chọn (HIRED) thuộc thẩm quyền của Quản lý chuyên môn (Hiring Manager).",
      };
    }

    // HR không được tác động/từ chối hồ sơ đã bàn giao sang vòng Phỏng vấn hoặc Tuyển chọn
    if (fromStage === "INTERVIEW" || fromStage === "HIRED") {
      return {
        authorized: false,
        rule: "RBAC-STAGE-LIMIT",
        error:
          "Phân quyền HR: Hồ sơ đã sang vòng Phỏng vấn hoặc Tuyển chọn thuộc thẩm quyền xử lý của Quản lý chuyên môn (Hiring Manager).",
      };
    }

    return { authorized: true };
  }

  if (role === "HIRING_MANAGER") {
    // Hiring Manager không can thiệp vòng NEW (để HR sàng lọc & chuẩn hóa thông tin trước)
    if (fromStage === "NEW") {
      return {
        authorized: false,
        rule: "RBAC-STAGE-LIMIT",
        error:
          "Phân quyền Hiring Manager: Hồ sơ ở vòng Mới tiếp nhận (NEW) cần được bộ phận HR kiểm tra và chuyển sang Sàng lọc tiêu chuẩn (SCREENING) trước khi Hiring Manager duyệt Phỏng vấn.",
      };
    }

    // Hiring Manager không kéo ngược về NEW
    if (toStage === "NEW") {
      return {
        authorized: false,
        rule: "RBAC-STAGE-LIMIT",
        error:
          "Phân quyền Hiring Manager: Không thể kéo hồ sơ về vòng Mới tiếp nhận (NEW). Thao tác sơ loại ban đầu thuộc thẩm quyền của bộ phận HR.",
      };
    }

    return { authorized: true };
  }

  return {
    authorized: false,
    rule: "RBAC-UNAUTHORIZED",
    error: "Tài khoản của bạn không có quyền luân chuyển trạng thái hồ sơ.",
  };
}

/**
 * Kiểm tra xem vai trò hiện tại có được phép kéo thẻ đang ở cột `fromStage` hay không (dùng cho Kanban Drag & Drop UI)
 */
export function canRoleDragFromStage(fromStage: string, role?: string | null): boolean {
  if (!role) return false;
  if (fromStage === "HIRED") return false; // Terminal state

  if (role === "ADMIN") return true;
  if (role === "HR") {
    return fromStage === "NEW" || fromStage === "SCREENING" || fromStage === "REJECTED";
  }
  if (role === "HIRING_MANAGER") {
    return fromStage === "SCREENING" || fromStage === "INTERVIEW" || fromStage === "REJECTED";
  }
  return false;
}

/**
 * Trả về danh sách các cột đích hợp lệ cho 1 vai trò từ trạng thái hiện tại
 */
export function getAllowedTargetStages(fromStage: string, role?: string | null): PipelineStage[] {
  if (!role || !VALID_STAGES.includes(fromStage as PipelineStage)) return [];
  const from = fromStage as PipelineStage;
  const flowTargets = ALLOWED_STAGE_FLOW[from] || [];

  return flowTargets.filter(
    (target) => isRoleAuthorizedForTransition(from, target, role).authorized
  );
}

/**
 * Bộ kiểm tra quy tắc chuyển trạng thái toàn diện (Single Source of Truth cho cả API & UI)
 */
export function validateStageTransition(
  ctx: StageTransitionContext
): StageTransitionValidationResult {
  const {
    fromStage,
    toStage,
    role,
    evaluationsCount = 0,
    hasPassingEvaluation,
    rejectionReason,
  } = ctx;

  if (!VALID_STAGES.includes(fromStage as PipelineStage) || !VALID_STAGES.includes(toStage as PipelineStage)) {
    return {
      allowed: false,
      statusCode: 400,
      rule: "BRL-STAGE-INVALID",
      error: `Trạng thái chuyển đổi từ "${fromStage}" sang "${toStage}" không hợp lệ.`,
    };
  }

  const from = fromStage as PipelineStage;
  const to = toStage as PipelineStage;

  if (from === to) {
    return { allowed: true };
  }

  // RULE 1: Trạng thái kết thúc HIRED (Terminal State)
  if (from === "HIRED") {
    return {
      allowed: false,
      statusCode: 400,
      rule: "BRL-STAGE-TERMINAL",
      error:
        "Quy tắc trạng thái (BRL-STAGE-TERMINAL): Hồ sơ đã ở trạng thái Tuyển chọn (HIRED — Trạng thái kết thúc), không thể tự ý chuyển sang giai đoạn khác.",
    };
  }

  // RULE 2: Kiểm tra phân quyền vai trò (RBAC Stage Authority)
  const rbacCheck = isRoleAuthorizedForTransition(from, to, role);
  if (!rbacCheck.authorized) {
    return {
      allowed: false,
      statusCode: 403,
      rule: rbacCheck.rule,
      error: rbacCheck.error,
    };
  }

  // RULE 3: Kiểm tra tuần tự State Machine (Cấm nhảy cóc giai đoạn)
  const allowedTargets = ALLOWED_STAGE_FLOW[from];
  if (!allowedTargets.includes(to)) {
    let hint = "";
    if (from === "NEW" && (to === "INTERVIEW" || to === "HIRED")) {
      hint = " Hồ sơ từ Mới tiếp nhận (NEW) bắt buộc phải qua vòng Sàng lọc tiêu chuẩn (SCREENING) trước.";
    } else if (from === "SCREENING" && to === "HIRED") {
      hint = " Hồ sơ từ Sàng lọc (SCREENING) bắt buộc phải qua vòng Phỏng vấn (INTERVIEW) và có phiếu Scorecard trước khi Tuyển chọn.";
    } else if (from === "REJECTED" && to === "HIRED") {
      hint = " Hồ sơ bị Từ chối không thể nhảy thẳng sang Tuyển chọn (HIRED).";
    }

    return {
      allowed: false,
      statusCode: 400,
      rule: "BRL-STAGE-ORDER",
      error: `Vi phạm trình tự quy trình (BRL-STAGE-ORDER): Không thể chuyển trực tiếp từ ${STAGE_LABELS[from]} sang ${STAGE_LABELS[to]}.${hint}`,
    };
  }

  // RULE 4: Bắt buộc nhập Lý do từ chối khi chuyển sang REJECTED (BRL-11)
  if (to === "REJECTED") {
    const trimmedReason = (rejectionReason || "").trim();
    if (trimmedReason.length < 5) {
      return {
        allowed: false,
        statusCode: 400,
        rule: "BRL-11",
        error:
          "Bắt buộc nhập Lý do từ chối (tối thiểu 5 ký tự) khi chuyển hồ sơ sang trạng thái Từ chối (BRL-11).",
      };
    }
  }

  // RULE 5: Stage Gate Rule trước khi HIRED (BRL-06)
  if (to === "HIRED") {
    if (evaluationsCount === 0) {
      return {
        allowed: false,
        statusCode: 400,
        rule: "BRL-06",
        error:
          "Chưa thể tuyển chọn (BRL-06): Cần có ít nhất 01 phiếu đánh giá Scorecard hoàn tất từ người phỏng vấn chuyên môn trước khi xác nhận Tuyển chọn.",
      };
    }

    if (hasPassingEvaluation === false) {
      return {
        allowed: false,
        statusCode: 400,
        rule: "BRL-06",
        error:
          "Chưa thể tuyển chọn (BRL-06): Hồ sơ cần có ít nhất 01 phiếu Scorecard với khuyến nghị đạt chuẩn (Đề xuất tuyển dụng / Tuyển dụng ngay).",
      };
    }
  }

  return { allowed: true };
}
