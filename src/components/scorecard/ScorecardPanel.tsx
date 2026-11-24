"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";

interface EvaluationItem {
  id: number;
  round?: string | null;
  technicalScore: number;
  communicationScore: number;
  culturalFitScore: number;
  overallScore?: number | null;
  recommendation: string;
  levelRecommendation?: string | null;
  strengths?: string | null;
  weaknesses?: string | null;
  technicalNotes?: string | null;
  communicationNotes?: string | null;
  cultureNotes?: string | null;
  hireReason?: string | null;
  comments?: string | null;
  createdAt: string;
  evaluator?: {
    fullName?: string;
    role?: string;
  } | null;
}

interface ScorecardPanelProps {
  applicationId: number;
  candidateName: string;
  jobTitle: string;
  evaluations: EvaluationItem[];
  blindScorecardLocked?: boolean;
  hiddenEvaluationsCount?: number;
  hasPassingOverride?: boolean;
  defaultFormOpen?: boolean;
  onSuccess: () => void;
}

const LEVELS = ["TRAINEE", "JUNIOR", "MIDDLE", "SENIOR", "LEAD"] as const;

export default function ScorecardPanel({
  applicationId,
  candidateName,
  jobTitle,
  evaluations,
  blindScorecardLocked = false,
  hiddenEvaluationsCount = 0,
  hasPassingOverride,
  defaultFormOpen = false,
  onSuccess,
}: ScorecardPanelProps) {
  const { locale } = useLanguage();
  const isEn = locale === "en";

  const [showForm, setShowForm] = useState<boolean>(
    defaultFormOpen || evaluations.length === 0
  );

  useEffect(() => {
    if (defaultFormOpen) {
      setShowForm(true);
    }
  }, [defaultFormOpen]);

  const defaultRound = isEn
    ? "Round 1 — Technical & Domain Assessment"
    : "Vòng 1 — Đánh giá Kỹ thuật & Chuyên môn";

  // Form states (BRL-08)
  const [round, setRound] = useState(defaultRound);
  const [levelRecommendation, setLevelRecommendation] = useState<string>("MIDDLE");
  const [techScore, setTechScore] = useState<number>(4);
  const [commScore, setCommScore] = useState<number>(4);
  const [cultScore, setCultScore] = useState<number>(4);
  const [recommendation, setRecommendation] = useState<string>("HIRE");

  const [strengths, setStrengths] = useState<string>("");
  const [weaknesses, setWeaknesses] = useState<string>("");
  const [technicalNotes, setTechnicalNotes] = useState<string>("");
  const [communicationNotes, setCommunicationNotes] = useState<string>("");
  const [cultureNotes, setCultureNotes] = useState<string>("");
  const [hireReason, setHireReason] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Weighted overall score: Technical 40%, Communication 30%, Culture 30% (BRL-08)
  const overallScore = (techScore * 0.4 + commScore * 0.3 + cultScore * 0.3).toFixed(2);

  const avgScore =
    evaluations.length > 0
      ? (
          evaluations.reduce(
            (sum, ev) =>
              sum +
              (ev.overallScore ??
                ev.technicalScore * 0.4 +
                  ev.communicationScore * 0.3 +
                  ev.culturalFitScore * 0.3),
            0
          ) / evaluations.length
        ).toFixed(2)
      : null;

  const hasPassingScorecard =
    typeof hasPassingOverride === "boolean"
      ? hasPassingOverride
      : evaluations.some(
          (ev) => ev.recommendation === "HIRE" || ev.recommendation === "STRONG_HIRE"
        );

  const scoreLabels: Record<number, string> = isEn
    ? { 1: "Poor", 2: "Fair", 3: "Meets", 4: "Strong", 5: "Exceptional" }
    : { 1: "Yếu", 2: "Trung bình", 3: "Đạt", 4: "Tốt", 5: "Xuất sắc" };

  const recommendationOptions = [
    {
      value: "STRONG_HIRE",
      label: isEn ? "Strong Hire" : "Tuyển ngay",
      activeClass: "border-emerald-600 bg-emerald-50/70 text-emerald-800",
    },
    {
      value: "HIRE",
      label: isEn ? "Hire" : "Đề xuất tuyển",
      activeClass: "border-emerald-500 bg-emerald-50/50 text-emerald-700",
    },
    {
      value: "NO_HIRE",
      label: isEn ? "No Hire" : "Chưa đạt",
      activeClass: "border-amber-500 bg-amber-50/60 text-amber-800",
    },
    {
      value: "STRONG_NO_HIRE",
      label: isEn ? "Strong No Hire" : "Không phù hợp",
      activeClass: "border-brand-600 bg-rose-50/60 text-brand-700",
    },
  ];

  const getRecommendationDisplay = (rec: string) => {
    switch (rec) {
      case "STRONG_HIRE":
        return {
          label: isEn ? "Strong Hire" : "Tuyển ngay",
          colorClass: "text-emerald-700",
        };
      case "HIRE":
        return {
          label: isEn ? "Hire" : "Đề xuất tuyển",
          colorClass: "text-emerald-600",
        };
      case "NO_HIRE":
        return {
          label: isEn ? "No Hire" : "Chưa đạt",
          colorClass: "text-amber-700",
        };
      default:
        return {
          label: isEn ? "Strong No Hire" : "Không phù hợp",
          colorClass: "text-brand-600",
        };
    }
  };

  const resetForm = () => {
    setRound(defaultRound);
    setLevelRecommendation("MIDDLE");
    setTechScore(4);
    setCommScore(4);
    setCultScore(4);
    setRecommendation("HIRE");
    setStrengths("");
    setWeaknesses("");
    setTechnicalNotes("");
    setCommunicationNotes("");
    setCultureNotes("");
    setHireReason("");
    setFieldErrors({});
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setFieldErrors({});

    const errors: Record<string, string> = {};
    if (!techScore || techScore < 1 || techScore > 5) {
      errors.techScore = isEn ? "Select a score from 1 to 5" : "Chọn điểm từ 1 đến 5";
    }
    if (!commScore || commScore < 1 || commScore > 5) {
      errors.commScore = isEn ? "Select a score from 1 to 5" : "Chọn điểm từ 1 đến 5";
    }
    if (!cultScore || cultScore < 1 || cultScore > 5) {
      errors.cultScore = isEn ? "Select a score from 1 to 5" : "Chọn điểm từ 1 đến 5";
    }
    if (!recommendation) {
      errors.recommendation = isEn ? "Select a recommendation" : "Chọn khuyến nghị tuyển dụng";
    }
    if (
      !strengths.trim() &&
      (recommendation === "HIRE" || recommendation === "STRONG_HIRE")
    ) {
      errors.strengths = isEn
        ? "Please note at least one key strength to support a Hire decision."
        : "Vui lòng nêu ít nhất 1 điểm mạnh làm căn cứ đề xuất tuyển.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError(
        isEn
          ? "Please complete the required evaluation fields."
          : "Vui lòng hoàn thiện các trường đánh giá bắt buộc."
      );
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/scorecards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId,
          round,
          levelRecommendation,
          technicalScore: techScore,
          communicationScore: commScore,
          culturalFitScore: cultScore,
          recommendation,
          strengths,
          weaknesses,
          technicalNotes,
          communicationNotes,
          cultureNotes,
          hireReason: hireReason.trim() || undefined,
          comments: hireReason.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        if (json.fieldErrors) setFieldErrors(json.fieldErrors);
        setError(json.error || (isEn ? "Could not save scorecard." : "Không thể lưu phiếu đánh giá."));
      } else {
        setSuccessMsg(
          isEn ? "Scorecard submitted successfully." : "Đã lưu phiếu đánh giá thành công."
        );
        resetForm();
        setShowForm(false);
        onSuccess();
      }
    } catch {
      setError(
        isEn ? "Connection error while saving scorecard." : "Lỗi kết nối khi lưu phiếu đánh giá."
      );
    } finally {
      setLoading(false);
    }
  };

  const renderCompetencyRow = ({
    label,
    weight,
    value,
    onChange,
    notes,
    onNotesChange,
    placeholder,
    fieldKey,
  }: {
    label: string;
    weight: string;
    value: number;
    onChange: (val: number) => void;
    notes: string;
    onNotesChange: (val: string) => void;
    placeholder: string;
    fieldKey: string;
  }) => (
    <div className="py-3.5 first:pt-0 last:pb-0 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="text-xs font-semibold text-zinc-900">{label}</span>
          <span className="ml-2 text-[11px] text-zinc-400 tabular-nums">{weight}</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-md border border-zinc-200 overflow-hidden bg-white">
            {[1, 2, 3, 4, 5].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => {
                  onChange(num);
                  if (fieldErrors[fieldKey]) {
                    const next = { ...fieldErrors };
                    delete next[fieldKey];
                    setFieldErrors(next);
                  }
                }}
                className={`w-8 h-7 text-xs font-semibold tabular-nums transition-colors cursor-pointer border-r last:border-r-0 border-zinc-200 ${
                  value === num
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-600 hover:bg-zinc-100"
                }`}
              >
                {num}
              </button>
            ))}
          </div>
          <span className="text-[11px] font-medium text-zinc-500 w-20 text-right">
            {scoreLabels[value]}
          </span>
        </div>
      </div>

      <input
        type="text"
        value={notes}
        onChange={(e) => onNotesChange(e.target.value)}
        placeholder={placeholder}
        className="w-full text-xs rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400"
      />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* 1. SUMMARY HEADER (Flat, No Pills, No Purple, No Avatars) */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-200">
        <div className="space-y-1 min-w-0">
          <p className="text-xs text-zinc-500 truncate">
            {candidateName} · {jobTitle}
          </p>
          <p
            className={`text-xs font-semibold ${
              hasPassingScorecard ? "text-emerald-700" : "text-amber-700"
            }`}
          >
            {hasPassingScorecard
              ? isEn
                ? "Qualified for Hiring Decision"
                : "Đủ điều kiện Tuyển chọn"
              : isEn
              ? "Requires at least 1 passing scorecard before Hiring"
              : "Cần tối thiểu 1 phiếu đạt chuẩn trước khi Tuyển chọn"}
          </p>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          {avgScore && (
            <div className="text-right pr-4 border-r border-zinc-200">
              <span className="block text-[11px] text-zinc-500">
                {isEn
                  ? `Average (${evaluations.length})`
                  : `Điểm TB (${evaluations.length} phiếu)`}
              </span>
              <span className="text-base font-bold text-zinc-900 tabular-nums">
                {avgScore}
                <span className="text-xs font-normal text-zinc-400"> / 5.0</span>
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              setShowForm((prev) => !prev);
              setSuccessMsg(null);
            }}
            className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
              showForm
                ? "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
                : "bg-brand-600 hover:bg-brand-700 text-white"
            }`}
          >
            {showForm
              ? isEn
                ? "Close Form"
                : "Đóng biểu mẫu"
              : isEn
              ? "New Scorecard"
              : "Tạo phiếu đánh giá"}
          </button>
        </div>
      </div>

      {/* Inline feedback message */}
      {successMsg && (
        <div className="px-4 py-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200 border-l-2 border-l-emerald-600 text-xs text-emerald-900">
          {successMsg}
        </div>
      )}

      {/* 2. STRUCTURED SCORECARD FORM */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg border border-zinc-200 p-5 space-y-5"
        >
          <div className="flex items-baseline justify-between gap-2 pb-3 border-b border-zinc-100">
            <h3 className="text-sm font-semibold text-zinc-900">
              {isEn ? "New Interview Scorecard" : "Phiếu đánh giá phỏng vấn mới"}
            </h3>
            <span className="text-[11px] text-zinc-400">
              {isEn
                ? "Technical 40% · Communication 30% · Culture 30%"
                : "Chuyên môn 40% · Giao tiếp 30% · Văn hóa 30%"}
            </span>
          </div>

          {error && (
            <div className="px-3.5 py-2.5 rounded-md bg-rose-50/70 border border-rose-200 border-l-2 border-l-brand-600 text-xs text-rose-800">
              {error}
            </div>
          )}

          {/* Round & Level */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                {isEn ? "Interview Round" : "Vòng phỏng vấn"}
              </label>
              <select
                value={round}
                onChange={(e) => setRound(e.target.value)}
                className="w-full text-xs rounded-md border border-zinc-200 bg-white py-2 px-3 text-zinc-800 focus:outline-none focus:border-zinc-400"
              >
                <option value={isEn ? "Round 1 — Technical & Domain Assessment" : "Vòng 1 — Đánh giá Kỹ thuật & Chuyên môn"}>
                  {isEn ? "Round 1 — Technical & Domain" : "Vòng 1 — Kỹ thuật & Chuyên môn"}
                </option>
                <option value={isEn ? "Round 2 — Culture & Management" : "Vòng 2 — Văn hóa & Quản lý"}>
                  {isEn ? "Round 2 — Culture & Management" : "Vòng 2 — Văn hóa & Quản lý"}
                </option>
                <option value={isEn ? "Final Panel Review" : "Vòng Tổng hợp — Hội đồng"}>
                  {isEn ? "Final Panel Review" : "Vòng Tổng hợp — Hội đồng"}
                </option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                {isEn ? "Recommended Level" : "Cấp bậc đề xuất"}
              </label>
              <div className="grid grid-cols-5 rounded-md border border-zinc-200 overflow-hidden bg-white">
                {LEVELS.map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setLevelRecommendation(lvl)}
                    className={`py-2 text-[11px] font-medium border-r last:border-r-0 border-zinc-200 transition-colors cursor-pointer ${
                      levelRecommendation === lvl
                        ? "bg-zinc-900 text-white"
                        : "text-zinc-600 hover:bg-zinc-50"
                    }`}
                  >
                    {lvl.charAt(0) + lvl.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 3 Weighted Competencies */}
          <div className="divide-y divide-zinc-100 border-y border-zinc-100 py-1">
            {renderCompetencyRow({
              label: isEn ? "Technical & Domain" : "Kỹ năng chuyên môn",
              weight: "40%",
              value: techScore,
              onChange: setTechScore,
              notes: technicalNotes,
              onNotesChange: setTechnicalNotes,
              placeholder: isEn
                ? "Optional note on technical depth..."
                : "Ghi chú ngắn về chuyên môn (không bắt buộc)...",
              fieldKey: "techScore",
            })}
            {renderCompetencyRow({
              label: isEn ? "Communication" : "Giao tiếp & Trình bày",
              weight: "30%",
              value: commScore,
              onChange: setCommScore,
              notes: communicationNotes,
              onNotesChange: setCommunicationNotes,
              placeholder: isEn
                ? "Optional note on clarity & structure..."
                : "Ghi chú ngắn về giao tiếp (không bắt buộc)...",
              fieldKey: "commScore",
            })}
            {renderCompetencyRow({
              label: isEn ? "Culture & Collaboration" : "Phù hợp văn hóa & Teamwork",
              weight: "30%",
              value: cultScore,
              onChange: setCultScore,
              notes: cultureNotes,
              onNotesChange: setCultureNotes,
              placeholder: isEn
                ? "Optional note on teamwork & alignment..."
                : "Ghi chú ngắn về văn hóa (không bắt buộc)...",
              fieldKey: "cultScore",
            })}
          </div>

          {/* Live Weighted Score + Recommendation */}
          <div className="space-y-2.5">
            <div className="flex items-baseline justify-between">
              <label className="text-xs font-medium text-zinc-700">
                {isEn ? "Hiring Recommendation" : "Khuyến nghị tuyển dụng"}{" "}
                <span className="text-brand-600">*</span>
              </label>
              <div className="text-xs text-zinc-500">
                {isEn ? "Weighted score: " : "Điểm tổng hợp: "}
                <strong className="text-sm font-bold text-zinc-900 tabular-nums">
                  {overallScore}
                </strong>
                <span className="text-zinc-400"> / 5.00</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {recommendationOptions.map((opt) => {
                const isSelected = recommendation === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRecommendation(opt.value)}
                    className={`py-2 px-3 rounded-md border text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      isSelected
                        ? opt.activeClass
                        : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Key Feedback */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                {isEn ? "Key Strengths" : "Điểm mạnh nổi bật"}{" "}
                {(recommendation === "HIRE" || recommendation === "STRONG_HIRE") && (
                  <span className="text-brand-600">*</span>
                )}
              </label>
              <textarea
                rows={2}
                value={strengths}
                onChange={(e) => setStrengths(e.target.value)}
                placeholder={
                  isEn
                    ? "Evidence supporting this candidate..."
                    : "Căn cứ nổi bật từ buổi phỏng vấn..."
                }
                className={`w-full text-xs rounded-md border ${
                  fieldErrors.strengths ? "border-brand-600 bg-rose-50/20" : "border-zinc-200 bg-white"
                } p-2.5 text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400`}
              />
              {fieldErrors.strengths && (
                <p className="text-[11px] text-brand-600 mt-1">{fieldErrors.strengths}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                {isEn ? "Areas of Concern" : "Điểm cần lưu ý / Đào tạo thêm"}
              </label>
              <textarea
                rows={2}
                value={weaknesses}
                onChange={(e) => setWeaknesses(e.target.value)}
                placeholder={
                  isEn
                    ? "Gaps or risks to consider..."
                    : "Điểm còn thiếu hoặc cần bổ sung..."
                }
                className="w-full text-xs rounded-md border border-zinc-200 bg-white p-2.5 text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">
              {isEn ? "Final Summary" : "Kết luận chung"}
            </label>
            <textarea
              rows={2}
              value={hireReason}
              onChange={(e) => setHireReason(e.target.value)}
              placeholder={
                isEn
                  ? "Concise decision rationale (optional)..."
                  : "Tóm tắt ngắn gọn quyết định (không bắt buộc)..."
              }
              className="w-full text-xs rounded-md border border-zinc-200 bg-white p-2.5 text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-100">
            {evaluations.length > 0 && (
              <button
                type="button"
                onClick={() => setShowForm(false)}
                disabled={loading}
                className="px-3.5 py-2 text-xs font-medium text-zinc-600 hover:text-zinc-900 cursor-pointer whitespace-nowrap"
              >
                {isEn ? "Cancel" : "Hủy"}
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-medium text-white bg-brand-600 hover:bg-brand-700 disabled:bg-brand-300 rounded-lg inline-flex items-center gap-2 cursor-pointer whitespace-nowrap"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>
                {loading
                  ? isEn
                    ? "Saving..."
                    : "Đang lưu..."
                  : isEn
                  ? "Submit Scorecard"
                  : "Lưu phiếu đánh giá"}
              </span>
            </button>
          </div>
        </form>
      )}

      {/* 3. SUBMITTED SCORECARDS LIST */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
          {isEn
            ? `Submitted Scorecards (${blindScorecardLocked ? hiddenEvaluationsCount : evaluations.length})`
            : `Phiếu đánh giá đã nộp (${blindScorecardLocked ? hiddenEvaluationsCount : evaluations.length})`}
        </h4>

        {blindScorecardLocked ? (
          <div className="px-4 py-4 rounded-lg border border-zinc-200 border-l-2 border-l-brand-600 bg-zinc-50/70 text-xs space-y-1">
            <p className="font-semibold text-zinc-900">
              {isEn
                ? `Blind Evaluation Active (${hiddenEvaluationsCount} submitted)`
                : `Đánh giá độc lập đang bật (${hiddenEvaluationsCount} phiếu đã nộp)`}
            </p>
            <p className="text-zinc-600 leading-relaxed">
              {isEn
                ? "To prevent anchoring bias, other interviewers' scores remain hidden until you submit your own scorecard above."
                : "Để tránh thiên kiến mỏ neo, điểm số và nhận xét của các giám khảo khác sẽ hiển thị ngay sau khi bạn hoàn tất và nộp phiếu đánh giá của mình."}
            </p>
          </div>
        ) : evaluations.length === 0 ? (
          <div className="py-8 px-4 rounded-lg border border-dashed border-zinc-200 text-center text-xs text-zinc-500">
            {isEn
              ? "No scorecards submitted yet."
              : "Chưa có phiếu đánh giá nào cho ứng viên này."}
          </div>
        ) : (
          <div className="space-y-3">
            {evaluations.map((ev) => {
              const recDisplay = getRecommendationDisplay(ev.recommendation);
              const computedOverall =
                ev.overallScore ??
                ev.technicalScore * 0.4 +
                  ev.communicationScore * 0.3 +
                  ev.culturalFitScore * 0.3;

              return (
                <div
                  key={ev.id}
                  className="p-5 rounded-lg border border-zinc-200 bg-white space-y-4 text-xs"
                >
                  {/* Top row: Evaluator & Decision */}
                  <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-zinc-100">
                    <div className="space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-zinc-900 text-sm">
                          {ev.evaluator?.fullName || (isEn ? "Interviewer" : "Người phỏng vấn")}
                        </span>
                        <span className="text-[11px] text-zinc-400">
                          {ev.evaluator?.role === "HIRING_MANAGER"
                            ? "Hiring Manager"
                            : ev.evaluator?.role === "ADMIN"
                            ? "Admin"
                            : "HR"}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500">
                        {ev.round || (isEn ? "Round 1" : "Vòng 1")} ·{" "}
                        {formatDateTime(ev.createdAt)}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      {ev.levelRecommendation && (
                        <span className="text-[11px] font-medium text-zinc-500">
                          {ev.levelRecommendation}
                        </span>
                      )}
                      <span className={`font-semibold whitespace-nowrap ${recDisplay.colorClass}`}>
                        {recDisplay.label}
                      </span>
                      <span className="text-sm font-bold text-zinc-900 tabular-nums">
                        {computedOverall.toFixed(2)}
                        <span className="text-[11px] font-normal text-zinc-400"> / 5.0</span>
                      </span>
                    </div>
                  </div>

                  {/* 3-Column Metric Breakdown (Flat, Hairline Dividers) */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-zinc-200 bg-zinc-50/70 rounded-md py-2.5">
                    <div className="px-3 py-1 sm:py-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-[11px] text-zinc-500">
                          {isEn ? "Technical (40%)" : "Chuyên môn (40%)"}
                        </span>
                        <strong className="text-zinc-900 tabular-nums">{ev.technicalScore}/5</strong>
                      </div>
                      {ev.technicalNotes && (
                        <p className="text-[11px] text-zinc-600 mt-1 leading-relaxed">
                          {ev.technicalNotes}
                        </p>
                      )}
                    </div>

                    <div className="px-3 py-1 sm:py-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-[11px] text-zinc-500">
                          {isEn ? "Communication (30%)" : "Giao tiếp (30%)"}
                        </span>
                        <strong className="text-zinc-900 tabular-nums">
                          {ev.communicationScore}/5
                        </strong>
                      </div>
                      {ev.communicationNotes && (
                        <p className="text-[11px] text-zinc-600 mt-1 leading-relaxed">
                          {ev.communicationNotes}
                        </p>
                      )}
                    </div>

                    <div className="px-3 py-1 sm:py-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-[11px] text-zinc-500">
                          {isEn ? "Culture (30%)" : "Văn hóa (30%)"}
                        </span>
                        <strong className="text-zinc-900 tabular-nums">
                          {ev.culturalFitScore}/5
                        </strong>
                      </div>
                      {ev.cultureNotes && (
                        <p className="text-[11px] text-zinc-600 mt-1 leading-relaxed">
                          {ev.cultureNotes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Structured Feedback (Left-border accents, no colored boxes) */}
                  {(ev.strengths || ev.weaknesses || ev.hireReason || ev.comments) && (
                    <div className="space-y-2.5 pt-1">
                      {ev.strengths && (
                        <div className="border-l-2 border-emerald-500 pl-3 space-y-0.5">
                          <span className="text-[11px] font-semibold text-zinc-500">
                            {isEn ? "Key Strengths" : "Điểm mạnh nổi bật"}
                          </span>
                          <p className="text-zinc-800 leading-relaxed">{ev.strengths}</p>
                        </div>
                      )}

                      {ev.weaknesses && (
                        <div className="border-l-2 border-amber-500 pl-3 space-y-0.5">
                          <span className="text-[11px] font-semibold text-zinc-500">
                            {isEn ? "Areas of Concern" : "Điểm cần lưu ý"}
                          </span>
                          <p className="text-zinc-800 leading-relaxed">{ev.weaknesses}</p>
                        </div>
                      )}

                      {(ev.hireReason || ev.comments) &&
                        (ev.hireReason || ev.comments) !== ev.strengths && (
                          <div className="border-l-2 border-zinc-300 pl-3 space-y-0.5">
                            <span className="text-[11px] font-semibold text-zinc-500">
                              {isEn ? "Final Summary" : "Kết luận chung"}
                            </span>
                            <p className="text-zinc-700 leading-relaxed">
                              {ev.hireReason || ev.comments}
                            </p>
                          </div>
                        )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
