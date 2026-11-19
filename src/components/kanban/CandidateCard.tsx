"use client";

import { Draggable } from "@hello-pangea/dnd";
import { Briefcase, Star, AlertTriangle, Clock } from "lucide-react";
import { getAiMatchTier } from "@/lib/match-score";

interface CandidateCardProps {
  application: any;
  index: number;
  onOpenDrawer: (appId: number) => void;
  onToggleStar?: (appId: number) => void;
  isDragDisabled?: boolean;
  searchQuery?: string;
}

function highlightMatch(text: string, query: string) {
  if (!query || query.length < 2) return text;
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const index = lowerText.indexOf(lowerQuery);
  if (index === -1) return text;
  const before = text.slice(0, index);
  const match = text.slice(index, index + query.length);
  const after = text.slice(index + query.length);
  return (
    <>
      {before}
      <span className="bg-amber-100 text-amber-950 font-bold px-0.5 rounded">
        {match}
      </span>
      {after}
    </>
  );
}

/**
 * Thẻ ứng viên tối giản trên Kanban (Overview-Only):
 * Chỉ giữ đúng các tín hiệu cốt lõi để quét nhanh trong 3 giây:
 * 1. Tên ứng viên (+ chấm xanh tĩnh nếu chưa xem, icon sao)
 * 2. Vị trí ứng tuyển
 * 3. AI Match % (3 mức màu) + Số năm kinh nghiệm
 * 4. Cảnh báo SLA (chỉ hiện khi quá hạn)
 * Toàn bộ chi tiết (Email, SĐT, kỹ năng đầy đủ, chứng chỉ, lý do...) nằm gọn trong Drawer Chi tiết.
 */
export default function CandidateCard({
  application,
  index,
  onOpenDrawer,
  onToggleStar,
  isDragDisabled = false,
  searchQuery = "",
}: CandidateCardProps) {
  const {
    candidate,
    job,
    isSlaBreached,
    slaMessage,
    evaluations,
    isStarred,
    isViewed,
    currentStage,
  } = application;

  const isUnviewedNew = currentStage === "NEW" && !isViewed;
  const matchTier = getAiMatchTier(application.aiMatchScore);

  // Phân tích lý do khớp từ khóa tìm kiếm (Match Explanation)
  const trimmedQuery = searchQuery.trim().toLowerCase();
  let matchedSkill: string | null = null;
  let matchedEmail = false;
  let matchedPhone = false;

  if (trimmedQuery.length >= 2) {
    try {
      const skills: string[] =
        typeof candidate?.parsedSkills === "string"
          ? JSON.parse(candidate.parsedSkills)
          : Array.isArray(candidate?.parsedSkills)
          ? candidate.parsedSkills
          : [];
      const found = skills.find((s) => s.toLowerCase().includes(trimmedQuery));
      if (found) matchedSkill = found;
    } catch {
      if (
        typeof candidate?.parsedSkills === "string" &&
        candidate.parsedSkills.toLowerCase().includes(trimmedQuery)
      ) {
        matchedSkill = trimmedQuery;
      }
    }

    const nameMatches = (candidate?.fullName || "").toLowerCase().includes(trimmedQuery);
    if (!nameMatches) {
      if ((candidate?.email || "").toLowerCase().includes(trimmedQuery)) {
        matchedEmail = true;
      } else if ((candidate?.phone || "").toLowerCase().includes(trimmedQuery)) {
        matchedPhone = true;
      }
    }
  }

  return (
    <Draggable
      draggableId={String(application.id)}
      index={index}
      isDragDisabled={isDragDisabled}
    >
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onOpenDrawer(application.id)}
          className={`group rounded-xl border p-3.5 mb-2.5 bg-white transition-all cursor-pointer ${
            snapshot.isDragging
              ? "shadow-xl border-brand-500 ring-2 ring-brand-500/15"
              : isSlaBreached
              ? "border-rose-200 hover:border-rose-300 shadow-2xs"
              : "border-slate-200 hover:border-slate-300 hover:shadow-xs"
          }`}
        >
          {/* Hàng 1: Tên ứng viên + Chấm chưa xem (tĩnh, không nhấp nháy) + Nút Sao */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {isUnviewedNew && (
                <span
                  className="w-2 h-2 rounded-full bg-blue-600 shrink-0"
                  title="Hồ sơ mới chưa xem"
                />
              )}
              <h4
                className={`text-sm truncate group-hover:text-brand-600 transition-colors ${
                  isUnviewedNew
                    ? "font-bold text-slate-900"
                    : "font-semibold text-slate-800"
                }`}
              >
                {candidate?.fullName
                  ? highlightMatch(candidate.fullName, trimmedQuery)
                  : "Ứng viên chưa cập nhật"}
              </h4>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleStar?.(application.id);
              }}
              title={isStarred ? "Bỏ gắn sao" : "Gắn sao ưu tiên"}
              className="p-0.5 rounded text-slate-300 hover:text-amber-400 transition-colors shrink-0 cursor-pointer"
            >
              <Star
                className={`w-3.5 h-3.5 ${
                  isStarred
                    ? "fill-amber-400 text-amber-400"
                    : "text-slate-300 hover:text-amber-400"
                }`}
              />
            </button>
          </div>

          {/* Hàng 2: Vị trí ứng tuyển (1 dòng gọn) */}
          <p className="text-xs text-slate-500 truncate mt-1 flex items-center gap-1.5">
            <Briefcase className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="truncate">{job?.title || "Vị trí không xác định"}</span>
          </p>

          {/* Hiển thị lý do khớp tìm kiếm nếu do Kỹ năng / Email / SĐT */}
          {matchedSkill && (
            <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-brand-700 bg-brand-50 border border-brand-200/80 px-2 py-0.5 rounded-md">
              <span>🎯 Khớp kỹ năng:</span>
              <span className="font-bold underline">{matchedSkill}</span>
            </div>
          )}
          {matchedEmail && (
            <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md">
              <span>✉️ Khớp email:</span>
              <span className="font-medium text-slate-900">{candidate.email}</span>
            </div>
          )}
          {matchedPhone && (
            <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md">
              <span>📞 Khớp SĐT:</span>
              <span className="font-medium text-slate-900">{candidate.phone}</span>
            </div>
          )}

          {/* Cảnh báo SLA quá hạn (chỉ hiện khi thực sự vi phạm) */}
          {isSlaBreached && (
            <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-rose-600">
              <AlertTriangle className="w-3 h-3 shrink-0" />
              <span className="truncate">{slaMessage}</span>
            </div>
          )}

          {/* Cảnh báo nghi trùng hồ sơ hoặc lệch thông tin CV nghiêm trọng (tối đa 1 dòng tĩnh, không gây rối) */}
          {(application.duplicateWarningAppId ||
            application.contactMismatchLevel === "CRITICAL") && (
            <div className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-amber-700">
              <AlertTriangle className="w-3 h-3 shrink-0 text-amber-600" />
              <span className="truncate">
                {application.duplicateWarningAppId
                  ? `Nghi trùng hồ sơ #${application.duplicateWarningAppId}`
                  : "Thông tin CV không khớp"}
              </span>
            </div>
          )}

          {/* Hàng 3: Tín hiệu cốt lõi (AI %, Kinh nghiệm, Điểm PV nếu có) */}
          <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-slate-100 text-[11px]">
            <div className="flex items-center gap-1.5">
              {matchTier.score !== null && (
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold border ${matchTier.badgeClass}`}
                  title={`Mức độ phù hợp: ${matchTier.score}% (${matchTier.label})`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${matchTier.dotClass}`} />
                  {matchTier.score}%
                </span>
              )}

              {candidate?.experienceYears !== undefined && (
                <span className="inline-flex items-center gap-1 text-slate-500 font-medium">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {candidate.experienceYears > 0
                    ? `${candidate.experienceYears} năm`
                    : "< 1 năm"}
                </span>
              )}
            </div>

            {evaluations && evaluations.length > 0 && (
              <span className="inline-flex items-center gap-0.5 text-slate-600 font-semibold">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                {evaluations[0].overallScore
                  ? evaluations[0].overallScore.toFixed(1)
                  : evaluations.length}
              </span>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}
