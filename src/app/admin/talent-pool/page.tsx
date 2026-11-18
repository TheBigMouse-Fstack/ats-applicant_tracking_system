"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Search,
  Download,
  RefreshCw,
  Briefcase,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet,
  X,
  Filter,
  Eye,
  Star,
  Trash2,
  ShieldAlert,
  Loader2,
} from "lucide-react";
import CandidateDrawer from "@/components/candidate/CandidateDrawer";
import { getAiMatchTier } from "@/lib/match-score";

export default function TalentPoolPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedJobId, setSelectedJobId] = useState("ALL");
  const [selectedStage, setSelectedStage] = useState("ALL");
  const [sortBy, setSortBy] = useState("NEWEST");
  const [quickFilter, setQuickFilter] = useState<"ALL" | "STARRED" | "UNVIEWED">("ALL");

  // Re-pool Modal State
  const [repoolCandidate, setRepoolCandidate] = useState<any | null>(null);
  const [targetJobId, setTargetJobId] = useState<string>("");
  const [repoolLoading, setRepoolLoading] = useState(false);
  const [repoolError, setRepoolError] = useState<string | null>(null);

  // BRL-10 Data Retention Purge State (Admin only)
  const [isPurgeModalOpen, setIsPurgeModalOpen] = useState(false);
  const [purgeDays, setPurgeDays] = useState(180);
  const [purgeSimResult, setPurgeSimResult] = useState<any | null>(null);
  const [purgeLoading, setPurgeLoading] = useState(false);
  const [purgeError, setPurgeError] = useState<string | null>(null);

  // Drawer
  const [drawerAppId, setDrawerAppId] = useState<number | null>(null);

  // Success / Notice Banner
  const [notice, setNotice] = useState<string | null>(null);

  // Toggle Star (Gmail-style)
  const handleToggleStar = async (appId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setData((prev) =>
      prev.map((app) => (app.id === appId ? { ...app, isStarred: !app.isStarred } : app))
    );
    try {
      await fetch(`/api/applications/${appId}/star`, { method: "POST" });
    } catch (err) {
      console.error("Lỗi khi gắn sao:", err);
      fetchTalentPool();
    }
  };

  // Fetch Jobs list for filter and repool dropdown
  const fetchJobs = async () => {
    try {
      const res = await fetch("/api/pipeline");
      const resData = await res.json();
      if (resData.success) {
        setJobs(resData.jobs || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch Talent Pool candidates
  const fetchTalentPool = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search.trim()) params.append("search", search.trim());
      if (selectedJobId !== "ALL") params.append("jobId", selectedJobId);
      if (selectedStage !== "ALL") params.append("stage", selectedStage);
      if (sortBy) params.append("sortBy", sortBy);
      if (quickFilter === "STARRED") params.append("starred", "true");
      if (quickFilter === "UNVIEWED") params.append("unviewed", "true");

      const res = await fetch(`/api/talent-pool?${params.toString()}`);
      const resData = await res.json();
      if (resData.success) {
        setData(resData.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search, selectedJobId, selectedStage, sortBy, quickFilter]);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((res) => {
        if (res.success && res.user) {
          setCurrentUser(res.user);
        }
      })
      .catch((e) => console.error(e));

    fetchJobs();
    fetchTalentPool();
  }, [fetchTalentPool]);

  // BRL-10: Mô phỏng quét dữ liệu quá hạn
  const handleSimulatePurge = async (days = purgeDays) => {
    try {
      setPurgeLoading(true);
      setPurgeError(null);
      const res = await fetch("/api/talent-pool/cleanup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days: Number(days), dryRun: true }),
      });
      const resData = await res.json();
      if (!res.ok || !resData.success) {
        setPurgeError(resData.error || "Không thể mô phỏng dọn dẹp");
      } else {
        setPurgeSimResult(resData);
      }
    } catch (e: any) {
      setPurgeError("Lỗi kết nối khi quét dọn dẹp: " + e.message);
    } finally {
      setPurgeLoading(false);
    }
  };

  // BRL-10: Thực thi xóa vĩnh viễn (Hard Delete)
  const handleExecutePurge = async () => {
    try {
      setPurgeLoading(true);
      setPurgeError(null);
      const res = await fetch("/api/talent-pool/cleanup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days: Number(purgeDays), dryRun: false }),
      });
      const resData = await res.json();
      if (!res.ok || !resData.success) {
        setPurgeError(resData.error || "Lỗi dọn dẹp dữ liệu");
      } else {
        setNotice(
          `Tuân thủ BRL-10: Đã dọn dẹp vĩnh viễn ${resData.purgedApplicationsCount} hồ sơ quá hạn ${purgeDays} ngày khỏi Kho Nhân Tài!`
        );
        setIsPurgeModalOpen(false);
        setPurgeSimResult(null);
        fetchTalentPool();
      }
    } catch (e: any) {
      setPurgeError("Lỗi hệ thống khi dọn dẹp dữ liệu: " + e.message);
    } finally {
      setPurgeLoading(false);
    }
  };

  // Handle Repool submit (UC-06)
  const handleRepoolSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoolCandidate || !targetJobId) {
      setRepoolError("Vui lòng chọn vị trí tuyển dụng mới cho ứng viên.");
      return;
    }

    setRepoolLoading(true);
    setRepoolError(null);

    try {
      const res = await fetch("/api/talent-pool", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId: repoolCandidate.id,
          targetJobId: Number(targetJobId),
        }),
      });

      const resData = await res.json();
      if (!res.ok || !resData.success) {
        setRepoolError(resData.error || "Không thể khôi phục ứng viên");
      } else {
        setNotice(
          `Đã chuyển ứng viên ${repoolCandidate.fullName} sang vị trí mới thành công!`
        );
        setRepoolCandidate(null);
        setTargetJobId("");
        fetchTalentPool();
      }
    } catch (err: any) {
      setRepoolError("Lỗi hệ thống khi khôi phục hồ sơ.");
    } finally {
      setRepoolLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      {/* 1. Header tối giản — không lặp Xuất CSV & Làm mới */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Kho Nhân Tài
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Lưu trữ và tái sử dụng hồ sơ ứng viên cho các vị trí phù hợp mới &bull; Nhấp vào từng dòng để xem chi tiết
          </p>
        </div>

        {currentUser?.role === "ADMIN" && (
          <button
            onClick={() => {
              setIsPurgeModalOpen(true);
              handleSimulatePurge(purgeDays);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold border border-rose-200 transition-colors cursor-pointer shrink-0"
            title="Dọn dẹp hồ sơ REJECTED quá hạn 180 ngày (BRL-10)"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            <span>Dọn dẹp hồ sơ quá hạn</span>
          </button>
        )}
      </div>

      {/* Thông báo Notice */}
      {notice && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 text-emerald-900 shadow-sm flex items-start justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notice}</span>
          </div>
          <button onClick={() => setNotice(null)} className="text-emerald-500 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Filters & Quick Sort Controls */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3 items-center">
          {/* Search */}
          <div className="md:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên ứng viên, email hoặc kỹ năng..."
              className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-9 pr-3 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Job filter */}
          <div className="md:col-span-3">
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="ALL">Tất cả vị trí tuyển dụng</option>
              {jobs.map((j) => (
                <option key={j.id} value={String(j.id)}>
                  {j.title} ({j.department})
                </option>
              ))}
            </select>
          </div>

          {/* Stage filter */}
          <div className="md:col-span-3">
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="ALL">Tất cả trạng thái Kanban</option>
              <option value="NEW">NEW — Mới tiếp nhận</option>
              <option value="SCREENING">SCREENING — Sàng lọc</option>
              <option value="INTERVIEW">INTERVIEW — Phỏng vấn</option>
              <option value="HIRED">HIRED — Đã tuyển</option>
              <option value="REJECTED">REJECTED — Đã từ chối</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="md:col-span-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="NEWEST">Mới nhất trước</option>
              <option value="OLDEST">Cũ nhất trước</option>
              <option value="STARRED_FIRST">⭐ Đã gắn sao</option>
              <option value="UNVIEWED_FIRST">🔔 Chưa xem trước</option>
            </select>
          </div>
        </div>

        {/* Quick Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Bộ lọc nhanh:</span>
          <button
            type="button"
            onClick={() => setQuickFilter("ALL")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              quickFilter === "ALL"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Tất cả
          </button>
          <button
            type="button"
            onClick={() => setQuickFilter("STARRED")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              quickFilter === "STARRED"
                ? "bg-amber-500 text-white shadow-xs"
                : "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
            }`}
          >
            <span>⭐ Đã gắn sao</span>
            {data.filter((a) => a.isStarred).length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/30 text-current font-black">
                {data.filter((a) => a.isStarred).length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setQuickFilter("UNVIEWED")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              quickFilter === "UNVIEWED"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
            }`}
          >
            <span>🔔 Chưa xem</span>
            {data.filter((a) => !a.isViewed).length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-200 text-blue-900 font-black">
                {data.filter((a) => !a.isViewed).length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 3. Bảng danh sách ứng viên Talent Pool */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3 text-center w-10" />
                <th className="py-3 px-4">Ứng viên</th>
                <th className="py-3 px-4">Vị trí &amp; Kinh nghiệm</th>
                <th className="py-3 px-4">Kỹ năng chính</th>
                <th className="py-3 px-4 text-center">AI Đánh giá</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-right">Luân chuyển</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-brand-600" />
                    Đang tải dữ liệu kho nhân tài...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Không tìm thấy ứng viên nào phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                data.map((app) => {
                  let skills: string[] = [];
                  try {
                    skills = JSON.parse(app.candidate?.parsedSkills || "[]");
                  } catch {
                    skills = [];
                  }

                  const candidate = app.candidate;
                  const matchTier = getAiMatchTier(app.aiMatchScore);

                  return (
                    <tr
                      key={app.id}
                      onClick={() => setDrawerAppId(app.id)}
                      className="hover:bg-slate-50/90 transition-colors cursor-pointer group"
                    >
                      {/* Star Column */}
                      <td className="py-3.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={(e) => handleToggleStar(app.id, e)}
                          className="p-1 rounded text-slate-300 hover:text-amber-400 transition-colors cursor-pointer"
                          title={app.isStarred ? "Bỏ gắn sao" : "Gắn sao ưu tiên"}
                        >
                          <Star
                            className={`w-4 h-4 ${
                              app.isStarred
                                ? "text-amber-400 fill-amber-400"
                                : "text-slate-300 hover:text-amber-400"
                            }`}
                          />
                        </button>
                      </td>

                      {/* Ứng viên */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-900 text-sm group-hover:text-brand-600 transition-colors block">
                          {candidate?.fullName}
                        </span>
                        <span className="text-[11px] text-slate-500 block mt-0.5">
                          {candidate?.email}
                        </span>
                      </td>

                      {/* Vị trí & Kinh nghiệm */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-900 block">
                          {app.job?.title}
                        </span>
                        <span className="text-[11px] text-slate-500 block mt-0.5">
                          {candidate?.experienceYears > 0
                            ? `${candidate.experienceYears} năm kinh nghiệm`
                            : "Dưới 1 năm kinh nghiệm"}
                        </span>
                      </td>

                      {/* Kỹ năng */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="flex flex-wrap gap-1">
                          {skills.slice(0, 3).map((sk) => (
                            <span
                              key={sk}
                              className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700"
                            >
                              {sk}
                            </span>
                          ))}
                          {skills.length > 3 && (
                            <span className="px-1.5 py-0.5 text-[11px] text-slate-400">
                              +{skills.length - 3}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* AI Đánh giá */}
                      <td className="py-3.5 px-4 text-center">
                        {matchTier.score !== null ? (
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${matchTier.badgeClass}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${matchTier.dotClass}`} />
                            {matchTier.score}%
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Trạng thái */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                            app.currentStage === "HIRED"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : app.currentStage === "REJECTED"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : app.currentStage === "INTERVIEW"
                              ? "bg-amber-50 text-amber-800 border-amber-200"
                              : app.currentStage === "SCREENING"
                              ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                              : "bg-blue-50 text-blue-700 border-blue-200"
                          }`}
                        >
                          {app.currentStage}
                        </span>
                      </td>

                      {/* Thao tác duy nhất: Khôi phục (Re-pooling) */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setRepoolCandidate(candidate);
                            setTargetJobId(String(jobs[0]?.id || ""));
                            setRepoolError(null);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-brand-50 hover:text-brand-700 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
                          title="Tái sử dụng hồ sơ sang vị trí tuyển dụng khác"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Khôi phục</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Modal Tái sử dụng hồ sơ (Re-pooling UC-06) */}
      {repoolCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 text-[11px] font-bold border border-brand-200 mb-1">
                  <RotateCcw className="w-3 h-3" />
                  Tái sử dụng hồ sơ
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  Tái Sử Dụng Hồ Sơ Ứng Viên
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRepoolCandidate(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {repoolError && (
              <div className="bg-red-50 border border-red-300 rounded-xl p-3 text-red-900 flex items-start gap-2 text-xs">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <p className="font-semibold">{repoolError}</p>
              </div>
            )}

            <form onSubmit={handleRepoolSubmit} className="space-y-4">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1">
                <p>
                  <strong>Ứng viên:</strong> {repoolCandidate.fullName}
                </p>
                <p>
                  <strong>Email:</strong> {repoolCandidate.email}
                </p>
                <p className="text-slate-500 text-[11px] pt-1">
                  Hồ sơ sẽ được đưa vào vòng <strong>SCREENING</strong> của vị trí mới để tiếp tục quy trình tuyển dụng mà không cần nộp lại CV.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Chọn Vị trí Tuyển dụng Mới <span className="text-red-500">*</span>
                </label>
                <select
                  value={targetJobId}
                  onChange={(e) => setTargetJobId(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {jobs.map((j) => (
                    <option key={j.id} value={String(j.id)}>
                      {j.title} — {j.department}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRepoolCandidate(null)}
                  disabled={repoolLoading}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={repoolLoading}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 disabled:bg-brand-400 rounded-xl shadow-md shadow-brand-500/20"
                >
                  {repoolLoading ? "Đang xử lý..." : "Xác nhận Khôi phục"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4.2 BRL-10 Data Retention Purge Modal (Admin Only) */}
      {isPurgeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Dọn dẹp hồ sơ quá hạn
                  </h3>
                  <p className="text-xs text-slate-500">
                    Tuân thủ quy định bảo mật vòng đời dữ liệu
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPurgeModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-2 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <p>
                Theo quy định bảo mật dữ liệu nhân sự, các hồ sơ ở trạng thái <strong>ĐÃ TỪ CHỐI</strong> lưu trữ quá thời hạn quy định (mặc định <strong>180 ngày</strong>) có thể được xóa vĩnh viễn để bảo vệ quyền riêng tư ứng viên.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ngưỡng thời gian lưu trữ (ngày):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={purgeDays}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setPurgeDays(isNaN(val) ? 0 : val);
                    }}
                    className="w-28 text-xs rounded-xl border border-slate-200 bg-white py-2 px-3 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleSimulatePurge(purgeDays)}
                    disabled={purgeLoading}
                    className="px-3 py-2 text-xs font-bold text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-xl border border-brand-200 cursor-pointer"
                  >
                    Quét kiểm tra
                  </button>
                  <span className="text-[11px] text-slate-400">
                    Mặc định 180 ngày; nhập 0 để quét tất cả
                  </span>
                </div>
              </div>

              {/* Simulation Result */}
              {purgeSimResult && (
                <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/70 text-xs text-amber-900 space-y-2">
                  <div className="flex items-center justify-between font-bold">
                    <span>Kết quả quét thử nghiệm:</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[11px]">
                      {purgeSimResult.eligibleCount} hồ sơ quá hạn
                    </span>
                  </div>
                  {purgeSimResult.eligibleCount === 0 ? (
                    <p className="text-slate-500 italic">
                      Hiện tại không có hồ sơ REJECTED nào lưu quá {purgeDays} ngày.
                    </p>
                  ) : (
                    <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                      {purgeSimResult.items.map((it: any) => (
                        <div
                          key={it.applicationId}
                          className="bg-white p-2 rounded-lg border border-amber-100 flex items-center justify-between text-[11px]"
                        >
                          <div>
                            <span className="font-bold text-slate-800">{it.candidateName}</span> &bull; {it.jobTitle}
                          </div>
                          <span className="text-red-600 font-semibold">{it.daysInPool} ngày</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {purgeError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{purgeError}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsPurgeModalOpen(false)}
                disabled={purgeLoading}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleExecutePurge}
                disabled={purgeLoading || (purgeSimResult && purgeSimResult.eligibleCount === 0)}
                className="px-5 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 disabled:bg-red-300 rounded-xl shadow-md shadow-red-500/20 flex items-center gap-1.5 cursor-pointer"
              >
                {purgeLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang dọn dẹp...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Xác nhận Xóa Vĩnh Viễn</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Candidate Drawer */}
      <CandidateDrawer
        applicationId={drawerAppId}
        onClose={() => {
          setDrawerAppId(null);
          fetchTalentPool();
        }}
        onStageChange={async (appId, toStage, rejectionReason) => {
          try {
            const res = await fetch("/api/pipeline/move", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ applicationId: appId, toStage, rejectionReason }),
            });
            const r = await res.json();
            if (!res.ok || !r.success) return r.error || "Lỗi chuyển trạng thái";
            fetchTalentPool();
            return true;
          } catch (e: any) {
            return e.message;
          }
        }}
      />
    </div>
  );
}


