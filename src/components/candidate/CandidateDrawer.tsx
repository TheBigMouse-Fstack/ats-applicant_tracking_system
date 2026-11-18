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
  ChevronDown,
  ChevronUp,
  Save,
  Lock,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import ScorecardPanel from "@/components/scorecard/ScorecardPanel";
import StageMismatchConfirmModal from "@/components/candidate/StageMismatchConfirmModal";
import RejectReasonModal from "@/components/candidate/RejectReasonModal";
import { getAllowedTargetStages, validateStageTransition } from "@/lib/stage-rules";
import { getAiMatchTier } from "@/lib/match-score";

interface CandidateDrawerProps {
  applicationId: number | null;
  onClose: () => void;
  onStageChange: (
    appId: number,
    toStage: string,
    rejectionReason?: string
  ) => Promise<boolean | string>;
}

export default function CandidateDrawer({
  applicationId,
  onClose,
  onStageChange,
}: CandidateDrawerProps) {
  const [data, setData] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "overview" | "jd" | "cv" | "evaluation" | "history"
  >("overview");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [openEvaluationForm, setOpenEvaluationForm] = useState(false);

  // Progressive Disclosure: Mặc định chỉ hiển thị 5 trường cốt lõi theo JD; bấm để xem chi tiết
  const [showDetailedProfile, setShowDetailedProfile] = useState(false);

  // Chỉnh sửa thủ công hồ sơ cho HR/Admin (khắc phục bóc tách text sai)
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [editFullName, setEditFullName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editExpYears, setEditExpYears] = useState<number>(0);
  const [editSkills, setEditSkills] = useState<string[]>([]);
  const [newSkillInput, setNewSkillInput] = useState("");

  // Modal bắt buộc nhập Lý do từ chối (BRL-11)
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

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

  // Tải thông tin tài khoản hiện tại để phân quyền UI (RBAC)
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((d) => d.success && setCurrentUser(d.user))
      .catch(() => {});
  }, []);

  // Tải chi tiết hồ sơ
  useEffect(() => {
    if (!applicationId) return;

    setLoading(true);
    setActionError("");
    setReparseNotice(null);
    setInterviewSuccessEmail(null);
    setInterviewError(null);
    setShowDetailedProfile(false);
    setIsEditingProfile(false);
    setIsRejectModalOpen(false);

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

  const canEditProfile = currentUser?.role === "HR" || currentUser?.role === "ADMIN";
  const canManageInterview =
    currentUser?.role === "HIRING_MANAGER" || currentUser?.role === "ADMIN";

  // Bật chế độ chỉnh sửa 5 trường thông tin cốt lõi cho HR / Admin
  const handleStartEditProfile = () => {
    setEditFullName(data?.candidate?.fullName || "");
    setEditEmail(data?.candidate?.email || "");
    setEditPhone(data?.candidate?.phone || "");
    setEditExpYears(Number(data?.candidate?.experienceYears ?? 0));
    let currentSkills: string[] = [];
    try {
      currentSkills = JSON.parse(data?.candidate?.parsedSkills || "[]");
    } catch {
      currentSkills = [];
    }
    setEditSkills(Array.isArray(currentSkills) ? currentSkills : []);
    setNewSkillInput("");
    setActionError("");
    setIsEditingProfile(true);
  };

  const handleAddSkill = () => {
    const trimmed = newSkillInput.trim();
    if (!trimmed) return;
    if (!editSkills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setEditSkills((prev) => [...prev, trimmed]);
    }
    setNewSkillInput("");
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setEditSkills((prev) => prev.filter((s) => s !== skillToRemove));
  };

  const handleSaveProfile = async () => {
    setActionError("");
    setSavingProfile(true);
    try {
      const res = await fetch(`/api/applications/${applicationId}/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: editFullName,
          email: editEmail,
          phone: editPhone,
          experienceYears: editExpYears,
          skills: editSkills,
        }),
      });
      const resData = await res.json();
      if (!res.ok || !resData.success) {
        setActionError(resData.error || "Không thể lưu chỉnh sửa hồ sơ.");
      } else {
        setData(resData.data);
        setIsEditingProfile(false);
        setReparseNotice(
          resData.message || "Đã lưu chỉnh sửa thông tin hồ sơ và cập nhật đối chiếu JD thành công."
        );
        setTimeout(() => setReparseNotice(null), 5000);
      }
    } catch (e: any) {
      setActionError("Lỗi kết nối khi lưu chỉnh sửa hồ sơ.");
    } finally {
      setSavingProfile(false);
    }
  };

  // Phân tích tiêu chuẩn ứng viên so với JD (Tránh thao tác nhầm)
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
  const executeQuickMove = async (toStage: string, rejectionReason?: string) => {
    setActionError("");
    setActionLoading(true);
    const result = await onStageChange(applicationId, toStage, rejectionReason);
    setActionLoading(false);

    if (typeof result === "string") {
      setActionError(result); // Báo lỗi quy tắc chuyển trạng thái hoặc RBAC
    } else if (result === true) {
      // Reload dữ liệu drawer
      fetch(`/api/applications/${applicationId}`)
        .then((r) => r.json())
        .then((r) => r.success && setData(r.data));
    }
  };

  const handleQuickMove = async (toStage: string) => {
    setActionError("");

    // Kiểm tra sơ bộ quy tắc vai trò & trình tự State Machine
    if (data?.currentStage && currentUser?.role) {
      const hasPassing = (data?.evaluations || []).some(
        (ev: any) => ev.recommendation === "HIRE" || ev.recommendation === "STRONG_HIRE"
      );
      const check = validateStageTransition({
        fromStage: data.currentStage,
        toStage,
        role: currentUser.role,
        evaluationsCount: data?.evaluations?.length || 0,
        hasPassingEvaluation: (data?.evaluations?.length || 0) > 0 ? hasPassing : undefined,
        rejectionReason: toStage === "REJECTED" ? "placeholder-for-precheck" : undefined,
      });

      if (!check.allowed) {
        setActionError(check.error || "Không được phép thực hiện thao tác chuyển trạng thái này.");
        return;
      }
    }

    // Nếu chuyển sang REJECTED ➔ mở Modal bắt buộc nhập Lý do từ chối (BRL-11)
    if (toStage === "REJECTED") {
      setIsRejectModalOpen(true);
      return;
    }

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
        setReparseNotice("Đã cập nhật lại thông tin hồ sơ thành công!");
        setTimeout(() => setReparseNotice(null), 5000);
      } else {
        setActionError(resData.error || "Không thể cập nhật hồ sơ");
      }
    } catch (e: any) {
      setActionError("Lỗi kết nối khi trích xuất hồ sơ.");
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
  const matchTier = getAiMatchTier(data?.aiMatchScore);

  // Chỉ hiển thị nút "Thử đánh giá lại AI" khi AI thực sự thất bại / chưa chấm được (mất mạng, lỗi server)
  const needsAiRetry =
    data?.aiMatchScore === null ||
    data?.aiMatchScore === undefined ||
    !data?.aiMatchRationale ||
    /lỗi kết nối|chưa có đánh giá|không thể kết nối|timeout|thất bại/i.test(
      String(data?.aiMatchRationale || "")
    );

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
          {/* Header Tối Giản: Chỉ Tên ứng viên + Icon Sao + Đóng (không lặp lại Stage/AI %/Vị trí vốn đã có ở dưới) */}
          <div className="px-6 py-4 border-b border-slate-200 bg-white flex items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight truncate">
              {loading ? "Đang tải hồ sơ..." : data?.candidate?.fullName}
            </h2>

            <div className="flex items-center gap-1 shrink-0">
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
                title={data?.isStarred ? "Bỏ gắn sao" : "Gắn sao ưu tiên"}
                className="p-2 rounded-xl text-slate-400 hover:text-amber-500 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <Star
                  className={`w-4 h-4 ${
                    data?.isStarred ? "fill-amber-400 text-amber-400" : "text-slate-400"
                  }`}
                />
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs (5 Tab Tách Biệt Rõ Ràng) */}
          <div className="flex border-b border-slate-200 px-6 bg-white gap-5 overflow-x-auto">
            <button
              onClick={() => setActiveTab("overview")}
              className={`py-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === "overview"
                  ? "border-brand-600 text-brand-600"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              <User className="w-3.5 h-3.5" />
              Hồ sơ &amp; AI
            </button>

            <button
              onClick={() => setActiveTab("jd")}
              className={`py-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === "jd"
                  ? "border-brand-600 text-brand-600"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              Tiêu chuẩn vị trí (JD)
            </button>

            <button
              onClick={() => setActiveTab("cv")}
              className={`py-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === "cv"
                  ? "border-brand-600 text-brand-600"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              CV Gốc
            </button>

            <button
              onClick={() => setActiveTab("evaluation")}
              className={`py-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === "evaluation"
                  ? "border-purple-600 text-purple-700"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              <Star className="w-3.5 h-3.5" />
              Phiếu đánh giá ({data?.evaluations?.length || 0})
            </button>

            <button
              onClick={() => setActiveTab("history")}
              className={`py-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === "history"
                  ? "border-brand-600 text-brand-600"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Nhật ký ({data?.auditLogs?.length || 0})
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
                    {/* BANNER LÝ DO TỪ CHỐI (Nếu đang ở trạng thái REJECTED) */}
                    {data?.currentStage === "REJECTED" && data?.rejectionReason && (
                      <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-3">
                        <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="font-bold text-rose-900 uppercase tracking-wider text-[11px]">
                            Lý Do Từ Chối Hồ Sơ
                          </p>
                          <p className="font-medium leading-relaxed">{data.rejectionReason}</p>
                        </div>
                      </div>
                    )}

                    {/* KHỐI 1 (HERO): THÔNG TIN CÁ NHÂN & 5 TRƯỜNG DỮ LIỆU CỐT LÕI */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
                      <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-slate-100">
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center font-extrabold text-lg shadow-sm shadow-brand-500/25 shrink-0">
                            {(data?.candidate?.fullName || "U").charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 block">
                              1. Thông Tin Cá Nhân &amp; Hồ Sơ Cốt Lõi
                            </span>
                            <h3 className="text-lg font-extrabold text-slate-900 tracking-tight truncate">
                              {data?.candidate?.fullName}
                            </h3>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 mt-0.5">
                              <span className="inline-flex items-center gap-1 font-medium text-slate-800">
                                <Mail className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                                {data?.candidate?.email}
                              </span>
                              {data?.candidate?.phone && (
                                <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  {data?.candidate?.phone}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {canEditProfile && !isEditingProfile && (
                            <button
                              type="button"
                              onClick={handleStartEditProfile}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all cursor-pointer"
                              title="Chỉnh sửa hoặc bổ sung thủ công các trường trích xuất từ CV"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Chỉnh sửa</span>
                            </button>
                          )}

                          {!isEditingProfile && (
                            <button
                              type="button"
                              onClick={() => setShowDetailedProfile((prev) => !prev)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200 transition-all cursor-pointer"
                            >
                              {showDetailedProfile ? (
                                <>
                                  <ChevronUp className="w-3.5 h-3.5" />
                                  <span>Thu gọn chi tiết</span>
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="w-3.5 h-3.5" />
                                  <span>Xem chi tiết hồ sơ</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* CHẾ ĐỘ CHỈNH SỬA THỦ CÔNG CHO HR / ADMIN */}
                      {isEditingProfile ? (
                        <div className="space-y-4 bg-slate-50/80 p-4 rounded-xl border border-brand-200">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div>
                              <label className="block font-bold text-slate-700 mb-1">
                                1. Họ và tên <span className="text-rose-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={editFullName}
                                onChange={(e) => setEditFullName(e.target.value)}
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                              />
                            </div>
                            <div>
                              <label className="block font-bold text-slate-700 mb-1">
                                2. Email liên hệ <span className="text-rose-500">*</span>
                              </label>
                              <input
                                type="email"
                                value={editEmail}
                                onChange={(e) => setEditEmail(e.target.value)}
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                              />
                            </div>
                            <div>
                              <label className="block font-bold text-slate-700 mb-1">
                                3. Số năm kinh nghiệm <span className="text-rose-500">*</span>
                              </label>
                              <input
                                type="number"
                                min={0}
                                max={50}
                                value={editExpYears}
                                onChange={(e) => setEditExpYears(Number(e.target.value))}
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                              />
                            </div>
                            <div>
                              <label className="block font-bold text-slate-700 mb-1">
                                Số điện thoại
                              </label>
                              <input
                                type="text"
                                value={editPhone}
                                onChange={(e) => setEditPhone(e.target.value)}
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                              />
                            </div>
                          </div>

                          {/* Chỉnh sửa danh sách Kỹ năng */}
                          <div className="space-y-2 text-xs">
                            <label className="block font-bold text-slate-700">
                              4. Kỹ năng chuyên môn ({editSkills.length})
                            </label>
                            <div className="flex flex-wrap gap-1.5">
                              {editSkills.map((sk) => (
                                <span
                                  key={sk}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white text-slate-800 font-semibold border border-slate-300"
                                >
                                  <span>{sk}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveSkill(sk)}
                                    className="text-slate-400 hover:text-rose-600 cursor-pointer"
                                    title="Xóa kỹ năng"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </span>
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={newSkillInput}
                                onChange={(e) => setNewSkillInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleAddSkill();
                                  }
                                }}
                                placeholder="Nhập thêm kỹ năng bị sót (VD: TypeScript, Docker, SQL)..."
                                className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                              />
                              <button
                                type="button"
                                onClick={handleAddSkill}
                                className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Thêm</span>
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                            <button
                              type="button"
                              onClick={() => setIsEditingProfile(false)}
                              disabled={savingProfile}
                              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 border border-slate-300 cursor-pointer"
                            >
                              Hủy
                            </button>
                            <button
                              type="button"
                              onClick={handleSaveProfile}
                              disabled={savingProfile}
                              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-xs disabled:opacity-60 cursor-pointer"
                            >
                              {savingProfile ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  <span>Đang lưu...</span>
                                </>
                              ) : (
                                <>
                                  <Save className="w-3.5 h-3.5" />
                                  <span>Lưu thay đổi</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* CHẾ ĐỘ HIỂN THỊ CHUẨN: VỊ TRÍ ỨNG TUYỂN & KINH NGHIỆM NỔI BẬT */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div className="bg-slate-50/90 p-3.5 rounded-xl border border-slate-200/80">
                              <span className="text-[11px] font-semibold text-slate-500 block mb-0.5">
                                Vị trí ứng tuyển
                              </span>
                              <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5 truncate">
                                <Briefcase className="w-4 h-4 text-slate-400 shrink-0" />
                                <span className="truncate">{data?.job?.title}</span>
                              </span>
                            </div>

                            <div className="bg-slate-50/90 p-3.5 rounded-xl border border-slate-200/80">
                              <span className="text-[11px] font-semibold text-slate-500 block mb-0.5">
                                Số năm kinh nghiệm
                              </span>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className={`font-extrabold text-sm flex items-center gap-1 ${
                                    minExpRequired > 0 && candidateExp < minExpRequired
                                      ? "text-rose-600"
                                      : "text-emerald-700"
                                  }`}
                                >
                                  <Clock className="w-4 h-4 shrink-0" />
                                  {candidateExp} năm
                                </span>
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white border border-slate-200 text-slate-600">
                                  JD yêu cầu ≥ {minExpRequired} năm
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Trường thứ 5: Kỹ năng theo JD */}
                          <div className="space-y-2">
                            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                              Kỹ Năng Trích Xuất ({parsedSkills.length})
                            </h4>
                            <div className="flex flex-wrap gap-1.5">
                              {parsedSkills.length > 0 ? (
                                parsedSkills.map((skill: string, idx: number) => {
                                  const isRequiredByJd = jobRequiredSkills.some(
                                    (req: string) =>
                                      req.toLowerCase() === skill.toLowerCase() ||
                                      skill.toLowerCase().includes(req.toLowerCase())
                                  );
                                  return (
                                    <span
                                      key={idx}
                                      className={`px-3 py-1 rounded-lg text-xs font-semibold border shadow-2xs ${
                                        isRequiredByJd
                                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                          : "bg-slate-100 text-slate-700 border-slate-200"
                                      }`}
                                    >
                                      {skill}
                                    </span>
                                  );
                                })
                              ) : (
                                <span className="text-xs text-slate-400">
                                  Chưa trích xuất được kỹ năng — HR có thể bấm &quot;Chỉnh sửa&quot; để bổ sung
                                </span>
                              )}
                            </div>
                          </div>
                        </>
                      )}

                      {/* PHẦN MỞ RỘNG KHI CẦN: XEM CHI TIẾT HỒ SƠ (Progressive Disclosure) */}
                      {showDetailedProfile && !isEditingProfile && (
                        <div className="pt-4 mt-2 border-t border-slate-200 space-y-5 animate-in fade-in">
                          <div className="flex items-center gap-3 text-xs">
                            <span className="text-slate-500">Số điện thoại:</span>
                            <span className="font-bold text-slate-800 flex items-center gap-1">
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              {data?.candidate?.phone}
                            </span>
                          </div>

                          {/* Học vấn & Bằng cấp */}
                          <div className="space-y-2">
                            <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
                              <GraduationCap className="w-4 h-4 text-brand-600" />
                              Học Vấn & Bằng Cấp:
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
                                      {edu.year || edu.grad_year || "N/A"}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Kinh nghiệm làm việc chi tiết */}
                          <div className="space-y-2">
                            <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
                              <Briefcase className="w-4 h-4 text-brand-600" />
                              Lịch Sử Kinh Nghiệm Làm Việc Chi Tiết:
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

                          {/* Bằng cấp & Chứng chỉ đính kèm (Ảnh / PDF) */}
                          <div className="space-y-2.5 pt-2 border-t border-slate-100">
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
                      )}
                    </div>

                    {/* KHỐI 2: ĐÁNH GIÁ MỨC ĐỘ PHÙ HỢP AI (% MATCH SCORE - NỀN TRẮNG PHẲNG THANH LỊCH) */}
                    <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
                        <div>
                          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                            2. Đánh Giá Mức Độ Phù Hợp AI
                          </h3>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Gợi ý đối chiếu tự động theo yêu cầu vị trí — HR &amp; Quản lý quyết định cuối cùng
                          </p>
                        </div>

                        {canEditProfile && needsAiRetry && (
                          <button
                            type="button"
                            onClick={handleReparse}
                            disabled={reparsing}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors cursor-pointer"
                            title="AI chưa chấm được điểm do lỗi mạng hoặc máy chủ — bấm để thử lại"
                          >
                            <RotateCw className={`w-3.5 h-3.5 ${reparsing ? "animate-spin text-amber-600" : ""}`} />
                            <span>{reparsing ? "Đang thử lại..." : "Thử đánh giá lại AI"}</span>
                          </button>
                        )}
                      </div>

                      {/* Chỉ số % AI Match nổi bật + Thanh tiến trình + Phân tầng 3 mức chuẩn ngành */}
                      <div className="bg-white rounded-xl border border-slate-200/90 p-4 space-y-3 shadow-2xs">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-baseline gap-2.5">
                            <span className={`text-3xl font-extrabold tracking-tight ${matchTier.scoreTextClass}`}>
                              {matchTier.score !== null ? `${matchTier.score}%` : "—"}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${matchTier.badgeClass}`}
                            >
                              <span className={`w-2 h-2 rounded-full ${matchTier.dotClass}`} />
                              {matchTier.label}
                            </span>
                          </div>
                          <span className="text-xs font-semibold text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                            Đáp ứng {aiMatchedSkills.length}/{jobRequiredSkills.length} kỹ năng JD
                          </span>
                        </div>

                        {/* Thanh tiến trình trực quan */}
                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${matchTier.score ?? 0}%` }}
                            className={`h-full rounded-full transition-all duration-500 ${matchTier.barClass}`}
                          />
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                          <span className="font-medium text-slate-600">{matchTier.recommendation}</span>
                          <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-400 shrink-0">
                            <span className="inline-flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-rose-500" /> &lt;50% Thấp
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-amber-500" /> 50–74% Cân nhắc
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-emerald-500" /> ≥75% Cao
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Phân tích Kỹ năng Đạt vs Còn thiếu */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-white/95 p-3.5 rounded-xl border border-emerald-200 shadow-2xs">
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

                        <div className="bg-white/95 p-3.5 rounded-xl border border-rose-200 shadow-2xs">
                          <span className="text-xs font-bold text-rose-800 flex items-center gap-1.5 mb-2">
                            <XCircle className="w-4 h-4 text-rose-600" />
                            Kỹ năng Còn thiếu ({aiMissingSkills.length}):
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {aiMissingSkills.length > 0 ? (
                              aiMissingSkills.map((s: string, idx: number) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 text-[11px] font-bold border border-rose-200"
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

                      {/* Giải trình chi tiết từ Hybrid AI */}
                      {data?.aiMatchRationale && (
                        <div className="bg-white/95 p-4 rounded-xl border border-slate-200 text-xs text-slate-800 leading-relaxed shadow-2xs">
                          <span className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                            <Award className="w-3.5 h-3.5 text-brand-600" />
                            Tóm tắt nhận định từ AI:
                          </span>
                          <p className="font-medium text-slate-700">{data.aiMatchRationale}</p>
                        </div>
                      )}
                    </div>

                    {/* KHỐI 3: LỊCH HẸN PHỎNG VẤN */}
                    {(data?.interviewDate ||
                      data?.currentStage === "INTERVIEW" ||
                      (canManageInterview && data?.currentStage === "SCREENING")) && (
                      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold shrink-0">
                              <Calendar className="w-4 h-4" />
                            </div>
                            <div>
                              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                                <span>3. Lịch Hẹn Phỏng Vấn</span>
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
                            {canManageInterview ? (
                              data?.interviewDate ? (
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
                              )
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-semibold border border-slate-200">
                                <Lock className="w-3 h-3" />
                                Do Hiring Manager phụ trách
                              </span>
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
                      </div>
                    )}
                  </div>
                )}

                {/* ========================================================================= */}
                {/* TAB 2: TIÊU CHUẨN YÊU CẦU VỊ TRÍ (JD) - MỞ KHI HR/MANAGER CẦN ĐỐI CHIẾU */}
                {/* ========================================================================= */}
                {activeTab === "jd" && (
                  <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs space-y-5">
                    <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold border border-amber-100">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                          Tiêu Chuẩn Yêu Cầu Vị Trí (JD)
                        </h3>
                        <p className="text-xs text-slate-500">
                          Cơ sở đối chiếu năng lực ứng viên và tiêu chuẩn chấm điểm AI
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50/80 p-4 rounded-xl border border-slate-200/80 text-xs">
                      <div>
                        <span className="text-slate-400 block mb-0.5">Vị trí tuyển dụng</span>
                        <span className="font-bold text-slate-900 text-sm">{data?.job?.title}</span>
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

                    {/* Kỹ năng bắt buộc trong JD (highlight ứng viên đã đáp ứng vs chưa có) */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Kỹ năng bắt buộc ({jobRequiredSkills.length}):
                        </span>
                        <span className="text-[11px] font-semibold text-slate-500">
                          Ứng viên đáp ứng {aiMatchedSkills.length}/{jobRequiredSkills.length} kỹ năng
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {jobRequiredSkills.map((sk: string, idx: number) => {
                          const isMatched = aiMatchedSkills.some(
                            (m: string) => m.toLowerCase() === sk.toLowerCase()
                          );
                          return (
                            <span
                              key={idx}
                              className={`px-3 py-1 rounded-lg text-xs font-bold border inline-flex items-center gap-1 ${
                                isMatched
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                  : "bg-amber-50 text-amber-800 border-amber-200"
                              }`}
                            >
                              {isMatched && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                              {sk}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Mô tả công việc đầy đủ (không bị bóp hẹp) */}
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-slate-700 block uppercase tracking-wider">
                        Mô tả công việc &amp; Quyền lợi chi tiết:
                      </span>
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed whitespace-pre-line font-medium">
                        {data?.job?.requirementsJd}
                      </div>
                    </div>
                  </div>
                )}

                {/* ========================================================================= */}
                {/* TAB 3: XEM TRƯỚC CV GỐC (TỐI GIẢN: XEM CV + TẢI VỀ) */}
                {/* ========================================================================= */}
                {activeTab === "cv" && (
                  <div className="space-y-4">
                    {/* Thanh công cụ tối giản: Tên file + Nút Tải về */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-red-100 text-red-700 flex items-center justify-center font-bold shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate max-w-xs sm:max-w-md">
                            {data?.candidate?.cvFileUrl?.split("/").pop() || "Tệp CV gốc"}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Tài liệu CV gốc của ứng viên
                          </p>
                        </div>
                      </div>

                      {data?.candidate?.cvFileUrl && (
                        <a
                          href={data.candidate.cvFileUrl}
                          download
                          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-xs transition-colors shrink-0"
                          title="Tải tệp CV gốc về máy tính"
                        >
                          <Download className="w-4 h-4" />
                          <span>Tải về CV</span>
                        </a>
                      )}
                    </div>

                    {/* Vùng hiển thị CV trực tiếp */}
                    <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm bg-slate-100 flex flex-col items-center justify-center min-h-[680px]">
                      {data?.candidate?.cvFileUrl ? (
                        <iframe
                          src={`${data.candidate.cvFileUrl}#toolbar=1&navpanes=0&scrollbar=1`}
                          className="w-full h-[720px] rounded-2xl border-none"
                          title="Tài liệu CV Gốc"
                        />
                      ) : (
                        <div className="text-center p-8 text-slate-400">
                          <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p className="text-sm font-semibold">Chưa có tệp CV tải lên</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ========================================================================= */}
                {/* TAB 4: PHIẾU ĐÁNH GIÁ SCORECARD TRỰC TIẾP (INLINE TAB - KHÔNG POPUP MODAL) */}
                {/* ========================================================================= */}
                {activeTab === "evaluation" && (
                  <ScorecardPanel
                    applicationId={applicationId}
                    candidateName={data?.candidate?.fullName || "Ứng viên"}
                    jobTitle={data?.job?.title || "Vị trí tuyển dụng"}
                    evaluations={data?.evaluations || []}
                    defaultFormOpen={openEvaluationForm}
                    onSuccess={() => {
                      setOpenEvaluationForm(false);
                      fetch(`/api/applications/${applicationId}`)
                        .then((r) => r.json())
                        .then((r) => r.success && setData(r.data));
                    }}
                  />
                )}

                {/* ========================================================================= */}
                {/* TAB 5: NHẬT KÝ LUÂN CHUYỂN & KIỂM TOÁN (TÁCH BIỆT HOÀN TOÀN VỚI SCORECARD) */}
                {/* ========================================================================= */}
                {activeTab === "history" && (
                  <div className="space-y-6">
                    {/* 1. Lịch sử ứng tuyển các vị trí khác tại công ty */}
                    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                          <Building2 className="w-4 h-4 text-purple-600" />
                          Lịch sử hồ sơ tại công ty:
                        </h4>
                        <span className="text-[11px] font-semibold text-slate-500">
                          Mã ứng viên: #{data?.candidate?.id}
                        </span>
                      </div>

                      {data?.candidate?.applications && data.candidate.applications.length > 0 ? (
                        <div className="space-y-2">
                          <p className="text-[11px] text-slate-500 font-medium">
                            Ứng viên đã từng ứng tuyển {data.candidate.applications.length} vị trí khác tại công ty:
                          </p>
                          <div className="divide-y divide-slate-100 rounded-xl border border-slate-100 overflow-hidden">
                            {data.candidate.applications.map((otherApp: any) => (
                              <div
                                key={otherApp.id}
                                className="p-3 bg-slate-50/50 hover:bg-slate-50 flex items-center justify-between text-xs transition-colors"
                              >
                                <div>
                                  <strong className="text-slate-900 font-bold block">
                                    {otherApp.job?.title || "Vị trí tuyển dụng"}
                                  </strong>
                                  <span className="text-[11px] text-slate-500">
                                    {otherApp.job?.department} &bull; Nộp ngày: {new Date(otherApp.createdAt).toLocaleDateString("vi-VN")}
                                  </span>
                                </div>
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                  otherApp.currentStage === "HIRED"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : otherApp.currentStage === "REJECTED"
                                    ? "bg-rose-100 text-rose-800"
                                    : "bg-blue-100 text-blue-800"
                                }`}>
                                  {otherApp.currentStage}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100 text-xs text-slate-600 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Đây là đợt ứng tuyển đầu tiên của ứng viên tại công ty. Chưa có lịch sử ứng tuyển vị trí khác.</span>
                        </div>
                      )}
                    </div>

                    {/* 2. Timeline Audit Logs */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        <History className="w-4 h-4 text-slate-500" />
                        Nhật ký luân chuyển & Thao tác kiểm toán ({data?.auditLogs?.length || 0}):
                      </h4>

                      <div className="space-y-2">
                        {data?.auditLogs?.map((log: any) => (
                          <div
                            key={log.id}
                            className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 text-xs flex justify-between items-start gap-3"
                          >
                            <div className="space-y-0.5">
                              <p className="font-semibold text-slate-800">
                                {log.action === "SCORECARD_EVALUATE" ? (
                                  <span className="text-purple-700 font-bold">★ Đánh giá Scorecard phỏng vấn</span>
                                ) : log.action === "INTERVIEW_CANCELLED" ? (
                                  <span className="text-red-600 font-bold">✕ Hủy lịch hẹn phỏng vấn</span>
                                ) : log.action === "PROFILE_EDITED" ? (
                                  <span className="text-blue-700 font-bold">✎ Chỉnh sửa thủ công hồ sơ</span>
                                ) : log.action === "STARRED" ? (
                                  <span className="text-amber-600 font-bold">⭐ Gắn sao ưu tiên hồ sơ</span>
                                ) : log.action === "UNSTARRED" ? (
                                  <span className="text-slate-500 font-medium">Bỏ gắn sao ưu tiên</span>
                                ) : (
                                  <>
                                    Chuyển từ <span className="text-slate-500">{log.fromStage || "N/A"}</span>{" "}
                                    ➔ <span className="text-brand-600 font-bold">{log.toStage}</span>
                                  </>
                                )}
                              </p>
                              {log.reason && (
                                <p className="text-[11px] text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200 mt-1">
                                  {log.reason}
                                </p>
                              )}
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                Thực hiện bởi: {log.user?.fullName || "Hệ thống"} &bull; {log.user?.role || "SYSTEM"}
                              </p>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono shrink-0">
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

          {/* Footer Actions: Chuyển Stage nhanh (Áp dụng State Machine & RBAC) */}
          <div className="p-5 border-t border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Chuyển vòng tuyển:</span>
              <div className="flex flex-wrap gap-1.5">
                {(() => {
                  const allowedTargets = getAllowedTargetStages(
                    data?.currentStage || "",
                    currentUser?.role
                  );
                  return stages.map((st) => {
                    const isCurrent = data?.currentStage === st.key;
                    const isAllowed = allowedTargets.includes(st.key as any);
                    return (
                      <button
                        key={st.key}
                        onClick={() => handleQuickMove(st.key)}
                        disabled={actionLoading || isCurrent}
                        title={
                          isCurrent
                            ? "Trạng thái hiện tại"
                            : isAllowed
                            ? `Chuyển sang ${st.label}`
                            : "Không nằm trong bước kế tiếp hợp lệ hoặc vượt thẩm quyền vai trò hiện tại"
                        }
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all inline-flex items-center gap-1 ${
                          isCurrent
                            ? "bg-brand-600 text-white border-brand-600 shadow-xs cursor-default"
                            : isAllowed
                            ? st.key === "REJECTED"
                              ? "bg-white hover:bg-rose-50 text-rose-700 border-rose-300 cursor-pointer"
                              : "bg-white hover:bg-brand-50 text-slate-800 border-slate-300 hover:border-brand-400 cursor-pointer"
                            : "bg-slate-100 text-slate-400 border-slate-200 opacity-60 cursor-pointer"
                        }`}
                      >
                        {!isCurrent && !isAllowed && <Lock className="w-3 h-3" />}
                        <span>{st.key}</span>
                      </button>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Bắt buộc nhập Lý do Từ chối (BRL-11) */}
      <RejectReasonModal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        onConfirm={async (reason) => {
          setIsRejectModalOpen(false);
          await executeQuickMove("REJECTED", reason);
        }}
        candidateName={data?.candidate?.fullName || "Ứng viên"}
        jobTitle={data?.job?.title || "Vị trí tuyển dụng"}
        currentStage={data?.currentStage || ""}
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
