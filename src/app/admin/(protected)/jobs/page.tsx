"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "@/contexts/SessionContext";
import { useLanguage } from "@/lib/i18n";
import { clientCache } from "@/lib/client-cache";
import {
  Plus,
  RefreshCw,
  Search,
  MapPin,
  Clock,
  Users,
  CheckCircle,
  AlertCircle,
  X,
  ExternalLink,
  Loader2,
} from "lucide-react";

export default function AdminJobsPage() {
  const { user: currentUser } = useSession();
  const { t, locale } = useLanguage();
  const isEn = locale === "en";
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [approvingId, setApprovingId] = useState<number | null>(null);

  // Modal create job
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState("Công nghệ thông tin");
  const [location, setLocation] = useState("Hồ Chí Minh");
  const [employmentType, setEmploymentType] = useState("Toàn thời gian");
  const [minExp, setMinExp] = useState("1");
  const [targetHeadcount, setTargetHeadcount] = useState("1");
  const [maxActiveInterviews, setMaxActiveInterviews] = useState("3");
  const [skillsText, setSkillsText] = useState("React, TypeScript, Tailwind");
  const [requirementsJd, setRequirementsJd] = useState("");
  const [screeningQuestions, setScreeningQuestions] = useState<
    Array<{ id: string; question: string; expectedAnswer: "YES" | "NO"; isKnockout: boolean }>
  >([]);
  const [newQuestionText, setNewQuestionText] = useState("");
  const [newQuestionExpected, setNewQuestionExpected] = useState<"YES" | "NO">("YES");
  const [newQuestionKnockout, setNewQuestionKnockout] = useState(true);

  // Modal quick-edit headcount & status
  const [editingJob, setEditingJob] = useState<any | null>(null);
  const [editHeadcount, setEditHeadcount] = useState("1");
  const [editMaxInterviews, setEditMaxInterviews] = useState("3");
  const [editStatus, setEditStatus] = useState<"ACTIVE" | "CLOSED">("ACTIVE");
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<string | null>(null);

  const fetchJobs = async (isSilent = false) => {
    try {
      if (!isSilent) {
        setJobs((prev) => {
          if (!prev || prev.length === 0) setLoading(true);
          return prev;
        });
      }
      const res = await fetch("/api/jobs");
      const data = await res.json();
      if (data.success) {
        const list = data.data || [];
        setJobs(list);
        clientCache.set("admin_jobs_list", list);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 1. Kiểm tra cache: Nếu có dữ liệu, hiển thị ngay lập tức (0ms) không cần spinner
    const cached = clientCache.getStale<any[]>("admin_jobs_list");
    if (cached && cached.length > 0) {
      setJobs(cached);
      setLoading(false);
      fetchJobs(true);
    } else {
      fetchJobs(false);
    }
  }, []);

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});

    const errors: Record<string, string> = {};
    if (!title.trim()) errors.title = "Tiêu đề vị trí tuyển dụng bắt buộc";
    if (!department.trim()) errors.department = "Vui lòng chọn hoặc nhập phòng ban";
    if (!requirementsJd.trim()) errors.requirementsJd = "Mô tả công việc & JD chi tiết bắt buộc";
    const parsedHeadcount = Number(targetHeadcount);
    if (!Number.isInteger(parsedHeadcount) || parsedHeadcount < 1 || parsedHeadcount > 100) {
      errors.targetHeadcount = "Nhập số nguyên từ 1 đến 100";
    }
    const parsedCap = Number(maxActiveInterviews);
    if (!Number.isInteger(parsedCap) || parsedCap < Math.max(1, parsedHeadcount || 1)) {
      errors.maxActiveInterviews = `Tối thiểu bằng số lượng cần tuyển (${Math.max(1, parsedHeadcount || 1)})`;
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormError("Vui lòng điền các trường bắt buộc được đánh dấu đỏ.");
      return;
    }

    setFormLoading(true);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          department,
          location,
          employmentType,
          minExperienceYears: Number(minExp) || 0,
          targetHeadcount: parsedHeadcount,
          maxActiveInterviews: parsedCap,
          requiredSkills: skillsText,
          requirementsJd,
          screeningQuestions,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        if (data.fieldErrors) setFieldErrors(data.fieldErrors);
        setFormError(data.error || "Không thể tạo tin tuyển dụng");
      } else {
        setNotice(`Đã tạo tin tuyển dụng "${title}" (chỉ tiêu ${parsedHeadcount} người, giới hạn ${parsedCap} PV cùng lúc)!`);
        setIsModalOpen(false);
        setTitle("");
        setTargetHeadcount("1");
        setMaxActiveInterviews("3");
        setRequirementsJd("");
        setScreeningQuestions([]);
        setNewQuestionText("");
        clientCache.invalidate("admin_jobs_list");
        clientCache.invalidate("pipeline_");
        fetchJobs(true);
      }
    } catch (err: any) {
      setFormError("Lỗi kết nối máy chủ khi tạo tin.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleOpenEditJob = (job: any) => {
    setEditingJob(job);
    setEditHeadcount(String(job.targetHeadcount || 1));
    setEditMaxInterviews(String(job.maxActiveInterviews || (job.targetHeadcount || 1) * 3));
    setEditStatus(job.status === "CLOSED" ? "CLOSED" : "ACTIVE");
    setEditError(null);
  };

  const handleSaveEditJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJob) return;
    setEditError(null);
    setEditSaving(true);
    try {
      const res = await fetch(`/api/jobs/${editingJob.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetHeadcount: Number(editHeadcount),
          maxActiveInterviews: Number(editMaxInterviews),
          status: editStatus,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setEditError(data.error || "Không thể cập nhật chỉ tiêu vị trí này.");
      } else {
        setNotice(data.message || "Đã cập nhật chỉ tiêu tuyển dụng.");
        setEditingJob(null);
        clientCache.invalidate("admin_jobs_list");
        clientCache.invalidate("pipeline_");
        fetchJobs(true);
      }
    } catch {
      setEditError("Lỗi kết nối khi cập nhật chỉ tiêu.");
    } finally {
      setEditSaving(false);
    }
  };

  const handleApproveJob = async (jobId: number, action: "APPROVE" | "REJECT") => {
    let approvalNote = "";
    if (action === "REJECT") {
      const note = prompt(
        isEn
          ? "Enter revision note (min 5 characters):"
          : "Nhập ghi chú yêu cầu chỉnh sửa (tối thiểu 5 ký tự):"
      );
      if (!note || note.trim().length < 5) return;
      approvalNote = note.trim();
    }
    setApprovingId(jobId);
    try {
      const res = await fetch(`/api/jobs/${jobId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, approvalNote }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNotice(data.message);
        clientCache.invalidate("admin_jobs_list");
        fetchJobs(true);
      }
    } finally {
      setApprovingId(null);
    }
  };

  const filteredJobs = jobs.filter((j) => {
    const matchSearch =
      j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.department.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (statusFilter === "ALL") return true;
    return j.status === statusFilter;
  });

  const canCreateJob = Boolean(currentUser && currentUser.role !== "HIRING_MANAGER");
  const canApproveJob = Boolean(
    currentUser && (currentUser.role === "ADMIN" || currentUser.role === "HIRING_MANAGER")
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      {/* Header tối giản: Chỉ giữ đúng 1 nhiệm vụ Quản lý Tin tuyển dụng */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            {t("jobsAdmin.title")}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {filteredJobs.length} {t("dashboard.activeJobs")}
          </p>
        </div>

        {canCreateJob && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{t("jobsAdmin.createBtn")}</span>
          </button>
        )}
      </div>

      {notice && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 text-emerald-900 text-xs font-semibold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>{notice}</span>
          </div>
          <button onClick={() => setNotice(null)} className="text-emerald-500 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search & Status Tabs */}
      <div className="bg-white rounded-xl border border-zinc-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("candidates.searchPlaceholder")}
            className="w-full text-xs rounded-lg border border-zinc-200 bg-white py-2 pl-9 pr-3 text-zinc-800 focus:outline-none focus:border-zinc-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs">
          {[
            { key: "ALL", label: isEn ? "All" : "Tất cả" },
            { key: "PENDING_APPROVAL", label: isEn ? "Pending Approval" : "Chờ duyệt" },
            { key: "ACTIVE", label: isEn ? "Active" : "Đang tuyển" },
            { key: "DRAFT", label: isEn ? "Draft" : "Bản nháp" },
            { key: "CLOSED", label: isEn ? "Closed" : "Đã đóng" },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              className={`pb-1 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                statusFilter === tab.key
                  ? "border-brand-600 text-zinc-900 font-semibold"
                  : "border-transparent text-zinc-500 hover:text-zinc-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Jobs List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full py-16 text-center text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-brand-600" />
            Đang tải danh sách vị trí...
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
            Chưa có tin tuyển dụng nào phù hợp.
          </div>
        ) : (
          filteredJobs.map((job) => {
            let skills: string[] = [];
            try {
              skills = JSON.parse(job.requiredSkills || "[]");
            } catch {
              skills = [];
            }

            return (
              <div
                key={job.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs font-medium text-zinc-500">
                      {job.department}
                    </span>
                    <span
                      className={`text-xs font-medium whitespace-nowrap ${
                        job.status === "PENDING_APPROVAL"
                          ? "text-amber-700"
                          : job.status === "DRAFT"
                          ? "text-zinc-500"
                          : job.status === "ACTIVE" && !job.headcountMetrics?.isHeadcountFull
                          ? "text-emerald-700"
                          : "text-zinc-400"
                      }`}
                    >
                      {job.status === "PENDING_APPROVAL"
                        ? isEn
                          ? "Pending Approval"
                          : "Chờ phê duyệt"
                        : job.status === "DRAFT"
                        ? isEn
                          ? "Draft"
                          : "Bản nháp"
                        : job.status === "ACTIVE" && !job.headcountMetrics?.isHeadcountFull
                        ? isEn
                          ? "Active"
                          : "Đang tuyển"
                        : isEn
                        ? "Filled"
                        : "Đã đủ chỉ tiêu"}
                    </span>
                  </div>

                  <h3 className="text-base font-semibold text-zinc-900 line-clamp-1">
                    {job.title}
                  </h3>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500">
                    <span>{job.location}</span>
                    <span>
                      {job.minExperienceYears} {isEn ? "yrs exp" : "năm KN"}
                    </span>
                  </div>

                  {/* Tiến độ chỉ tiêu tuyển dụng (chữ màu gọn, không viền) */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-xs tabular-nums">
                    <span
                      className={
                        job.headcountMetrics?.isHeadcountFull
                          ? "font-medium text-emerald-700"
                          : "text-zinc-600"
                      }
                    >
                      {isEn ? "Quota:" : "Chỉ tiêu:"}{" "}
                      <strong className="text-zinc-900">
                        {job.headcountMetrics?.hiredCount ?? 0}/
                        {job.headcountMetrics?.targetHeadcount ?? job.targetHeadcount ?? 1}
                      </strong>
                    </span>
                    <span
                      className={
                        job.headcountMetrics?.isInterviewAtCap
                          ? "font-medium text-amber-700"
                          : "text-zinc-600"
                      }
                    >
                      {isEn ? "Interviewing:" : "Đang PV:"}{" "}
                      <strong className="text-zinc-900">
                        {job.headcountMetrics?.activeInterviewCount ?? 0}/
                        {job.headcountMetrics?.effectiveInterviewCap ?? job.maxActiveInterviews ?? 3}
                      </strong>
                    </span>
                  </div>

                  {/* Skills (chữ xám nhẹ, không viền hộp) */}
                  {skills.length > 0 && (
                    <div className="flex flex-wrap gap-x-2.5 gap-y-1 pt-1 text-xs text-zinc-500">
                      {skills.slice(0, 4).map((sk) => (
                        <span key={sk}>{sk}</span>
                      ))}
                      {skills.length > 4 && (
                        <span className="text-zinc-400">+{skills.length - 4}</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-3 border-t border-zinc-100 flex items-center justify-between gap-2 text-xs">
                  <span className="font-medium text-zinc-600 tabular-nums">
                    <strong className="text-zinc-900">{job._count?.applications || 0}</strong>{" "}
                    {isEn ? "applicants" : "hồ sơ"}
                  </span>

                  <div className="flex items-center gap-4">
                    {canApproveJob && (job.status === "PENDING_APPROVAL" || job.status === "DRAFT") && (
                      <>
                        <button
                          type="button"
                          disabled={approvingId === job.id}
                          onClick={() => handleApproveJob(job.id, "APPROVE")}
                          className="text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer whitespace-nowrap"
                        >
                          {isEn ? "Approve" : "Duyệt đăng"}
                        </button>
                        {job.status === "PENDING_APPROVAL" && (
                          <button
                            type="button"
                            disabled={approvingId === job.id}
                            onClick={() => handleApproveJob(job.id, "REJECT")}
                            className="text-brand-600 hover:text-brand-700 font-medium cursor-pointer whitespace-nowrap"
                          >
                            {isEn ? "Return" : "Trả sửa"}
                          </button>
                        )}
                      </>
                    )}
                    {canCreateJob && (
                      <button
                        type="button"
                        onClick={() => handleOpenEditJob(job)}
                        className="text-zinc-600 hover:text-brand-600 font-medium cursor-pointer whitespace-nowrap"
                      >
                        {isEn ? "Edit quota" : "Chỉnh chỉ tiêu"}
                      </button>
                    )}
                    {job.status === "ACTIVE" && (
                      <Link
                        href={`/jobs/${job.id}`}
                        target="_blank"
                        className="text-zinc-600 hover:text-brand-600 font-medium whitespace-nowrap"
                      >
                        {isEn ? "Apply page" : "Trang nộp CV"}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Tạo Tin Tuyển Dụng */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                Thêm Vị Trí Tuyển Dụng Mới
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="bg-red-50 border border-red-300 rounded-xl p-3 text-red-900 flex items-start gap-2 text-xs">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <p className="font-semibold">{formError}</p>
              </div>
            )}

            <form onSubmit={handleCreateJob} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tiêu đề vị trí <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ví dụ: Senior Backend Engineer"
                  className={`w-full rounded-xl border py-2 px-3 font-medium ${fieldErrors.title
                      ? "border-red-500 bg-red-50/20"
                      : "border-slate-200 bg-slate-50/50"
                    }`}
                />
                {fieldErrors.title && (
                  <p className="text-red-600 font-medium mt-1">{fieldErrors.title}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Phòng ban <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="VD: Kỹ thuật, Marketing"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-3 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Địa điểm</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-3 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Loại hình</label>
                  <select
                    value={employmentType}
                    onChange={(e) => setEmploymentType(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-3 font-medium"
                  >
                    <option value="Toàn thời gian">Toàn thời gian</option>
                    <option value="Bán thời gian">Bán thời gian</option>
                    <option value="Thực tập sinh">Thực tập sinh</option>
                    <option value="Hợp đồng dự án">Hợp đồng dự án</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Số năm KN tối thiểu</label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={minExp}
                    onChange={(e) => setMinExp(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-3 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Số lượng cần tuyển <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={targetHeadcount}
                    onChange={(e) => {
                      const val = e.target.value;
                      setTargetHeadcount(val);
                      const num = Number(val);
                      if (Number.isInteger(num) && num >= 1) {
                        setMaxActiveInterviews(String(num * 3));
                      }
                    }}
                    className={`w-full rounded-xl border py-2 px-3 font-medium ${
                      fieldErrors.targetHeadcount
                        ? "border-red-500 bg-red-50/20"
                        : "border-slate-200 bg-slate-50/50"
                    }`}
                  />
                  {fieldErrors.targetHeadcount && (
                    <p className="text-red-600 font-medium mt-1">{fieldErrors.targetHeadcount}</p>
                  )}
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Giới hạn PV cùng lúc
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="300"
                    value={maxActiveInterviews}
                    onChange={(e) => setMaxActiveInterviews(e.target.value)}
                    className={`w-full rounded-xl border py-2 px-3 font-medium ${
                      fieldErrors.maxActiveInterviews
                        ? "border-red-500 bg-red-50/20"
                        : "border-slate-200 bg-slate-50/50"
                    }`}
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Gợi ý chuẩn: gấp 3 lần số lượng tuyển để tránh phỏng vấn dư
                  </p>
                  {fieldErrors.maxActiveInterviews && (
                    <p className="text-red-600 font-medium mt-1">{fieldErrors.maxActiveInterviews}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Kỹ năng bắt buộc (phân tách bằng dấu phẩy)
                </label>
                <input
                  type="text"
                  value={skillsText}
                  onChange={(e) => setSkillsText(e.target.value)}
                  placeholder="React, Node.js, TypeScript, SQL"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-3 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Chi tiết JD & Tiêu chuẩn tuyển dụng <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={requirementsJd}
                  onChange={(e) => setRequirementsJd(e.target.value)}
                  placeholder="Mô tả trách nhiệm công việc, yêu cầu chuyên môn, quyền lợi..."
                  className={`w-full rounded-xl border p-3 font-medium ${fieldErrors.requirementsJd
                      ? "border-red-500 bg-red-50/20"
                      : "border-slate-200 bg-slate-50/50"
                    }`}
                />
                {fieldErrors.requirementsJd && (
                  <p className="text-red-600 font-medium mt-1">{fieldErrors.requirementsJd}</p>
                )}
              </div>

              {/* BRL-16: Câu hỏi sàng lọc (Knock-out Questions) */}
              <div className="space-y-2 pt-2 border-t border-zinc-100">
                <label className="block font-semibold text-zinc-700">
                  {isEn ? "Screening Questions (Optional, max 5)" : "Câu hỏi sàng lọc ứng viên (Tùy chọn, tối đa 5)"}
                </label>

                {screeningQuestions.length > 0 && (
                  <div className="space-y-1.5">
                    {screeningQuestions.map((q) => (
                      <div
                        key={q.id}
                        className="flex items-center justify-between gap-2 px-3 py-2 rounded-md bg-zinc-50 border border-zinc-200 text-xs"
                      >
                        <div className="min-w-0">
                          <p className="text-zinc-900 font-medium truncate">{q.question}</p>
                          <p className="text-[11px] text-zinc-500">
                            {isEn ? "Expected:" : "Đáp án đạt:"}{" "}
                            <strong className="text-zinc-800">{q.expectedAnswer === "YES" ? (isEn ? "Yes" : "Có") : (isEn ? "No" : "Không")}</strong>
                            {q.isKnockout && (
                              <span className="ml-2 text-brand-600 font-medium">
                                · {isEn ? "Knock-out" : "Tiêu chí cứng"}
                              </span>
                            )}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setScreeningQuestions((prev) => prev.filter((item) => item.id !== q.id))
                          }
                          className="text-zinc-400 hover:text-brand-600 font-medium cursor-pointer shrink-0"
                        >
                          {isEn ? "Remove" : "Xóa"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {screeningQuestions.length < 5 && (
                  <div className="space-y-2 bg-zinc-50/70 p-3 rounded-lg border border-zinc-200">
                    <input
                      type="text"
                      value={newQuestionText}
                      onChange={(e) => setNewQuestionText(e.target.value)}
                      placeholder={
                        isEn
                          ? "e.g., Are you able to work onsite in Ho Chi Minh City?"
                          : "VD: Bạn có thể làm việc toàn thời gian tại TP. Hồ Chí Minh không?"
                      }
                      className="w-full rounded-md border border-zinc-200 bg-white py-1.5 px-2.5 text-xs text-zinc-800"
                    />
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1.5 text-zinc-600">
                          <span>{isEn ? "Expected:" : "Đáp án đạt:"}</span>
                          <select
                            value={newQuestionExpected}
                            onChange={(e) => setNewQuestionExpected(e.target.value as "YES" | "NO")}
                            className="rounded border border-zinc-200 bg-white px-1.5 py-0.5 text-zinc-800"
                          >
                            <option value="YES">{isEn ? "Yes" : "Có"}</option>
                            <option value="NO">{isEn ? "No" : "Không"}</option>
                          </select>
                        </label>
                        <label className="flex items-center gap-1.5 text-zinc-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={newQuestionKnockout}
                            onChange={(e) => setNewQuestionKnockout(e.target.checked)}
                          />
                          <span>{isEn ? "Must-have (Knock-out)" : "Tiêu chí cứng"}</span>
                        </label>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (!newQuestionText.trim()) return;
                          setScreeningQuestions((prev) => [
                            ...prev,
                            {
                              id: `q_${Date.now()}`,
                              question: newQuestionText.trim(),
                              expectedAnswer: newQuestionExpected,
                              isKnockout: newQuestionKnockout,
                            },
                          ]);
                          setNewQuestionText("");
                        }}
                        className="text-brand-600 hover:text-brand-700 font-semibold cursor-pointer whitespace-nowrap"
                      >
                        + {isEn ? "Add question" : "Thêm câu hỏi"}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {currentUser?.role === "HR" && (
                <p className="text-[11px] text-amber-700">
                  {isEn
                    ? "Note: New positions created by HR will be submitted for Hiring Manager / Admin approval before publishing."
                    : "Lưu ý: Tin tuyển dụng do HR tạo sẽ chuyển sang trạng thái Chờ phê duyệt trước khi hiển thị công khai."}
                </p>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={formLoading}
                  className="px-4 py-2 font-medium text-zinc-600 hover:text-zinc-900 cursor-pointer"
                >
                  {isEn ? "Cancel" : "Hủy"}
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2 font-semibold text-white bg-brand-600 hover:bg-brand-700 disabled:bg-brand-400 rounded-lg cursor-pointer"
                >
                  {formLoading
                    ? isEn
                      ? "Saving..."
                      : "Đang tạo..."
                    : currentUser?.role === "HR"
                    ? isEn
                      ? "Submit for Approval"
                      : "Gửi duyệt tin"
                    : isEn
                    ? "Publish Job"
                    : "Tạo tin tuyển dụng"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Điều chỉnh Chỉ tiêu Tuyển dụng & Giới hạn Phỏng vấn */}
      {editingJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-5 shadow-xl space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Điều chỉnh chỉ tiêu tuyển dụng
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{editingJob.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingJob(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-800 text-xs font-medium">
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveEditJob} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Số lượng cần tuyển
                  </label>
                  <input
                    type="number"
                    min={Math.max(1, editingJob.headcountMetrics?.hiredCount || 0)}
                    max="100"
                    value={editHeadcount}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditHeadcount(val);
                      const num = Number(val);
                      if (Number.isInteger(num) && num >= 1) {
                        setEditMaxInterviews(String(num * 3));
                      }
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-3 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Giới hạn PV cùng lúc
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="300"
                    value={editMaxInterviews}
                    onChange={(e) => setEditMaxInterviews(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-3 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Trạng thái nhận hồ sơ
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as "ACTIVE" | "CLOSED")}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-3 font-medium"
                >
                  <option value="ACTIVE">Đang mở tuyển</option>
                  <option value="CLOSED">Đóng nhận hồ sơ</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingJob(null)}
                  disabled={editSaving}
                  className="px-3.5 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className="px-4 py-2 font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl"
                >
                  {editSaving ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


