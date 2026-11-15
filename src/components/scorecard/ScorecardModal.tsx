"use client";

import { useState } from "react";
import {
  X,
  Star,
  Award,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ThumbsUp,
  AlertTriangle,
  Briefcase,
  Layers,
  FileText,
} from "lucide-react";

interface ScorecardModalProps {
  applicationId: number;
  candidateName: string;
  jobTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ScorecardModal({
  applicationId,
  candidateName,
  jobTitle,
  isOpen,
  onClose,
  onSuccess,
}: ScorecardModalProps) {
  const [round, setRound] = useState("Vòng 1 — Đánh giá Kỹ thuật & Chuyên môn");
  const [levelRecommendation, setLevelRecommendation] = useState("MIDDLE");
  const [techScore, setTechScore] = useState<number>(4);
  const [commScore, setCommScore] = useState<number>(4);
  const [cultScore, setCultScore] = useState<number>(4);
  const [recommendation, setRecommendation] = useState<string>("HIRE");

  // Chi tiết đánh giá & căn cứ quyết định
  const [strengths, setStrengths] = useState<string>("");
  const [weaknesses, setWeaknesses] = useState<string>("");
  const [technicalNotes, setTechnicalNotes] = useState<string>("");
  const [communicationNotes, setCommunicationNotes] = useState<string>("");
  const [cultureNotes, setCultureNotes] = useState<string>("");
  const [hireReason, setHireReason] = useState<string>("");
  const [comments, setComments] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  // Tính điểm tổng hợp có trọng số: Chuyên môn 40%, Giao tiếp 30%, Văn hóa 30%
  const overallScore = (techScore * 0.4 + commScore * 0.3 + cultScore * 0.3).toFixed(2);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
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
    if (!strengths.trim() && (recommendation === "HIRE" || recommendation === "STRONG_HIRE")) {
      errors.strengths = "Vui lòng nêu ít nhất 1 điểm mạnh làm căn cứ tuyển dụng người này";
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
          comments: comments || hireReason,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.fieldErrors) setFieldErrors(data.fieldErrors);
        setError(data.error || "Không thể lưu phiếu đánh giá");
      } else {
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      console.error("Scorecard submit error:", err);
      setError("Lỗi kết nối máy chủ khi lưu phiếu đánh giá.");
    } finally {
      setLoading(false);
    }
  };

  const renderStarButtons = (
    value: number,
    onChange: (val: number) => void,
    fieldKey: string
  ) => {
    return (
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
            <Star
              className={`w-4 h-4 ${star <= value ? "fill-white" : ""}`}
            />
          </button>
        ))}
        <span className="text-xs font-bold text-slate-700 ml-2">
          {value}/5 sao
        </span>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl border border-slate-200 max-w-2xl w-full p-6 sm:p-7 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-start justify-between pb-3.5 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[11px] font-bold border border-purple-200 mb-1">
              <Award className="w-3.5 h-3.5" />
              Phiếu Đánh Giá Chuyên Môn
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Đánh Giá Phỏng Vấn Chuyên Sâu
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Ứng viên: <strong className="text-slate-800">{candidateName}</strong> &bull;{" "}
              {jobTitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Banner Lỗi */}
        {error && (
          <div className="bg-red-50 border border-red-300 rounded-xl p-3 text-red-900 flex items-start gap-2.5 text-xs">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <p className="font-semibold">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Vòng phỏng vấn & Khuyến nghị Cấp bậc */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200/70">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Vòng Phỏng Vấn <span className="text-red-500">*</span>
              </label>
              <select
                value={round}
                onChange={(e) => setRound(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 bg-white py-2 px-3 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="Vòng 1 — Đánh giá Kỹ thuật & Chuyên môn">
                  Vòng 1 — Đánh giá Kỹ thuật & Chuyên môn
                </option>
                <option value="Vòng 2 — Phỏng vấn Văn hóa & Quản lý">
                  Vòng 2 — Phỏng vấn Văn hóa & Quản lý
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
                className="w-full text-xs rounded-xl border border-slate-200 bg-white py-2 px-3 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="TRAINEE">Trainee / Thực tập sinh</option>
                <option value="JUNIOR">Junior Developer</option>
                <option value="MIDDLE">Middle Developer</option>
                <option value="SENIOR">Senior Developer</option>
                <option value="LEAD">Tech Lead / Solution Architect</option>
              </select>
            </div>
          </div>

          {/* 3 Tiêu chí cốt lõi có trọng số */}
          <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-purple-600" />
              Chấm Điểm Theo Trọng Số
            </h4>

            {/* Tiêu chí 1: Kỹ năng Chuyên môn (40%) */}
            <div className="pt-1">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">
                  1. Kỹ năng chuyên môn kỹ thuật
                </label>
                <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                  Trọng số 40%
                </span>
              </div>
              {renderStarButtons(techScore, setTechScore, "techScore")}
              <input
                type="text"
                value={technicalNotes}
                onChange={(e) => setTechnicalNotes(e.target.value)}
                placeholder="Nhận xét chuyên môn: Kiến trúc, giải thuật, khả năng debug, thiết kế API..."
                className="mt-1.5 w-full text-xs rounded-xl border border-slate-200 bg-slate-50/50 py-1.5 px-3 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Tiêu chí 2: Giao tiếp & Thuyết trình (30%) */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">
                  2. Kỹ năng giao tiếp, thuyết trình & ngoại ngữ
                </label>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  Trọng số 30%
                </span>
              </div>
              {renderStarButtons(commScore, setCommScore, "commScore")}
              <input
                type="text"
                value={communicationNotes}
                onChange={(e) => setCommunicationNotes(e.target.value)}
                placeholder="Nhận xét giao tiếp: Khả năng diễn đạt mạch lạc, phản biện, giao tiếp tiếng Anh..."
                className="mt-1.5 w-full text-xs rounded-xl border border-slate-200 bg-slate-50/50 py-1.5 px-3 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Tiêu chí 3: Phù hợp Văn hóa & Thái độ (30%) */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">
                  3. Độ phù hợp văn hóa & tinh thần làm việc nhóm
                </label>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Trọng số 30%
                </span>
              </div>
              {renderStarButtons(cultScore, setCultScore, "cultScore")}
              <input
                type="text"
                value={cultureNotes}
                onChange={(e) => setCultureNotes(e.target.value)}
                placeholder="Nhận xét văn hóa: Thái độ cầu thị, chủ động, gắn kết đội ngũ, tính kỷ luật..."
                className="mt-1.5 w-full text-xs rounded-xl border border-slate-200 bg-slate-50/50 py-1.5 px-3 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Preview Điểm có trọng số */}
          <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border border-purple-200/80 rounded-2xl p-4 flex items-center justify-between shadow-2xs">
            <div>
              <p className="text-xs font-bold text-purple-950 uppercase tracking-wider">
                Điểm Đánh Giá Tổng Hợp:
              </p>
              <p className="text-[11px] text-purple-700 mt-0.5">
                = (Chuyên môn × 0.4) + (Giao tiếp × 0.3) + (Văn hóa × 0.3)
              </p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-black text-purple-700">
                {overallScore}
              </span>
              <span className="text-xs font-bold text-purple-600"> / 5.0★</span>
            </div>
          </div>

          {/* Quyết định Khuyến nghị */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Khuyến Nghị Tuyển Dụng <span className="text-red-500">*</span>
            </label>
            <select
              value={recommendation}
              onChange={(e) => setRecommendation(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 bg-white py-2.5 px-3 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="STRONG_HIRE">🌟 Xuất sắc — Tuyển dụng ngay (Strong Hire)</option>
              <option value="HIRE">✅ Đạt chuẩn — Đề xuất tuyển dụng (Hire)</option>
              <option value="NO_HIRE">⚠️ Chưa đạt — Xem xét từ chối (No Hire)</option>
              <option value="STRONG_NO_HIRE">⛔ Không phù hợp (Strong No Hire)</option>
            </select>
          </div>

          {/* Lý do tại sao người này đậu (Điểm mạnh nổi bật) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <ThumbsUp className="w-3.5 h-3.5 text-emerald-600" />
              <span>Lý do Đạt / Điểm mạnh nổi bật (Căn cứ quyết định tuyển dụng)</span>
              <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={2}
              value={strengths}
              onChange={(e) => setStrengths(e.target.value)}
              placeholder="VD: Nắm vững tư duy thiết kế kiến trúc Microservices, trả lời xuất sắc bài test thuật toán, kinh nghiệm tối ưu hóa cơ sở dữ liệu lớn..."
              className={`w-full text-xs rounded-xl border ${
                fieldErrors.strengths ? "border-red-400 bg-red-50/20" : "border-slate-200 bg-slate-50/50"
              } p-2.5 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500`}
            />
            {fieldErrors.strengths && (
              <p className="text-[11px] text-red-600 font-medium mt-1">
                {fieldErrors.strengths}
              </p>
            )}
          </div>

          {/* Điểm cần lưu ý / Rủi ro / Cần đào tạo thêm */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>Điểm cần lưu ý / Rủi ro / Kế hoạch đào tạo khi nhận việc</span>
            </label>
            <textarea
              rows={2}
              value={weaknesses}
              onChange={(e) => setWeaknesses(e.target.value)}
              placeholder="VD: Cần đào tạo thêm về quy trình CI/CD và văn hóa bảo mật hệ thống trong thời gian thử việc..."
              className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Tóm tắt kết luận của Giám khảo */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Tóm tắt kết luận của Giám khảo / Hội đồng phỏng vấn</span>
            </label>
            <textarea
              rows={2}
              value={hireReason}
              onChange={(e) => setHireReason(e.target.value)}
              placeholder="Tóm tắt ngắn gọn lý do chốt tuyển để HR và Ban Giám Đốc tham khảo khi phê duyệt..."
              className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 rounded-xl shadow-md shadow-purple-500/20 flex items-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang lưu...</span>
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
    </div>
  );
}
