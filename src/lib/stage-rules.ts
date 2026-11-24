export type PipelineStage = "NEW" | "SCREENING" | "INTERVIEW" | "OFFER" | "HIRED" | "REJECTED";
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
  "OFFER",
  "HIRED",
  "REJECTED",
];

export const STAGE_LABELS: Record<PipelineStage, string> = {
  NEW: "Mới tiếp nhận",
  SCREENING: "Sàng lọc",
  INTERVIEW: "Phỏng vấn",
  OFFER: "Đề nghị",
  HIRED: "Tuyển chọn",
  REJECTED: "Từ chối",
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
  INTERVIEW: ["SCREENING", "OFFER", "REJECTED"],
  OFFER: ["INTERVIEW", "HIRED", "REJECTED"],
  HIRED: [], // Terminal State — Trạng thái kết thúc, không cho kéo ngược tùy tiện
  REJECTED: ["NEW", "SCREENING", "INTERVIEW", "OFFER"],
};

/**
 * Kiểm tra quyền hạn chuyển trạng thái theo vai trò (RBAC Stage Authority)
 * - HR: Chuyển tối đa đến SCREENING (NEW <-> SCREENING, NEW/SCREENING -> REJECTED, REJECTED -> NEW/SCREENING)
 *       VÀ hỗ trợ hoàn tất OFFER -> HIRED / REJECTED sau khi Hiring Manager đã duyệt sang OFFER.
 * - HIRING_MANAGER: Phụ trách từ SCREENING trở đi (SCREENING -> INTERVIEW -> OFFER -> HIRED, hoặc REJECTED).
 *       KHÔNG được chuyển hồ sơ ở vòng NEW.
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
    // Cho phép HR hoàn tất OFFER -> HIRED / REJECTED sau khi HM đã duyệt sang OFFER
    if (fromStage === "OFFER" && (toStage === "HIRED" || toStage === "REJECTED")) {
      return { authorized: true };
    }

    // HR tuyệt đối không được duyệt hồ sơ sang Phỏng vấn, Đề nghị hoặc tự nhảy sang Tuyển chọn
    if (toStage === "INTERVIEW" || toStage === "OFFER" || toStage === "HIRED") {
      return {
        authorized: false,
        rule: "RBAC-STAGE-LIMIT",
        error:
          "Chuyên viên HR chuyển hồ sơ tối đa đến vòng Sàng lọc. Quyền duyệt Phỏng vấn và Đề nghị (Offer) thuộc Quản lý chuyên môn.",
      };
    }

    // HR không được tác động/từ chối hồ sơ đang ở vòng Phỏng vấn hoặc đã Tuyển chọn
    if (fromStage === "INTERVIEW" || fromStage === "OFFER" || fromStage === "HIRED") {
      return {
        authorized: false,
        rule: "RBAC-STAGE-LIMIT",
        error:
          "Hồ sơ ở vòng Phỏng vấn hoặc Tuyển chọn thuộc thẩm quyền xử lý của Quản lý chuyên môn.",
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
          "Hồ sơ mới cần được HR sàng lọc trước khi Quản lý chuyên môn duyệt phỏng vấn.",
      };
    }

    // Hiring Manager không kéo ngược về NEW
    if (toStage === "NEW") {
      return {
        authorized: false,
        rule: "RBAC-STAGE-LIMIT",
        error:
          "Không thể chuyển hồ sơ về vòng Mới tiếp nhận. Thao tác tiếp nhận ban đầu thuộc thẩm quyền của HR.",
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
    return fromStage === "NEW" || fromStage === "SCREENING" || fromStage === "OFFER" || fromStage === "REJECTED";
  }
  if (role === "HIRING_MANAGER") {
    return fromStage === "SCREENING" || fromStage === "INTERVIEW" || fromStage === "OFFER" || fromStage === "REJECTED";
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
        "Hồ sơ này đã được xác nhận Tuyển chọn nên không thể chuyển sang giai đoạn khác.",
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
    if (from === "NEW" && (to === "INTERVIEW" || to === "OFFER" || to === "HIRED")) {
      hint = " Hồ sơ cần qua vòng Sàng lọc trước khi chuyển tiếp.";
    } else if (from === "SCREENING" && (to === "OFFER" || to === "HIRED")) {
      hint = " Hồ sơ cần qua vòng Phỏng vấn và có phiếu đánh giá trước khi gửi đề nghị hoặc tuyển chọn.";
    } else if (from === "INTERVIEW" && to === "HIRED") {
      hint = " Hồ sơ cần chuyển qua vòng Đề nghị (Offer) để thương lượng trước khi xác nhận Tuyển chọn.";
    } else if (from === "REJECTED" && to === "HIRED") {
      hint = " Vui lòng chuyển hồ sơ về vòng Phỏng vấn hoặc Đề nghị trước khi tuyển chọn.";
    }

    return {
      allowed: false,
      statusCode: 400,
      rule: "BRL-STAGE-ORDER",
      error: `Không thể chuyển trực tiếp từ ${STAGE_LABELS[from]} sang ${STAGE_LABELS[to]}.${hint}`,
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
          "Vui lòng nhập lý do từ chối (tối thiểu 5 ký tự) trước khi chuyển hồ sơ sang mục Từ chối.",
      };
    }
  }

  // RULE 5: Stage Gate Rule trước khi OFFER hoặc HIRED (BRL-06)
  if (to === "OFFER" || to === "HIRED") {
    const targetLabel = to === "OFFER" ? "gửi Đề nghị (Offer)" : "xác nhận Tuyển chọn";
    if (evaluationsCount === 0) {
      return {
        allowed: false,
        statusCode: 400,
        rule: "BRL-06",
        error: `Chưa thể ${targetLabel}: Cần có ít nhất 01 phiếu đánh giá phỏng vấn hoàn tất từ chuyên môn.`,
      };
    }

    if (hasPassingEvaluation === false) {
      return {
        allowed: false,
        statusCode: 400,
        rule: "BRL-06",
        error: `Chưa thể ${targetLabel}: Hồ sơ cần có ít nhất 01 phiếu đánh giá đạt chuẩn (Đề xuất tuyển / Tuyển ngay).`,
      };
    }
  }

  return { allowed: true };
}
