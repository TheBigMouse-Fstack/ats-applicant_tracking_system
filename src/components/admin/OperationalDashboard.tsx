"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Database,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Briefcase,
  Users,
  Calendar,
  ClipboardCheck,
  ShieldAlert,
  ChevronRight,
  Star,
  History,
  Video,
  MapPin,
  Eye,
  X,
  RefreshCw,
} from "lucide-react";
import CandidateDrawer from "@/components/candidate/CandidateDrawer";
import { formatDateTime } from "@/lib/utils";
import { getAiMatchTier } from "@/lib/match-score";
import { useLanguage } from "@/lib/i18n";
import { clientCache } from "@/lib/client-cache";

interface QueueCandidateItem {
  id: number;
  candidateName: string;
  email: string;
  jobId: number;
  jobTitle: string;
  department: string;
  currentStage: string;
  experienceYears: number;
  skills: string[];
  aiMatchScore: number | null;
  hoursInStage: number;
  isSlaBreached: boolean;
  slaMessage: string;
  isViewed: boolean;
  isStarred: boolean;
  evaluationsCount: number;
  interviewDate: string | null;
  interviewFormat: string | null;
  interviewLocation: string | null;
  createdAt: string;
}

interface JobBreakdownItem {
  id: number;
  title: string;
  department: string;
  location: string;
  status: string;
  total: number;
  NEW: number;
  SCREENING: number;
  INTERVIEW: number;
  HIRED: number;
  REJECTED: number;
}

interface AuditLogItem {
  id: number;
  applicationId: number;
  candidateName: string;
  jobTitle: string;
  actorName: string;
  actorRole: string;
  action: string;
  fromStage: string | null;
  toStage: string;
  reason: string | null;
  createdAt: string;
}

interface DashboardData {
  role: "ADMIN" | "HR" | "HIRING_MANAGER" | string;
  userName: string;
  generatedAt: string;
  funnel: {
    total: number;
    NEW: number;
    SCREENING: number;
    INTERVIEW: number;
    HIRED: number;
    REJECTED: number;
  };
  sla: {
    newBreachCount: number;
    screeningBreachCount: number;
    totalBreaches: number;
  };
  summary: {
    activeJobsCount: number;
    closedJobsCount: number;
    totalJobsCount: number;
    unviewedNewCount: number;
    starredCount: number;
    pendingScorecardCount: number;
    upcomingInterviewsCount: number;
    hireRatePercent: number;
  };
  activeJobs: JobBreakdownItem[];
  hrUnviewedQueue?: QueueCandidateItem[];
  hrSlaBreachQueue?: QueueCandidateItem[];
  hrRecentNewQueue?: QueueCandidateItem[];
  hmScreeningQueue?: QueueCandidateItem[];
  hmMissingScorecardQueue?: QueueCandidateItem[];
  slaBreachQueue?: QueueCandidateItem[];
  upcomingInterviews?: QueueCandidateItem[];
  adminStats?: {
    totalUsers: number;
    activeUsers: number;
    hrCount: number;
    managerCount: number;
    adminCount: number;
    purgeEligibleCount: number;
  };
  recentAuditLogs?: AuditLogItem[];
}

const STAGE_META = [
  { key: "NEW" as const, label: "Mới nộp", dotColor: "bg-blue-500", barColor: "bg-blue-500", desc: "Chờ HR sơ loại" },
  { key: "SCREENING" as const, label: "Sàng lọc", dotColor: "bg-indigo-500", barColor: "bg-indigo-500", desc: "Chờ duyệt PV" },
  { key: "INTERVIEW" as const, label: "Phỏng vấn", dotColor: "bg-amber-500", barColor: "bg-amber-500", desc: "Đang đánh giá" },
  { key: "HIRED" as const, label: "Tuyển chọn", dotColor: "bg-emerald-500", barColor: "bg-emerald-500", desc: "Đã trúng tuyển" },
  { key: "REJECTED" as const, label: "Từ chối", dotColor: "bg-rose-400", barColor: "bg-rose-400", desc: "Lưu kho dự phòng" },
];

const ACTION_LABELS: Record<string, string> = {
  STAGE_CHANGE: "Chuyển vòng",
  CV_UPLOAD: "Nộp hồ sơ",
  SCORECARD_EVALUATE: "Chấm Scorecard",
  PROFILE_EDITED: "Sửa dữ liệu CV",
  INTERVIEW_SCHEDULED: "Xếp lịch PV",
  INTERVIEW_CANCELLED: "Hủy lịch PV",
};

function getRoleMeta(role: string) {
  if (role === "ADMIN") {
    return {
      badge: "Quản trị viên (Admin)",
      subtitle: "Bảng điều khiển vận hành: Giám sát phễu chuyển đổi tuyển dụng, kiểm soát điểm nghẽn SLA và nhật ký kiểm toán hệ thống.",
    };
  }
  if (role === "HIRING_MANAGER") {
    return {
      badge: "Hiring Manager",
      subtitle: "Hồ sơ chờ duyệt phỏng vấn, lịch hẹn sắp tới và phiếu đánh giá còn thiếu.",
    };
  }
  return {
    badge: "HR",
    subtitle: "Hồ sơ mới chưa xem và cảnh báo tồn đọng đầu phễu cần sơ loại.",
  };
}

/**
 * Bảng Điều Khiển Tổng Quan Vận Hành (Minimalist Operational Dashboard):
 * - Triệt tiêu hoàn toàn nút trùng lặp (không lặp nút Tiếp nhận CV, Xuất CSV, Mở Pipeline vốn đã có trên Navbar/trang chuyên biệt).
 * - Mỗi dòng danh sách chỉ hiển thị đúng 4 tín hiệu tổng quan (Tên, Vị trí, AI %, SLA) — nhấp vào để mở Drawer Chi tiết.
 */
export default function OperationalDashboard() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbiddenDismissed, setForbiddenDismissed] = useState(false);

  const [hrTab, setHrTab] = useState<"UNVIEWED" | "SLA" | "ALL_NEW">("UNVIEWED");
  const [hmTab, setHmTab] = useState<"SCREENING" | "SCORECARD">("SCREENING");
  const [selectedAppId, setSelectedAppId] = useState<number | null>(null);

  const fetchDashboard = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) {
        setData((prev) => {
          if (!prev) setLoading(true);
          return prev;
        });
      }
      setError(null);
      const res = await fetch("/api/dashboard", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error || "Không thể tải dữ liệu bảng điều khiển");
        return;
      }
      setData(json.data);
      clientCache.set("dashboard_data", json.data);
    } catch {
      setError("Lỗi kết nối máy chủ khi tải dữ liệu tổng quan.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const cached = clientCache.getStale<any>("dashboard_data");
    if (cached) {
      setData(cached);
      setLoading(false);
      fetchDashboard(true);
    } else {
      fetchDashboard(false);
    }
  }, [fetchDashboard]);

  useEffect(() => {
    const handleNewApp = () => {
      clientCache.invalidate("dashboard_data");
      fetchDashboard(true);
    };
    window.addEventListener("ats:new-application", handleNewApp);
    return () => window.removeEventListener("ats:new-application", handleNewApp);
  }, [fetchDashboard]);

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
      const json = await res.json();
      if (!res.ok || !json.success) {
        return json.error || "Không thể cập nhật trạng thái hồ sơ";
      }
      await fetchDashboard();
      return true;
    } catch {
      return "Lỗi kết nối máy chủ khi cập nhật trạng thái";
    }
  };

  const isForbiddenNotice =
    searchParams.get("error") === "forbidden" && !forbiddenDismissed;

  if (loading && !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-5 animate-pulse">
        <div className="h-14 bg-white rounded-2xl border border-slate-200" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-white rounded-2xl border border-slate-200" />
          ))}
        </div>
        <div className="h-24 bg-white rounded-2xl border border-slate-200" />
        <div className="h-72 bg-white rounded-2xl border border-slate-200" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center max-w-md mx-auto">
          <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
          <h2 className="text-base font-bold text-slate-900">Không thể tải dữ liệu</h2>
          <p className="text-xs text-slate-500 mt-1">{error}</p>
          <button
            onClick={() => fetchDashboard()}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  const roleMeta = getRoleMeta(data.role);

  const hrActiveList: QueueCandidateItem[] =
    hrTab === "UNVIEWED"
      ? data.hrUnviewedQueue || []
      : hrTab === "SLA"
      ? data.hrSlaBreachQueue || []
      : data.hrRecentNewQueue || [];

  const hmActiveList: QueueCandidateItem[] =
    hmTab === "SCREENING"
      ? data.hmScreeningQueue || []
      : data.hmMissingScorecardQueue || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      {/* Thông báo phân quyền nếu bị chuyển hướng */}
      {isForbiddenNotice && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Tài khoản của bạn không có quyền truy cập mục vừa yêu cầu.
            </span>
          </div>
          <button
            onClick={() => setForbiddenDismissed(true)}
            className="p-1 text-amber-600 hover:bg-amber-100 rounded-lg cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* HEADER TỐI GIẢN — KHÔNG NHỒI NÚT THỪA */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {t("dashboard.title", "Tổng Quan Tuyển Dụng")}
            </h1>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
              {roleMeta.badge}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{roleMeta.subtitle}</p>
        </div>
      </div>

      {/* TẦNG 1: 4 THẺ KPI SẠCH, TỐI GIẢN */}
      {data.role === "HR" && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <KpiCard
            label="CV mới chưa xem"
            value={data.summary.unviewedNewCount}
            subtext={`Trên ${data.funnel.NEW} hồ sơ cột Mới nộp`}
            icon={<Eye className="w-4 h-4 text-slate-500" />}
            highlight={data.summary.unviewedNewCount > 0 ? "info" : "neutral"}
          />
          <KpiCard
            label="Quá hạn xử lý (>48h)"
            value={data.sla.newBreachCount}
            subtext="Hồ sơ mới chờ quá 48 giờ, cần sơ loại sớm"
            icon={<AlertTriangle className="w-4 h-4 text-slate-500" />}
            highlight={data.sla.newBreachCount > 0 ? "danger" : "neutral"}
          />
          <KpiCard
            label="Đang ở Sàng lọc"
            value={data.funnel.SCREENING}
            subtext="Chờ Hiring Manager duyệt PV"
            icon={<CheckCircle2 className="w-4 h-4 text-slate-500" />}
          />
          <KpiCard
            label="Vị trí đang mở"
            value={data.summary.activeJobsCount}
            subtext={`Tổng ${data.funnel.total} hồ sơ toàn hệ thống`}
            icon={<Briefcase className="w-4 h-4 text-slate-500" />}
          />
        </div>
      )}

      {data.role === "HIRING_MANAGER" && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <KpiCard
            label="Chờ duyệt Phỏng vấn"
            value={data.funnel.SCREENING}
            subtext={
              data.sla.screeningBreachCount > 0
                ? `${data.sla.screeningBreachCount} hồ sơ quá 72h`
                : "Hồ sơ HR đã sơ loại"
            }
            icon={<Clock className="w-4 h-4 text-slate-500" />}
            highlight={data.sla.screeningBreachCount > 0 ? "danger" : "neutral"}
          />
          <KpiCard
            label="Đang Phỏng vấn"
            value={data.funnel.INTERVIEW}
            subtext={`${data.summary.upcomingInterviewsCount} lịch hẹn đã xếp`}
            icon={<Calendar className="w-4 h-4 text-slate-500" />}
          />
          <KpiCard
            label="Thiếu Scorecard"
            value={data.summary.pendingScorecardCount}
            subtext="Chưa có phiếu đánh giá"
            icon={<ClipboardCheck className="w-4 h-4 text-slate-500" />}
            highlight={data.summary.pendingScorecardCount > 0 ? "danger" : "neutral"}
          />
          <KpiCard
            label="Đã Tuyển chọn"
            value={data.funnel.HIRED}
            subtext={`Tỷ lệ tuyển chọn: ${data.summary.hireRatePercent}%`}
            icon={<CheckCircle2 className="w-4 h-4 text-slate-500" />}
          />
        </div>
      )}

      {data.role === "ADMIN" && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <KpiCard
            label="Tổng hồ sơ"
            value={data.funnel.total}
            subtext={`${data.summary.activeJobsCount} vị trí đang mở`}
            icon={<Briefcase className="w-4 h-4 text-slate-500" />}
          />
          <KpiCard
            label="Hồ sơ quá hạn xử lý"
            value={data.sla.totalBreaches}
            subtext={`Chờ HR: ${data.sla.newBreachCount} • Chờ Manager: ${data.sla.screeningBreachCount}`}
            icon={<AlertTriangle className="w-4 h-4 text-slate-500" />}
            highlight={data.sla.totalBreaches > 0 ? "danger" : "neutral"}
          />
          <KpiCard
            label="Đã Tuyển chọn"
            value={data.funnel.HIRED}
            subtext={`Tỷ lệ: ${data.summary.hireRatePercent}% • ${data.funnel.INTERVIEW} đang PV`}
            icon={<CheckCircle2 className="w-4 h-4 text-slate-500" />}
          />
          <KpiCard
            label="Tài khoản hoạt động"
            value={data.adminStats?.activeUsers ?? 0}
            subtext={`HR: ${data.adminStats?.hrCount ?? 0} • HM: ${data.adminStats?.managerCount ?? 0} • Admin: ${data.adminStats?.adminCount ?? 0}`}
            icon={<Users className="w-4 h-4 text-slate-500" />}
          />
        </div>
      )}

      {/* TẦNG 2: PHỄU CHUYỂN ĐỔI TUYỂN DỤNG (RECRUITMENT CONVERSION FUNNEL) */}
      <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-slate-900 text-sm">{t("dashboard.funnelTitle", "Phễu Chuyển Đổi Tuyển Dụng")}</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold border border-slate-200">
                5 Giai Đoạn
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {t("dashboard.funnelDesc", "Tỷ lệ chuyển đổi và phân bổ hồ sơ qua từng vòng tuyển dụng.")}
            </p>
          </div>
          <span className="text-slate-500 font-semibold text-xs shrink-0">
            Tổng cộng: <strong className="text-slate-900">{data.funnel.total}</strong> hồ sơ
          </span>
        </div>

        {/* Thanh phễu đa sắc trực quan */}
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
          {data.funnel.total > 0 ? (
            STAGE_META.map((stage) => {
              const pct = (data.funnel[stage.key] / data.funnel.total) * 100;
              if (pct <= 0) return null;
              return (
                <div
                  key={stage.key}
                  style={{ width: `${pct}%` }}
                  className={`${stage.barColor} transition-all duration-300 relative group`}
                  title={`${t(`stage.${stage.key}`, stage.label)}: ${data.funnel[stage.key]} hồ sơ (${pct.toFixed(1)}%)`}
                />
              );
            })
          ) : (
            <div className="w-full bg-slate-200" />
          )}
        </div>

        {/* 5 Hộp thống kê giai đoạn có hiển thị Tỷ lệ % và Ý nghĩa vai trò */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
          {STAGE_META.map((stage) => {
            const pct = data.funnel.total > 0 ? ((data.funnel[stage.key] / data.funnel.total) * 100).toFixed(1) : "0.0";
            return (
              <div key={stage.key} className="bg-slate-50/70 p-2.5 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
                    <span className={`w-2 h-2 rounded-full ${stage.dotColor}`} />
                    <span className="truncate">{t(`stage.${stage.key}`, stage.label)}</span>
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400">{pct}%</span>
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <p className="text-xl font-extrabold text-slate-900">
                    {data.funnel[stage.key]}
                  </p>
                  <span className="text-[10px] text-slate-500 font-medium">
                    {t(`stageDesc.${stage.key}`, stage.desc)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* TẦNG 3: KHU VỰC VIỆC CẦN LÀM NGAY THEO TỪNG ROLE */}
      {data.role === "HR" && (
        <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Hồ sơ cần HR xử lý (Vòng Mới nộp)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Nhấp vào từng hồ sơ để xem chi tiết và chuyển sang Sàng lọc tiêu chuẩn
              </p>
            </div>
            <div className="inline-flex bg-slate-100 p-1 rounded-xl text-xs font-medium">
              <button
                onClick={() => setHrTab("UNVIEWED")}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  hrTab === "UNVIEWED"
                    ? "bg-white text-slate-900 font-semibold shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Chưa xem ({data.hrUnviewedQueue?.length ?? 0})
              </button>
              <button
                onClick={() => setHrTab("SLA")}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  hrTab === "SLA"
                    ? "bg-white text-rose-700 font-semibold shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Quá hạn (&gt;48h) ({data.hrSlaBreachQueue?.length ?? 0})
              </button>
              <button
                onClick={() => setHrTab("ALL_NEW")}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  hrTab === "ALL_NEW"
                    ? "bg-white text-slate-900 font-semibold shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Tất cả hồ sơ mới ({data.hrRecentNewQueue?.length ?? 0})
              </button>
            </div>
          </div>

          <MinimalQueueList
            items={hrActiveList}
            emptyMessage={
              hrTab === "UNVIEWED"
                ? "Bạn đã xem toàn bộ CV mới tiếp nhận."
                : hrTab === "SLA"
                ? "Không có hồ sơ nào bị chờ quá 48 giờ."
                : "Hiện chưa có hồ sơ nào ở vòng Mới nộp."
            }
            onSelect={(id) => setSelectedAppId(id)}
          />
        </section>
      )}

      {data.role === "HIRING_MANAGER" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <section className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Hồ sơ chờ Hiring Manager quyết định
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Nhấp vào hồ sơ để duyệt Phỏng vấn hoặc chấm Scorecard trực tiếp
                </p>
              </div>
              <div className="inline-flex bg-slate-100 p-1 rounded-xl text-xs font-medium">
                <button
                  onClick={() => setHmTab("SCREENING")}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    hmTab === "SCREENING"
                      ? "bg-white text-slate-900 font-semibold shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Chờ duyệt PV ({data.hmScreeningQueue?.length ?? 0})
                </button>
                <button
                  onClick={() => setHmTab("SCORECARD")}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    hmTab === "SCORECARD"
                      ? "bg-white text-rose-700 font-semibold shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Thiếu Scorecard ({data.hmMissingScorecardQueue?.length ?? 0})
                </button>
              </div>
            </div>

            <MinimalQueueList
              items={hmActiveList}
              emptyMessage={
                hmTab === "SCREENING"
                  ? "Không có hồ sơ nào đang chờ duyệt phỏng vấn."
                  : "Tất cả ứng viên đang phỏng vấn đều đã có Scorecard."
              }
              onSelect={(id) => setSelectedAppId(id)}
            />
          </section>

          <UpcomingInterviewsCard
            items={data.upcomingInterviews || []}
            onSelect={(id) => setSelectedAppId(id)}
          />
        </div>
      )}

      {data.role === "ADMIN" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    Cảnh Báo Điểm Nghẽn Xử Lý (Quá hạn SLA)
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Hồ sơ bị &quot;ngâm&quot; quá 48h tại vòng Mới nộp (chờ HR) hoặc quá 72h tại vòng Sàng lọc (chờ Hiring Manager).
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                  {data.sla.totalBreaches} quá hạn
                </span>
              </div>

              <MinimalQueueList
                items={data.slaBreachQueue || []}
                emptyMessage="Chưa ghi nhận hồ sơ nào bị chờ xử lý quá hạn."
                onSelect={(id) => setSelectedAppId(id)}
              />
            </section>

            {/* Tiến độ gọn theo Vị trí */}
            <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-brand-600" />
                    Ma Trận Phân Bổ Theo Vị Trí Đang Tuyển
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Xem nhanh phân bổ ứng viên ở từng phòng ban để biết vị trí nào đang thiếu hồ sơ hay đã tuyển đủ.
                  </p>
                </div>
                <span className="text-xs text-slate-400 font-medium shrink-0">
                  {data.activeJobs.length} vị trí
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 border-b border-slate-100">
                      <th className="py-2.5 px-4 font-semibold">Vị trí</th>
                      <th className="py-2.5 px-2 font-semibold text-center">New</th>
                      <th className="py-2.5 px-2 font-semibold text-center">Screen</th>
                      <th className="py-2.5 px-2 font-semibold text-center">PV</th>
                      <th className="py-2.5 px-2 font-semibold text-center">Hired</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Tổng</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.activeJobs.map((job) => (
                      <tr key={job.id} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-4 font-medium text-slate-900">
                          {job.title}
                        </td>
                        <td className="py-2.5 px-2 text-center text-slate-600">{job.NEW}</td>
                        <td className="py-2.5 px-2 text-center text-slate-600">{job.SCREENING}</td>
                        <td className="py-2.5 px-2 text-center text-slate-600">{job.INTERVIEW}</td>
                        <td className="py-2.5 px-2 text-center font-semibold text-emerald-700">
                          {job.HIRED}
                        </td>
                        <td className="py-2.5 px-4 text-right font-bold text-slate-900">
                          {job.total}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <div className="space-y-5">
            {/* Cảnh báo lưu trữ 180 ngày (chỉ hiện nếu Admin) */}
            {data.adminStats && (
              <section className="bg-white border border-slate-200 rounded-2xl p-4 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">
                    Thời hạn lưu trữ hồ sơ (180 ngày)
                  </span>
                  <span
                    className={`font-semibold ${
                      data.adminStats.purgeEligibleCount > 0
                        ? "text-amber-700"
                        : "text-emerald-700"
                    }`}
                  >
                    {data.adminStats.purgeEligibleCount} hồ sơ
                  </span>
                </div>
                <p className="text-slate-500">
                  {data.adminStats.purgeEligibleCount > 0
                    ? "Có hồ sơ đã từ chối lưu quá 180 ngày cần rà soát dọn dẹp tại Kho nhân tài."
                    : "Chưa có hồ sơ bị từ chối nào vượt quá thời hạn 180 ngày."}
                </p>
                {data.adminStats.purgeEligibleCount > 0 && (
                  <Link
                    href="/admin/talent-pool"
                    className="inline-block text-brand-600 font-semibold hover:underline"
                  >
                    Kiểm tra tại Kho nhân tài →
                  </Link>
                )}
              </section>
            )}

            {/* Nhật ký kiểm toán gần nhất */}
            <section className="bg-white border border-slate-200 rounded-2xl p-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 mb-0.5">
                <History className="w-4 h-4 text-slate-400" />
                Nhật Ký Kiểm Toán (Audit Trail)
              </h2>
              <p className="text-xs text-slate-500 mb-3">
                Lịch sử minh bạch mọi thao tác của HR và Trưởng bộ phận trên hệ thống.
              </p>

              {!data.recentAuditLogs || data.recentAuditLogs.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">
                  Chưa có hoạt động nào.
                </p>
              ) : (
                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                  {data.recentAuditLogs.map((log) => (
                    <div
                      key={log.id}
                      onClick={() => setSelectedAppId(log.applicationId)}
                      className="pb-2.5 border-b border-slate-100 last:border-b-0 last:pb-0 text-xs cursor-pointer hover:bg-slate-50 rounded-lg p-1.5 -mx-1.5 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-slate-800 truncate">
                          {log.actorName}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {formatDateTime(log.createdAt)}
                        </span>
                      </div>
                      <p className="text-slate-600 mt-0.5 truncate">
                        {ACTION_LABELS[log.action] || log.action} •{" "}
                        <strong className="text-slate-800">{log.candidateName}</strong>
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      )}

      {/* Drawer Chi tiết Hồ sơ (1-click từ mọi dòng trên Dashboard) */}
      {selectedAppId !== null && (
        <CandidateDrawer
          applicationId={selectedAppId}
          onClose={() => {
            setSelectedAppId(null);
            fetchDashboard(true);
          }}
          onStageChange={handleStageChange}
        />
      )}
    </div>
  );
}

/* =========================== SUB-COMPONENTS =========================== */

function KpiCard({
  label,
  value,
  subtext,
  icon,
  highlight = "neutral",
}: {
  label: string;
  value: number;
  subtext: string;
  icon: React.ReactNode;
  highlight?: "neutral" | "info" | "danger";
}) {
  const numClass =
    highlight === "danger"
      ? "text-rose-600"
      : highlight === "info"
      ? "text-brand-600"
      : "text-slate-900";

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-slate-500">{label}</span>
        {icon}
      </div>
      <p className={`text-2xl sm:text-3xl font-bold tracking-tight mt-2 ${numClass}`}>
        {value}
      </p>
      <p className="text-[11px] text-slate-500 mt-1 truncate">{subtext}</p>
    </div>
  );
}

function MinimalQueueList({
  items,
  emptyMessage,
  onSelect,
}: {
  items: QueueCandidateItem[];
  emptyMessage: string;
  onSelect: (id: number) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-slate-500">
        <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-100">
      {items.map((item) => {
        const tier = getAiMatchTier(item.aiMatchScore);
        return (
          <div
            key={item.id}
            onClick={() => onSelect(item.id)}
            className="px-5 py-3.5 hover:bg-slate-50/90 transition-colors cursor-pointer flex items-center justify-between gap-3 group"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                {item.currentStage === "NEW" && !item.isViewed && (
                  <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                )}
                <span className="font-semibold text-sm text-slate-900 truncate group-hover:text-brand-600 transition-colors">
                  {item.candidateName}
                </span>
                {item.isStarred && (
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                )}
                {item.isSlaBreached && (
                  <span className="text-[11px] font-medium text-rose-600 shrink-0">
                    • {item.slaMessage}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                {item.jobTitle} • {item.experienceYears} năm kinh nghiệm
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              {tier.score !== null && (
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${tier.badgeClass}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${tier.dotClass}`} />
                  {tier.score}%
                </span>
              )}
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-brand-600 transition-colors" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function UpcomingInterviewsCard({
  items,
  onSelect,
}: {
  items: QueueCandidateItem[];
  onSelect: (id: number) => void;
}) {
  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 h-fit">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-slate-900">Lịch phỏng vấn sắp tới</h2>
        <span className="text-xs text-slate-400">{items.length}</span>
      </div>

      {items.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-6">
          Chưa có lịch phỏng vấn nào được xếp.
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-900 truncate">
                  {item.candidateName}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 shrink-0">
                  {item.interviewFormat === "OFFLINE" ? (
                    <>
                      <MapPin className="w-3 h-3" /> Offline
                    </>
                  ) : (
                    <>
                      <Video className="w-3 h-3" /> Online
                    </>
                  )}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate mt-0.5">{item.jobTitle}</p>
              {item.interviewDate && (
                <p className="text-[11px] font-semibold text-brand-700 mt-1">
                  {formatDateTime(item.interviewDate)}
                </p>
              )}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
