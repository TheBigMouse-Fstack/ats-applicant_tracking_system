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
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import ScorecardModal from "@/components/scorecard/ScorecardModal";

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
  const [interviewLoading, setInterviewLoading] = useState(false);
  const [interviewSuccessEmail, setInterviewSuccessEmail] = useState<string | null>(null);
  const [interviewError, setInterviewError] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);

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
          }
        }
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [applicationId]);

  if (!applicationId) return null;

  // Xử lý chuyển trạng thái nhanh từ trong Drawer
  const handleQuickMove = async (toStage: string) => {
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

  // Lên lịch Phỏng vấn & Tạo thư mời (UC-05A)
  const handleScheduleInterview = async (e: React.FormEvent) => {
    e.preventDefault();
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
          moveToInterviewStage: data?.currentStage !== "INTERVIEW",
        }),
      });

      const resData = await res.json();
      if (!res.ok || !resData.success) {
        setInterviewError(resData.error || "Không thể lưu lịch phỏng vấn");
      } else {
        setInterviewSuccessEmail(resData.emailTemplate?.body || "Đã lưu lịch phỏng vấn");
        setData(resData.data);
        setReparseNotice("Đã lên lịch phỏng vấn và tạo mẫu thư mời tự động thành công!");
      }
    } catch (err: any) {
      setInterviewError("Lỗi kết nối khi xếp lịch: " + err.message);
    } finally {
      setInterviewLoading(false);
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
              Bóc tách AI & Năng lực
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
              Xem trước CV Gốc (Visual PDF)
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
              Lịch sử Luân chuyển & Scorecard ({data?.evaluations?.length || 0})
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {loading ? (
              <div className="py-20 text-center text-slate-400 space-y-3">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-600" />
                <p className="text-xs">Đang nạp chi tiết ứng viên & phân tích AI...</p>
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
                {/* TAB 1: BÓC TÁCH AI & NĂNG LỰC (3 KHỐI RÕ RÀNG THEO YÊU CẦU ITBA) */}
                {/* ========================================================================= */}
                {activeTab === "overview" && (
                  <div className="space-y-6">
                    {/* KHỐI 1: HỒ SƠ ỨNG VIÊN BÓC TÁCH TỪ CV */}
                    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                            <User className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                              1. Thông tin Bóc Tách Trực Tiếp Từ CV
                            </h3>
                            <p className="text-[11px] text-slate-400">
                              Dữ liệu học vấn, số năm kinh nghiệm và kỹ năng trích xuất
                            </p>
                          </div>
                        </div>

                        {/* Nút Chạy lại AI Phân tích */}
                        <button
                          type="button"
                          onClick={handleReparse}
                          disabled={reparsing}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200 transition-all cursor-pointer"
                          title="Chạy lại AI bóc tách nếu muốn cập nhật thông tin"
                        >
                          <RotateCw
                            className={`w-3.5 h-3.5 ${reparsing ? "animate-spin text-brand-600" : ""}`}
                          />
                          <span>{reparsing ? "Đang phân tích..." : "Phân tích lại AI"}</span>
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
                          Kỹ Năng & Chuyên Môn Bóc Tách Từ CV ({parsedSkills.length}):
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
                            <span className="text-xs text-slate-400">Chưa bóc tách được kỹ năng</span>
                          )}
                        </div>
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
                            2. Tiêu Chuẩn Vị Trí Đang Ứng Tuyển (Job Requirements)
                          </h3>
                          <p className="text-[11px] text-slate-400">
                            Yêu cầu JD làm căn cứ để AI đối soát và chấm điểm
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
                          Kỹ năng bắt buộc (Required Skills):
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
                          Mô tả & Trách nhiệm công việc (JD):
                        </span>
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed max-h-32 overflow-y-auto whitespace-pre-line font-medium">
                          {data?.job?.requirementsJd}
                        </div>
                      </div>
                    </div>

                    {/* KHỐI 3: KẾT QUẢ ĐỐI SOÁT & CHẤM ĐIỂM AI MATCH (BRL-04) */}
                    <div className="bg-gradient-to-br from-indigo-50/70 via-purple-50/40 to-slate-50 p-5 rounded-2xl border border-indigo-200/80 shadow-xs space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-indigo-100">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-md shadow-brand-500/20">
                            <Sparkles className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-brand-900">
                              3. Đánh Giá Đối Soát & Chấm Điểm AI (Match Evaluation)
                            </h3>
                            <p className="text-[11px] text-slate-500">
                              So sánh năng lực thực tế trong CV với tiêu chuẩn tuyển dụng
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span
                            className={`px-3.5 py-1.5 rounded-xl text-lg font-black border ${
                              (data?.aiMatchScore || 0) >= 75
                                ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                : (data?.aiMatchScore || 0) >= 60
                                ? "bg-amber-100 text-amber-800 border-amber-300"
                                : "bg-red-100 text-red-800 border-red-300"
                            }`}
                          >
                            Match: {data?.aiMatchScore ? `${Math.round(data.aiMatchScore)}%` : "N/A"}
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

                      {/* Giải trình của AI (Rationale) */}
                      {data?.aiMatchRationale && (
                        <div className="bg-white/90 p-4 rounded-xl border border-indigo-100 text-xs text-slate-800 leading-relaxed shadow-2xs">
                          <span className="font-bold text-indigo-900 block mb-1 flex items-center gap-1">
                            <Award className="w-3.5 h-3.5 text-indigo-600" />
                            Giải trình của AI (AI Match Rationale):
                          </span>
                          <p className="font-medium text-slate-700">{data.aiMatchRationale}</p>
                        </div>
                      )}
                    </div>

                    {/* KHỐI 4: LỊCH HẸN PHỎNG VẤN CHUYÊN MÔN (UC-05A) */}
                    {(data?.interviewDate || data?.currentStage === "INTERVIEW") && (
                      <div className="bg-gradient-to-r from-purple-50/80 via-indigo-50/40 to-white rounded-2xl border border-purple-200/90 p-5 shadow-2xs space-y-3.5">
                        <div className="flex items-center justify-between pb-2.5 border-b border-purple-100">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                              <Calendar className="w-4 h-4" />
                            </div>
                            <div>
                              <h3 className="text-xs font-bold uppercase tracking-wider text-purple-950">
                                4. Lịch Hẹn Phỏng Vấn Chuyên Môn (UC-05A)
                              </h3>
                              <p className="text-[11px] text-purple-600">
                                {data?.interviewDate
                                  ? "Đã xác nhận thời gian & phòng họp"
                                  : "Chưa xếp lịch cụ thể cho ứng viên"}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setIsInterviewModalOpen(true);
                              setInterviewSuccessEmail(null);
                              setInterviewError(null);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-xs transition-all cursor-pointer"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{data?.interviewDate ? "Đổi lịch phỏng vấn" : "+ Lên lịch ngay"}</span>
                          </button>
                        </div>

                        {data?.interviewDate ? (
                          <div className="space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                              <div className="bg-white p-3 rounded-xl border border-purple-100 shadow-2xs">
                                <span className="text-slate-400 block mb-0.5">Thời gian bắt đầu:</span>
                                <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                  <Clock className="w-4 h-4 text-purple-600" />
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

                              <div className="bg-white p-3 rounded-xl border border-purple-100 shadow-2xs">
                                <span className="text-slate-400 block mb-0.5">Hình thức & Địa điểm:</span>
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

                            {data.interviewNotes && (
                              <div className="bg-white/80 p-3 rounded-xl border border-purple-100 text-xs text-slate-700">
                                <span className="font-bold text-purple-900 block mb-0.5">
                                  Dặn dò ứng viên:
                                </span>
                                <p>{data.interviewNotes}</p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="p-3 bg-white/70 rounded-xl border border-dashed border-purple-200 text-xs text-purple-700 flex items-center justify-between">
                            <span>Hồ sơ đang ở vòng Phỏng vấn. Hãy lên lịch hẹn để hệ thống sinh Thư mời gửi ứng viên.</span>
                          </div>
                        )}
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
                            📝 Văn Bản Bóc Tách
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
                          <span>Văn bản trích xuất trực tiếp bằng thư viện `pdf-parse`:</span>
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
                {/* TAB 3: AUDIT LOGS & SCORECARD (BRL-08 & BRL-06) */}
                {/* ========================================================================= */}
                {activeTab === "history" && (
                  <div className="space-y-6">
                    {/* Scorecards */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                          <Star className="w-4 h-4 text-purple-600 fill-purple-600" />
                          Phiếu đánh giá phỏng vấn (Scorecards):
                        </h4>
                        <button
                          type="button"
                          onClick={() => setIsScorecardOpen(true)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                        >
                          <Star className="w-3.5 h-3.5 fill-white" />
                          + Chấm Điểm Scorecard (BRL-08)
                        </button>
                      </div>

                      {data?.evaluations?.length === 0 ? (
                        <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                          Chưa có phiếu đánh giá Scorecard nào cho ứng viên này.
                        </div>
                      ) : (
                        data?.evaluations?.map((ev: any) => (
                          <div
                            key={ev.id}
                            className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 text-xs shadow-2xs"
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-slate-900">
                                Giám khảo: {ev.evaluator?.fullName} ({ev.evaluator?.role})
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
                        Nhật ký Luân chuyển Trạng thái (Audit Logs):
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
                  <h3 className="text-base font-bold text-slate-900">
                    Lên Lịch Phỏng Vấn & Soạn Thư Mời (UC-05A)
                  </h3>
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
                    <option value="ONLINE">Trực tuyến (Google Meet / Zoom)</option>
                    <option value="OFFLINE">Trực tiếp tại văn phòng công ty</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {interviewFormat === "ONLINE"
                    ? "Link Họp Trực Tuyến (Google Meet/Zoom) *"
                    : "Địa Chỉ / Phòng Họp Trực Tiếp *"}
                </label>
                <input
                  type="text"
                  value={interviewLocation}
                  onChange={(e) => setInterviewLocation(e.target.value)}
                  placeholder={
                    interviewFormat === "ONLINE"
                      ? "https://meet.google.com/xyz-abcd-efg"
                      : "Phòng Họp Lotus 3, Tầng 12, Tòa nhà ReCoverX Tower, TP.HCM"
                  }
                  required
                  className="w-full text-xs rounded-xl border border-slate-200 bg-white py-2.5 px-3 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Ghi Chú Dặn Dò Ứng Viên (Tùy chọn)
                </label>
                <textarea
                  rows={2}
                  value={interviewNotes}
                  onChange={(e) => setInterviewNotes(e.target.value)}
                  placeholder="VD: Vui lòng chuẩn bị slide hoặc portfolio giới thiệu dự án tiêu biểu..."
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
                      Mẫu Thư Mời Phỏng Vấn Tự Động Đã Sẵn Sàng:
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

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
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
                      <span>Đang lưu lịch...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Xác Nhận & Tạo Thư Mời</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
