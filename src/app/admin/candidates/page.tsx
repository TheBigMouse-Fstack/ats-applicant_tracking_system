"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Search,
  Download,
  RefreshCw,
  UserPlus,
  Star,
  CheckCircle2,
  X,
  ChevronRight,
} from "lucide-react";
import CandidateDrawer from "@/components/candidate/CandidateDrawer";
import AddCandidateModal from "@/components/candidate/AddCandidateModal";
import { getAiMatchTier } from "@/lib/match-score";
import { useSession } from "@/contexts/SessionContext";
import { useLanguage } from "@/lib/i18n";
import { clientCache } from "@/lib/client-cache";

interface JobOption {
  id: number;
  title: string;
  department: string;
}

const STAGE_STYLES: Record<string, { label: string; cls: string }> = {
  NEW: { label: "Mới nộp", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  SCREENING: { label: "Sàng lọc", cls: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  INTERVIEW: { label: "Phỏng vấn", cls: "bg-amber-50 text-amber-800 border-amber-200" },
  HIRED: { label: "Tuyển chọn", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  REJECTED: { label: "Từ chối", cls: "bg-rose-50 text-rose-700 border-rose-200" },
};

/**
 * Trang Danh sách Ứng viên (Overview-Only Table):
 * Chỉ hiển thị đúng 5 nhóm thông tin tổng quan cốt lõi:
 * 1. Ứng viên (Tên, Email, trạng thái chưa xem/sao)
 * 2. Vị trí & Kinh nghiệm
 * 3. Kỹ năng chính (tối đa 3 tag)
 * 4. Đánh giá AI (%)
 * 5. Trạng thái vòng tuyển
 * Toàn bộ thông tin chi tiết (SĐT, nguồn tiếp nhận, bằng cấp, CV gốc, Scorecard, lịch sử) được gộp gọn trong Drawer khi nhấp vào dòng.
 */
export default function CandidatesListPage() {
  const { user: currentUser } = useSession();
  const { t } = useLanguage();
  const [candidates, setCandidates] = useState<any[]>([]);
  const [jobs, setJobs] = useState<JobOption[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [selectedJobId, setSelectedJobId] = useState("ALL");
  const [selectedStage, setSelectedStage] = useState("ALL");
  const [sortBy, setSortBy] = useState<string>("NEWEST");
  const [quickFilter, setQuickFilter] = useState<"ALL" | "STARRED" | "UNVIEWED">("ALL");

  const [selectedAppId, setSelectedAppId] = useState<number | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/jobs")
      .then((res) => res.json())
      .then((d) => {
        if (d.success) setJobs(d.data || []);
      })
      .catch(() => {});
  }, []);

  const cacheKey = `candidates_${search.trim()}_${selectedJobId}_${selectedStage}_${sortBy}_${quickFilter}`;
  const abortControllerRef = useRef<AbortController | null>(null);
  const latestRequestIdRef = useRef<number>(0);

  const fetchCandidates = useCallback(async (isSilent = false) => {
    // Hủy bỏ request đang chạy dở trước đó
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const currentRequestId = ++latestRequestIdRef.current;

    try {
      if (!isSilent) {
        setCandidates((prev) => {
          if ((!prev || prev.length === 0) && !clientCache.getStale(cacheKey)) {
            setLoading(true);
          }
          return prev;
        });
      }
      const params = new URLSearchParams();
      if (search.trim()) params.append("search", search.trim());
      if (selectedJobId !== "ALL") params.append("jobId", selectedJobId);
      if (selectedStage !== "ALL") params.append("stage", selectedStage);
      if (sortBy !== "NEWEST") params.append("sortBy", sortBy);
      if (quickFilter === "STARRED") params.append("starred", "true");
      if (quickFilter === "UNVIEWED") params.append("unviewed", "true");

      const res = await fetch(`/api/applications?${params.toString()}`, {
        signal: controller.signal,
      });
      const data = await res.json();

      // Chống Race Condition: Bỏ qua nếu có request mới hơn
      if (currentRequestId !== latestRequestIdRef.current) return;

      if (data.success) {
        const list = data.data || [];
        setCandidates(list);
        clientCache.set(cacheKey, list);
      }
    } catch (e: any) {
      if (e.name === "AbortError") return;
      if (currentRequestId !== latestRequestIdRef.current) return;
      console.error(e);
    } finally {
      if (currentRequestId === latestRequestIdRef.current) {
        setLoading(false);
      }
    }
  }, [search, selectedJobId, selectedStage, sortBy, quickFilter, cacheKey]);

  useEffect(() => {
    // Kiểm tra cache: hiển thị ngay lập tức nếu có, sau đó revalidate ngầm
    const cached = clientCache.getStale<any[]>(cacheKey);
    if (cached) {
      setCandidates(cached);
      setLoading(false);
      fetchCandidates(true);
    } else {
      fetchCandidates(false);
    }
  }, [fetchCandidates, cacheKey]);

  useEffect(() => {
    const handleNewApp = () => {
      clientCache.invalidate("candidates_");
      fetchCandidates(true);
    };
    window.addEventListener("ats:new-application", handleNewApp);
    return () => window.removeEventListener("ats:new-application", handleNewApp);
  }, [fetchCandidates]);

  const handleToggleStar = async (appId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setCandidates((prev) =>
      prev.map((c) => (c.id === appId ? { ...c, isStarred: !c.isStarred } : c))
    );
    try {
      const res = await fetch(`/api/applications/${appId}/star`, { method: "POST" });
      const data = await res.json();
      if (!data.success) fetchCandidates();
    } catch {
      fetchCandidates();
    }
  };

  const handleStageChange = async (
    appId: number,
    toStage: string,
    rejectionReason?: string
  ): Promise<boolean | string> => {
    try {
      const res = await fetch("/api/pipeline/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId: appId, toStage, rejectionReason }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        return result.error || "Không thể cập nhật trạng thái";
      }
      await fetchCandidates();
      return true;
    } catch {
      return "Lỗi kết nối máy chủ khi cập nhật trạng thái";
    }
  };

  const canUploadOrExport = Boolean(currentUser && currentUser.role !== "HIRING_MANAGER");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      {/* 1. Header & Thanh công cụ lọc 1 hàng */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {t("candidates.title")}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {loading ? (
                <span className="inline-flex items-center gap-1.5 text-brand-600 font-medium animate-pulse">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>{t("pipeline.loading")}</span>
                </span>
              ) : (
                `${candidates.length} ${t("candidates.countSubtitle")}`
              )}
            </p>
          </div>

          {canUploadOrExport && (
            <div className="flex items-center gap-2 shrink-0">
              <a
                href="/api/export"
                download
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors active:scale-[0.98]"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>{t("kanban.exportCsv")}</span>
              </a>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors cursor-pointer active:scale-[0.98]"
              >
                <UserPlus className="w-4 h-4" />
                <span>{t("candidates.addBtn")}</span>
              </button>
            </div>
          )}
        </div>

        {/* Thanh tìm kiếm & lọc gọn 1 hàng */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-2.5 pt-3 border-t border-slate-100 text-xs">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("candidates.searchPlaceholder")}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2 pl-8 pr-8 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white transition-all"
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

          <select
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50/70 py-2 px-3 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white transition-all lg:w-56"
          >
            <option value="ALL">{t("candidates.allJobs")} ({jobs.length})</option>
            {jobs.map((job) => (
              <option key={job.id} value={String(job.id)}>
                {job.title}
              </option>
            ))}
          </select>

          <select
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50/70 py-2 px-3 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white transition-all lg:w-40"
          >
            <option value="ALL">{t("candidates.allStages")}</option>
            <option value="NEW">{t("stage.NEW")}</option>
            <option value="SCREENING">{t("stage.SCREENING")}</option>
            <option value="INTERVIEW">{t("stage.INTERVIEW")}</option>
            <option value="HIRED">{t("stage.HIRED")}</option>
            <option value="REJECTED">{t("stage.REJECTED")}</option>
          </select>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() =>
                setQuickFilter(quickFilter === "STARRED" ? "ALL" : "STARRED")
              }
              className={`inline-flex items-center gap-1 px-3 py-2 rounded-xl font-medium transition-colors cursor-pointer border ${
                quickFilter === "STARRED"
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Star
                className={`w-3.5 h-3.5 ${
                  quickFilter === "STARRED"
                    ? "fill-amber-400 text-amber-400"
                    : "text-slate-400"
                }`}
              />
              <span>{t("candidates.starred")}</span>
            </button>

            <button
              type="button"
              onClick={() =>
                setQuickFilter(quickFilter === "UNVIEWED" ? "ALL" : "UNVIEWED")
              }
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl font-medium transition-colors cursor-pointer border ${
                quickFilter === "UNVIEWED"
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span>{t("candidates.unviewed")}</span>
            </button>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white py-2 px-3 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all cursor-pointer"
            >
              <option value="NEWEST">{t("candidates.sortNewest")}</option>
              <option value="OLDEST">{t("candidates.sortOldest")}</option>
              <option value="UNVIEWED_FIRST">{t("candidates.sortUnviewed")}</option>
              <option value="STARRED_FIRST">{t("candidates.sortStarred")}</option>
              <option value="NAME_ASC">{t("candidates.sortName")}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Thông báo */}
      {notice && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-emerald-900 flex items-center justify-between gap-3 text-xs font-medium">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notice}</span>
          </div>
          <button
            onClick={() => setNotice(null)}
            className="text-emerald-600 hover:text-emerald-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Bảng Tổng quan 5 cột cốt lõi (Bấm vào dòng để mở Drawer Chi tiết) */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs">
                <th className="py-3 px-3 w-10 text-center" />
                <th className="py-3 px-4">{t("candidates.thCandidate")}</th>
                <th className="py-3 px-4">{t("candidates.thPositionExp")}</th>
                <th className="py-3 px-4">{t("candidates.thSkills")}</th>
                <th className="py-3 px-4 text-center">{t("candidates.thMatch")}</th>
                <th className="py-3 px-4 text-center">{t("candidates.thStatus")}</th>
                <th className="py-3 px-3 w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-3 text-center">
                      <div className="w-4 h-4 bg-slate-200 rounded-full mx-auto" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="space-y-1.5">
                        <div className="h-4 w-36 bg-slate-200 rounded-md" />
                        <div className="h-3 w-48 bg-slate-100 rounded-md" />
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="space-y-1.5">
                        <div className="h-4 w-40 bg-slate-200 rounded-md" />
                        <div className="h-3 w-20 bg-slate-100 rounded-md" />
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex gap-1.5">
                        <div className="h-5 w-14 bg-slate-100 rounded-md" />
                        <div className="h-5 w-16 bg-slate-100 rounded-md" />
                        <div className="h-5 w-12 bg-slate-100 rounded-md" />
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="h-5 w-14 bg-slate-100 rounded-full mx-auto" />
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="h-5 w-20 bg-slate-100 rounded-full mx-auto" />
                    </td>
                    <td className="py-4 px-3 text-right">
                      <div className="w-4 h-4 bg-slate-100 rounded mx-auto" />
                    </td>
                  </tr>
                ))
              ) : candidates.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    {t("candidates.empty")}
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

                  const stageLabel = t(`stage.${app.currentStage}`, app.currentStage);
                  const stageInfo = STAGE_STYLES[app.currentStage] || {
                    label: stageLabel,
                    cls: "bg-slate-100 text-slate-700 border-slate-200",
                  };
                  const matchTier = getAiMatchTier(app.aiMatchScore);
                  const isUnviewedNew = app.currentStage === "NEW" && !app.isViewed;

                  return (
                    <tr
                      key={app.id}
                      onClick={() => setSelectedAppId(app.id)}
                      className="hover:bg-slate-50/90 transition-colors cursor-pointer group"
                    >
                      {/* Sao */}
                      <td className="py-3.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={(e) => handleToggleStar(app.id, e)}
                          title={app.isStarred ? t("kanban.starredOnly") : t("candidates.starred")}
                          className="p-1 rounded text-slate-300 hover:text-amber-400 transition-colors cursor-pointer"
                        >
                          <Star
                            className={`w-4 h-4 ${
                              app.isStarred
                                ? "fill-amber-400 text-amber-400"
                                : "text-slate-300 hover:text-amber-400"
                            }`}
                          />
                        </button>
                      </td>

                      {/* 1. Ứng viên (Tên + Email + chấm xanh tĩnh nếu chưa xem) */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          {isUnviewedNew && (
                            <span
                              className="w-2 h-2 rounded-full bg-blue-600 shrink-0"
                              title={t("candidates.unviewed")}
                            />
                          )}
                          <span
                            className={`text-sm group-hover:text-brand-600 transition-colors ${
                              isUnviewedNew
                                ? "font-bold text-slate-900"
                                : "font-semibold text-slate-800"
                            }`}
                          >
                            {candidate?.fullName}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 truncate max-w-xs">
                          {candidate?.email}
                        </p>
                      </td>

                      {/* 2. Vị trí & Kinh nghiệm */}
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-900">{app.job?.title}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {candidate?.experienceYears > 0
                            ? `${candidate.experienceYears} ${t("candidates.yearsExp")}`
                            : `< 1 ${t("candidates.yearsExp")}`}
                        </p>
                      </td>

                      {/* 3. Kỹ năng trích xuất (tối đa 3 tag gọn) */}
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
                            <span className="px-1.5 py-0.5 text-[11px] font-medium text-slate-400">
                              +{skills.length - 3}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 4. AI Đánh giá (%) */}
                      <td className="py-3.5 px-4 text-center">
                        {matchTier.score !== null ? (
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${matchTier.badgeClass}`}
                            title={matchTier.recommendation}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${matchTier.dotClass}`} />
                            {matchTier.score}%
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* 5. Trạng thái */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${stageInfo.cls}`}
                        >
                          {t(`stage.${app.currentStage}`, stageInfo.label)}
                        </span>
                      </td>

                      {/* Mũi tên mở chi tiết */}
                      <td className="py-3.5 px-3 text-right">
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-brand-600 transition-colors inline-block" />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer Chi tiết Hồ sơ (Tất cả thông tin chi tiết, CV gốc, Chứng chỉ, JD, Scorecard, Nhật ký nằm tại đây) */}
      {selectedAppId !== null && (
        <CandidateDrawer
          applicationId={selectedAppId}
          onClose={() => {
            setSelectedAppId(null);
            fetchCandidates(true);
          }}
          onStageChange={handleStageChange}
        />
      )}

      {/* Modal Tiếp nhận CV mới */}
      <AddCandidateModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          setIsAddModalOpen(false);
          setNotice("Đã tiếp nhận hồ sơ ứng viên mới và phân tích dữ liệu thành công.");
          fetchCandidates();
          setTimeout(() => setNotice(null), 5000);
        }}
      />
    </div>
  );
}
