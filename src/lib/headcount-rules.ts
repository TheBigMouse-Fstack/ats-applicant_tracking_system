export interface JobHeadcountInput {
  targetHeadcount?: number | null;
  maxActiveInterviews?: number | null;
  hiredCount: number;
  activeInterviewCount: number;
  status?: string | null;
}

export interface JobHeadcountMetrics {
  targetHeadcount: number;
  configuredInterviewCap: number;
  hiredCount: number;
  activeInterviewCount: number;
  remainingSlots: number;
  effectiveInterviewCap: number;
  isHeadcountFull: boolean;
  isInterviewAtCap: boolean;
}

export interface HeadcountGateEvaluation {
  allowed: boolean;
  requiresOverride?: boolean;
  statusCode?: number;
  rule?: string;
  error?: string;
  willAutoCloseJob?: boolean;
  metrics: JobHeadcountMetrics;
}

/**
 * Tính toán các chỉ số chỉ tiêu tuyển dụng và trần phỏng vấn hiệu lực
 * - Khi tuyển được 1 người, trần phỏng vấn tự động thu hẹp theo tỷ lệ số vị trí còn trống
 *   VD: Tuyển 2 người (trần 6 PV) -> đã tuyển 1 -> còn 1 vị trí -> trần tự động co về 3 PV
 */
export function computeJobHeadcountMetrics(input: JobHeadcountInput): JobHeadcountMetrics {
  const targetHeadcount = Math.max(1, Number(input.targetHeadcount) || 1);
  const configuredInterviewCap = Math.max(
    targetHeadcount,
    Number(input.maxActiveInterviews) || targetHeadcount * 3
  );
  const hiredCount = Math.max(0, Number(input.hiredCount) || 0);
  const activeInterviewCount = Math.max(0, Number(input.activeInterviewCount) || 0);

  const remainingSlots = Math.max(0, targetHeadcount - hiredCount);
  const effectiveInterviewCap =
    remainingSlots === 0
      ? 0
      : Math.max(
          remainingSlots,
          Math.ceil((configuredInterviewCap * remainingSlots) / targetHeadcount)
        );

  return {
    targetHeadcount,
    configuredInterviewCap,
    hiredCount,
    activeInterviewCount,
    remainingSlots,
    effectiveInterviewCap,
    isHeadcountFull: remainingSlots === 0,
    isInterviewAtCap: remainingSlots > 0 && activeInterviewCount >= effectiveInterviewCap,
  };
}

/**
 * Cơ chế kiểm soát 3 lớp chống phỏng vấn dư & tự đóng tin khi đủ chỉ tiêu (BRL-13):
 * 1. Đã tuyển đủ chỉ tiêu (remainingSlots === 0): Chặn chuyển thêm sang INTERVIEW hoặc HIRED
 *    (yêu cầu mở rộng chỉ tiêu trước nếu thực sự phát sinh nhu cầu).
 * 2. Chuyển sang INTERVIEW khi đã chạm trần phỏng vấn cùng lúc (activeInterviewCount >= effectiveInterviewCap):
 *    Trả về cảnh báo mềm (409 requiresOverride) khuyên đánh giá xong đợt hiện tại, chỉ cho vượt trần khi xác nhận rõ.
 * 3. Chuyển sang HIRED và lấp đầy suất cuối cùng (hiredCount + 1 >= targetHeadcount):
 *    Đánh dấu willAutoCloseJob = true để hệ thống tự đóng tin tuyển dụng ngay lập tức.
 */
export function evaluateHeadcountGate(params: {
  jobTitle: string;
  toStage: string;
  fromStage: string;
  targetHeadcount?: number | null;
  maxActiveInterviews?: number | null;
  hiredCount: number;
  activeInterviewCount: number;
  forceOverride?: boolean;
}): HeadcountGateEvaluation {
  const metrics = computeJobHeadcountMetrics({
    targetHeadcount: params.targetHeadcount,
    maxActiveInterviews: params.maxActiveInterviews,
    hiredCount: params.hiredCount,
    activeInterviewCount: params.activeInterviewCount,
  });

  // Không áp dụng chặn chỉ tiêu cho các giai đoạn khác
  if (params.toStage !== "INTERVIEW" && params.toStage !== "HIRED") {
    return { allowed: true, metrics };
  }

  // LỚP 3A: Vị trí đã tuyển đủ chỉ tiêu
  if (metrics.isHeadcountFull) {
    return {
      allowed: false,
      statusCode: 400,
      rule: "BRL-13-FULL",
      error: `Vị trí "${params.jobTitle}" đã tuyển đủ chỉ tiêu (${metrics.hiredCount}/${metrics.targetHeadcount} nhân sự). Vui lòng tăng số lượng cần tuyển ở trang Tin tuyển dụng nếu có nhu cầu bổ sung.`,
      metrics,
    };
  }

  // LỚP 1: Trần phỏng vấn cùng lúc (WIP Cap) khi đưa thêm ứng viên vào vòng INTERVIEW
  if (params.toStage === "INTERVIEW" && params.fromStage !== "INTERVIEW") {
    if (metrics.activeInterviewCount >= metrics.effectiveInterviewCap && !params.forceOverride) {
      return {
        allowed: false,
        requiresOverride: true,
        statusCode: 409,
        rule: "BRL-13-CAP",
        error: `Vị trí "${params.jobTitle}" hiện đã đủ hạn mức phỏng vấn cùng lúc (${metrics.activeInterviewCount}/${metrics.effectiveInterviewCap} ứng viên cho ${metrics.remainingSlots} chỉ tiêu còn trống). Nên đánh giá xong đợt hiện tại trước khi mời thêm để tránh phỏng vấn dư.`,
        metrics,
      };
    }
  }

  // LỚP 3B: Nếu tuyển thêm người này là đủ chỉ tiêu -> tự động đóng tin tuyển dụng
  const willAutoCloseJob =
    params.toStage === "HIRED" &&
    params.fromStage !== "HIRED" &&
    metrics.hiredCount + 1 >= metrics.targetHeadcount;

  return {
    allowed: true,
    willAutoCloseJob,
    metrics,
  };
}
