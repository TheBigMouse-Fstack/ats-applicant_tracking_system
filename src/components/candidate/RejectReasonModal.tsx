"use client";

import { useState, useEffect } from "react";
import { X, XCircle, Loader2 } from "lucide-react";
import { REJECTION_REASON_PRESETS } from "@/lib/stage-rules";

interface RejectReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  candidateName: string;
  jobTitle: string;
  currentStage: string;
}

export default function RejectReasonModal({
  isOpen,
  onClose,
  onConfirm,
  candidateName,
  jobTitle,
  currentStage,
}: RejectReasonModalProps) {
  const [selectedPreset, setSelectedPreset] = useState<string>("");
  const [customReason, setCustomReason] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedPreset("");
      setCustomReason("");
      setError(null);
      setSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: string) => {
    setSelectedPreset(preset);
    setCustomReason(preset);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = customReason.trim();
    if (finalReason.length < 5) {
      setError("Vui lòng chọn hoặc nhập lý do từ chối cụ thể (tối thiểu 5 ký tự).");
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await onConfirm(finalReason);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/55 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Xác Nhận Từ Chối Hồ Sơ
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Ứng viên: <strong className="text-slate-800">{candidateName}</strong> &bull; {jobTitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Gợi ý nhanh các lý do chuẩn */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Chọn nhanh lý do phổ biến
            </label>
            <div className="flex flex-wrap gap-1.5">
              {REJECTION_REASON_PRESETS.map((preset) => {
                const isSelected = selectedPreset === preset;
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border text-left transition-all cursor-pointer ${
                      isSelected
                        ? "bg-rose-50 border-rose-400 text-rose-800 font-bold"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {preset}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chi tiết lý do từ chối */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Lý do từ chối chi tiết <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={customReason}
              onChange={(e) => {
                setCustomReason(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Nhập lý do cụ thể (ví dụ: Thiếu kinh nghiệm thực chiến về Node.js và thiết kế cơ sở dữ liệu theo yêu cầu vị trí)..."
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all"
              required
            />
            {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-sm transition-all disabled:opacity-60 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Xác Nhận Từ Chối</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
