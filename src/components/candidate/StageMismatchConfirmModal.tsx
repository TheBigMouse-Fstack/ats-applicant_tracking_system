"use client";

import { AlertTriangle, X, ArrowRight, Briefcase, User, Award, ShieldAlert } from "lucide-react";

interface StageMismatchConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  candidateName: string;
  jobTitle: string;
  targetStage: string;
  missingSkills?: string[];
  expYears?: number;
  minExpYears?: number;
  rationale?: string;
  actionType?: "MOVE_STAGE" | "SCHEDULE_INTERVIEW";
}

export default function StageMismatchConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  candidateName,
  jobTitle,
  targetStage,
  missingSkills = [],
  expYears = 0,
  minExpYears = 0,
  rationale = "",
  actionType = "MOVE_STAGE",
}: StageMismatchConfirmModalProps) {
  if (!isOpen) return null;

  const stageLabels: Record<string, string> = {
    SCREENING: "Sơ Loại Hồ Sơ (Screening)",
    INTERVIEW: "Phỏng Vấn Chuyên Môn (Interview)",
    HIRED: "Tuyển Chọn Chính Thức (Hired)",
  };

  const stageName = stageLabels[targetStage] || targetStage;

  const cleanRationale = rationale
    .replace(/Điểm đánh giá:\s*\d+%\.?/gi, "")
    .replace(/\(\d+%\)/gi, "")
    .trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl border border-amber-200 max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
        {/* Header với Icon cảnh báo */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200">
            <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div className="flex-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[11px] font-bold border border-amber-200 mb-1">
              <ShieldAlert className="w-3 h-3 text-amber-600" />
              <span>Cảnh Báo Tiêu Chí Tuyển Dụng</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight leading-snug">
              {actionType === "SCHEDULE_INTERVIEW"
                ? "Ứng viên chưa đạt tiêu chuẩn để xếp lịch phỏng vấn"
                : "Hồ sơ chưa đạt đầy đủ tiêu chuẩn yêu cầu"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thông tin hồ sơ & Vị trí */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              Ứng viên:
            </span>
            <strong className="text-slate-900 font-bold">{candidateName}</strong>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-slate-400" />
              Vị trí tuyển dụng:
            </span>
            <strong className="text-slate-900 font-bold">{jobTitle}</strong>
          </div>
          {actionType === "MOVE_STAGE" && (
            <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
              <span className="text-slate-500">Dự định chuyển sang:</span>
              <span className="px-2 py-0.5 rounded-md bg-brand-50 text-brand-700 font-bold border border-brand-200">
                {stageName}
              </span>
            </div>
          )}
        </div>

        {/* Chi tiết các tiêu chí chưa đạt */}
        <div className="space-y-3">
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">
            Các tiêu chí chưa đáp ứng:
          </p>

          {/* Kỹ năng còn thiếu */}
          {missingSkills.length > 0 && (
            <div className="bg-red-50/70 border border-red-200/80 rounded-xl p-3 space-y-1.5">
              <span className="text-[11px] font-bold text-red-900 block">
                Thiếu kỹ năng chuyên môn bắt buộc ({missingSkills.length} kỹ năng):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {missingSkills.map((sk, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-white text-red-700 border border-red-200 shadow-2xs"
                  >
                    <span className="text-red-500">✖</span>
                    {sk}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Số năm kinh nghiệm */}
          {minExpYears > 0 && expYears < minExpYears && (
            <div className="bg-orange-50/70 border border-orange-200/80 rounded-xl p-3 text-xs text-orange-950 font-medium">
              <span>
                Kinh nghiệm tích lũy: <strong>{expYears} năm</strong> (Mức tối thiểu yêu cầu: <strong>{minExpYears} năm</strong>).
              </span>
            </div>
          )}

          {/* Tóm tắt đối chiếu */}
          {cleanRationale && (
            <div className="bg-amber-50/60 border border-amber-200/70 rounded-xl p-3 text-xs text-amber-950 leading-relaxed">
              <span className="font-bold block mb-0.5 flex items-center gap-1 text-amber-900">
                <Award className="w-3.5 h-3.5 text-amber-600" />
                Ghi chú đối chiếu hồ sơ:
              </span>
              <p className="font-medium text-slate-700">{cleanRationale}</p>
            </div>
          )}
        </div>

        {/* Thông điệp cảnh báo nhắc nhở */}
        <div className="p-3 bg-amber-50 rounded-xl border border-amber-300/80 text-[11px] text-amber-900 leading-normal">
          <p className="font-semibold">
            {actionType === "SCHEDULE_INTERVIEW"
              ? "Hồ sơ này thiếu nhiều tiêu chuẩn quan trọng so với JD. Để tránh xếp lịch phỏng vấn nhầm, vui lòng xác nhận bạn có muốn tiếp tục đặc cách lên lịch phỏng vấn cho ứng viên này không?"
              : "Để tránh việc HR bấm nhầm hoặc duyệt sót hồ sơ chưa đạt chuẩn, vui lòng xác nhận bạn có muốn đặc cách tiếp tục chuyển hồ sơ này sang giai đoạn tiếp theo không?"}
          </p>
        </div>

        {/* Các nút hành động */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
          >
            Hủy bỏ (Giữ nguyên)
          </button>

          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-600/20 hover:shadow-lg transition-all cursor-pointer"
          >
            <span>Vẫn tiếp tục</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
