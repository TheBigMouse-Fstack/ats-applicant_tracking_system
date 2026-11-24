"use client";

import Link from "next/link";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import BrandLogo from "@/components/common/BrandLogo";
import { useLanguage } from "@/lib/i18n";
import {
  Briefcase,
  MapPin,
  Clock,
  ChevronRight,
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle,
  Search,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

interface JobItem {
  id: number;
  title: string;
  department: string;
  location: string;
  employmentType: string;
  minExperienceYears: number;
  requiredSkills: string | null;
  createdAt: Date | string;
}

interface JobsPublicClientProps {
  jobs: JobItem[];
  departments: string[];
}

export default function JobsPublicClient({
  jobs,
  departments,
}: JobsPublicClientProps) {
  const { t, locale } = useLanguage();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* 1. Header Public */}
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="shrink-0">
            <BrandLogo variant="public" size="md" />
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/jobs/tracker"
              className="text-xs font-medium text-zinc-600 hover:text-zinc-900 transition-colors whitespace-nowrap"
            >
              {t("public.track", "Tra cứu hồ sơ")}
            </Link>
            <LanguageSwitcher />
            <Link
              href="/admin/login"
              className="text-xs font-medium text-white bg-zinc-900 hover:bg-brand-600 px-3.5 py-2 rounded-md transition-colors whitespace-nowrap"
            >
              {locale === "en" ? "Recruiter portal" : "Cổng nhà tuyển dụng"}
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Banner Hero */}
      <div className="bg-[#f8f9fa] border-b border-zinc-200 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-2">
          <h1 className="text-2xl sm:text-3xl font-semibold text-zinc-900 tracking-tight">
            {t("jobs.title", "Vị trí đang tuyển dụng")}
          </h1>
          <p className="text-sm text-zinc-600 max-w-2xl">
            {locale === "en"
              ? "Select a position below to view requirements and submit your CV."
              : "Chọn vị trí phù hợp để xem yêu cầu công việc và nộp hồ sơ trực tuyến."}
          </p>
          {departments.length > 0 && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-2 text-xs text-zinc-500">
              <span className="font-medium text-zinc-400">
                {t("jobs.departments", "Phòng ban:")}
              </span>
              {departments.map((dep) => (
                <span key={dep} className="font-medium text-zinc-700">
                  {dep}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. Danh sách công việc mở tuyển */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full">
        {/* Banner Tra Cứu Tiến Độ Hồ Sơ */}
        <div className="mb-8 p-5 rounded-2xl bg-gradient-to-r from-brand-50/90 via-indigo-50/60 to-purple-50/50 border border-brand-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-brand-500/20">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {t("jobs.trackerBanner.title", "Bạn đã nộp hồ sơ ứng tuyển tại RecoverX?")}
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                {t("jobs.trackerBanner.desc", "Tra cứu tiến độ xét duyệt hồ sơ, lịch phỏng vấn và phản hồi nhanh chóng theo thời gian thực.")}
              </p>
            </div>
          </div>
          <Link
            href="/jobs/tracker"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-brand-50 text-brand-700 font-bold text-xs border border-brand-200 shadow-2xs transition-all shrink-0 cursor-pointer"
          >
            <span>{t("jobs.trackerBanner.button", "Tra Cứu Hồ Sơ Ngay")}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-brand-600" />
            <span>{t("jobs.listTitle", "Các Vị Trí Đang Tuyển Dụng")} ({jobs.length})</span>
          </h2>
          <span className="text-xs text-slate-500">
            {t("jobs.listSubtitle", "Hồ sơ ứng tuyển được bảo mật thông tin tuyệt đối")}
          </span>
        </div>

        {jobs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
            <Briefcase className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-700 text-base">{t("jobs.emptyTitle", "Hiện chưa có vị trí nào đang mở tuyển")}</h3>
            <p className="text-xs text-slate-500">{t("jobs.emptyDesc", "Vui lòng quay lại sau hoặc liên hệ bộ phận tuyển dụng.")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {jobs.map((job) => {
              let skills: string[] = [];
              try {
                skills = JSON.parse(job.requiredSkills || "[]");
              } catch {
                skills = [];
              }

              return (
                <div
                  key={job.id}
                  className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs hover:shadow-md hover:border-brand-300 transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-brand-50 text-brand-700 border border-brand-200/70 mb-2">
                          {job.department}
                        </span>
                        <h3 className="text-lg font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
                          {job.title}
                        </h3>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                        <CheckCircle className="w-3 h-3" />
                        {locale === "en" ? "Open" : "Đang mở"}
                      </span>
                    </div>

                    {/* Metadata */}
                    <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {job.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {job.employmentType}
                      </span>
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                        {locale === "en" ? `Min ${job.minExperienceYears} yrs exp` : `Tối thiểu ${job.minExperienceYears} năm KN`}
                      </span>
                    </div>

                    {/* Kỹ năng yêu cầu */}
                    {skills.length > 0 && (
                      <div className="pt-2">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                          {locale === "en" ? "Key Skills:" : "Kỹ năng trọng yếu:"}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {skills.slice(0, 5).map((skill) => (
                            <span
                              key={skill}
                              className="px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200"
                            >
                              {skill}
                            </span>
                          ))}
                          {skills.length > 5 && (
                            <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-50 text-slate-500 border border-slate-200">
                              +{skills.length - 5}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Nút xem chi tiết & ứng tuyển */}
                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {locale === "en"
                        ? `Posted: ${new Date(job.createdAt).toLocaleDateString("en-US")}`
                        : `Đăng tuyển: ${new Date(job.createdAt).toLocaleDateString("vi-VN")}`}
                    </span>

                    <Link
                      href={`/jobs/${job.id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-xs hover:shadow-sm transition-all"
                    >
                      <span>{t("jobs.viewJob", "Chi tiết & Ứng tuyển")}</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 mt-12 text-center text-xs text-slate-500 space-y-2">
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-slate-600 mb-2">
          <Link href="/" className="hover:text-brand-600">Trang chủ</Link>
          <Link href="/jobs" className="hover:text-brand-600">Tuyển dụng</Link>
          <Link href="/jobs/tracker" className="hover:text-brand-600">Tra cứu hồ sơ</Link>
          <Link href="/admin/login" className="text-brand-700 hover:text-brand-800 font-bold flex items-center gap-1 bg-brand-50 px-2.5 py-1 rounded-md border border-brand-200">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
            <span>Cổng Nhà Tuyển Dụng (Demo Live)</span>
          </Link>
        </div>
        <p>© 2026 RecoverX Technology Solutions Co., Ltd. {locale === "en" ? "All rights reserved." : "Bảo lưu mọi quyền."}</p>
        <p className="mt-1 text-slate-400">
          {locale === "en"
            ? "Headquarters: 18th Floor, RecoverX Innovation Tower, District 1, Ho Chi Minh City"
            : "Trụ sở chính: Tầng 18, RecoverX Innovation Tower, Quận 1, TP. Hồ Chí Minh"}
        </p>
      </footer>
    </div>
  );
}
