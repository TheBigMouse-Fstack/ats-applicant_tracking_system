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

  const filteredJobs = jobs.filter(
    (j) =>
      j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.department.toLowerCase().includes(search.toLowerCase())
  );

  const canCreateJob = Boolean(currentUser && currentUser.role !== "HIRING_MANAGER");

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

      {/* Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("candidates.searchPlaceholder")}
            className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-9 pr-3 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
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
                        job.status === "ACTIVE" && !job.headcountMetrics?.isHeadcountFull
                          ? "text-emerald-700"
                          : "text-zinc-400"
                      }`}
                    >
                      {job.status === "ACTIVE" && !job.headcountMetrics?.isHeadcountFull
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
                    {canCreateJob && (
                      <button
                        type="button"
                        onClick={() => handleOpenEditJob(job)}
                        className="text-zinc-600 hover:text-brand-600 font-medium cursor-pointer whitespace-nowrap"
                      >
                        {isEn ? "Edit quota" : "Chỉnh chỉ tiêu"}
                      </button>
                    )}
                    <Link
                      href={`/jobs/${job.id}`}
                      target="_blank"
                      className="text-zinc-600 hover:text-brand-600 font-medium whitespace-nowrap"
                    >
                      {isEn ? "Apply page" : "Trang nộp CV"}
                    </Link>
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

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={formLoading}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2 font-bold text-white bg-brand-600 hover:bg-brand-700 disabled:bg-brand-400 rounded-xl shadow-md shadow-brand-500/20"
                >
                  {formLoading ? "Đang tạo..." : "Tạo tin tuyển dụng"}
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


