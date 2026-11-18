"use client";

import { useState, useEffect } from "react";
import {
  Star,
  Award,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ThumbsUp,
  AlertTriangle,
  Layers,
  FileText,
  Plus,
  ChevronUp,
  ShieldCheck,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";

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
  defaultFormOpen?: boolean;
  onSuccess: () => void;
}

export default function ScorecardPanel({
  applicationId,
  candidateName,
  jobTitle,
  evaluations,
  defaultFormOpen = false,
  onSuccess,
}: ScorecardPanelProps) {
  const [showForm, setShowForm] = useState<boolean>(
    defaultFormOpen || evaluations.length === 0
  );

  useEffect(() => {
    if (defaultFormOpen) {
      setShowForm(true);
    }
  }, [defaultFormOpen]);

  // Form states (BRL-08)
  const [round, setRound] = useState("Vòng 1 — Đánh giá Kỹ thuật & Chuyên môn");
  const [levelRecommendation, setLevelRecommendation] = useState("MIDDLE");
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

  // Tính điểm tổng hợp có trọng số: Chuyên môn 40%, Giao tiếp 30%, Văn hóa 30% (BRL-08)
  const overallScore = (techScore * 0.4 + commScore * 0.3 + cultScore * 0.3).toFixed(2);

  // Thống kê tổng hợp các phiếu đã nộp
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

  const hasPassingScorecard = evaluations.some(
    (ev) => ev.recommendation === "HIRE" || ev.recommendation === "STRONG_HIRE"
  );

  const resetForm = () => {
    setRound("Vòng 1 — Đánh giá Kỹ thuật & Chuyên môn");
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
      errors.techScore = "Vui lòng cho điểm chuyên môn từ 1 đến 5 sao";
    }
    if (!commScore || commScore < 1 || commScore > 5) {
      errors.commScore = "Vui lòng cho điểm giao tiếp từ 1 đến 5 sao";
    }
    if (!cultScore || cultScore < 1 || cultScore > 5) {
      errors.cultScore = "Vui lòng cho điểm văn hóa từ 1 đến 5 sao";
    }
    if (!recommendation) {
      errors.recommendation = "Vui lòng chọn khuyến nghị tuyển dụng";
    }
    if (
      !strengths.trim() &&
      (recommendation === "HIRE" || recommendation === "STRONG_HIRE")
    ) {
      errors.strengths =
        "Vui lòng nêu ít nhất 1 điểm mạnh làm căn cứ tuyển dụng ứng viên này";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError("Vui lòng hoàn thiện các tiêu chí đánh giá bắt buộc.");
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
          hireReason: hireReason || strengths,
          comments: hireReason || strengths,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        if (json.fieldErrors) setFieldErrors(json.fieldErrors);
        setError(json.error || "Không thể lưu phiếu đánh giá");
      } else {
        setSuccessMsg("Đã lưu phiếu đánh giá phỏng vấn thành công!");
        resetForm();
        setShowForm(false);
        onSuccess();
      }
    } catch {
      setError("Lỗi kết nối máy chủ khi lưu phiếu đánh giá.");
    } finally {
      setLoading(false);
    }
  };

  const renderStarButtons = (
    value: number,
    onChange: (val: number) => void,
    fieldKey: string
  ) => (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => {
            onChange(star);
            if (fieldErrors[fieldKey]) {
              const next = { ...fieldErrors };
              delete next[fieldKey];
              setFieldErrors(next);
            }
          }}
          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs transition-all cursor-pointer ${
            star <= value
              ? "bg-amber-500 text-white shadow-xs scale-105"
              : "bg-slate-100 text-slate-400 hover:bg-slate-200"
          }`}
        >
          <Star className={`w-4 h-4 ${star <= value ? "fill-white" : ""}`} />
        </button>
      ))}
      <span className="text-xs font-bold text-slate-700 ml-2">{value}/5 sao</span>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* 1. THANH TỔNG HỢP ĐIỂM & TRẠNG THÁI CHỐT CHẶN BRL-06 */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            {hasPassingScorecard ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5" />
                Đủ điều kiện Tuyển chọn
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[11px] font-semibold border border-amber-200">
                <AlertTriangle className="w-3.5 h-3.5" />
                Cần phiếu đạt chuẩn trước khi Tuyển chọn
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">
            {candidateName} &bull; {jobTitle}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {avgScore && (
            <div className="text-right px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200">
              <span className="block text-[10px] font-bold text-purple-600 uppercase">
                Điểm TB ({evaluations.length} phiếu)
              </span>
              <span className="text-lg font-black text-purple-800">{avgScore}/5.0★</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              setShowForm((prev) => !prev);
              setSuccessMsg(null);
            }}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer ${
              showForm
                ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                : "bg-purple-600 hover:bg-purple-700 text-white"
            }`}
          >
            {showForm ? (
              <>
                <ChevronUp className="w-4 h-4" />
                <span>Thu gọn biểu mẫu</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Tạo phiếu đánh giá</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Thông báo thành công */}
      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 2. BIỂU MẪU CHẤM ĐIỂM TRỰC TIẾP TRONG TAB (INLINE — KHÔNG CÒN POPUP MODAL) */}
      {showForm && (
        <div className="bg-white rounded-2xl border-2 border-purple-200/80 p-5 sm:p-6 shadow-sm space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">
              Nhập Phiếu Đánh Giá Phỏng Vấn Mới
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Cách tính điểm: Chuyên môn 40% • Giao tiếp 30% • Văn hóa 30%
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-300 rounded-xl p-3 text-red-900 flex items-start gap-2.5 text-xs">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <p className="font-semibold">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Vòng phỏng vấn & Level */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/70">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Vòng Phỏng Vấn <span className="text-red-500">*</span>
                </label>
                <select
                  value={round}
                  onChange={(e) => setRound(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 bg-white py-2 px-3 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="Vòng 1 — Đánh giá Kỹ thuật & Chuyên môn">
                    Vòng 1 — Đánh giá Kỹ thuật &amp; Chuyên môn
                  </option>
                  <option value="Vòng 2 — Phỏng vấn Văn hóa & Quản lý">
                    Vòng 2 — Phỏng vấn Văn hóa &amp; Quản lý
                  </option>
                  <option value="Vòng Tổng hợp — Hội đồng Phỏng vấn">
                    Vòng Tổng hợp — Hội đồng Phỏng vấn
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Khuyến Nghị Cấp Bậc (Level)
                </label>
                <select
                  value={levelRecommendation}
                  onChange={(e) => setLevelRecommendation(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 bg-white py-2 px-3 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="TRAINEE">Trainee / Thực tập sinh</option>
                  <option value="JUNIOR">Junior</option>
                  <option value="MIDDLE">Middle</option>
                  <option value="SENIOR">Senior</option>
                  <option value="LEAD">Lead / Principal</option>
                </select>
              </div>
            </div>

            {/* 3 Tiêu chí đánh giá năng lực */}
            <div className="space-y-3 bg-slate-50/40 p-4 rounded-xl border border-slate-200/80">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-purple-600" />
                Tiêu Chí Đánh Giá Năng Lực
              </h4>

              <div className="pt-1">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  1. Kỹ năng chuyên môn kỹ thuật (Trọng số 40%)
                </label>
                {renderStarButtons(techScore, setTechScore, "techScore")}
                <input
                  type="text"
                  value={technicalNotes}
                  onChange={(e) => setTechnicalNotes(e.target.value)}
                  placeholder="Nhận xét chuyên môn: Kiến trúc, nghiệp vụ, bài test thực tế..."
                  className="mt-1.5 w-full text-xs rounded-xl border border-slate-200 bg-white py-2 px-3 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="pt-2.5 border-t border-slate-200/70">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  2. Kỹ năng giao tiếp &amp; thuyết trình (Trọng số 30%)
                </label>
                {renderStarButtons(commScore, setCommScore, "commScore")}
                <input
                  type="text"
                  value={communicationNotes}
                  onChange={(e) => setCommunicationNotes(e.target.value)}
                  placeholder="Nhận xét giao tiếp: Diễn đạt mạch lạc, phản biện, ngoại ngữ..."
                  className="mt-1.5 w-full text-xs rounded-xl border border-slate-200 bg-white py-2 px-3 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="pt-2.5 border-t border-slate-200/70">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  3. Độ phù hợp văn hóa &amp; làm việc nhóm (Trọng số 30%)
                </label>
                {renderStarButtons(cultScore, setCultScore, "cultScore")}
                <input
                  type="text"
                  value={cultureNotes}
                  onChange={(e) => setCultureNotes(e.target.value)}
                  placeholder="Nhận xét văn hóa: Thái độ cầu thị, chủ động, kỷ luật đội ngũ..."
                  className="mt-1.5 w-full text-xs rounded-xl border border-slate-200 bg-white py-2 px-3 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Điểm tổng hợp tự tính + Khuyến nghị */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-purple-900 uppercase block">
                    Điểm Tổng Hợp
                  </span>
                  <span className="text-[10px] text-purple-600 block">
                    40% CM + 30% GT + 30% VH
                  </span>
                </div>
                <div>
                  <span className="text-2xl font-black text-purple-700">
                    {overallScore}
                  </span>
                  <span className="text-xs font-bold text-purple-500"> / 5.0★</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Khuyến Nghị Tuyển Dụng <span className="text-red-500">*</span>
                </label>
                <select
                  value={recommendation}
                  onChange={(e) => setRecommendation(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 bg-white py-2.5 px-3 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="STRONG_HIRE">🌟 Xuất sắc — Tuyển ngay (Strong Hire)</option>
                  <option value="HIRE">✅ Đạt chuẩn — Đề xuất tuyển (Hire)</option>
                  <option value="NO_HIRE">⚠️ Chưa đạt — Cân nhắc loại (No Hire)</option>
                  <option value="STRONG_NO_HIRE">⛔ Không phù hợp (Strong No Hire)</option>
                </select>
              </div>
            </div>

            {/* Căn cứ điểm mạnh */}
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <ThumbsUp className="w-3.5 h-3.5 text-emerald-600" />
                <span>Lý do Đạt / Điểm mạnh nổi bật (Căn cứ quyết định)</span>
                <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={2}
                value={strengths}
                onChange={(e) => setStrengths(e.target.value)}
                placeholder="VD: Nắm chắc chuyên môn, phân tích bài toán mạch lạc, giải quyết tốt tình huống thực tế..."
                className={`w-full text-xs rounded-xl border ${
                  fieldErrors.strengths
                    ? "border-red-400 bg-red-50/20"
                    : "border-slate-200 bg-slate-50/50"
                } p-2.5 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500`}
              />
              {fieldErrors.strengths && (
                <p className="text-[11px] text-red-600 font-medium mt-1">
                  {fieldErrors.strengths}
                </p>
              )}
            </div>

            {/* Điểm cần lưu ý & Kết luận */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Điểm cần lưu ý / Đào tạo thêm</span>
                </label>
                <textarea
                  rows={2}
                  value={weaknesses}
                  onChange={(e) => setWeaknesses(e.target.value)}
                  placeholder="VD: Cần bổ sung thêm quy trình CI/CD trong thời gian thử việc..."
                  className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>Tóm tắt kết luận Giám khảo</span>
                </label>
                <textarea
                  rows={2}
                  value={hireReason}
                  onChange={(e) => setHireReason(e.target.value)}
                  placeholder="Tóm tắt ngắn gọn căn cứ chốt tuyển hoặc từ chối..."
                  className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              {evaluations.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  disabled={loading}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Hủy bỏ
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 rounded-xl shadow-sm flex items-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang lưu phiếu...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Lưu Phiếu Đánh Giá</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. DANH SÁCH PHIẾU ĐÁNH GIÁ ĐÃ NỘP */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
          <Star className="w-4 h-4 text-purple-600 fill-purple-600" />
          Danh Sách Phiếu Đánh Giá Đã Nộp ({evaluations.length})
        </h4>

        {evaluations.length === 0 ? (
          <div className="p-6 rounded-2xl border border-dashed border-slate-200 bg-white text-center text-xs text-slate-500">
            Chưa có phiếu đánh giá nào được ghi nhận cho ứng viên này. Hãy hoàn thiện biểu mẫu ở trên để lưu phiếu đánh giá đầu tiên.
          </div>
        ) : (
          evaluations.map((ev) => (
            <div
              key={ev.id}
              className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-white space-y-3 text-xs shadow-2xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    {ev.evaluator?.fullName?.charAt(0) || "G"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">
                        {ev.evaluator?.fullName || "Chuyên gia phỏng vấn"}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                        {ev.evaluator?.role === "HIRING_MANAGER"
                          ? "Hiring Manager"
                          : ev.evaluator?.role === "ADMIN"
                          ? "Admin"
                          : "Ban Giám Khảo"}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium block mt-0.5">
                      {ev.round || "Vòng 1 — Đánh giá Chuyên môn"} &bull;{" "}
                      {formatDateTime(ev.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {ev.levelRecommendation && (
                    <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-200">
                      Level: {ev.levelRecommendation}
                    </span>
                  )}
                  <span
                    className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] border ${
                      ev.recommendation === "STRONG_HIRE" || ev.recommendation === "HIRE"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                        : "bg-rose-50 text-rose-700 border-rose-300"
                    }`}
                  >
                    {ev.recommendation === "STRONG_HIRE"
                      ? "🌟 Xuất sắc"
                      : ev.recommendation === "HIRE"
                      ? "✅ Đạt chuẩn"
                      : "⚠️ Chưa đạt"}
                  </span>
                  <span className="font-extrabold text-purple-700 text-sm px-2.5 py-0.5 bg-purple-50 rounded-lg border border-purple-200">
                    {ev.overallScore ? `${ev.overallScore.toFixed(2)}/5.0★` : "—"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 py-2 border-y border-slate-100 text-[11px]">
                <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-slate-500 block">Chuyên môn (40%)</span>
                  <strong className="text-slate-900 text-xs">{ev.technicalScore}/5★</strong>
                  {ev.technicalNotes && (
                    <p className="text-slate-600 mt-1 leading-relaxed">{ev.technicalNotes}</p>
                  )}
                </div>
                <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-slate-500 block">Giao tiếp (30%)</span>
                  <strong className="text-slate-900 text-xs">{ev.communicationScore}/5★</strong>
                  {ev.communicationNotes && (
                    <p className="text-slate-600 mt-1 leading-relaxed">
                      {ev.communicationNotes}
                    </p>
                  )}
                </div>
                <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-slate-500 block">Văn hóa (30%)</span>
                  <strong className="text-slate-900 text-xs">{ev.culturalFitScore}/5★</strong>
                  {ev.cultureNotes && (
                    <p className="text-slate-600 mt-1 leading-relaxed">{ev.cultureNotes}</p>
                  )}
                </div>
              </div>

              {ev.strengths && (
                <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-950 text-xs">
                  <strong className="text-emerald-900 block mb-0.5 font-bold">
                    Căn cứ tuyển dụng (Điểm mạnh nổi bật):
                  </strong>
                  <p className="leading-relaxed font-medium">{ev.strengths}</p>
                </div>
              )}

              {ev.weaknesses && (
                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-950 text-xs">
                  <strong className="text-amber-900 block mb-0.5 font-bold">
                    Điểm cần lưu ý &amp; đào tạo:
                  </strong>
                  <p className="leading-relaxed font-medium">{ev.weaknesses}</p>
                </div>
              )}

              {(ev.hireReason || ev.comments) && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs">
                  <strong className="text-slate-900 block mb-0.5 font-bold">
                    Kết luận của Giám khảo:
                  </strong>
                  <p className="leading-relaxed">{ev.hireReason || ev.comments}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
