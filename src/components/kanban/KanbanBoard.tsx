"use client";

import { useState, useEffect, useCallback } from "react";
import {
  DragDropContext,
  Droppable,
  DropResult,
} from "@hello-pangea/dnd";
import CandidateCard from "@/components/kanban/CandidateCard";
import CandidateDrawer from "@/components/candidate/CandidateDrawer";
import AddCandidateModal from "@/components/candidate/AddCandidateModal";
import RejectReasonModal from "@/components/candidate/RejectReasonModal";
import { ToastNotification } from "@/components/common/Toast";
import { canRoleDragFromStage, validateStageTransition } from "@/lib/stage-rules";
import { useLanguage } from "@/lib/i18n";
import { useSession } from "@/contexts/SessionContext";
import { clientCache } from "@/lib/client-cache";
import {
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  AlertTriangle,
  Briefcase,
  Users,
  CheckCircle,
  Clock,
  Layers,
  X,
  FileSpreadsheet,
  UserPlus,
  Star,
  ArrowUpDown,
} from "lucide-react";

interface JobOption {
  id: number;
  title: string;
  department: string;
  status: string;
  targetHeadcount?: number;
  maxActiveInterviews?: number;
  headcountMetrics?: {
    targetHeadcount: number;
    hiredCount: number;
    activeInterviewCount: number;
    remainingSlots: number;
    effectiveInterviewCap: number;
    isHeadcountFull: boolean;
    isInterviewAtCap: boolean;
  };
  _count: {
    applications: number;
  };
}

interface ColumnConfig {
  id: string;
  title: string;
  badgeColor: string;
  headerBg: string;
  dotColor: string;
  description: string;
}

const COLUMNS_CONFIG: ColumnConfig[] = [
  {
    id: "NEW",
    title: "Mới tiếp nhận",
    badgeColor: "bg-blue-100 text-blue-700 border-blue-200",
    headerBg: "bg-blue-50/70 border-b border-blue-100",
    dotColor: "bg-blue-500",
    description: "CV nộp qua cổng hoặc tải lên",
  },
  {
    id: "SCREENING",
    title: "Sàng lọc tiêu chuẩn",
    badgeColor: "bg-indigo-100 text-indigo-700 border-indigo-200",
    headerBg: "bg-indigo-50/70 border-b border-indigo-100",
    dotColor: "bg-indigo-500",
    description: "Đánh giá sơ bộ hồ sơ",
  },
  {
    id: "INTERVIEW",
    title: "Phỏng vấn",
    badgeColor: "bg-amber-100 text-amber-700 border-amber-200",
    headerBg: "bg-amber-50/70 border-b border-amber-100",
    dotColor: "bg-amber-500",
    description: "Đang đánh giá vòng chuyên môn",
  },
  {
    id: "HIRED",
    title: "Tuyển chọn",
    badgeColor: "bg-emerald-100 text-emerald-700 border-emerald-200",
    headerBg: "bg-emerald-50/70 border-b border-emerald-100",
    dotColor: "bg-emerald-500",
    description: "Đã hoàn thành đánh giá phỏng vấn",
  },
  {
    id: "REJECTED",
    title: "Từ chối",
    badgeColor: "bg-rose-100 text-rose-700 border-rose-200",
    headerBg: "bg-rose-50/70 border-b border-rose-100",
    dotColor: "bg-rose-500",
    description: "Tạm lưu trữ hồ sơ chưa phù hợp",
  },
];

export default function KanbanBoard() {
  const { t } = useLanguage();
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<JobOption[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("NEWEST");
  const [showStarredOnly, setShowStarredOnly] = useState(false);
  const [showUnviewedOnly, setShowUnviewedOnly] = useState(false);
  const [showSlaOnly, setShowSlaOnly] = useState(false);
  const [showHighMatchOnly, setShowHighMatchOnly] = useState(false);

  const [columns, setColumns] = useState<Record<string, any[]>>({
    NEW: [],
    SCREENING: [],
    INTERVIEW: [],
    HIRED: [],
    REJECTED: [],
  });
  const [stats, setStats] = useState<any>({
    total: 0,
    new: 0,
    screening: 0,
    interview: 0,
    hired: 0,
    rejected: 0,
  });

  // Drawer state
  const [selectedAppId, setSelectedAppId] = useState<number | null>(null);
  const { user: currentUser } = useSession();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Modal bắt buộc nhập Lý do từ chối khi chuyển sang REJECTED
  const [pendingRejectMove, setPendingRejectMove] = useState<{
    applicationId: number;
    fromStage: string;
    candidateName: string;
    jobTitle: string;
  } | null>(null);

  // Modal xác nhận khi vượt trần phỏng vấn cùng lúc (chống phỏng vấn dư)
  const [pendingCapOverride, setPendingCapOverride] = useState<{
    applicationId: number;
    toStage: string;
    message: string;
  } | null>(null);

  // Error / Notification alert banner
  const [alertError, setAlertError] = useState<string | null>(null);
  const [alertSuccess, setAlertSuccess] = useState<string | null>(null);

  // BRL-14: Phân trang lũy tiến theo từng cột Kanban (Mặc định: 15 hồ sơ / cột)
  const DEFAULT_PAGE_SIZE = 15;
  const [stageLimits, setStageLimits] = useState<Record<string, number>>({
    NEW: DEFAULT_PAGE_SIZE,
    SCREENING: DEFAULT_PAGE_SIZE,
    INTERVIEW: DEFAULT_PAGE_SIZE,
    HIRED: DEFAULT_PAGE_SIZE,
    REJECTED: DEFAULT_PAGE_SIZE,
  });

  const handleLoadMore = (stage: string) => {
    setStageLimits((prev) => ({
      ...prev,
      [stage]: (prev[stage] || DEFAULT_PAGE_SIZE) + DEFAULT_PAGE_SIZE,
    }));
  };

  // Debounce tìm kiếm 300ms và chỉ kích hoạt khi >= 2 ký tự (hoặc rỗng để xem tất cả)
  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = searchQuery.trim();
      if (trimmed.length >= 2 || trimmed.length === 0) {
        setDebouncedSearch(trimmed);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset phân trang lũy tiến về mặc định khi thay đổi bộ lọc hoặc tìm kiếm
  useEffect(() => {
    setStageLimits({
      NEW: DEFAULT_PAGE_SIZE,
      SCREENING: DEFAULT_PAGE_SIZE,
      INTERVIEW: DEFAULT_PAGE_SIZE,
      HIRED: DEFAULT_PAGE_SIZE,
      REJECTED: DEFAULT_PAGE_SIZE,
    });
  }, [selectedJobId, debouncedSearch, sortBy, showStarredOnly, showUnviewedOnly, showSlaOnly, showHighMatchOnly]);

  const cacheKey = `pipeline_${selectedJobId}_${debouncedSearch}_${sortBy}_${showStarredOnly}_${showUnviewedOnly}_${showSlaOnly}_${showHighMatchOnly}`;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch Pipeline Data (Hỗ trợ Silent Background Refresh để không bị giật Skeleton)
  const fetchPipeline = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) {
        setColumns((prev) => {
          const hasExistingCards = Object.values(prev).some((arr) => arr && arr.length > 0);
          if (!hasExistingCards) setLoading(true);
          return prev;
        });
      }
      const params = new URLSearchParams();
      if (selectedJobId && selectedJobId !== "ALL") {
        params.append("jobId", selectedJobId);
      }
      if (debouncedSearch) {
        params.append("search", debouncedSearch);
      }
      if (sortBy !== "NEWEST") {
        params.append("sortBy", sortBy);
      }
      if (showStarredOnly) {
        params.append("starred", "true");
      }
      if (showUnviewedOnly) {
        params.append("unviewed", "true");
      }
      if (showSlaOnly) {
        params.append("slaOnly", "true");
      }
      if (showHighMatchOnly) {
        params.append("highMatch", "true");
      }

      const res = await fetch(`/api/pipeline?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        const newJobs = data.jobs || [];
        const newCols = data.columns || {
          NEW: [],
          SCREENING: [],
          INTERVIEW: [],
          HIRED: [],
          REJECTED: [],
        };
        const newStats = data.stats || {};
        setJobs(newJobs);
        setColumns(newCols);
        setStats(newStats);

        // Lưu vào Client Cache
        clientCache.set(cacheKey, {
          jobs: newJobs,
          columns: newCols,
          stats: newStats,
        });
      } else {
        setAlertError(data.error || "Không thể tải dữ liệu tuyển dụng.");
      }
    } catch (err) {
      console.error("Error fetching pipeline:", err);
      setAlertError("Lỗi kết nối khi tải dữ liệu tuyển dụng.");
    } finally {
      setLoading(false);
    }
  }, [selectedJobId, debouncedSearch, sortBy, showStarredOnly, showUnviewedOnly, showSlaOnly, showHighMatchOnly, cacheKey]);

  // Xử lý bật/tắt gắn sao nhanh (Gmail star toggle)
  const handleToggleStar = async (appId: number) => {
    // Cập nhật lạc quan (Optimistic update)
    setColumns((prev) => {
      const next: Record<string, any[]> = {};
      Object.keys(prev).forEach((stage) => {
        next[stage] = prev[stage].map((item) =>
          item.id === appId ? { ...item, isStarred: !item.isStarred } : item
        );
      });
      return next;
    });

    try {
      const res = await fetch(`/api/applications/${appId}/star`, { method: "POST" });
      const data = await res.json();
      if (!data.success) {
        fetchPipeline(true);
      }
    } catch {
      fetchPipeline(true);
    }
  };

  useEffect(() => {
    if (isMounted) {
      // 1. Kiểm tra Cache trước: nếu có dữ liệu lưu tạm, hiển thị ngay lập tức (0ms)!
      const cached = clientCache.getStale<any>(cacheKey);
      if (cached) {
        if (cached.jobs) setJobs(cached.jobs);
        if (cached.columns) setColumns(cached.columns);
        if (cached.stats) setStats(cached.stats);
        setLoading(false);
        // Tải ngầm cập nhật lại trong nền
        fetchPipeline(true);
      } else {
        fetchPipeline(false);
      }
    }
  }, [isMounted, fetchPipeline, cacheKey]);

  // Lắng nghe sự kiện Realtime khi có ứng viên mới nộp hồ sơ -> Tự động cập nhật vào cột NEW không cần F5
  useEffect(() => {
    const handleNewApplication = () => {
      clientCache.invalidate("pipeline_");
      fetchPipeline(true);
    };

    window.addEventListener("ats:new-application", handleNewApplication);
    return () => window.removeEventListener("ats:new-application", handleNewApplication);
  }, [fetchPipeline]);

  // Stage change logic (used both by Drag-Drop and CandidateDrawer)
  const handleMoveStage = async (
    applicationId: number,
    toStage: string,
    rejectionReason?: string,
    forceInterviewCapOverride = false
  ): Promise<boolean | string> => {
    try {
      const res = await fetch("/api/pipeline/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId,
          toStage,
          rejectionReason,
          forceInterviewCapOverride,
        }),
      });

      const result = await res.json();

      // Chạm trần phỏng vấn cùng lúc -> mở hộp xác nhận mềm
      if (res.status === 409 && result.requiresOverride) {
        setPendingCapOverride({
          applicationId,
          toStage,
          message:
            result.error ||
            "Vị trí này đã đủ số lượng ứng viên phỏng vấn cùng lúc. Bạn có muốn vượt hạn mức không?",
        });
        return result.error || "Đã chạm giới hạn phỏng vấn cùng lúc.";
      }

      if (!res.ok || !result.success) {
        const errorMsg = result.error || "Không thể chuyển giai đoạn hồ sơ.";
        setAlertError(errorMsg);
        return errorMsg;
      }

      // Thông báo thành công: Silent success cho thao tác kéo thả thông thường (Chuẩn Ashby/Greenhouse)
      // Chỉ hiện toast khi có sự kiện hệ thống đặc biệt (như tự động đóng tin khi đã tuyển đủ chỉ tiêu)
      if (result.jobAutoClosed) {
        setAlertSuccess(result.message);
      }

      // Re-fetch để đồng bộ lại toàn bộ thống kê, chỉ tiêu và SLA ngầm (Silent sync)
      clientCache.invalidate("pipeline_");
      await fetchPipeline(true);
      return true;
    } catch (err: any) {
      const msg = err.message || "Lỗi hệ thống khi cập nhật trạng thái.";
      setAlertError(msg);
      return msg;
    }
  };

  // Drag and Drop Handler
  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;

    // Kéo vào cùng vị trí cũ
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const sourceColId = source.droppableId;
    const destColId = destination.droppableId;
    const appId = Number(draggableId);

    const movedCandidate = (columns[sourceColId] || [])[source.index];

    // 1. KIỂM TRA SƠ BỘ QUYỀN VAI TRÒ & TRÌNH TỰ STATE MACHINE TRƯỚC KHI MỞ MODAL HAY OPTIMISTIC UPDATE
    if (sourceColId !== destColId && currentUser?.role) {
      const preCheck = validateStageTransition({
        fromStage: sourceColId,
        toStage: destColId,
        role: currentUser.role,
        evaluationsCount: movedCandidate?.evaluationsCount ?? (movedCandidate?.evaluations?.length || 0),
        rejectionReason: destColId === "REJECTED" ? "placeholder-for-precheck" : undefined,
      });

      if (!preCheck.allowed) {
        setAlertError(preCheck.error || "Không được phép chuyển sang giai đoạn này.");
        return;
      }
    }

    // 2. BẮT BUỘC NHẬP LÝ DO TỪ CHỐI KHI KÉO SANG CỘT REJECTED (BRL-11)
    if (sourceColId !== destColId && destColId === "REJECTED" && movedCandidate) {
      setAlertError(null);
      setPendingRejectMove({
        applicationId: appId,
        fromStage: sourceColId,
        candidateName: movedCandidate.candidate?.fullName || "Ứng viên",
        jobTitle: movedCandidate.job?.title || "Vị trí tuyển dụng",
      });
      return;
    }

    // Lưu lại trạng thái ban đầu để rollback nếu có lỗi
    const prevColumns = { ...columns };

    // Thực hiện Optimistic Update trên UI ngay lập tức
    const sourceItems = Array.from(columns[sourceColId] || []);
    const destItems =
      sourceColId === destColId
        ? sourceItems
        : Array.from(columns[destColId] || []);

    const [movedItem] = sourceItems.splice(source.index, 1);
    if (!movedItem) return;

    // Cập nhật tạm thời stage của item
    const optimisticMovedItem = {
      ...movedItem,
      currentStage: destColId,
    };

    if (sourceColId === destColId) {
      sourceItems.splice(destination.index, 0, optimisticMovedItem);
      setColumns({
        ...columns,
        [sourceColId]: sourceItems,
      });
      return;
    } else {
      destItems.splice(destination.index, 0, optimisticMovedItem);
      setColumns({
        ...columns,
        [sourceColId]: sourceItems,
        [destColId]: destItems,
      });
    }

    // Xóa alert lỗi cũ trước khi gọi API
    setAlertError(null);

    // Gửi request API đến server
    const moveResult = await handleMoveStage(appId, destColId);
    if (typeof moveResult === "string") {
      // Rollback về trạng thái cũ vì vi phạm Business Rule hoặc lỗi
      setColumns(prevColumns);
    }
  };

  if (!isMounted) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <RefreshCw className="w-8 h-8 animate-spin text-brand-600" />
          <p className="text-sm font-medium">Đang tải dữ liệu tuyển dụng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-5">
      {/* 1. Header & Thanh công cụ tinh gọn (Single-row Toolbar) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                {t("pipeline.title")}
              </h1>
              {loading && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 text-[11px] font-semibold border border-brand-200 animate-pulse">
                  <RefreshCw className="w-3 h-3 animate-spin text-brand-600" />
                  <span>{t("pipeline.loading")}</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {currentUser?.role === "HR"
                ? t("pipeline.descHr")
                : currentUser?.role === "HIRING_MANAGER"
                ? t("pipeline.descHm")
                : t("pipeline.descAdmin")}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {Boolean(currentUser && currentUser.role !== "HIRING_MANAGER") && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl text-white bg-brand-600 hover:bg-brand-700 transition-colors cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>{t("pipeline.addCandidate")}</span>
              </button>
            )}
          </div>
        </div>

        {/* Thanh tìm kiếm & lọc gọn trên 1 hàng */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-2.5 pt-3 border-t border-slate-100 text-xs">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("kanban.searchPlaceholder")}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2 pl-8 pr-8 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <select
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50/70 py-2 px-3 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white transition-all lg:w-64"
          >
            <option value="ALL">{t("kanban.allJobs")} ({jobs.length})</option>
            {jobs.map((job) => (
              <option key={job.id} value={String(job.id)}>
                {job.title} ({job._count.applications})
              </option>
            ))}
          </select>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setShowStarredOnly(!showStarredOnly);
                setShowUnviewedOnly(false);
              }}
              className={`inline-flex items-center gap-1 px-3 py-2 rounded-xl font-medium transition-colors cursor-pointer border ${
                showStarredOnly
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${showStarredOnly ? "fill-amber-400 text-amber-400" : "text-slate-400"}`} />
              <span>{t("pipeline.starredOnly")}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowUnviewedOnly(!showUnviewedOnly);
                setShowStarredOnly(false);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl font-medium transition-colors cursor-pointer border ${
                showUnviewedOnly
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span>
                {t("pipeline.unviewedOnly")}{" "}
                {loading
                  ? "(...)"
                  : `(${columns.NEW?.filter((c: any) => !c.isViewed).length || 0})`}
              </span>
            </button>

            {/* Lọc nhanh vi phạm SLA */}
            <button
              type="button"
              onClick={() => setShowSlaOnly(!showSlaOnly)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl font-medium transition-colors cursor-pointer border ${
                showSlaOnly
                  ? "bg-rose-600 text-white border-rose-600 shadow-2xs font-semibold"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
              title="Lọc các hồ sơ vượt quá thời hạn cam kết (NEW > 48h, SCREENING > 72h)"
            >
              <AlertTriangle className={`w-3.5 h-3.5 ${showSlaOnly ? "text-white" : "text-rose-500"}`} />
              <span>{t("pipeline.slaBreach")}</span>
            </button>

            {/* Lọc nhanh điểm AI phù hợp cao */}
            <button
              type="button"
              onClick={() => setShowHighMatchOnly(!showHighMatchOnly)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl font-medium transition-colors cursor-pointer border ${
                showHighMatchOnly
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs font-semibold"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
              title="Chỉ hiển thị các hồ sơ có điểm đối chiếu JD đạt từ 75% trở lên"
            >
              <span className={`w-2 h-2 rounded-full ${showHighMatchOnly ? "bg-white" : "bg-emerald-500"}`} />
              <span>{t("pipeline.highMatch")}</span>
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
            </select>
          </div>
        </div>

        {/* Gợi ý khi người dùng mới gõ 1 ký tự */}
        {searchQuery.trim().length === 1 && (
          <p className="text-[11px] text-slate-500 bg-slate-50 border border-slate-200/80 px-3 py-2 rounded-xl animate-in fade-in duration-150">
            💡 <strong>Mẹo tìm kiếm ATS:</strong> Nhập từ 2 ký tự trở lên để tìm chính xác theo <strong>Họ tên</strong>, <strong>Email</strong>, <strong>SĐT</strong> hoặc <strong>Kỹ năng</strong> (ví dụ: <em>React, Node, QA, Python...</em>).
          </p>
        )}

        {/* Thanh trạng thái bộ lọc đang áp dụng */}
        {(debouncedSearch || showSlaOnly || showHighMatchOnly || showStarredOnly || showUnviewedOnly) && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-slate-100 text-xs bg-slate-50/70 px-3.5 py-2 rounded-xl">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-semibold text-slate-600">Đang lọc:</span>
              {debouncedSearch && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 text-[11px] font-bold border border-brand-200">
                  Từ khóa: &quot;{debouncedSearch}&quot;
                </span>
              )}
              {showSlaOnly && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[11px] font-bold border border-rose-200">
                  Quá hạn SLA
                </span>
              )}
              {showHighMatchOnly && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200">
                  Điểm AI ≥ 75%
                </span>
              )}
              {showStarredOnly && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[11px] font-bold border border-amber-200">
                  Gắn sao
                </span>
              )}
              {showUnviewedOnly && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold border border-blue-200">
                  Chưa xem
                </span>
              )}
              <span className="text-[11px] text-slate-400 font-medium ml-1">
                (Tìm thấy {Object.values(columns).reduce((acc, colItems) => acc + (colItems?.length || 0), 0)} hồ sơ)
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setDebouncedSearch("");
                setShowSlaOnly(false);
                setShowHighMatchOnly(false);
                setShowStarredOnly(false);
                setShowUnviewedOnly(false);
              }}
              className="text-slate-500 hover:text-rose-600 text-[11px] font-bold underline transition-colors cursor-pointer"
            >
              Đặt lại tất cả lọc
            </button>
          </div>
        )}

        {/* Thanh tiến độ chỉ tiêu & trần phỏng vấn (chỉ hiện gọn khi đang lọc theo 1 vị trí cụ thể) */}
        {selectedJobId !== "ALL" && (() => {
          const activeJob = jobs.find((j) => String(j.id) === selectedJobId);
          const hm = activeJob?.headcountMetrics;
          if (!activeJob || !hm) return null;
          return (
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-slate-100 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`px-2.5 py-1 rounded-lg font-semibold border ${
                    hm.isHeadcountFull
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-slate-50 text-slate-700 border-slate-200"
                  }`}
                >
                  Chỉ tiêu: {hm.hiredCount}/{hm.targetHeadcount} đã tuyển
                </span>
                <span
                  className={`px-2.5 py-1 rounded-lg font-semibold border ${
                    hm.isInterviewAtCap
                      ? "bg-amber-50 text-amber-800 border-amber-200"
                      : "bg-slate-50 text-slate-600 border-slate-200"
                  }`}
                >
                  Đang phỏng vấn: {hm.activeInterviewCount}/{hm.effectiveInterviewCap}
                </span>
              </div>
              {hm.isHeadcountFull ? (
                <span className="text-[11px] font-medium text-emerald-700">
                  Đã tuyển đủ chỉ tiêu — tin tuyển dụng đã tự đóng nhận hồ sơ mới
                </span>
              ) : hm.isInterviewAtCap ? (
                <span className="text-[11px] font-medium text-amber-700">
                  Đã đủ hạn mức phỏng vấn cùng lúc — nên đánh giá xong đợt hiện tại trước khi mời thêm
                </span>
              ) : null}
            </div>
          );
        })()}
      </div>

      {/* Toast Thông báo Nổi góc màn hình (Có thanh đếm ngược thời gian tự đóng - Chuẩn UX Enterprise) */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm sm:max-w-md pointer-events-none">
        {alertError && (
          <ToastNotification
            key={`error-${alertError}`}
            type="error"
            title={
              alertError.includes("kết nối") || alertError.includes("dữ liệu")
                ? t("kanban.systemError", "Thông báo hệ thống")
                : t("kanban.transitionBlocked", "Chưa thể chuyển giai đoạn")
            }
            message={alertError}
            duration={5000}
            onClose={() => setAlertError(null)}
          />
        )}

        {alertSuccess && (
          <ToastNotification
            key={`success-${alertSuccess}`}
            type="success"
            title={t("kanban.pipelineNotice", "Thông báo tuyển dụng")}
            message={alertSuccess}
            duration={4000}
            onClose={() => setAlertSuccess(null)}
          />
        )}
      </div>

      {/* 3. Bảng 5 Cột Kanban Kéo thả */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start pb-6">
          {COLUMNS_CONFIG.map((col) => {
            const allColumnItems = columns[col.id] || [];
            const count = allColumnItems.length;
            const currentLimit = stageLimits[col.id] || DEFAULT_PAGE_SIZE;
            const displayedItems = allColumnItems.slice(0, currentLimit);
            const hasMore = allColumnItems.length > currentLimit;

            return (
              <div
                key={col.id}
                className="flex flex-col bg-slate-50/80 rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden min-h-[580px] max-h-[82vh]"
              >
                {/* Header Cột */}
                <div className={`p-3.5 ${col.headerBg}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${col.dotColor}`} />
                      <h3 className="font-bold text-xs text-slate-800 tracking-tight">
                        {t(`stage.${col.id}`, col.title)}
                      </h3>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-black border ${col.badgeColor}`}
                      title={`Đang hiển thị ${displayedItems.length} trên tổng số ${count} hồ sơ`}
                    >
                      {loading ? (
                        <span className="inline-block w-4 h-2.5 bg-slate-300/80 rounded animate-pulse" />
                      ) : displayedItems.length < count ? (
                        `${displayedItems.length}/${count}`
                      ) : (
                        count
                      )}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">
                    {t(`stageDesc.${col.id}`, col.description)}
                  </p>
                </div>

                {/* Vùng thả Droppable */}
                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 p-3 overflow-y-auto transition-colors ${
                        snapshot.isDraggingOver
                          ? "bg-brand-50/50 ring-2 ring-brand-400/50 ring-inset"
                          : ""
                      }`}
                    >
                      {loading ? (
                        <div className="space-y-2.5">
                          {[1, 2, 3].map((n) => (
                            <div
                              key={n}
                              className="rounded-xl border border-slate-200/80 p-3.5 bg-white space-y-2.5 animate-pulse"
                            >
                              <div className="flex items-center justify-between">
                                <div className="h-4 w-28 bg-slate-200 rounded-md" />
                                <div className="h-3.5 w-3.5 bg-slate-100 rounded-full" />
                              </div>
                              <div className="h-3 w-36 bg-slate-100 rounded-md" />
                              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                <div className="h-4 w-12 bg-slate-100 rounded-md" />
                                <div className="h-3 w-14 bg-slate-100 rounded-md" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : displayedItems.length === 0 ? (
                        <div className="h-40 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl p-4 text-center">
                          <Users className="w-6 h-6 text-slate-300 mb-1" />
                          <p className="text-xs font-semibold text-slate-500">
                            {debouncedSearch ? "Không có hồ sơ khớp" : "Chưa có hồ sơ"}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5 max-w-[180px]">
                            {debouncedSearch
                              ? `Không có ứng viên nào khớp từ khóa "${debouncedSearch}" ở cột này`
                              : "Kéo thả ứng viên vào đây"}
                          </p>
                        </div>
                      ) : (
                        displayedItems.map((app, index) => (
                          <CandidateCard
                            key={app.id}
                            application={app}
                            index={index}
                            onOpenDrawer={(id) => setSelectedAppId(id)}
                            onToggleStar={handleToggleStar}
                            isDragDisabled={!canRoleDragFromStage(col.id, currentUser?.role)}
                            searchQuery={debouncedSearch}
                          />
                        ))
                      )}
                      {provided.placeholder}

                      {/* BRL-14: Nút Tải thêm lũy tiến theo từng cột */}
                      {hasMore && (
                        <div className="pt-2.5 pb-1">
                          <button
                            type="button"
                            onClick={() => handleLoadMore(col.id)}
                            className="w-full py-2 px-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 hover:text-brand-700 shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <span>+ Tải thêm {Math.min(DEFAULT_PAGE_SIZE, count - displayedItems.length)} hồ sơ</span>
                            <span className="text-[10px] text-slate-400 font-normal">
                              ({displayedItems.length}/{count})
                            </span>
                          </button>
                        </div>
                      )}
                      {!hasMore && count > DEFAULT_PAGE_SIZE && (
                        <p className="text-[10px] text-center text-slate-400 py-2 font-medium">
                          Đã hiển thị toàn bộ {count} hồ sơ
                        </p>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {/* 4. Slide-over Candidate Drawer khi click vào thẻ ứng viên */}
      <CandidateDrawer
        applicationId={selectedAppId}
        onClose={() => {
          setSelectedAppId(null);
          // Silent refresh ngầm trong nền: giữ nguyên giao diện thẻ, không bao giờ nhấp nháy Skeleton!
          fetchPipeline(true);
        }}
        onStageChange={async (appId, toStage, rejectionReason) => {
          const res = await handleMoveStage(appId, toStage, rejectionReason);
          return res;
        }}
      />

      {/* 5. Modal Tiếp nhận CV Mới dành cho HR & Admin */}
      <AddCandidateModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          clientCache.invalidate("pipeline_");
          fetchPipeline(false);
          setAlertSuccess("Tiếp nhận hồ sơ ứng viên thành công!");
        }}
        defaultJobId={selectedJobId !== "ALL" ? Number(selectedJobId) : null}
      />

      {/* 7. Modal Bắt buộc nhập Lý do Từ chối */}
      {pendingRejectMove && (
        <RejectReasonModal
          isOpen={true}
          onClose={() => setPendingRejectMove(null)}
          onConfirm={async (reason) => {
            const { applicationId } = pendingRejectMove;
            setPendingRejectMove(null);
            await handleMoveStage(applicationId, "REJECTED", reason);
          }}
          candidateName={pendingRejectMove.candidateName}
          jobTitle={pendingRejectMove.jobTitle}
          currentStage={pendingRejectMove.fromStage}
        />
      )}

      {/* 8. Modal Xác nhận khi vượt giới hạn phỏng vấn cùng lúc */}
      {pendingCapOverride && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-5 shadow-xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">
                  Đã chạm giới hạn phỏng vấn cùng lúc
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {pendingCapOverride.message}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPendingCapOverride(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Giữ lại ở Sàng lọc
              </button>
              <button
                type="button"
                onClick={async () => {
                  const { applicationId, toStage } = pendingCapOverride;
                  setPendingCapOverride(null);
                  await handleMoveStage(applicationId, toStage, undefined, true);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 cursor-pointer"
              >
                Vẫn mời phỏng vấn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

