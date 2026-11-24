export type AiMatchTierKey = "HIGH" | "MEDIUM" | "LOW" | "PENDING";

export interface AiMatchTierInfo {
  tier: AiMatchTierKey;
  score: number | null;
  label: string;
  shortLabel: string;
  recommendation: string;
  badgeClass: string;
  barClass: string;
  panelClass: string;
  scoreTextClass: string;
  dotClass: string;
}

/**
 * Phân tầng màu sắc đánh giá độ phù hợp AI theo chuẩn 3 mức Traffic-Light của ATS doanh nghiệp
 * (Tham chiếu chuẩn thực tế: iCIMS Role Fit, Eightfold AI, Workable, Manatal, Base E-Hiring):
 * - >= 75%: Xanh lá (Phù hợp cao — Ưu tiên sàng lọc)
 * - 50% - 74%: Vàng hổ phách (Tiềm năng / Cân nhắc — Cần HR đọc kỹ)
 * - < 50%: Đỏ (Phù hợp thấp — Cảnh báo thiếu kỹ năng trọng yếu, vẫn tuân thủ Human-in-the-loop)
 */
export function getAiMatchTier(rawScore: number | null | undefined): AiMatchTierInfo {
  if (rawScore === null || rawScore === undefined || Number.isNaN(Number(rawScore))) {
    return {
      tier: "PENDING",
      score: null,
      label: "Chưa đối chiếu",
      shortLabel: "Chưa đối chiếu",
      recommendation: "Chưa hoàn tất đối chiếu tiêu chuẩn vị trí — HR có thể bấm Đối chiếu lại.",
      badgeClass: "text-zinc-500 border-transparent bg-transparent",
      barClass: "bg-zinc-300",
      panelClass: "bg-zinc-50 border-zinc-200",
      scoreTextClass: "text-zinc-600",
      dotClass: "bg-zinc-400",
    };
  }

  const score = Math.max(0, Math.min(100, Math.round(Number(rawScore))));

  if (score >= 75) {
    return {
      tier: "HIGH",
      score,
      label: "Phù hợp cao",
      shortLabel: "Phù hợp cao",
      recommendation: "Đáp ứng tốt kỹ năng cốt lõi và kinh nghiệm JD — Khuyến nghị ưu tiên sàng lọc.",
      badgeClass: "text-emerald-700 border-transparent bg-transparent",
      barClass: "bg-emerald-600",
      panelClass: "bg-zinc-50 border-zinc-200",
      scoreTextClass: "text-emerald-700",
      dotClass: "bg-emerald-600",
    };
  }

  if (score >= 50) {
    return {
      tier: "MEDIUM",
      score,
      label: "Tiềm năng / Cân nhắc",
      shortLabel: "Cân nhắc",
      recommendation: "Đáp ứng một phần tiêu chuẩn JD — Cần HR đọc kỹ hồ sơ và đánh giá tiềm năng.",
      badgeClass: "text-amber-700 border-transparent bg-transparent",
      barClass: "bg-amber-500",
      panelClass: "bg-zinc-50 border-zinc-200",
      scoreTextClass: "text-amber-700",
      dotClass: "bg-amber-500",
    };
  }

  return {
    tier: "LOW",
    score,
    label: "Phù hợp thấp",
    shortLabel: "Thấp",
    recommendation: "Thiếu nhiều kỹ năng bắt buộc hoặc chưa khớp kinh nghiệm JD — Cần cân nhắc kỹ trước khi duyệt.",
    badgeClass: "text-brand-600 border-transparent bg-transparent",
    barClass: "bg-brand-600",
    panelClass: "bg-zinc-50 border-zinc-200",
    scoreTextClass: "text-brand-600",
    dotClass: "bg-rose-500",
  };
}
