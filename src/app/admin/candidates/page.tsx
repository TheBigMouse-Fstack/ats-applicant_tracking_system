"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  Filter,
  Download,
  RefreshCw,
  Briefcase,
  FileText,
  Eye,
  Award,
  Image as ImageIcon,
  UserPlus,
  Star,
  CheckCircle2,
  X,
  ExternalLink,
  ChevronRight,
  Clock,
  Building2,
  Calendar,
  ArrowUpDown,
} from "lucide-react";
import CandidateDrawer from "@/components/candidate/CandidateDrawer";
import AddCandidateModal from "@/components/candidate/AddCandidateModal";

interface JobOption {
  id: number;
  title: string;
  department: string;
}

export default function CandidatesListPage() {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [jobs, setJobs] = useState<JobOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Bộ lọc & Sắp xếp
  const [search, setSearch] = useState("");
  const [selectedJobId, setSelectedJobId] = useState("ALL");
  const [selectedStage, setSelectedStage] = useState("ALL");
  const [selectedSource, setSelectedSource] = useState("ALL");
  const [sortBy, setSortBy] = useState<string>("NEWEST");
  const [quickFilter, setQuickFilter] = useState<string>("ALL"); // ALL, STARRED, UNVIEWED, UNEVALUATED

  // Drawer & Modal State
  const [selectedAppId, setSelectedAppId] = useState<number | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Quick PDF Preview Modal
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfPreviewTitle, setPdfPreviewTitle] = useState<string>("");

  // Lightbox Preview Image
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imagePreviewTitle, setImagePreviewTitle] = useState<string>("");

  const [notice, setNotice] = useState<string | null>(null);

  // Tải danh sách Jobs cho bộ lọc
  const fetchJobs = async () => {
    try {
      const res = await fetch("/api/jobs");
      const data = await res.json();
      if (data.success) {
        setJobs(data.data || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Tải danh sách Ứng viên
  const fetchCandidates = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search.trim()) params.append("search", search.trim());
      if (selectedJobId !== "ALL") params.append("jobId", selectedJobId);
      if (selectedStage !== "ALL") params.append("stage", selectedStage);
      if (selectedSource !== "ALL") params.append("source", selectedSource);
      if (sortBy !== "NEWEST") params.append("sortBy", sortBy);
      if (quickFilter === "STARRED") params.append("starred", "true");
      if (quickFilter === "UNVIEWED") params.append("unviewed", "true");
      if (quickFilter === "UNEVALUATED") params.append("unevaluated", "true");

      const res = await fetch(`/api/applications?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setCandidates(data.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search, selectedJobId, selectedStage, selectedSource, sortBy, quickFilter]);

  // Xử lý bật/tắt gắn sao hồ sơ (Star như Gmail)
  const handleToggleStar = async (appId: number) => {
    setCandidates((prev) =>
      prev.map((c) => (c.id === appId ? { ...c, isStarred: !c.isStarred } : c))
    );
    try {
      const res = await fetch(`/api/applications/${appId}/star`, { method: "POST" });
      const data = await res.json();
      if (!data.success) {
        fetchCandidates();
      }
    } catch {
      fetchCandidates();
    }
  };

  useEffect(() => {
    fetchJobs();
    fetchCandidates();
  }, [fetchCandidates]);

  const getSourceBadge = (source: string) => {
    switch (source) {
      case "LINKEDIN":
        return { label: "LinkedIn Sourcing", bg: "bg-sky-50 text-sky-700 border-sky-200" };
      case "REFERRAL":
        return { label: "Giới thiệu nội bộ", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" };
      case "HEADHUNTER":
        return { label: "Đối tác săn đầu người", bg: "bg-purple-50 text-purple-700 border-purple-200" };
      case "DIRECT_EMAIL":
        return { label: "Email trực tiếp", bg: "bg-amber-50 text-amber-700 border-amber-200" };
      default:
        return { label: "Cổng tuyển dụng", bg: "bg-slate-100 text-slate-700 border-slate-200" };
    }
  };

  const getStageBadge = (stage: string) => {
    switch (stage) {
      case "NEW":
        return { label: "Mới nộp", bg: "bg-blue-100 text-blue-800" };
      case "SCREENING":
        return { label: "Sàng lọc", bg: "bg-indigo-100 text-indigo-800" };
      case "INTERVIEW":
        return { label: "Phỏng vấn", bg: "bg-amber-100 text-amber-800" };
      case "HIRED":
        return { label: "Tuyển chọn", bg: "bg-emerald-100 text-emerald-800" };
      case "REJECTED":
        return { label: "Từ chối", bg: "bg-rose-100 text-rose-800" };
      default:
        return { label: stage, bg: "bg-slate-100 text-slate-800" };
    }
  };

  return (
    <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* 1. Header Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 text-[11px] font-bold border border-brand-200 mb-1.5">
            <Users className="w-3.5 h-3.5" />
            Danh Sách Hồ Sơ Toàn Hệ Thống
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Quản Lý Hồ Sơ Ứng Viên & Xem Trực Quan CV
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Tra cứu toàn bộ hồ sơ, xem trực tiếp file CV PDF gốc, kiểm tra bằng cấp đính kèm và tiếp nhận CV từ các kênh bên ngoài.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Nút Tiếp nhận CV mới */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-500/20 hover:shadow-lg transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Tiếp Nhận CV Mới</span>
          </button>

          {/* Xuất CSV */}
          <a
            href="/api/export"
            download
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 hover:shadow-lg transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Xuất CSV</span>
          </a>

          {/* Làm mới */}
          <button
            onClick={() => fetchCandidates()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all cursor-pointer"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${loading ? "animate-spin text-brand-600" : ""}`}
            />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* Thông báo Notice */}
      {notice && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 text-emerald-900 shadow-sm flex items-start justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notice}</span>
          </div>
          <button onClick={() => setNotice(null)} className="text-emerald-500 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Bộ Lọc Đa Tiêu Chí & Sắp Xếp */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        {/* Hàng 1: Tìm kiếm & Các dropdown phân loại */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3">
          {/* Ô tìm kiếm */}
          <div className="md:col-span-4">
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              Tìm kiếm ứng viên
            </label>
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nhập tên, email hoặc kỹ năng..."
                className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-3 pr-8 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Lọc theo Vị trí tuyển dụng */}
          <div className="md:col-span-3">
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-slate-400" />
              Vị trí tuyển dụng
            </label>
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
            >
              <option value="ALL">Tất cả vị trí ({jobs.length})</option>
              {jobs.map((job) => (
                <option key={job.id} value={String(job.id)}>
                  {job.title} — {job.department}
                </option>
              ))}
            </select>
          </div>

          {/* Lọc theo Vòng tuyển dụng */}
          <div className="md:col-span-3">
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              Vòng tuyển dụng
            </label>
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
            >
              <option value="ALL">Tất cả các vòng</option>
              <option value="NEW">Mới nộp</option>
              <option value="SCREENING">Sàng lọc</option>
              <option value="INTERVIEW">Phỏng vấn</option>
              <option value="HIRED">Tuyển chọn</option>
              <option value="REJECTED">Từ chối</option>
            </select>
          </div>

          {/* Lọc theo Nguồn ứng viên */}
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Nguồn tiếp nhận
            </label>
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
            >
              <option value="ALL">Tất cả nguồn</option>
              <option value="LINKEDIN">LinkedIn Sourcing</option>
              <option value="REFERRAL">Giới thiệu nội bộ</option>
              <option value="HEADHUNTER">Agency / Headhunter</option>
              <option value="CAREER_SITE">Cổng tuyển dụng</option>
              <option value="DIRECT_EMAIL">Email trực tiếp</option>
            </select>
          </div>
        </div>

        {/* Hàng 2: Sắp Xếp (Sort) & Quick Filter Pills */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          {/* Quick Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-semibold mr-1">Bộ lọc nhanh:</span>
            <button
              type="button"
              onClick={() => setQuickFilter("ALL")}
              className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                quickFilter === "ALL"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Tất cả ({candidates.length})
            </button>
            <button
              type="button"
              onClick={() => setQuickFilter(quickFilter === "STARRED" ? "ALL" : "STARRED")}
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-xl font-bold transition-all cursor-pointer border ${
                quickFilter === "STARRED"
                  ? "bg-amber-500 text-white border-amber-600 shadow-xs"
                  : "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
              }`}
            >
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>Đã gắn sao ({candidates.filter((c) => c.isStarred).length})</span>
            </button>
            <button
              type="button"
              onClick={() => setQuickFilter(quickFilter === "UNVIEWED" ? "ALL" : "UNVIEWED")}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl font-bold transition-all cursor-pointer border ${
                quickFilter === "UNVIEWED"
                  ? "bg-blue-600 text-white border-blue-700 shadow-xs"
                  : "bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span>Chưa xem ({candidates.filter((c) => !c.isViewed).length})</span>
            </button>
            <button
              type="button"
              onClick={() => setQuickFilter(quickFilter === "UNEVALUATED" ? "ALL" : "UNEVALUATED")}
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-xl font-bold transition-all cursor-pointer border ${
                quickFilter === "UNEVALUATED"
                  ? "bg-purple-600 text-white border-purple-700 shadow-xs"
                  : "bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100"
              }`}
            >
              <span>Chưa đánh giá ({candidates.filter((c) => !c.evaluations || c.evaluations.length === 0).length})</span>
            </button>
          </div>

          {/* Sắp xếp danh sách (Sort Dropdown) */}
          <div className="flex items-center gap-2 shrink-0">
            <label className="text-xs font-semibold text-slate-500 flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <span>Sắp xếp:</span>
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-xs rounded-xl border border-slate-200 bg-slate-50/70 py-1.5 px-3 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all cursor-pointer"
            >
              <option value="NEWEST">🕒 Mới nhất (Thời gian nộp)</option>
              <option value="OLDEST">⏳ Cũ nhất</option>
              <option value="UNVIEWED_FIRST">🔔 Chưa xem lên đầu</option>
              <option value="STARRED_FIRST">⭐ Được gắn sao lên đầu</option>
              <option value="UNEVALUATED_FIRST">📝 Chưa có đánh giá lên đầu</option>
              <option value="NAME_ASC">🔤 Tên ứng viên (A - Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Bảng Danh Sách Ứng Viên */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-3 w-10 text-center">
                  <Star className="w-3.5 h-3.5 mx-auto text-amber-500 fill-amber-500" />
                </th>
                <th className="py-3.5 px-4">Ứng viên & Nguồn</th>
                <th className="py-3.5 px-4">Vị trí ứng tuyển</th>
                <th className="py-3.5 px-4">Kỹ năng trích xuất</th>
                <th className="py-3.5 px-4 text-center">Bằng cấp & Chứng chỉ</th>
                <th className="py-3.5 px-4 text-center">Đánh giá phỏng vấn</th>
                <th className="py-3.5 px-4 text-center">Giai đoạn</th>
                <th className="py-3.5 px-4 text-right">Xem CV / Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-600" />
                    Đang nạp danh sách hồ sơ ứng viên...
                  </td>
                </tr>
              ) : candidates.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Không tìm thấy ứng viên nào phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                candidates.map((app) => {
                  const candidate = app.candidate;
                  let skills: string[] = [];
                  try {
                    skills = JSON.parse(candidate?.parsedSkills || "[]");
                  } catch {
                    skills = [];
                  }

                  let certs: any[] = [];
                  try {
                    certs = JSON.parse(candidate?.certificates || "[]");
                  } catch {
                    certs = [];
                  }

                  const sourceBadge = getSourceBadge(app.source || "CAREER_SITE");
                  const stageBadge = getStageBadge(app.currentStage);
                  const hasScorecard = app.evaluations && app.evaluations.length > 0;
                  const isNewStage = app.currentStage === "NEW";
                  const isUnviewedNew = isNewStage && !app.isViewed;

                  return (
                    <tr
                      key={app.id}
                      className={`transition-colors group ${
                        isUnviewedNew
                          ? "bg-blue-50/50 hover:bg-blue-50/80 border-l-4 border-l-blue-600"
                          : app.isStarred
                          ? "bg-amber-50/25 hover:bg-amber-50/50 border-l-4 border-l-amber-400"
                          : "hover:bg-slate-50/70"
                      }`}
                    >
                      {/* Cột Gắn sao ⭐ (Gmail style) */}
                      <td className="py-3.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleStar(app.id);
                          }}
                          title={app.isStarred ? "Bỏ gắn sao" : "Gắn sao hồ sơ đặc biệt"}
                          className="p-1.5 rounded-lg text-slate-300 hover:text-amber-400 hover:bg-amber-50 transition-all cursor-pointer inline-flex items-center justify-center"
                        >
                          <Star
                            className={`w-4 h-4 transition-transform ${
                              app.isStarred
                                ? "fill-amber-400 text-amber-400 scale-110 drop-shadow-2xs"
                                : "text-slate-300 hover:text-amber-400 hover:scale-110"
                            }`}
                          />
                        </button>
                      </td>

                      {/* Ứng viên & Nguồn */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedAppId(app.id)}
                            className="hover:text-brand-600 transition-colors text-left"
                          >
                            {candidate?.fullName}
                          </button>

                          {/* Đánh sáng cho CV ở stage NEW chưa xem */}
                          {isUnviewedNew ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-700 border border-blue-300 shadow-2xs animate-pulse">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping" />
                              <span>Mới • Chưa xem</span>
                            </span>
                          ) : isNewStage ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                              Đã xem
                            </span>
                          ) : null}

                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${sourceBadge.bg}`}
                          >
                            {sourceBadge.label}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {candidate?.email} &bull; {candidate?.phone}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          KN: {candidate?.experienceYears > 0 ? `${candidate.experienceYears} năm` : "Mới tốt nghiệp"} &bull; Nộp: {new Date(app.createdAt).toLocaleDateString("vi-VN")}
                        </div>
                      </td>

                      {/* Vị trí */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900">
                          {app.job?.title}
                        </span>
                        <div className="text-[11px] text-slate-500">
                          {app.job?.department}
                        </div>
                      </td>

                      {/* Kỹ năng */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="flex flex-wrap gap-1">
                          {skills.slice(0, 3).map((sk) => (
                            <span
                              key={sk}
                              className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200"
                            >
                              {sk}
                            </span>
                          ))}
                          {skills.length > 3 && (
                            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-50 text-slate-400">
                              +{skills.length - 3}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Bằng cấp & Chứng chỉ */}
                      <td className="py-3.5 px-4 text-center">
                        {certs.length > 0 ? (
                          <div className="inline-flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                              <Award className="w-3.5 h-3.5 text-purple-600" />
                              <span>{certs.length} tệp</span>
                            </span>
                            {/* Nút xem nhanh ảnh đầu tiên nếu có */}
                            {certs[0]?.fileUrl && (certs[0]?.fileType === "image" || /\.(jpg|jpeg|png|webp)$/i.test(certs[0]?.fileUrl)) && (
                              <button
                                onClick={() => {
                                  setImagePreviewUrl(certs[0].fileUrl);
                                  setImagePreviewTitle(certs[0].name || "Chứng chỉ ứng viên");
                                }}
                                className="p-1 rounded-lg text-purple-600 hover:bg-purple-100 transition-colors"
                                title="Xem ảnh chứng chỉ ngay"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>

                      {/* Scorecard */}
                      <td className="py-3.5 px-4 text-center">
                        {hasScorecard ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                            {app.evaluations[0]?.overallScore?.toFixed(1) || "5.0"}/5★
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">Chưa đánh giá</span>
                        )}
                      </td>

                      {/* Giai đoạn (Stage) */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${stageBadge.bg}`}
                        >
                          {stageBadge.label}
                        </span>
                      </td>

                      {/* Thao tác: Xem PDF & Mở Drawer */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Nút Xem PDF Trực Tiếp */}
                          {candidate?.cvFileUrl ? (
                            <button
                              onClick={() => {
                                setPdfPreviewUrl(candidate.cvFileUrl);
                                setPdfPreviewTitle(`${candidate.fullName} — CV Gốc`);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold border border-red-200 transition-all cursor-pointer"
                              title="Xem trực tiếp bản PDF gốc ngay trên màn hình"
                            >
                              <FileText className="w-3.5 h-3.5 text-red-600" />
                              <span>Xem PDF</span>
                            </button>
                          ) : (
                            <span className="text-slate-300 text-xs italic">Không có PDF</span>
                          )}

                          {/* Nút Chi Tiết Hồ Sơ */}
                          <button
                            onClick={() => setSelectedAppId(app.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-slate-700 text-xs font-bold border border-slate-200 transition-all cursor-pointer"
                            title="Mở Drawer chi tiết hồ sơ & đối chiếu"
                          >
                            <span>Chi tiết</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Quick PDF Viewer Modal (Xem trực tiếp bản PDF gốc không rời trang) */}
      {pdfPreviewUrl && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setPdfPreviewUrl(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-4xl w-full h-[90vh] shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Toolbar */}
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center font-bold">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm truncate max-w-md">
                    {pdfPreviewTitle}
                  </h3>
                  <p className="text-[11px] text-slate-400">Trình xem trước tài liệu PDF trực quan</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={pdfPreviewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-200 border border-slate-300 transition-all"
                  title="Mở trong tab mới"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Mở tab mới</span>
                </a>
                <a
                  href={pdfPreviewUrl}
                  download
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-xs transition-all"
                  title="Tải tệp PDF về máy tính"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Tải về</span>
                </a>
                <button
                  onClick={() => setPdfPreviewUrl(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors ml-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Embedded Iframe */}
            <div className="flex-1 bg-slate-100 p-2">
              <iframe
                src={`${pdfPreviewUrl}#toolbar=1&navpanes=0&scrollbar=1`}
                className="w-full h-full rounded-2xl border-none shadow-sm"
                title={pdfPreviewTitle}
              />
            </div>
          </div>
        </div>
      )}

      {/* 5. Lightbox Xem Ảnh Bằng Cấp / Chứng Chỉ */}
      {imagePreviewUrl && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in"
          onClick={() => setImagePreviewUrl(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-700 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-3.5 bg-slate-800 text-white border-b border-slate-700">
              <span className="text-xs font-bold truncate max-w-md">{imagePreviewTitle}</span>
              <div className="flex items-center gap-2">
                <a
                  href={imagePreviewUrl}
                  download
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                  title="Tải ảnh về máy"
                >
                  <Download className="w-4 h-4" />
                </a>
                <button
                  type="button"
                  onClick={() => setImagePreviewUrl(null)}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
                  title="Đóng"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-2 flex items-center justify-center max-h-[80vh] overflow-auto">
              <img
                src={imagePreviewUrl}
                alt={imagePreviewTitle}
                className="max-h-[75vh] w-auto object-contain rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* 6. Candidate Drawer (Slide-over chi tiết) */}
      <CandidateDrawer
        applicationId={selectedAppId}
        onClose={() => {
          setSelectedAppId(null);
          fetchCandidates();
        }}
        onStageChange={async (appId, toStage) => {
          try {
            const res = await fetch("/api/pipeline/move", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ applicationId: appId, toStage }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
              return data.error || "Không thể chuyển trạng thái";
            }
            fetchCandidates();
            setNotice(`Đã chuyển ứng viên sang trạng thái ${toStage}!`);
            return true;
          } catch (e: any) {
            return e.message || "Lỗi chuyển giai đoạn";
          }
        }}
      />

      {/* 7. Modal Tiếp Nhận CV Mới Nội Bộ */}
      <AddCandidateModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          fetchCandidates();
          setNotice("Tiếp nhận hồ sơ ứng viên mới thành công!");
        }}
        defaultJobId={selectedJobId !== "ALL" ? Number(selectedJobId) : null}
      />
    </div>
  );
}

