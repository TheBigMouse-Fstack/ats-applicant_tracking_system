"use client";

import { useState } from "react";
import Link from "next/link";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import { useLanguage } from "@/lib/i18n";
import {
  Briefcase,
  Search,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Calendar,
  Video,
  MapPin,
  AlertCircle,
  Building2,
  Mail,
  Phone,
  ExternalLink,
  Loader2,
  ShieldCheck,
} from "lucide-react";

export default function CandidateTrackerPage() {
  const { t, locale } = useLanguage();
  const [email, setEmail] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResult(null);

    if (!email.trim()) {
      setError(
        locale === "en"
          ? "Please enter your application email address."
          : "Vui lòng nhập địa chỉ Email ứng tuyển của bạn."
      );
      return;
    }

    if (!identifier.trim()) {
      setError(
        locale === "en"
          ? "Please enter your Application ID (e.g. #4 or 4) or Phone Number."
          : "Vui lòng nhập Mã đơn ứng tuyển (VD: #4 hoặc 4) hoặc Số điện thoại."
      );
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/tracker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, identifier }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(
          data.error ||
            (locale === "en"
              ? "No matching application found. Please verify your details."
              : "Không tìm thấy hồ sơ phù hợp. Vui lòng kiểm tra lại thông tin.")
        );
      } else {
        setResult(data.data);
      }
    } catch (err: any) {
      setError(
        locale === "en"
          ? "Network connection error. Please try again later."
          : "Lỗi kết nối máy chủ khi tra cứu. Vui lòng thử lại sau."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/jobs" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg text-slate-900 tracking-tight">
                RecoverX
              </span>
              <span className="ml-2 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
                {t("tracker.badge")}
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link
              href="/jobs"
              className="text-xs font-semibold text-slate-600 hover:text-brand-600 transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-100"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              {t("tracker.backToJobs")}
            </Link>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            {locale === "en" ? "Transparent Hiring • Zero Ghosting" : "Minh Bạch Tuyển Dụng • Không Ghosting"}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {t("tracker.heading")}
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm max-w-xl mx-auto">
            {t("tracker.subheading")}
          </p>
        </div>

        {/* Lookup Form */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {t("tracker.emailLabel")} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("tracker.emailPlaceholder")}
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {t("tracker.idLabel")} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder={t("tracker.idPlaceholder")}
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-slate-800"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-semibold text-xs sm:text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/20"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t("tracker.searching")}</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>{t("tracker.searchButton")}</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Search Results Display */}
        {result && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Candidate & Job Summary Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-brand-50 text-brand-700 border border-brand-200">
                      {locale === "en" ? "Application #" : "Đơn Ứng Tuyển #"}{result.applicationId}
                    </span>
                    <span className="text-xs text-slate-400">
                      {locale === "en" ? "Applied on " : "Nộp ngày "}
                      {new Date(result.appliedAt).toLocaleDateString(locale === "en" ? "en-US" : "vi-VN")}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {locale === "en" ? "Candidate: " : "Ứng viên: "}{result.candidateName}
                  </h2>
                </div>

                <div>
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${result.currentStage === "HIRED"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : result.currentStage === "INTERVIEW"
                          ? "bg-purple-50 text-purple-700 border-purple-200"
                          : result.currentStage === "REJECTED"
                            ? "bg-slate-100 text-slate-700 border-slate-200"
                            : "bg-blue-50 text-blue-700 border-blue-200"
                      }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    {result.stageInfo.title}
                  </span>
                </div>
              </div>

              {/* Job Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl text-xs border border-slate-200/70">
                <div>
                  <span className="text-slate-400 block mb-0.5">
                    {locale === "en" ? "Position Applied" : "Vị trí ứng tuyển"}
                  </span>
                  <span className="font-bold text-slate-800 flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                    {result.jobTitle}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">
                    {locale === "en" ? "Department" : "Phòng ban phụ trách"}
                  </span>
                  <span className="font-semibold text-slate-800 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    {result.jobDepartment}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">
                    {locale === "en" ? "Work Location" : "Địa điểm làm việc"}
                  </span>
                  <span className="font-semibold text-slate-800 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {result.jobLocation}
                  </span>
                </div>
              </div>

              {/* Status Message */}
              <div
                className={`p-4 rounded-xl border text-xs leading-relaxed ${result.currentStage === "HIRED"
                    ? "bg-emerald-50/80 border-emerald-200 text-emerald-900"
                    : result.currentStage === "INTERVIEW"
                      ? "bg-purple-50/80 border-purple-200 text-purple-900"
                      : result.currentStage === "REJECTED"
                        ? "bg-slate-50 border-slate-200 text-slate-700"
                        : "bg-blue-50/80 border-blue-200 text-blue-900"
                  }`}
              >
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold mb-0.5">{result.stageInfo.title}</p>
                    <p>{result.stageInfo.description}</p>
                  </div>
                </div>
              </div>

              {/* Thông tin Lịch phỏng vấn cụ thể (Nếu đã có) */}
              {result.stageInfo.hasInterview && (
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 p-4 rounded-xl space-y-2.5">
                  <div className="flex items-center gap-2 text-purple-900 font-bold text-xs uppercase tracking-wider">
                    <Calendar className="w-4 h-4 text-purple-600" />
                    {locale === "en" ? "Official Interview Details:" : "Thông Tin Lịch Phỏng Vấn Chính Thức:"}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="bg-white/80 p-3 rounded-lg border border-purple-100">
                      <span className="text-slate-400 block mb-0.5">
                        {locale === "en" ? "Date & Time:" : "Thời gian diễn ra:"}
                      </span>
                      <span className="font-bold text-slate-800 text-sm">
                        {new Date(result.stageInfo.interviewDate).toLocaleString(locale === "en" ? "en-US" : "vi-VN", {
                          weekday: "long",
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <div className="bg-white/80 p-3 rounded-lg border border-purple-100">
                      <span className="text-slate-400 block mb-0.5">
                        {locale === "en" ? "Format & Location:" : "Hình thức & Địa điểm:"}
                      </span>
                      {result.stageInfo.interviewFormat === "ONLINE" ? (
                        <div className="flex items-center gap-1.5 font-bold text-brand-600">
                          <Video className="w-4 h-4" />
                          <span>{locale === "en" ? "Online Meet: " : "Họp Trực Tuyến: "}</span>
                          <a
                            href={
                              result.stageInfo.interviewLocation.startsWith("http")
                                ? result.stageInfo.interviewLocation
                                : `https://${result.stageInfo.interviewLocation}`
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="underline inline-flex items-center gap-1 hover:text-brand-800 truncate max-w-[200px]"
                          >
                            {locale === "en" ? "Join Meeting" : "Tham gia phòng họp"} <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 font-bold text-slate-800">
                          <MapPin className="w-4 h-4 text-amber-600" />
                          <span>{locale === "en" ? "On-site: " : "Tại văn phòng: "}{result.stageInfo.interviewLocation}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {result.stageInfo.interviewNotes && (
                    <div className="bg-white/90 p-3 rounded-lg border border-purple-100 text-xs text-slate-700">
                      <span className="font-semibold text-purple-900 block mb-0.5">
                        {locale === "en" ? "Recruiter Notes:" : "Dặn dò từ chuyên viên tuyển dụng:"}
                      </span>
                      <p>{result.stageInfo.interviewNotes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 4-Step Visual Timeline */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                {locale === "en" ? "Recruitment Journey & Progress" : "Tiến Trình Đơn Tuyển Dụng (Application Journey)"}
              </h3>

              <div className="relative border-l-2 border-slate-200 ml-4 sm:ml-6 space-y-6 py-2">
                {result.timeline.map((item: any, idx: number) => {
                  const isDone = item.status === "COMPLETED";
                  const isActive = item.status === "IN_PROGRESS";
                  const isArchived = item.status === "ARCHIVED";

                  return (
                    <div key={idx} className="relative pl-6 sm:pl-8">
                      {/* Node icon */}
                      <div
                        className={`absolute -left-[17px] top-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${isDone
                            ? "bg-emerald-500 border-emerald-600 text-white shadow-sm"
                            : isActive
                              ? "bg-brand-600 border-brand-700 text-white animate-pulse"
                              : isArchived
                                ? "bg-slate-300 border-slate-400 text-slate-600"
                                : "bg-white border-slate-300 text-slate-400"
                          }`}
                      >
                        {isDone ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : isActive ? (
                          <Clock className="w-4 h-4" />
                        ) : (
                          <span className="text-xs font-bold">{item.step}</span>
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4
                            className={`text-sm font-bold ${isDone
                                ? "text-slate-900"
                                : isActive
                                  ? "text-brand-700 font-extrabold"
                                  : "text-slate-400"
                              }`}
                          >
                            {locale === "en" ? `Step ${item.step}: ` : `Bước ${item.step}: `}{item.title}
                          </h4>
                          {isActive && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-100 text-brand-700 uppercase">
                              {locale === "en" ? "Current" : "Hiện tại"}
                            </span>
                          )}
                          {isDone && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">
                              {locale === "en" ? "Completed" : "Hoàn thành"}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">{item.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-400">
        &copy; 2026 RecoverX Technology Solutions Co., Ltd. {locale === "en" ? "Online Candidate Tracking Portal." : "Cổng thông tin ứng viên trực tuyến."}
      </footer>
    </div>
  );
}

