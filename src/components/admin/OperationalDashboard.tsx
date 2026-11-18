"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  RefreshCw,
  UserPlus,
  Kanban,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Briefcase,
  Users,
  Calendar,
  ClipboardCheck,
  ShieldAlert,
  ArrowRight,
  Star,
  FileSpreadsheet,
  Database,
  History,
  Video,
  MapPin,
  Eye,
  ShieldCheck,
  X,
} from "lucide-react";
import CandidateDrawer from "@/components/candidate/CandidateDrawer";
import AddCandidateModal from "@/components/candidate/AddCandidateModal";
import { formatDateTime } from "@/lib/utils";

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
  {
    key: "NEW" as const,
    label: "Mới tiếp nhận",
    short: "New",
    barColor: "bg-blue-500",
    pillColor: "bg-blue-50 text-blue-700 border-blue-200",
    dotColor: "bg-blue-500",
  },
  {
    key: "SCREENING" as const,
    label: "Sàng lọc tiêu chuẩn",
    short: "Screening",
    barColor: "bg-indigo-500",
    pillColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
    dotColor: "bg-indigo-500",
  },
  {
    key: "INTERVIEW" as const,
    label: "Phỏng vấn",
    short: "Interview",
    barColor: "bg-amber-500",
    pillColor: "bg-amber-50 text-amber-700 border-amber-200",
    dotColor: "bg-amber-500",
  },
  {
    key: "HIRED" as const,
    label: "Tuyển chọn",
    short: "Hired",
    barColor: "bg-emerald-500",
    pillColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dotColor: "bg-emerald-500",
  },
  {
    key: "REJECTED" as const,
    label: "Từ chối",
    short: "Rejected",
    barColor: "bg-rose-400",
    pillColor: "bg-rose-50 text-rose-700 border-rose-200",
    dotColor: "bg-rose-400",
  },
];

const ACTION_LABELS: Record<string, string> = {
  STAGE_CHANGE: "Chuyển vòng",
  CV_UPLOAD: "Nộp hồ sơ",
  SCORECARD_EVALUATE: "Chấm Scorecard",
  PROFILE_EDITED: "Sửa dữ liệu CV",
  INTERVIEW_SCHEDULED: "Xếp lịch PV",
  INTERVIEW_CANCELLED: "Hủy lịch PV",
};

function getRoleHeaderInfo(role: string) {
  if (role === "ADMIN") {
    return {
      badge: "QUẢN TRỊ VIÊN (ADMIN)",
      badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
      subtitle:
        "Toàn cảnh vận hành tuyển dụng: giám sát điểm nghẽn SLA toàn phễu, phân quyền người dùng và nhật ký kiểm toán.",
    };
  }
  if (role === "HIRING_MANAGER") {
    return {
      badge: "QUẢN LÝ CHUYÊN MÔN (HIRING MANAGER)",
      badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
      subtitle:
        "Bảng tác nghiệp chuyên môn: duyệt hồ sơ từ Sàng lọc sang Phỏng vấn, quản lý lịch hẹn, chấm Scorecard và quyết định Tuyển chọn.",
    };
  }
  return {
    badge: "CHUYÊN VIÊN TUYỂN DỤNG (HR)",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
    subtitle:
      "Bảng tác nghiệp đầu phễu: tiếp nhận CV mới, kiểm tra chuẩn hóa 5 trường cốt lõi, xử lý cảnh báo SLA >48h và chuyển Sàng lọc tiêu chuẩn.",
  };
}

export default function OperationalDashboard() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbiddenDismissed, setForbiddenDismissed] = useState(false);

  // Interactive Tabs per role
  const [hrTab, setHrTab] = useState<"UNVIEWED" | "SLA" | "ALL_NEW">("UNVIEWED");
  const [hmTab, setHmTab] = useState<"SCREENING" | "SCORECARD">("SCREENING");

  // 1-click Modals / Drawer
  const [selectedAppId, setSelectedAppId] = useState<number | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/dashboard", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error || "Không thể tải dữ liệu bảng điều khiển");
        return;
      }
      setData(json.data);
    } catch {
      setError("Lỗi kết nối máy chủ khi tải dữ liệu tổng quan.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Xử lý chuyển trạng thái trực tiếp từ CandidateDrawer mở trên Dashboard
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-pulse">
        <div className="h-20 bg-white rounded-2xl border border-slate-200" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-white rounded-2xl border border-slate-200" />
          ))}
        </div>
        <div className="h-32 bg-white rounded-2xl border border-slate-200" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 bg-white rounded-2xl border border-slate-200" />
          <div className="h-80 bg-white rounded-2xl border border-slate-200" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white border border-red-200 rounded-2xl p-8 text-center max-w-lg mx-auto">
          <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-900">Không thể tải Dashboard</h2>
          <p className="text-sm text-slate-600 mt-1">{error}</p>
          <button
            onClick={fetchDashboard}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700"
          >
            <RefreshCw className="w-4 h-4" />
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  const roleMeta = getRoleHeaderInfo(data.role);

  // Chọn hàng đợi hiển thị cho HR
  const hrActiveList: QueueCandidateItem[] =
    hrTab === "UNVIEWED"
      ? data.hrUnviewedQueue || []
      : hrTab === "SLA"
      ? data.hrSlaBreachQueue || []
      : data.hrRecentNewQueue || [];

  // Chọn hàng đợi hiển thị cho Hiring Manager
  const hmActiveList: QueueCandidateItem[] =
    hmTab === "SCREENING"
      ? data.hmScreeningQueue || []
      : data.hmMissingScorecardQueue || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Cảnh báo phân quyền nếu vừa bị Middleware chuyển hướng */}
      {isForbiddenNotice && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl flex items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Tài khoản của bạn không có quyền truy cập phân hệ vừa yêu cầu. Hệ thống đã chuyển về Bảng điều khiển Tổng quan theo đúng phân quyền RBAC.
            </span>
          </div>
          <button
            onClick={() => setForbiddenDismissed(true)}
            className="p-1 text-amber-600 hover:bg-amber-100 rounded-lg"
            title="Đóng thông báo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* HEADER TỔNG QUAN THEO VAI TRÒ */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <LayoutDashboard className="w-4 h-4 text-brand-600" />
              Bảng điều khiển Tổng quan Vận hành
            </span>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${roleMeta.badgeClass}`}
            >
              {roleMeta.badge}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Xin chào, {data.userName}
          </h1>
          <p className="text-sm text-slate-600 max-w-3xl">{roleMeta.subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={fetchDashboard}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium transition-colors"
            title="Làm mới số liệu"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Làm mới
          </button>

          {(data.role === "HR" || data.role === "ADMIN") && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold shadow-sm transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Tiếp nhận CV
            </button>
          )}

          <Link
            href="/admin/pipeline"
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              data.role === "HIRING_MANAGER"
                ? "bg-brand-600 hover:bg-brand-700 text-white shadow-sm"
                : "border border-slate-200 bg-slate-900 hover:bg-slate-800 text-white"
            }`}
          >
            <Kanban className="w-4 h-4" />
            Mở Kanban Pipeline
          </Link>
        </div>
      </div>

      {/* TẦNG 1: 4 THẺ KPI TÁC NGHIỆP CHUYÊN BIỆT THEO ROLE (5-SECOND RULE) */}
      {data.role === "HR" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="CV mới chưa xem"
            value={data.summary.unviewedNewCount}
            subtext={`Trên tổng ${data.funnel.NEW} hồ sơ đang ở cột NEW`}
            icon={<Eye className="w-5 h-5 text-blue-600" />}
            accent={data.summary.unviewedNewCount > 0 ? "blue" : "slate"}
            href="/admin/pipeline"
          />
          <KpiCard
            label="Quá hạn SLA đầu phễu"
            value={data.sla.newBreachCount}
            subtext="Hồ sơ ở cột NEW quá 48h (BRL-07)"
            icon={<AlertTriangle className="w-5 h-5 text-rose-600" />}
            accent={data.sla.newBreachCount > 0 ? "rose" : "emerald"}
            href="/admin/pipeline"
          />
          <KpiCard
            label="Đã chuyển Sàng lọc"
            value={data.funnel.SCREENING}
            subtext="Đang chờ Hiring Manager duyệt PV"
            icon={<CheckCircle2 className="w-5 h-5 text-indigo-600" />}
            accent="indigo"
            href="/admin/pipeline"
          />
          <KpiCard
            label="Vị trí đang tuyển"
            value={data.summary.activeJobsCount}
            subtext={`Tổng ${data.funnel.total} hồ sơ • ${data.summary.starredCount} gắn sao`}
            icon={<Briefcase className="w-5 h-5 text-emerald-600" />}
            accent="emerald"
            href="/admin/jobs"
          />
        </div>
      )}

      {data.role === "HIRING_MANAGER" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Chờ duyệt Phỏng vấn"
            value={data.funnel.SCREENING}
            subtext={
              data.sla.screeningBreachCount > 0
                ? `${data.sla.screeningBreachCount} hồ sơ quá hạn >72h (BRL-07)`
                : "Hồ sơ HR đã sơ loại xong"
            }
            icon={<Clock className="w-5 h-5 text-indigo-600" />}
            accent={data.sla.screeningBreachCount > 0 ? "rose" : "indigo"}
            href="/admin/pipeline"
          />
          <KpiCard
            label="Đang Phỏng vấn"
            value={data.funnel.INTERVIEW}
            subtext={`${data.summary.upcomingInterviewsCount} lịch hẹn đã xếp`}
            icon={<Calendar className="w-5 h-5 text-amber-600" />}
            accent="amber"
            href="/admin/pipeline"
          />
          <KpiCard
            label="Chờ chấm Scorecard"
            value={data.summary.pendingScorecardCount}
            subtext="Bắt buộc đủ phiếu mới chốt Hired (BRL-06)"
            icon={<ClipboardCheck className="w-5 h-5 text-rose-600" />}
            accent={data.summary.pendingScorecardCount > 0 ? "rose" : "emerald"}
            href="/admin/pipeline"
          />
          <KpiCard
            label="Đã Tuyển chọn"
            value={data.funnel.HIRED}
            subtext={`Tỷ lệ tuyển chọn toàn phễu: ${data.summary.hireRatePercent}%`}
            icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
            accent="emerald"
            href="/admin/candidates"
          />
        </div>
      )}

      {data.role === "ADMIN" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Tổng hồ sơ hệ thống"
            value={data.funnel.total}
            subtext={`${data.summary.activeJobsCount} vị trí đang mở • ${data.summary.unviewedNewCount} CV mới chưa xem`}
            icon={<Briefcase className="w-5 h-5 text-blue-600" />}
            accent="blue"
            href="/admin/candidates"
          />
          <KpiCard
            label="Điểm nghẽn SLA toàn phễu"
            value={data.sla.totalBreaches}
            subtext={`HR (>48h): ${data.sla.newBreachCount} • Manager (>72h): ${data.sla.screeningBreachCount}`}
            icon={<AlertTriangle className="w-5 h-5 text-rose-600" />}
            accent={data.sla.totalBreaches > 0 ? "rose" : "emerald"}
            href="/admin/pipeline"
          />
          <KpiCard
            label="Đã Tuyển chọn (Hired)"
            value={data.funnel.HIRED}
            subtext={`Tỷ lệ chuyển đổi: ${data.summary.hireRatePercent}% • ${data.funnel.INTERVIEW} đang PV`}
            icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
            accent="emerald"
            href="/admin/pipeline"
          />
          <KpiCard
            label="Nhân sự nội bộ hoạt động"
            value={data.adminStats?.activeUsers ?? 0}
            subtext={`HR: ${data.adminStats?.hrCount ?? 0} • HM: ${data.adminStats?.managerCount ?? 0} • Admin: ${data.adminStats?.adminCount ?? 0}`}
            icon={<Users className="w-5 h-5 text-indigo-600" />}
            accent="indigo"
            href="/admin/users"
          />
        </div>
      )}

      {/* TẦNG 2: PHỄU TUYỂN DỤNG 5 GIAI ĐOẠN (IN-SCOPE CORE OVERVIEW) */}
      <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Tổng quan Phễu Tuyển dụng (5 Giai đoạn)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Phân bổ hồ sơ theo thời gian thực từ Mới tiếp nhận đến Tuyển chọn / Từ chối
            </p>
          </div>
          <Link
            href="/admin/pipeline"
            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
          >
            Xem chi tiết trên Kanban
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Thanh phân bổ trực quan */}
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex mb-4">
          {data.funnel.total > 0 ? (
            STAGE_META.map((stage) => {
              const count = data.funnel[stage.key];
              const pct = (count / data.funnel.total) * 100;
              if (pct <= 0) return null;
              return (
                <div
                  key={stage.key}
                  style={{ width: `${pct}%` }}
                  className={`${stage.barColor} transition-all`}
                  title={`${stage.label}: ${count} hồ sơ (${Math.round(pct)}%)`}
                />
              );
            })
          ) : (
            <div className="w-full bg-slate-200" />
          )}
        </div>

        {/* 5 thẻ giai đoạn */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {STAGE_META.map((stage) => {
            const count = data.funnel[stage.key];
            const pct =
              data.funnel.total > 0
                ? Math.round((count / data.funnel.total) * 100)
                : 0;
            return (
              <Link
                key={stage.key}
                href="/admin/pipeline"
                className="group p-3.5 rounded-xl border border-slate-200 hover:border-brand-300 hover:bg-slate-50/70 transition-all"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                    <span className={`w-2 h-2 rounded-full ${stage.dotColor}`} />
                    {stage.label}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {pct}%
                  </span>
                </div>
                <p className="text-2xl font-bold text-slate-900 mt-2 group-hover:text-brand-700 transition-colors">
                  {count}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* TẦNG 3: KHU VỰC TÁC NGHIỆP PHÂN QUYỀN THEO TỪNG VAI TRÒ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CỘT TRÁI (2/3): HÀNG ĐỢI CẦN XỬ LÝ NGAY */}
        <div className="lg:col-span-2 space-y-6">
          {/* === HR ACTION QUEUE === */}
          {data.role === "HR" && (
            <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Hàng đợi ưu tiên của HR (Vòng Mới tiếp nhận)
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Nhấp vào từng hồ sơ để kiểm tra 5 trường cốt lõi, sửa lỗi bóc tách CV hoặc chuyển sang Sàng lọc tiêu chuẩn
                  </p>
                </div>
                <div className="inline-flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                  <button
                    onClick={() => setHrTab("UNVIEWED")}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      hrTab === "UNVIEWED"
                        ? "bg-white text-brand-700 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Chưa xem ({data.hrUnviewedQueue?.length ?? 0})
                  </button>
                  <button
                    onClick={() => setHrTab("SLA")}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      hrTab === "SLA"
                        ? "bg-white text-rose-700 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Quá hạn SLA ({data.hrSlaBreachQueue?.length ?? 0})
                  </button>
                  <button
                    onClick={() => setHrTab("ALL_NEW")}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      hrTab === "ALL_NEW"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Tất cả NEW ({data.hrRecentNewQueue?.length ?? 0})
                  </button>
                </div>
              </div>

              <CandidateQueueList
                items={hrActiveList}
                emptyMessage={
                  hrTab === "UNVIEWED"
                    ? "Tuyệt vời! Bạn đã xem toàn bộ CV mới tiếp nhận."
                    : hrTab === "SLA"
                    ? "Không có hồ sơ nào vượt quá hạn SLA 48 giờ ở cột Mới tiếp nhận."
                    : "Hiện chưa có hồ sơ nào trong cột Mới tiếp nhận."
                }
                actionLabel="Mở & Sơ loại"
                onSelect={(id) => setSelectedAppId(id)}
              />
            </section>
          )}

          {/* === HIRING MANAGER ACTION QUEUE === */}
          {data.role === "HIRING_MANAGER" && (
            <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Hàng đợi cần Hiring Manager quyết định
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Duyệt ứng viên từ Sàng lọc vào Phỏng vấn hoặc hoàn tất Scorecard để đủ điều kiện Tuyển chọn (BRL-06)
                  </p>
                </div>
                <div className="inline-flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                  <button
                    onClick={() => setHmTab("SCREENING")}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      hmTab === "SCREENING"
                        ? "bg-white text-indigo-700 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Chờ duyệt PV ({data.hmScreeningQueue?.length ?? 0})
                  </button>
                  <button
                    onClick={() => setHmTab("SCORECARD")}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      hmTab === "SCORECARD"
                        ? "bg-white text-rose-700 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Thiếu Scorecard ({data.hmMissingScorecardQueue?.length ?? 0})
                  </button>
                </div>
              </div>

              <CandidateQueueList
                items={hmActiveList}
                emptyMessage={
                  hmTab === "SCREENING"
                    ? "Không có hồ sơ nào đang chờ duyệt phỏng vấn tại vòng Sàng lọc tiêu chuẩn."
                    : "Tất cả ứng viên đang phỏng vấn đều đã có phiếu đánh giá Scorecard."
                }
                actionLabel={hmTab === "SCREENING" ? "Xem & Duyệt PV" : "Chấm Scorecard"}
                onSelect={(id) => setSelectedAppId(id)}
              />
            </section>
          )}

          {/* === ADMIN CONTROL TOWER LEFT === */}
          {data.role === "ADMIN" && (
            <>
              <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Cảnh báo Điểm nghẽn SLA Toàn phễu (BRL-07)
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Hồ sơ tồn đọng quá 48h ở cột NEW (trách nhiệm HR) hoặc quá 72h ở cột SCREENING (trách nhiệm Hiring Manager)
                    </p>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                    {data.sla.totalBreaches} quá hạn
                  </span>
                </div>

                <CandidateQueueList
                  items={data.slaBreachQueue || []}
                  emptyMessage="Hệ thống đang vận hành đúng chuẩn SLA — chưa ghi nhận hồ sơ nào tồn đọng quá hạn."
                  actionLabel="Kiểm tra hồ sơ"
                  onSelect={(id) => setSelectedAppId(id)}
                />
              </section>

              {/* Bảng tiến độ theo từng vị trí tuyển dụng */}
              <ActiveJobsTable jobs={data.activeJobs} />
            </>
          )}

          {/* Với HR & Hiring Manager, hiển thị bảng Vị trí đang tuyển phía dưới hàng đợi */}
          {data.role !== "ADMIN" && <ActiveJobsTable jobs={data.activeJobs} />}
        </div>

        {/* CỘT PHẢI (1/3): PANEL CHUYÊN BIỆT THEO ROLE */}
        <div className="space-y-6">
          {/* LỊCH PHỎNG VẤN SẮP TỚI (Cho Hiring Manager & Admin) */}
          {(data.role === "HIRING_MANAGER" || data.role === "ADMIN") && (
            <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-600" />
                  Lịch phỏng vấn đã xếp
                </h2>
                <span className="text-xs font-semibold text-slate-500">
                  {data.upcomingInterviews?.length ?? 0} lịch hẹn
                </span>
              </div>

              {!data.upcomingInterviews || data.upcomingInterviews.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  Chưa có lịch phỏng vấn nào được xếp ở cột Phỏng vấn.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {data.upcomingInterviews.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedAppId(item.id)}
                      className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-brand-300 hover:bg-slate-50 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {item.candidateName}
                        </p>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
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
                      <p className="text-xs text-slate-500 truncate mt-0.5">{item.jobTitle}</p>
                      {item.interviewDate && (
                        <p className="text-xs font-semibold text-brand-700 mt-1.5 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {formatDateTime(item.interviewDate)}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* KHUNG QUYỀN HẠN & LỐI TẮT CHO HR */}
          {data.role === "HR" && (
            <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                Lối tắt tác nghiệp HR
              </h2>

              <div className="space-y-2">
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-slate-200 hover:border-brand-300 hover:bg-brand-50/40 text-sm font-medium text-slate-700 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-brand-600" />
                    Nạp CV nội bộ mới
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </button>
                <Link
                  href="/admin/talent-pool"
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-slate-200 hover:border-brand-300 hover:bg-brand-50/40 text-sm font-medium text-slate-700 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-indigo-600" />
                    Tra cứu Kho Nhân tài
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </Link>
                <a
                  href="/api/export"
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-slate-200 hover:border-brand-300 hover:bg-brand-50/40 text-sm font-medium text-slate-700 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    Xuất danh sách ứng viên (CSV)
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </a>
              </div>

              <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-100 text-xs text-blue-900 space-y-1">
                <p className="font-bold">Phạm vi thẩm quyền HR:</p>
                <p className="text-blue-800/90 leading-relaxed">
                  • Chỉnh sửa/chuẩn hóa 5 trường trích xuất CV nếu máy bóc sai.<br />
                  • Luân chuyển hồ sơ tối đa đến vòng <strong>Sàng lọc tiêu chuẩn (SCREENING)</strong>.<br />
                  • Vòng Phỏng vấn &amp; Tuyển chọn do Hiring Manager phụ trách.
                </p>
              </div>
            </section>
          )}

          {/* KHUNG QUYỀN HẠN CHO HIRING MANAGER */}
          {data.role === "HIRING_MANAGER" && (
            <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                Quy chuẩn phê duyệt Chuyên môn
              </h2>
              <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-100 text-xs text-purple-900 space-y-1.5 leading-relaxed">
                <p>
                  • Duyệt chuyển hồ sơ từ <strong>SCREENING ➔ INTERVIEW</strong> và trực tiếp quản lý lịch phỏng vấn.
                </p>
                <p>
                  • Bắt buộc hoàn tất <strong>Phiếu Scorecard đạt chuẩn (BRL-06)</strong> trước khi chốt <strong>HIRED</strong>.
                </p>
                <p>
                  • Khi từ chối ứng viên, bắt buộc ghi rõ <strong>Lý do từ chối (BRL-11)</strong> để lưu Audit Log.
                </p>
              </div>
            </section>
          )}

          {/* GIÁM SÁT QUẢN TRỊ & TUÂN THỦ (CHỈ ADMIN THẤY) */}
          {data.role === "ADMIN" && data.adminStats && (
            <>
              <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3.5">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Quản trị &amp; Tuân thủ (Admin Only)
                </h2>

                <div
                  className={`p-3.5 rounded-xl border text-xs ${
                    data.adminStats.purgeEligibleCount > 0
                      ? "bg-amber-50 border-amber-200 text-amber-900"
                      : "bg-emerald-50 border-emerald-200 text-emerald-900"
                  }`}
                >
                  <p className="font-bold">Lưu trữ dữ liệu 180 ngày (BRL-10 / NĐ 13)</p>
                  <p className="mt-1">
                    {data.adminStats.purgeEligibleCount > 0
                      ? `Có ${data.adminStats.purgeEligibleCount} hồ sơ REJECTED đã quá 180 ngày cần rà soát xóa vĩnh viễn.`
                      : "Không có hồ sơ REJECTED nào quá hạn lưu trữ 180 ngày."}
                  </p>
                  <Link
                    href="/admin/talent-pool"
                    className="inline-flex items-center gap-1 font-semibold underline mt-1.5"
                  >
                    Mở công cụ dọn dẹp BRL-10 <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/admin/users"
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700"
                  >
                    <Users className="w-3.5 h-3.5 text-brand-600" />
                    Quản trị User
                  </Link>
                  <a
                    href="/api/export"
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    Xuất CSV
                  </a>
                </div>
              </section>

              {/* NHẬT KÝ KIỂM TOÁN GẦN NHẤT (CHỈ ADMIN THẤY) */}
              <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <History className="w-4 h-4 text-slate-600" />
                    Nhật ký kiểm toán mới nhất
                  </h2>
                  <span className="text-[11px] font-semibold text-slate-400">
                    Audit Trail
                  </span>
                </div>

                {!data.recentAuditLogs || data.recentAuditLogs.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-4">
                    Chưa có nhật ký hoạt động nào.
                  </p>
                ) : (
                  <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                    {data.recentAuditLogs.map((log) => (
                      <div
                        key={log.id}
                        className="pb-3 border-b border-slate-100 last:border-b-0 last:pb-0 text-xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-slate-900 truncate">
                            {log.actorName}
                          </span>
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {formatDateTime(log.createdAt)}
                          </span>
                        </div>
                        <p className="text-slate-600 mt-0.5">
                          <span className="font-medium text-brand-700">
                            {ACTION_LABELS[log.action] || log.action}
                          </span>{" "}
                          —{" "}
                          <button
                            onClick={() => setSelectedAppId(log.applicationId)}
                            className="font-semibold text-slate-800 hover:text-brand-600 underline decoration-slate-300"
                          >
                            {log.candidateName}
                          </button>
                          {log.fromStage ? ` (${log.fromStage} → ${log.toStage})` : ` (${log.toStage})`}
                        </p>
                        {log.reason && (
                          <p className="mt-1 text-[11px] text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-100 line-clamp-2">
                            Ghi chú: {log.reason}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </div>

      {/* DRAWER CHI TIẾT HỒ SƠ (1-CLICK XỬ LÝ TRỰC TIẾP TỪ DASHBOARD) */}
      {selectedAppId !== null && (
        <CandidateDrawer
          applicationId={selectedAppId}
          onClose={() => {
            setSelectedAppId(null);
            fetchDashboard();
          }}
          onStageChange={handleStageChange}
        />
      )}

      {/* MODAL NẠP CV NHANH CHO HR & ADMIN */}
      <AddCandidateModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          setIsAddModalOpen(false);
          fetchDashboard();
        }}
      />
    </div>
  );
}

/* =========================== SUB-COMPONENTS =========================== */

function KpiCard({
  label,
  value,
  subtext,
  icon,
  accent,
  href,
}: {
  label: string;
  value: number;
  subtext: string;
  icon: React.ReactNode;
  accent: "blue" | "indigo" | "amber" | "emerald" | "rose" | "slate";
  href: string;
}) {
  const accentBg: Record<typeof accent, string> = {
    blue: "bg-blue-50 border-blue-100",
    indigo: "bg-indigo-50 border-indigo-100",
    amber: "bg-amber-50 border-amber-100",
    emerald: "bg-emerald-50 border-emerald-100",
    rose: "bg-rose-50 border-rose-100",
    slate: "bg-slate-50 border-slate-200",
  };

  return (
    <Link
      href={href}
      className="group bg-white border border-slate-200 hover:border-brand-300 rounded-2xl p-5 shadow-xs transition-all flex flex-col justify-between"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          {label}
        </span>
        <div
          className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${accentBg[accent]}`}
        >
          {icon}
        </div>
      </div>
      <div className="mt-3">
        <p className="text-3xl font-bold text-slate-900 tracking-tight group-hover:text-brand-700 transition-colors">
          {value}
        </p>
        <p className="text-xs text-slate-500 mt-1 line-clamp-1">{subtext}</p>
      </div>
    </Link>
  );
}

function CandidateQueueList({
  items,
  emptyMessage,
  actionLabel,
  onSelect,
}: {
  items: QueueCandidateItem[];
  emptyMessage: string;
  actionLabel: string;
  onSelect: (id: number) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="p-10 text-center">
        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
        <p className="text-sm font-medium text-slate-700">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-100">
      {items.map((item) => (
        <div
          key={item.id}
          onClick={() => onSelect(item.id)}
          className="p-4 sm:px-5 hover:bg-slate-50/80 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-sm text-slate-900 truncate">
                {item.candidateName}
              </span>
              {item.isStarred && (
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
              )}
              {item.currentStage === "NEW" && !item.isViewed && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                  Mới chưa xem
                </span>
              )}
              {item.isSlaBreached && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 inline-flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {item.slaMessage}
                </span>
              )}
              {item.aiMatchScore !== null && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    item.aiMatchScore >= 60
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  Phù hợp JD: {Math.round(item.aiMatchScore)}%
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
              <span className="font-medium text-slate-700">{item.jobTitle}</span>
              <span>•</span>
              <span>{item.email}</span>
              <span>•</span>
              <span>{item.experienceYears} năm KN</span>
            </div>

            {item.skills.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-0.5">
                {item.skills.slice(0, 4).map((skill, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-lg inline-flex items-center gap-1 transition-colors">
              {actionLabel}
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function ActiveJobsTable({ jobs }: { jobs: JobBreakdownItem[] }) {
  return (
    <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Tiến độ theo Vị trí đang tuyển dụng
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Số lượng ứng viên hiện tại theo từng vị trí đang mở
          </p>
        </div>
        <Link
          href="/admin/jobs"
          className="text-xs font-semibold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1"
        >
          Quản lý tin tuyển dụng <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {jobs.length === 0 ? (
        <div className="p-8 text-center text-sm text-slate-500">
          Chưa có vị trí tuyển dụng nào đang mở.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 border-b border-slate-100">
                <th className="py-3 px-4 font-semibold">Vị trí tuyển dụng</th>
                <th className="py-3 px-2 font-semibold text-center">New</th>
                <th className="py-3 px-2 font-semibold text-center">Screening</th>
                <th className="py-3 px-2 font-semibold text-center">Interview</th>
                <th className="py-3 px-2 font-semibold text-center">Hired</th>
                <th className="py-3 px-3 font-semibold text-right">Tổng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {jobs.map((job) => (
                <tr key={job.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4">
                    <p className="font-semibold text-slate-900 text-sm">{job.title}</p>
                    <p className="text-[11px] text-slate-500">
                      {job.department} • {job.location}
                    </p>
                  </td>
                  <td className="py-3 px-2 text-center font-semibold text-blue-700">
                    {job.NEW}
                  </td>
                  <td className="py-3 px-2 text-center font-semibold text-indigo-700">
                    {job.SCREENING}
                  </td>
                  <td className="py-3 px-2 text-center font-semibold text-amber-700">
                    {job.INTERVIEW}
                  </td>
                  <td className="py-3 px-2 text-center font-semibold text-emerald-700">
                    {job.HIRED}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-slate-900">
                    {job.total}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
