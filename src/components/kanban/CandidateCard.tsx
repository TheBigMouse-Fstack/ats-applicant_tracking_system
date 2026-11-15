"use client";

import { Draggable } from "@hello-pangea/dnd";
import {
  Briefcase,
  Star,
  AlertTriangle,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";

interface CandidateCardProps {
  application: any;
  index: number;
  onOpenDrawer: (appId: number) => void;
  onToggleStar?: (appId: number) => void;
  isDragDisabled?: boolean;
}

export default function CandidateCard({
  application,
  index,
  onOpenDrawer,
  onToggleStar,
  isDragDisabled = false,
}: CandidateCardProps) {
  const { candidate, job, isSlaBreached, slaMessage, evaluations, isStarred, isViewed, currentStage } = application;

  let skills: string[] = [];
  try {
    skills = JSON.parse(candidate?.parsedSkills || "[]");
  } catch {
    skills = [];
  }

  const isNewStage = currentStage === "NEW";
  const isUnviewedNew = isNewStage && !isViewed;

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
          className={`group rounded-xl border p-4 mb-3 transition-all cursor-pointer relative ${
            snapshot.isDragging
              ? "shadow-2xl border-brand-500 ring-2 ring-brand-500/20 rotate-1 scale-102 bg-white"
              : isSlaBreached
              ? "border-red-300 shadow-xs hover:border-red-400 hover:shadow-md bg-white"
              : isUnviewedNew
              ? "border-blue-400 ring-2 ring-blue-500/20 bg-gradient-to-br from-blue-50/50 via-white to-white shadow-sm hover:border-blue-500 hover:shadow-md"
              : isStarred
              ? "border-amber-300 ring-1 ring-amber-400/30 bg-amber-50/15 shadow-2xs hover:border-amber-400 hover:shadow-md"
              : "border-slate-200/90 shadow-2xs hover:border-brand-400 hover:shadow-md bg-white"
          }`}
        >
          {/* Cảnh báo vi phạm SLA đỏ (BRL-07) */}
          {isSlaBreached && (
            <div className="mb-2.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-red-100 text-red-700 text-[11px] font-bold border border-red-200">
              <AlertTriangle className="w-3 h-3 text-red-600 shrink-0" />
              <span>{slaMessage}</span>
            </div>
          )}

          {/* Đánh sáng đặc biệt cho CV vẫn ở giai đoạn NEW để HR không bị miss */}
          {isNewStage && !isSlaBreached && (
            <div className="mb-2 flex items-center justify-between gap-1">
              {isUnviewedNew ? (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-extrabold border border-blue-300 shadow-2xs animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping" />
                  <span>MỚI TIẾP NHẬN • CHƯA XEM</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold border border-slate-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Đã xem sơ bộ</span>
                </div>
              )}

              {isStarred && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-300">
                  <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                  <span>Đặc biệt</span>
                </span>
              )}
            </div>
          )}

          {/* Tiêu đề: Tên ứng viên, Nút Gắn sao (Star) & Nút xem */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              {/* Nút Gắn sao như Gmail */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleStar?.(application.id);
                }}
                title={isStarred ? "Bỏ gắn sao" : "Gắn sao hồ sơ đặc biệt"}
                className="p-1 -ml-1 rounded-lg text-slate-300 hover:text-amber-400 hover:bg-amber-50 transition-all shrink-0 cursor-pointer"
              >
                <Star
                  className={`w-4 h-4 transition-transform ${
                    isStarred
                      ? "fill-amber-400 text-amber-400 scale-110 drop-shadow-2xs"
                      : "text-slate-300 hover:text-amber-400 hover:scale-110"
                  }`}
                />
              </button>

              <h4 className="font-bold text-slate-900 text-sm group-hover:text-brand-600 transition-colors line-clamp-1">
                {candidate?.fullName || "Ứng viên chưa cập nhật"}
              </h4>
            </div>

            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-brand-500 group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
          </div>

          {/* Vị trí ứng tuyển */}
          <p className="text-xs text-slate-500 line-clamp-1 mt-0.5 flex items-center gap-1.5 pl-5">
            <Briefcase className="w-3 h-3 text-slate-400 shrink-0" />
            <span>{job?.title || "Vị trí không xác định"}</span>
          </p>

          {/* Thông tin năng lực: Kỹ năng & Kinh nghiệm */}
          <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-2.5 border-t border-slate-100">
            {/* Kỹ năng tiêu biểu */}
            {skills.slice(0, 2).map((sk) => (
              <span
                key={sk}
                className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-brand-50 text-brand-700 border border-brand-200/70"
              >
                {sk}
              </span>
            ))}

            {/* Năm kinh nghiệm */}
            {candidate?.experienceYears !== undefined && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] bg-slate-50 text-slate-600 border border-slate-200">
                {candidate.experienceYears > 0
                  ? `${candidate.experienceYears} năm KN`
                  : "Mới tốt nghiệp"}
              </span>
            )}

            {/* Đánh giá phỏng vấn nếu có */}
            {evaluations && evaluations.length > 0 ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-purple-50 text-purple-700 border border-purple-200 font-semibold ml-auto">
                <Star className="w-3 h-3 fill-purple-600 text-purple-600" />
                {evaluations[0].overallScore
                  ? `${evaluations[0].overallScore.toFixed(1)}/5`
                  : `${evaluations.length} đánh giá`}
              </span>
            ) : currentStage === "INTERVIEW" ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] bg-slate-100 text-slate-500 border border-slate-200 font-medium ml-auto">
                Chưa đánh giá
              </span>
            ) : null}
          </div>
        </div>
      )}
    </Draggable>
  );
}


