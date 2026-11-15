"use client";

import { useState, useEffect } from "react";
import {
  X,
  Sparkles,
  Briefcase,
  Mail,
  Phone,
  GraduationCap,
  Calendar,
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
  Star,
  ShieldAlert,
  ArrowRight,
  Loader2,
  History,
  ExternalLink,
  Download,
  RotateCw,
  Building2,
  User,
  MapPin,
  Award,
  Video,
  Send,
  Copy,
  Check,
  Eye,
  Image as ImageIcon,
  AlertTriangle,
  Trash2,
  Edit3,
  MessageSquare,
  ClipboardCheck,
  ThumbsUp,
  ThumbsDown,
  Plus,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import ScorecardModal from "@/components/scorecard/ScorecardModal";
import StageMismatchConfirmModal from "@/components/candidate/StageMismatchConfirmModal";

interface CandidateDrawerProps {
  applicationId: number | null;
  onClose: () => void;
  onStageChange: (appId: number, toStage: string) => Promise<boolean | string>;
}

export default function CandidateDrawer({
  applicationId,
  onClose,
  onStageChange,
}: CandidateDrawerProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "cv" | "history">("overview");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [isScorecardOpen, setIsScorecardOpen] = useState(false);

  // Chế độ xem CV gốc: "pdf" (Visual PDF iframe) hoặc "text" (Văn bản trích xuất)
  const [cvViewMode, setCvViewMode] = useState<"pdf" | "text">("pdf");
  const [reparsing, setReparsing] = useState(false);
  const [reparseNotice, setReparseNotice] = useState<string | null>(null);

  // Lên lịch Phỏng vấn State (UC-05A)
  const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false);
  const [interviewDate, setInterviewDate] = useState("");
  const [interviewFormat, setInterviewFormat] = useState<"ONLINE" | "OFFLINE">("ONLINE");
  const [interviewLocation, setInterviewLocation] = useState("");
  const [interviewNotes, setInterviewNotes] = useState("");
  const [interviewInterviewerNotes, setInterviewInterviewerNotes] = useState("");
  const [interviewPostNotes, setInterviewPostNotes] = useState("");
  const [interviewLoading, setInterviewLoading] = useState(false);
  const [isSavingPostNotes, setIsSavingPostNotes] = useState(false);
  const [isCancellingInterview, setIsCancellingInterview] = useState(false);
  const [interviewSuccessEmail, setInterviewSuccessEmail] = useState<string | null>(null);
  const [interviewError, setInterviewError] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);

  // Lightbox xem ảnh Bằng cấp / Chứng chỉ phóng to
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewImageTitle, setPreviewImageTitle] = useState<string>("");

  // Modal cảnh báo tiêu chuẩn tuyển dụng khi chuyển vòng hoặc xếp lịch (tránh HR bấm nhầm)
  const [mismatchWarning, setMismatchWarning] = useState<{
    targetStage: string;
    actionType: "MOVE_STAGE" | "SCHEDULE_INTERVIEW";
  } | null>(null);

  // Tải chi tiết hồ sơ
  useEffect(() => {
    if (!applicationId) return;

    setLoading(true);
    setActionError("");
    setReparseNotice(null);
    setInterviewSuccessEmail(null);
    setInterviewError(null);

    fetch(`/api/applications/${applicationId}`)
      .then((res) => res.json())
      .then((res) => {
        if (res.success) {
          setData(res.data);
          if (res.data.interviewDate) {
            const d = new Date(res.data.interviewDate);
            const iso = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
              .toISOString()
              .slice(0, 16);
            setInterviewDate(iso);
            setInterviewFormat(res.data.interviewFormat || "ONLINE");
            setInterviewLocation(res.data.interviewLocation || "");
            setInterviewNotes(res.data.interviewNotes || "");
            setInterviewInterviewerNotes(res.data.interviewInterviewerNotes || "");
            setInterviewPostNotes(res.data.interviewPostNotes || "");
          } else {
            const defDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
            defDate.setHours(9, 0, 0, 0);
            const iso = new Date(defDate.getTime() - defDate.getTimezoneOffset() * 60000)
              .toISOString()
              .slice(0, 16);
            setInterviewDate(iso);
            setInterviewFormat("ONLINE");
            setInterviewLocation("https://meet.google.com/xyz-recoverx-meet");
            setInterviewNotes(
              "Vui lòng chuẩn bị slide giới thiệu bản thân và kiểm tra micro/camera trước 5 phút."
            );
            setInterviewInterviewerNotes(res.data.interviewInterviewerNotes || "");
            setInterviewPostNotes(res.data.interviewPostNotes || "");
          }
        }
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [applicationId]);

  if (!applicationId) return null;

  // Phân tích tiêu chuẩn ứng viên so với JD (Tránh HR thao tác nhầm)
  let missingSkillsList: string[] = [];
  try {
    if (typeof data?.aiMissingSkills === "string") {
      missingSkillsList = JSON.parse(data.aiMissingSkills);
    } else if (Array.isArray(data?.aiMissingSkills)) {
      missingSkillsList = data.aiMissingSkills;
    }
  } catch (e) {}

  const minExpRequired = data?.job?.minExperienceYears || 0;
  const candidateExp = data?.candidate?.experienceYears || 0;

  const isUnderQualified = Boolean(
    data &&
      ((data.aiMatchScore != null && data.aiMatchScore < 60) ||
        missingSkillsList.length >= 2 ||
        (minExpRequired > 0 && candidateExp < minExpRequired))
  );

  // Xử lý chuyển trạng thái nhanh từ trong Drawer
  const executeQuickMove = async (toStage: string) => {
    setActionError("");
    setActionLoading(true);
    const result = await onStageChange(applicationId, toStage);
    setActionLoading(false);

    if (typeof result === "string") {
      setActionError(result); // Báo lỗi BRL-06 hoặc lỗi nghiệp vụ
    } else if (result === true) {
      // Reload dữ liệu drawer
      fetch(`/api/applications/${applicationId}`)
        .then((r) => r.json())
        .then((r) => r.success && setData(r.data));
    }
  };

  const handleQuickMove = async (toStage: string) => {
    if (isUnderQualified && (toStage === "SCREENING" || toStage === "INTERVIEW")) {
      setMismatchWarning({ targetStage: toStage, actionType: "MOVE_STAGE" });
      return;
    }
    await executeQuickMove(toStage);
  };

  // Kích hoạt AI phân tích lại CV
  const handleReparse = async () => {
    try {
      setReparsing(true);
      setReparseNotice(null);
      const res = await fetch(`/api/applications/${applicationId}/re-parse`, {
        method: "POST",
      });
      const resData = await res.json();
      if (resData.success && resData.data) {
        setData(resData.data);
        setReparseNotice("Đã phân tích lại CV bằng AI thành công!");
        setTimeout(() => setReparseNotice(null), 5000);
      } else {
        setActionError(resData.error || "Không thể phân tích lại CV");
      }
    } catch (e: any) {
      setActionError("Lỗi kết nối khi chạy lại AI bóc tách.");
    } finally {
      setReparsing(false);
    }
  };

  // Lên lịch / Cập nhật Phỏng vấn & Tạo thư mời (UC-05A)
  const executeScheduleInterview = async () => {
    setInterviewError(null);
    setInterviewLoading(true);

    try {
      const res = await fetch("/api/interviews/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId,
          interviewDate: new Date(interviewDate).toISOString(),
          interviewFormat,
          interviewLocation,
          interviewNotes,
          interviewInterviewerNotes,
          interviewPostNotes,
          moveToInterviewStage: data?.currentStage !== "INTERVIEW",
        }),
      });

      const resData = await res.json();
      if (!res.ok || !resData.success) {
        setInterviewError(resData.error || "Không thể lưu lịch phỏng vấn");
      } else {
        setInterviewSuccessEmail(resData.emailTemplate || resData.data?.emailTemplate || "Đã lưu lịch phỏng vấn");
        setData(resData.data?.application || resData.data);
        setReparseNotice(resData.message || "Đã lưu lịch phỏng vấn thành công!");
        setTimeout(() => setReparseNotice(null), 5000);
      }
    } catch (err: any) {
      setInterviewError("Lỗi kết nối khi xếp lịch: " + err.message);
    } finally {
      setInterviewLoading(false);
    }
  };

  const handleScheduleInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUnderQualified && !data?.interviewDate) {
      setMismatchWarning({ targetStage: "INTERVIEW", actionType: "SCHEDULE_INTERVIEW" });
      return;
    }
    await executeScheduleInterview();
  };

  // Hủy lịch phỏng vấn đã xếp
  const handleCancelInterview = async () => {
    if (
      !confirm(
        `Bạn có chắc chắn muốn hủy lịch hẹn phỏng vấn của ứng viên ${data?.candidate?.fullName || ""} không? Thời gian và địa điểm phỏng vấn sẽ được gỡ bỏ hoàn toàn.`
      )
    ) {
      return;
    }

    try {
      setIsCancellingInterview(true);
      const res = await fetch(`/api/interviews/schedule?applicationId=${applicationId}`, {
        method: "DELETE",
      });
      const resData = await res.json();
      if (resData.success && resData.data) {
        setData(resData.data);
        setIsInterviewModalOpen(false);
        setInterviewSuccessEmail(null);
        setReparseNotice(resData.message || "Đã hủy lịch phỏng vấn thành công!");
        setTimeout(() => setReparseNotice(null), 5000);
      } else {
        setInterviewError(resData.error || "Không thể hủy lịch phỏng vấn");
      }
    } catch (e: any) {
      setInterviewError("Lỗi kết nối khi hủy lịch: " + e.message);
    } finally {
      setIsCancellingInterview(false);
    }
  };

  // Lưu nhanh ghi chú trước / sau phỏng vấn từ khối chi tiết (không đổi ngày/giờ)
  const handleSaveQuickNotes = async () => {
    try {
      setIsSavingPostNotes(true);
      const res = await fetch("/api/interviews/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId,
          interviewNotes,
          interviewInterviewerNotes,
          interviewPostNotes,
          isQuickNotesUpdate: true,
        }),
      });
      const resData = await res.json();
      if (resData.success && resData.data) {
        setData(resData.data);
        setReparseNotice("Đã lưu ghi chú và biên bản phỏng vấn thành công!");
        setTimeout(() => setReparseNotice(null), 5000);
      } else {
        setActionError(resData.error || "Không thể lưu ghi chú");
      }
    } catch (e: any) {
      setActionError("Lỗi kết nối khi lưu ghi chú: " + e.message);
    } finally {
      setIsSavingPostNotes(false);
    }
  };

  // Parse JSON helper
  const safeParseJSON = (jsonString: string | null | undefined, fallback: any = []) => {
    if (!jsonString) return fallback;
    try {
      return JSON.parse(jsonString);
    } catch {
      return fallback;
    }
  };

  const parsedSkills = safeParseJSON(data?.candidate?.parsedSkills, []);
  const parsedEducation = safeParseJSON(data?.candidate?.parsedEducation, []);
  const parsedExperience = safeParseJSON(data?.candidate?.parsedExperience, []);
  const certificates = safeParseJSON(data?.candidate?.certificates, []);
  const aiMatchedSkills = safeParseJSON(data?.aiMatchedSkills, []);
  const aiMissingSkills = safeParseJSON(data?.aiMissingSkills, []);
  const jobRequiredSkills = safeParseJSON(data?.job?.requiredSkills, []);

  const stages = [
    { key: "NEW", label: "Mới nộp" },
    { key: "SCREENING", label: "Sàng lọc" },
    { key: "INTERVIEW", label: "Phỏng vấn" },
    { key: "HIRED", label: "Tuyển chọn" },
    { key: "REJECTED", label: "Từ chối" },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop mờ */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-2xl sm:max-w-3xl lg:max-w-4xl bg-white shadow-2xl flex flex-col justify-between border-l border-slate-200">
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/70 flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-brand-100 text-brand-700 uppercase tracking-wide">
                  Hồ sơ #{data?.id}
                </span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-slate-200 text-slate-800">
                  Cột: {data?.currentStage}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsInterviewModalOpen(true);
                    setInterviewSuccessEmail(null);
                    setInterviewError(null);
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold bg-purple-100 text-purple-700 hover:bg-purple-200 border border-purple-200 transition-all cursor-pointer"
                  title="Lên lịch hoặc xem lịch phỏng vấn chuyên môn"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{data?.interviewDate ? "Đã xếp lịch PV" : "Lên lịch PV"}</span>
                </button>

                {/* Nút Gắn sao hồ sơ đặc biệt (Gmail Star style) */}
                <button
                  type="button"
                  onClick={async () => {
                    if (!data?.id) return;
                    const newStarred = !data.isStarred;
                    setData((prev: any) => ({ ...prev, isStarred: newStarred }));
                    try {
                      await fetch(`/api/applications/${data.id}/star`, { method: "POST" });
                    } catch {}
                  }}
                  title={data?.isStarred ? "Bỏ gắn sao đặc biệt" : "Gắn sao hồ sơ đặc biệt"}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold border transition-all cursor-pointer ${
                    data?.isStarred
                      ? "bg-amber-100 text-amber-900 border-amber-300 shadow-2xs"
                      : "bg-white hover:bg-slate-100 text-slate-600 border-slate-200"
                  }`}
                >
                  <Star className={`w-3.5 h-3.5 ${data?.isStarred ? "fill-amber-400 text-amber-500" : "text-slate-400"}`} />
                  <span>{data?.isStarred ? "Đã gắn sao" : "Gắn sao"}</span>
                </button>

                {data?.candidate?.cvFileUrl && (
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    PDF Đã lưu trữ
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                {loading ? "Đang tải hồ sơ..." : data?.candidate?.fullName}
              </h2>
              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  Ứng tuyển: <strong>{data?.job?.title}</strong> &bull; {data?.job?.department}
                </span>
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 px-6 bg-white gap-6">
            <button
              onClick={() => setActiveTab("overview")}
              className={`py-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === "overview"
                  ? "border-brand-600 text-brand-600"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Hồ sơ & Đối chiếu Tiêu chuẩn
            </button>

            <button
              onClick={() => setActiveTab("cv")}
              className={`py-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === "cv"
                  ? "border-brand-600 text-brand-600"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Xem trước CV Gốc
            </button>

            <button
              onClick={() => setActiveTab("history")}
              className={`py-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === "history"
                  ? "border-brand-600 text-brand-600"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Nhật ký luân chuyển & Đánh giá ({data?.evaluations?.length || 0})
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {loading ? (
              <div className="py-20 text-center text-slate-400 space-y-3">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-600" />
                <p className="text-xs">Đang tải chi tiết hồ sơ ứng viên...</p>
              </div>
            ) : (
              <>
                {/* Lỗi nếu thao tác thất bại (VD vi phạm BRL-06) */}
                {actionError && (
                  <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5">
                    <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Thao tác bị chặn:</p>
                      <p className="mt-0.5">{actionError}</p>
                    </div>
                  </div>
                )}

                {/* Thông báo reparse */}
                {reparseNotice && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{reparseNotice}</span>
                  </div>
                )}

                {/* ========================================================================= */}
                {/* TAB 1: HỒ SƠ & ĐỐI CHIẾU TIÊU CHUẨN */}
                {/* ========================================================================= */}
                {activeTab === "overview" && (
                  <div className="space-y-6">
                    {/* KHỐI 1: HỒ SƠ ỨNG VIÊN TRÍCH XUẤT TỪ CV */}
                    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                            <User className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                              1. Thông Tin Trích Xuất Từ CV
                            </h3>
                            <p className="text-[11px] text-slate-400">
                              Dữ liệu học vấn, số năm kinh nghiệm và kỹ năng trích xuất
                            </p>
                          </div>
                        </div>

                        {/* Nút Cập nhật thông tin */}
                        <button
                          type="button"
                          onClick={handleReparse}
                          disabled={reparsing}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200 transition-all cursor-pointer"
                          title="Cập nhật lại thông tin trích xuất từ CV"
                        >
                          <RotateCw
                            className={`w-3.5 h-3.5 ${reparsing ? "animate-spin text-brand-600" : ""}`}
                          />
                          <span>{reparsing ? "Đang cập nhật..." : "Cập nhật thông tin CV"}</span>
                        </button>
                      </div>

                      {/* Thông tin liên hệ nhanh */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80 text-xs">
                        <div>
                          <span className="text-slate-400 block mb-0.5">Email liên hệ</span>
                          <span className="font-semibold text-slate-800 flex items-center gap-1 truncate">
                            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />{" "}
                            {data?.candidate?.email}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block mb-0.5">Số điện thoại</span>
                          <span className="font-semibold text-slate-800 flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />{" "}
                            {data?.candidate?.phone}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block mb-0.5">Tổng số năm kinh nghiệm</span>
                          <span className="font-bold text-brand-600 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-brand-500 shrink-0" />{" "}
                            {data?.candidate?.experienceYears ?? 0} năm thực tế
                          </span>
                        </div>
                      </div>

                      {/* 1.1 Học vấn & Bằng cấp */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
                          <GraduationCap className="w-4 h-4 text-brand-600" />
                          Học Vấn & Bằng Cấp Hiện Tại:
                        </h4>
                        {parsedEducation.length === 0 ? (
                          <div className="p-3 rounded-xl border border-dashed border-slate-200 text-xs text-slate-400">
                            Không tìm thấy thông tin học vấn trong CV.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {parsedEducation.map((edu: any, idx: number) => (
                              <div
                                key={idx}
                                className="p-3 rounded-xl border border-slate-200/90 bg-white text-xs flex items-start justify-between gap-3 shadow-2xs"
                              >
                                <div>
                                  <p className="font-bold text-slate-900 text-sm">
                                    {edu.degree || "Bằng cấp chuyên môn"}
                                  </p>
                                  <p className="text-slate-600 font-medium mt-0.5">
                                    {edu.school || edu.institution}
                                  </p>
                                </div>
                                <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                                  {edu.year || edu.grad_year || "2011 - 2015"}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* 1.2 Kinh nghiệm làm việc chi tiết */}
                      <div className="space-y-2 pt-1">
                        <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
                          <Briefcase className="w-4 h-4 text-brand-600" />
                          Lịch Sử Kinh Nghiệm Làm Việc ({data?.candidate?.experienceYears || 0} năm):
                        </h4>
                        {parsedExperience.length === 0 ? (
                          <div className="p-3 rounded-xl border border-dashed border-slate-200 text-xs text-slate-400">
                            Chưa có thông tin kinh nghiệm chi tiết.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {parsedExperience.map((exp: any, idx: number) => (
                              <div
                                key={idx}
                                className="p-3.5 rounded-xl border border-slate-200/90 bg-white space-y-1.5 text-xs shadow-2xs"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <h5 className="font-bold text-slate-900 text-sm">
                                      {exp.role || exp.position}
                                    </h5>
                                    <p className="font-semibold text-brand-700 text-xs">
                                      {exp.company}
                                    </p>
                                  </div>
                                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                                    {exp.duration}
                                  </span>
                                </div>
                                {exp.description && (
                                  <p className="text-slate-600 text-xs leading-relaxed pt-1 border-t border-slate-100">
                                    {exp.description}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* 1.3 Kỹ năng bóc tách thực tế từ CV */}
                      <div className="space-y-2 pt-1">
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Kỹ Năng & Chuyên Môn Trong CV ({parsedSkills.length}):
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {parsedSkills.length > 0 ? (
                            parsedSkills.map((skill: string, idx: number) => (
                              <span
                                key={idx}
                                className="px-3 py-1 rounded-lg bg-slate-100 text-slate-800 text-xs font-semibold border border-slate-200 shadow-2xs"
                              >
                                {skill}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400">Chưa có thông tin kỹ năng</span>
                          )}
                        </div>
                      </div>

                      {/* 1.4 Bằng cấp & Chứng chỉ đính kèm (Ảnh / PDF) */}
                      <div className="space-y-2.5 pt-3 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
                            <Award className="w-4 h-4 text-purple-600" />
                            Bằng Cấp & Chứng Chỉ Đính Kèm ({certificates.length}):
                          </h4>
                          <span className="text-[11px] text-slate-400">Xem trực tiếp trên web</span>
                        </div>

                        {certificates.length === 0 ? (
                          <div className="p-3.5 rounded-xl border border-dashed border-slate-200 text-xs text-slate-400 bg-slate-50/50">
                            Ứng viên chưa tải lên tệp chứng chỉ hoặc bằng cấp bổ sung.
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {certificates.map((cert: any, idx: number) => {
                              const isImg =
                                cert.fileType === "image" ||
                                /\.(jpg|jpeg|png|webp)$/i.test(cert.fileUrl || "");
                              return (
                                <div
                                  key={idx}
                                  className="group relative bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs hover:shadow-md hover:border-purple-300 transition-all flex flex-col justify-between"
                                >
                                  {isImg ? (
                                    <div
                                      onClick={() => {
                                        setPreviewImage(cert.fileUrl);
                                        setPreviewImageTitle(cert.name || `Chứng chỉ #${idx + 1}`);
                                      }}
                                      className="h-28 bg-slate-100 flex items-center justify-center cursor-pointer relative overflow-hidden"
                                    >
                                      <img
                                        src={cert.fileUrl}
                                        alt={cert.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                      />
                                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                                        <Eye className="w-4 h-4" />
                                        <span>Phóng to</span>
                                      </div>
                                    </div>
                                  ) : (
                                    <a
                                      href={cert.fileUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="h-28 bg-slate-50 flex flex-col items-center justify-center p-3 text-center cursor-pointer hover:bg-slate-100 transition-colors"
                                    >
                                      <FileText className="w-8 h-8 text-red-500 mb-1" />
                                      <span className="text-[10px] font-bold text-slate-700 line-clamp-1">
                                        Tài liệu PDF
                                      </span>
                                    </a>
                                  )}
                                  <div className="p-2 border-t border-slate-100 bg-white">
                                    <p
                                      className="text-[11px] font-bold text-slate-800 truncate"
                                      title={cert.name}
                                    >
                                      {cert.name || "Bằng cấp / Chứng chỉ"}
                                    </p>
                                    <p className="text-[10px] text-slate-400">
                                      {isImg ? "Ảnh chứng chỉ" : "Tài liệu PDF"}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* KHỐI 2: TIÊU CHUẨN CỦA VỊ TRÍ ĐANG TUYỂN DỤNG (JD) */}
                    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-3.5">
                      <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
                        <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                            2. Tiêu Chuẩn Yêu Cầu Vị Trí
                          </h3>
                          <p className="text-[11px] text-slate-400">
                            Cơ sở đối chiếu và đánh giá mức độ phù hợp
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50/70 p-3 rounded-xl border border-slate-200/80 text-xs">
                        <div>
                          <span className="text-slate-400 block mb-0.5">Vị trí</span>
                          <span className="font-bold text-slate-900">{data?.job?.title}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block mb-0.5">Phòng ban</span>
                          <span className="font-semibold text-slate-800">{data?.job?.department}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block mb-0.5">Yêu cầu kinh nghiệm</span>
                          <span className="font-bold text-amber-700">
                            Tối thiểu {data?.job?.minExperienceYears || 0} năm
                          </span>
                        </div>
                      </div>

                      {/* Kỹ năng bắt buộc trong JD */}
                      <div>
                        <span className="text-xs font-bold text-slate-700 block mb-1.5 uppercase tracking-wider">
                          Kỹ năng bắt buộc:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {jobRequiredSkills.map((sk: string, idx: number) => (
                            <span
                              key={idx}
                              className="px-2.5 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200"
                            >
                              {sk}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Tóm tắt mô tả công việc */}
                      <div>
                        <span className="text-xs font-bold text-slate-700 block mb-1 uppercase tracking-wider">
                          Mô tả công việc:
                        </span>
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed max-h-32 overflow-y-auto whitespace-pre-line font-medium">
                          {data?.job?.requirementsJd}
                        </div>
                      </div>
                    </div>

                    {/* KHỐI 3: KẾT QUẢ ĐỐI CHIẾU TIÊU CHUẨN TUYỂN DỤNG */}
                    <div className="bg-gradient-to-br from-indigo-50/70 via-purple-50/40 to-slate-50 p-5 rounded-2xl border border-indigo-200/80 shadow-xs space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-indigo-100">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-md shadow-brand-500/20">
                            <Sparkles className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-brand-900">
                              3. Đối Chiếu Kỹ Năng & Tiêu Chuẩn Tuyển Dụng
                            </h3>
                            <p className="text-[11px] text-slate-500">
                              Đối chiếu kỹ năng thực tế với tiêu chuẩn yêu cầu
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="px-3 py-1.5 rounded-xl text-xs font-bold border bg-white text-slate-700 border-indigo-200 shadow-2xs">
                            Đối chiếu: {aiMatchedSkills.length}/{jobRequiredSkills.length} kỹ năng đáp ứng
                          </span>
                        </div>
                      </div>

                      {/* Phân tích Kỹ năng Đạt vs Còn thiếu */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-white/90 p-3.5 rounded-xl border border-emerald-200 shadow-2xs">
                          <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5 mb-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            Kỹ năng Trùng khớp ({aiMatchedSkills.length}):
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {aiMatchedSkills.length > 0 ? (
                              aiMatchedSkills.map((s: string, idx: number) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200"
                                >
                                  ✔ {s}
                                </span>
                              ))
                            ) : (
                              <span className="text-slate-400 text-xs italic">
                                Không có kỹ năng nào trùng khớp với JD
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="bg-white/90 p-3.5 rounded-xl border border-red-200 shadow-2xs">
                          <span className="text-xs font-bold text-red-800 flex items-center gap-1.5 mb-2">
                            <XCircle className="w-4 h-4 text-red-600" />
                            Kỹ năng Còn thiếu ({aiMissingSkills.length}):
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {aiMissingSkills.length > 0 ? (
                              aiMissingSkills.map((s: string, idx: number) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 rounded bg-red-50 text-red-700 text-[11px] font-bold border border-red-200"
                                >
                                  ✖ {s}
                                </span>
                              ))
                            ) : (
                              <span className="text-emerald-700 text-xs font-bold">
                                Ứng viên đạt trọn vẹn kỹ năng yêu cầu!
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Gợi ý đối chiếu cho HR */}
                      {data?.aiMatchRationale && (
                        <div className="bg-white/90 p-4 rounded-xl border border-indigo-100 text-xs text-slate-800 leading-relaxed shadow-2xs">
                          <span className="font-bold text-indigo-900 block mb-1 flex items-center gap-1">
                            <Award className="w-3.5 h-3.5 text-indigo-600" />
                            Tóm tắt đối chiếu hồ sơ:
                          </span>
                          <p className="font-medium text-slate-700">
                            {data.aiMatchRationale
                              .replace(/Điểm đánh giá:\s*\d+%\.?/gi, "")
                              .replace(/\(\d+%\)/gi, "")
                              .trim()}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* KHỐI 4: LỊCH HẸN PHỎNG VẤN & ĐÁNH GIÁ CHUYÊN GIA */}
                    {(data?.interviewDate || data?.currentStage === "INTERVIEW" || (data?.evaluations && data.evaluations.length > 0)) && (
                      <div className="bg-gradient-to-r from-purple-50/80 via-indigo-50/40 to-white rounded-2xl border border-purple-200/90 p-5 shadow-2xs space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-purple-100 gap-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold shrink-0">
                              <Calendar className="w-5 h-5" />
                            </div>
                            <div>
                              <h3 className="text-xs font-bold uppercase tracking-wider text-purple-950 flex items-center gap-2">
                                <span>4. Lịch Hẹn Phỏng Vấn & Đánh Giá Chuyên Gia</span>
                                {data?.interviewDate && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-200/70 text-purple-800 font-bold">
                                    Đã có lịch
                                  </span>
                                )}
                              </h3>
                              <p className="text-[11px] text-purple-600 mt-0.5">
                                {data?.interviewDate
                                  ? "Quản lý lịch hẹn, ghi chú trước/sau phỏng vấn và kết quả chấm điểm chuyên gia"
                                  : "Chưa xếp lịch phỏng vấn cụ thể cho ứng viên"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {data?.interviewDate ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsInterviewModalOpen(true);
                                    setInterviewSuccessEmail(null);
                                    setInterviewError(null);
                                  }}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-xs transition-all cursor-pointer"
                                  title="Chỉnh sửa ngày giờ, link họp hoặc ghi chú"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                  <span>Sửa Lịch Hẹn</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={handleCancelInterview}
                                  disabled={isCancellingInterview}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 shadow-xs transition-all cursor-pointer"
                                  title="Hủy lịch hẹn phỏng vấn này"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>{isCancellingInterview ? "Đang hủy..." : "Hủy Lịch"}</span>
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setIsInterviewModalOpen(true);
                                  setInterviewSuccessEmail(null);
                                  setInterviewError(null);
                                }}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-md shadow-purple-500/20 transition-all cursor-pointer"
                              >
                                <Calendar className="w-4 h-4" />
                                <span>+ Lên Lịch Phỏng Vấn</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Thẻ Thời gian & Phòng họp */}
                        {data?.interviewDate ? (
                          <div className="space-y-3.5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                              <div className="bg-white p-3.5 rounded-xl border border-purple-100 shadow-2xs">
                                <span className="text-slate-400 block mb-0.5 text-[11px] font-semibold">Thời gian phỏng vấn:</span>
                                <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                  <Clock className="w-4 h-4 text-purple-600 shrink-0" />
                                  {new Date(data.interviewDate).toLocaleString("vi-VN", {
                                    weekday: "long",
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>

                              <div className="bg-white p-3.5 rounded-xl border border-purple-100 shadow-2xs">
                                <span className="text-slate-400 block mb-0.5 text-[11px] font-semibold">Hình thức & Địa điểm:</span>
                                {data.interviewFormat === "ONLINE" ? (
                                  <div className="flex items-center gap-1.5 font-bold text-brand-600 text-xs">
                                    <Video className="w-4 h-4 text-brand-500 shrink-0" />
                                    <span className="truncate">Họp Online: {data.interviewLocation}</span>
                                    {data.interviewLocation?.startsWith("http") && (
                                      <a
                                        href={data.interviewLocation}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-brand-700 hover:text-brand-900 ml-1 underline shrink-0 inline-flex items-center gap-0.5"
                                      >
                                        Vào phòng <ExternalLink className="w-3 h-3" />
                                      </a>
                                    )}
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                                    <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
                                    <span>Văn phòng: {data.interviewLocation}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Ghi chú Trước Phỏng Vấn: Dặn dò ứng viên & Lưu ý Giám khảo */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                              <div className="bg-white/90 p-3.5 rounded-xl border border-purple-100 shadow-2xs space-y-1">
                                <span className="font-bold text-purple-950 flex items-center gap-1.5">
                                  <MessageSquare className="w-3.5 h-3.5 text-purple-600" />
                                  Dặn dò ứng viên:
                                </span>
                                <p className="text-slate-700 text-[11px] leading-relaxed">
                                  {data.interviewNotes || <span className="text-slate-400 italic">Chưa có ghi chú dặn dò</span>}
                                </p>
                              </div>

                              <div className="bg-white/90 p-3.5 rounded-xl border border-indigo-100 shadow-2xs space-y-1">
                                <span className="font-bold text-indigo-950 flex items-center gap-1.5">
                                  <ClipboardCheck className="w-3.5 h-3.5 text-indigo-600" />
                                  Lưu ý cho hội đồng phỏng vấn:
                                </span>
                                <p className="text-slate-700 text-[11px] leading-relaxed">
                                  {data.interviewInterviewerNotes || <span className="text-slate-400 italic">Chưa có lưu ý nội bộ</span>}
                                </p>
                              </div>
                            </div>

                            {/* Ghi chú / Biên bản Sau Phỏng Vấn */}
                            <div className="bg-white p-4 rounded-xl border border-purple-100 shadow-2xs space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                                  <FileText className="w-3.5 h-3.5 text-purple-600" />
                                  Biên bản phỏng vấn:
                                </span>
                                <button
                                  type="button"
                                  onClick={handleSaveQuickNotes}
                                  disabled={isSavingPostNotes}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 text-[11px] font-bold border border-purple-200 transition-colors cursor-pointer"
                                >
                                  {isSavingPostNotes ? (
                                    <>
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                      <span>Đang lưu...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Check className="w-3 h-3 text-purple-600" />
                                      <span>Lưu biên bản</span>
                                    </>
                                  )}
                                </button>
                              </div>
                              <textarea
                                rows={2}
                                value={interviewPostNotes}
                                onChange={(e) => setInterviewPostNotes(e.target.value)}
                                placeholder="Ghi nhận tóm tắt diễn biến buổi phỏng vấn, phản hồi của hội đồng, các câu trả lời tiêu biểu..."
                                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 bg-white/80 rounded-xl border border-dashed border-purple-200 text-xs text-purple-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <span>Hồ sơ chưa có lịch hẹn phỏng vấn. Hãy lên lịch hẹn để sinh Thư mời và cung cấp link họp cho ứng viên.</span>
                            <button
                              type="button"
                              onClick={() => {
                                setIsInterviewModalOpen(true);
                                setInterviewSuccessEmail(null);
                                setInterviewError(null);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-purple-600 text-white font-bold text-xs shrink-0 cursor-pointer"
                            >
                              + Lên lịch ngay
                            </button>
                          </div>
                        )}

                        {/* KHỐI ĐÁNH GIÁ CỦA CHUYÊN GIA (EXPERT SCORECARD) */}
                        <div className="pt-3 border-t border-purple-100 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                                Đánh Giá Phỏng Vấn
                              </h4>
                            </div>
                            <button
                              type="button"
                              onClick={() => setIsScorecardOpen(true)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold transition-colors cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5 text-amber-600" />
                              <span>{data?.evaluations && data.evaluations.length > 0 ? "+ Thêm đánh giá" : "Nhập đánh giá phỏng vấn"}</span>
                            </button>
                          </div>

                          {data?.evaluations && data.evaluations.length > 0 ? (
                            <div className="space-y-3">
                              {data.evaluations.map((ev: any, idx: number) => (
                                <div
                                  key={ev.id || idx}
                                  className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs space-y-3 text-xs"
                                >
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                                    <div className="flex items-center gap-2">
                                      <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-[11px]">
                                        {ev.evaluator?.fullName?.charAt(0) || "E"}
                                      </div>
                                      <div>
                                        <strong className="text-slate-900 font-bold block">
                                          {ev.evaluator?.fullName || "Chuyên gia phỏng vấn"}
                                        </strong>
                                        <span className="text-[10px] text-slate-400 font-semibold">
                                          {ev.evaluator?.role === "HIRING_MANAGER" ? "Hiring Manager" : "Ban Giám Khảo"} &bull; {formatDateTime(ev.createdAt)}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <span
                                        className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] border ${
                                          ev.recommendation === "HIRE" || ev.recommendation === "STRONG_HIRE"
                                            ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                                            : "bg-red-50 text-red-700 border-red-300"
                                        }`}
                                      >
                                        {ev.recommendation === "STRONG_HIRE"
                                          ? "Rất khuyến khích tuyển"
                                          : ev.recommendation === "HIRE"
                                          ? "Đồng ý tuyển dụng"
                                          : ev.recommendation === "NO_HIRE"
                                          ? "Không tuyển"
                                          : "Từ chối tuyệt đối"}
                                      </span>
                                      <div className="px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 font-bold text-xs flex items-center gap-1">
                                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                        <span>{Number(ev.overallScore || 0).toFixed(2)}/5.0</span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                                      <span className="text-slate-400 block text-[10px]">Chuyên Môn (40%)</span>
                                      <strong className="text-slate-800 font-bold text-xs">{ev.technicalScore}/5</strong>
                                    </div>
                                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                                      <span className="text-slate-400 block text-[10px]">Giao Tiếp (30%)</span>
                                      <strong className="text-slate-800 font-bold text-xs">{ev.communicationScore}/5</strong>
                                    </div>
                                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                                      <span className="text-slate-400 block text-[10px]">Văn Hóa (30%)</span>
                                      <strong className="text-slate-800 font-bold text-xs">{ev.culturalFitScore}/5</strong>
                                    </div>
                                  </div>

                                  {ev.comments && (
                                    <div className="p-2.5 rounded-lg bg-amber-50/50 border border-amber-200/60 text-slate-700 text-xs leading-relaxed">
                                      <span className="font-bold text-amber-900 block mb-0.5">Nhận xét chi tiết của Chuyên gia:</span>
                                      <p>{ev.comments}</p>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="p-3 bg-white/70 rounded-xl border border-dashed border-amber-200 text-xs text-amber-900 flex items-center justify-between">
                              <span>Hội đồng chuyên môn chưa hoàn thành phiếu đánh giá phỏng vấn cho ứng viên này.</span>
                              <button
                                type="button"
                                onClick={() => setIsScorecardOpen(true)}
                                className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] shadow-xs cursor-pointer"
                              >
                                + Nhập Đánh Giá Ngay
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ========================================================================= */}
                {/* TAB 2: XEM TRƯỚC CV GỐC (FULL EMBEDDED VISUAL PDF VIEWER) */}
                {/* ========================================================================= */}
                {activeTab === "cv" && (
                  <div className="space-y-4">
                    {/* Thanh công cụ xem PDF */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-red-100 text-red-700 flex items-center justify-center font-bold shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 truncate max-w-xs sm:max-w-md">
                            {data?.candidate?.cvFileUrl?.split("/").pop()}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Định dạng tệp: Tài liệu PDF chuẩn gốc
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Toggle Chế độ xem */}
                        <div className="bg-slate-200/80 p-0.5 rounded-xl flex items-center text-[11px] font-bold">
                          <button
                            type="button"
                            onClick={() => setCvViewMode("pdf")}
                            className={`px-3 py-1.5 rounded-lg transition-all ${
                              cvViewMode === "pdf"
                                ? "bg-white text-slate-900 shadow-xs"
                                : "text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            👁️ Xem PDF Trực Quan
                          </button>
                          <button
                            type="button"
                            onClick={() => setCvViewMode("text")}
                            className={`px-3 py-1.5 rounded-lg transition-all ${
                              cvViewMode === "text"
                                ? "bg-white text-slate-900 shadow-xs"
                                : "text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            📝 Văn Bản Trích Xuất
                          </button>
                        </div>

                        {data?.candidate?.cvFileUrl && (
                          <>
                            <a
                              href={data.candidate.cvFileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2 text-slate-600 hover:text-brand-600 hover:bg-white rounded-xl border border-slate-200 transition-colors"
                              title="Mở toàn màn hình trong Tab mới"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                            <a
                              href={data.candidate.cvFileUrl}
                              download
                              className="p-2 text-slate-600 hover:text-brand-600 hover:bg-white rounded-xl border border-slate-200 transition-colors"
                              title="Tải tệp PDF về máy tính"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Vùng hiển thị PDF Trực quan hoặc Văn bản thô */}
                    {cvViewMode === "pdf" ? (
                      <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm bg-slate-100 flex flex-col items-center justify-center min-h-[680px]">
                        {data?.candidate?.cvFileUrl ? (
                          <iframe
                            src={`${data.candidate.cvFileUrl}#toolbar=1&navpanes=0&scrollbar=1`}
                            className="w-full h-[720px] rounded-2xl border-none"
                            title="Tài liệu CV PDF Gốc"
                          />
                        ) : (
                          <div className="text-center p-8 text-slate-400">
                            <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p className="text-sm font-semibold">Chưa có tệp PDF tải lên</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs text-slate-500 px-1">
                          <span>Văn bản trích xuất từ tài liệu CV:</span>
                          <span>{data?.candidate?.cvText?.length || 0} ký tự</span>
                        </div>
                        <div className="bg-slate-900 text-slate-100 p-5 rounded-2xl font-mono text-xs leading-relaxed max-h-[650px] overflow-y-auto border border-slate-800 shadow-inner whitespace-pre-line">
                          {data?.candidate?.cvText || "Không có nội dung văn bản trích xuất."}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ========================================================================= */}
                {/* TAB 3: AUDIT LOGS & SCORECARD */}
                {/* ========================================================================= */}
                {activeTab === "history" && (
                  <div className="space-y-6">
                    {/* Scorecards */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                          <Star className="w-4 h-4 text-purple-600 fill-purple-600" />
                          Phiếu đánh giá phỏng vấn:
                        </h4>
                        <button
                          type="button"
                          onClick={() => setIsScorecardOpen(true)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                        >
                          <Star className="w-3.5 h-3.5 fill-white" />
                          + Đánh Giá Phỏng Vấn
                        </button>
                      </div>

                      {data?.evaluations?.length === 0 ? (
                        <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                          Chưa có phiếu đánh giá phỏng vấn nào cho ứng viên này.
                        </div>
                      ) : (
                        data?.evaluations?.map((ev: any) => (
                          <div
                            key={ev.id}
                            className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 text-xs shadow-2xs"
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-slate-900">
                                Giám khảo: {ev.evaluator?.fullName}
                              </span>
                              <span className="font-extrabold text-brand-600 text-sm">
                                {ev.overallScore ? `${ev.overallScore.toFixed(1)}/5.0★` : "Chưa chấm"}
                              </span>
                            </div>

                            <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-100 text-[11px]">
                              <div>
                                Chuyên môn (40%): <b>{ev.technicalScore}/5★</b>
                              </div>
                              <div>
                                Giao tiếp (30%): <b>{ev.communicationScore}/5★</b>
                              </div>
                              <div>
                                Văn hóa (30%): <b>{ev.culturalFitScore}/5★</b>
                              </div>
                            </div>

                            {ev.comments && (
                              <p className="text-slate-600 italic font-medium">"{ev.comments}"</p>
                            )}
                            <div className="text-[10px] text-slate-400">
                              Đánh giá lúc: {formatDateTime(ev.createdAt)}
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Timeline Audit Logs */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        <History className="w-4 h-4 text-slate-500" />
                        Nhật ký luân chuyển trạng thái:
                      </h4>

                      <div className="space-y-2">
                        {data?.auditLogs?.map((log: any) => (
                          <div
                            key={log.id}
                            className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 text-xs flex justify-between items-center"
                          >
                            <div>
                              <p className="font-semibold text-slate-800">
                                Chuyển từ <span className="text-slate-500">{log.fromStage || "N/A"}</span>{" "}
                                ➔ <span className="text-brand-600 font-bold">{log.toStage}</span>
                              </p>
                              <p className="text-[11px] text-slate-400">
                                Thực hiện bởi: {log.user?.fullName || "Hệ thống"}
                              </p>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {formatDateTime(log.createdAt)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer Actions: Chuyển Stage nhanh */}
          <div className="p-5 border-t border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Chuyển vòng tuyển:</span>
              <div className="flex flex-wrap gap-1">
                {stages.map((st) => (
                  <button
                    key={st.key}
                    onClick={() => handleQuickMove(st.key)}
                    disabled={actionLoading || data?.currentStage === st.key}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                      data?.currentStage === st.key
                        ? "bg-brand-600 text-white border-brand-600 shadow-xs cursor-default"
                        : "bg-white hover:bg-slate-100 text-slate-700 border-slate-300"
                    }`}
                  >
                    {st.key}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>

      {/* Scorecard Modal (BRL-08) */}
      <ScorecardModal
        applicationId={applicationId}
        candidateName={data?.candidate?.fullName || ""}
        jobTitle={data?.job?.title || ""}
        isOpen={isScorecardOpen}
        onClose={() => setIsScorecardOpen(false)}
        onSuccess={() => {
          fetch(`/api/applications/${applicationId}`)
            .then((r) => r.json())
            .then((r) => r.success && setData(r.data));
        }}
      />

      {/* Modal Lên Lịch Phỏng Vấn (UC-05A) */}
      {isInterviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">
                      {data?.interviewDate ? "Chỉnh Sửa Lịch Phỏng Vấn" : "Lên Lịch Phỏng Vấn Mới"}
                    </h3>
                    {data?.interviewDate && (
                      <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-bold border border-purple-200">
                        Đang có lịch
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    Ứng viên: <strong>{data?.candidate?.fullName}</strong> &bull; {data?.job?.title}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsInterviewModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isUnderQualified && (
              <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3.5 text-xs text-amber-900 space-y-1.5 animate-in fade-in">
                <div className="flex items-center gap-2 font-bold text-amber-950">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Lưu ý: Hồ sơ ứng viên chưa đạt đầy đủ tiêu chuẩn yêu cầu</span>
                </div>
                {missingSkillsList.length > 0 && (
                  <div className="flex flex-wrap gap-1 text-[11px]">
                    <span className="font-semibold text-amber-800">Thiếu:</span>
                    {missingSkillsList.map((sk, i) => (
                      <span key={i} className="px-1.5 py-0.5 rounded bg-white text-red-700 text-[10px] font-bold border border-red-200">
                        ✖ {sk}
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Bạn đang thực hiện xếp lịch phỏng vấn đặc cách cho ứng viên này. Vui lòng kiểm tra kỹ trước khi bấm xác nhận để tránh gửi nhầm thư mời.
                </p>
              </div>
            )}

            <form onSubmit={handleScheduleInterview} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Ngày & Giờ Phỏng Vấn <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={interviewDate}
                    onChange={(e) => setInterviewDate(e.target.value)}
                    required
                    className="w-full text-xs rounded-xl border border-slate-200 bg-white py-2.5 px-3 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Hình Thức Phỏng Vấn <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={interviewFormat}
                    onChange={(e) => setInterviewFormat(e.target.value as any)}
                    className="w-full text-xs rounded-xl border border-slate-200 bg-white py-2.5 px-3 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="ONLINE">Trực tuyến</option>
                    <option value="OFFLINE">Trực tiếp tại văn phòng</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {interviewFormat === "ONLINE"
                    ? "Đường dẫn phòng họp trực tuyến *"
                    : "Địa chỉ phòng họp trực tiếp *"}
                </label>
                <input
                  type="text"
                  value={interviewLocation}
                  onChange={(e) => setInterviewLocation(e.target.value)}
                  placeholder={
                    interviewFormat === "ONLINE"
                      ? "https://meet.google.com/xyz-abcd-efg"
                      : "Phòng Họp Lotus 3, Tầng 18, Tòa nhà RecoverX Tower, TP.HCM"
                  }
                  required
                  className="w-full text-xs rounded-xl border border-slate-200 bg-white py-2.5 px-3 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Ghi chú gửi ứng viên
                </label>
                <textarea
                  rows={2}
                  value={interviewNotes}
                  onChange={(e) => setInterviewNotes(e.target.value)}
                  placeholder="Vui lòng chuẩn bị slide hoặc portfolio giới thiệu dự án tiêu biểu, kiểm tra kết nối mạng trước 5 phút..."
                  className="w-full text-xs rounded-xl border border-slate-200 bg-white py-2 px-3 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Lưu ý cho hội đồng phỏng vấn
                </label>
                <textarea
                  rows={2}
                  value={interviewInterviewerNotes}
                  onChange={(e) => setInterviewInterviewerNotes(e.target.value)}
                  placeholder="Tập trung hỏi sâu về kiến trúc hệ thống, kinh nghiệm xử lý tải cao, tư duy giải thuật..."
                  className="w-full text-xs rounded-xl border border-slate-200 bg-white py-2 px-3 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Biên bản phỏng vấn
                </label>
                <textarea
                  rows={2}
                  value={interviewPostNotes}
                  onChange={(e) => setInterviewPostNotes(e.target.value)}
                  placeholder="Ứng viên thể hiện phong thái tự tin, trả lời tốt câu hỏi tình huống, hội đồng đánh giá tích cực..."
                  className="w-full text-xs rounded-xl border border-slate-200 bg-white py-2 px-3 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {interviewError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{interviewError}</span>
                </div>
              )}

              {/* Email Template Preview / Success */}
              {interviewSuccessEmail && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Mẫu thư mời phỏng vấn:
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(interviewSuccessEmail);
                        setCopiedEmail(true);
                        setTimeout(() => setCopiedEmail(false), 3000);
                      }}
                      className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 inline-flex items-center gap-1 px-2 py-1 bg-white rounded-lg border border-emerald-300 cursor-pointer"
                    >
                      {copiedEmail ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Đã sao chép!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Sao chép thư</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="text-[11px] text-slate-700 font-mono bg-white p-3 rounded-lg border border-emerald-100 max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                    {interviewSuccessEmail}
                  </pre>
                </div>
              )}

              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
                {data?.interviewDate ? (
                  <button
                    type="button"
                    onClick={handleCancelInterview}
                    disabled={isCancellingInterview}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 rounded-xl transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>{isCancellingInterview ? "Đang hủy..." : "Hủy Lịch Phỏng Vấn"}</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsInterviewModalOpen(false)}
                    disabled={interviewLoading}
                    className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    Đóng
                  </button>
                  <button
                    type="submit"
                    disabled={interviewLoading}
                    className="px-5 py-2.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 rounded-xl shadow-md shadow-purple-500/20 flex items-center gap-2 cursor-pointer"
                  >
                    {interviewLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Đang lưu...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>{data?.interviewDate ? "Lưu Thay Đổi & Gửi Thư Cập Nhật" : "Xác Nhận & Tạo Thư Mời"}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox Phóng to Ảnh Bằng cấp / Chứng chỉ */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-700 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-3.5 bg-slate-800 text-white border-b border-slate-700">
              <span className="text-xs font-bold truncate max-w-md">{previewImageTitle}</span>
              <div className="flex items-center gap-2">
                <a
                  href={previewImage}
                  download
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                  title="Tải ảnh về máy"
                >
                  <Download className="w-4 h-4" />
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewImage(null)}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
                  title="Đóng"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-2 flex items-center justify-center max-h-[80vh] overflow-auto">
              <img
                src={previewImage}
                alt={previewImageTitle}
                className="max-h-[75vh] w-auto object-contain rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal Cảnh báo khi chuyển vòng / xếp lịch hồ sơ chưa đạt chuẩn */}
      {mismatchWarning && (
        <StageMismatchConfirmModal
          isOpen={true}
          onClose={() => setMismatchWarning(null)}
          onConfirm={async () => {
            const action = mismatchWarning.actionType;
            const target = mismatchWarning.targetStage;
            setMismatchWarning(null);
            if (action === "MOVE_STAGE") {
              await executeQuickMove(target);
            } else if (action === "SCHEDULE_INTERVIEW") {
              await executeScheduleInterview();
            }
          }}
          candidateName={data?.candidate?.fullName || "Ứng viên"}
          jobTitle={data?.job?.title || "Vị trí tuyển dụng"}
          targetStage={mismatchWarning.targetStage}
          missingSkills={missingSkillsList}
          expYears={candidateExp}
          minExpYears={minExpRequired}
          rationale={data?.aiMatchRationale || ""}
          actionType={mismatchWarning.actionType}
        />
      )}
    </div>
  );
}
