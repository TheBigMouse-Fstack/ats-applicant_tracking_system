"use client";

import Link from "next/link";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import BrandLogo from "@/components/common/BrandLogo";
import { useLanguage } from "@/lib/i18n";
import { ArrowRight } from "lucide-react";

const FEATURED_ROLES = [
  {
    title: "Senior Backend Engineer (Java / Microservices)",
    department: "Engineering",
    location: "TP. Hồ Chí Minh",
    experience: "4+ năm KN",
  },
  {
    title: "Fullstack Developer (Node.js / React / TypeScript)",
    department: "Engineering",
    location: "TP. Hồ Chí Minh",
    experience: "2+ năm KN",
  },
  {
    title: "IT Business Analyst (Enterprise Systems)",
    department: "Product & BA",
    location: "TP. Hồ Chí Minh",
    experience: "3+ năm KN",
  },
  {
    title: "Senior Automation QA Engineer (Playwright)",
    department: "Quality Assurance",
    location: "TP. Hồ Chí Minh",
    experience: "3+ năm KN",
  },
  {
    title: "Software Engineer Trainee (Fast-Track)",
    department: "Engineering",
    location: "TP. Hồ Chí Minh",
    experience: "0–1 năm KN",
  },
];

export default function HomePage() {
  const { locale } = useLanguage();
  const isEn = locale === "en";

  return (
    <div className="min-h-screen bg-white text-zinc-900 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="shrink-0">
            <BrandLogo variant="public" size="md" />
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-600">
            <Link href="/jobs" className="hover:text-zinc-900 transition-colors">
              {isEn ? "Open positions" : "Vị trí tuyển dụng"}
            </Link>
            <Link href="/jobs/tracker" className="hover:text-zinc-900 transition-colors">
              {isEn ? "Track application" : "Tra cứu hồ sơ"}
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link
              href="/admin/login"
              className="px-3.5 py-2 rounded-md bg-zinc-900 hover:bg-brand-600 text-white text-xs font-medium transition-colors whitespace-nowrap"
            >
              {isEn ? "Recruiter portal" : "Cổng nhà tuyển dụng"}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero: Recruitment-first, Swiss Minimalist (ELCA-inspired) */}
      <section className="border-b border-zinc-200 bg-[#f8f9fa]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="max-w-2xl space-y-6">
            <div className="w-10 h-1 bg-brand-600" aria-hidden="true" />
            <h1 className="text-3xl sm:text-5xl font-semibold text-zinc-900 tracking-tight leading-[1.15]">
              {isEn
                ? "Engineering careers at RecoverX"
                : "Tuyển dụng kỹ sư phần mềm tại RecoverX"}
            </h1>
            <p className="text-base text-zinc-600 leading-relaxed">
              {isEn
                ? "Apply directly for open engineering, QA, and business analysis roles with transparent application tracking."
                : "Ứng tuyển trực tiếp các vị trí kỹ sư phần mềm, QA và phân tích nghiệp vụ với tiến độ xử lý minh bạch theo từng vòng."}
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/jobs"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-md bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium transition-colors whitespace-nowrap"
              >
                <span>{isEn ? "View open positions" : "Xem vị trí đang tuyển"}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/admin/login"
                className="inline-flex items-center px-5 py-3 rounded-md bg-white hover:bg-zinc-100 text-zinc-900 text-sm font-medium border border-zinc-300 transition-colors whitespace-nowrap"
              >
                {isEn ? "Internal ATS demo" : "Vào trang nội bộ (Demo)"}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Open Positions Preview */}
      <section className="py-16 sm:py-20 bg-white border-b border-zinc-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-xl sm:text-2xl font-semibold text-zinc-900 tracking-tight">
              {isEn ? "Open positions" : "Vị trí đang mở"}
            </h2>
            <Link
              href="/jobs"
              className="text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors whitespace-nowrap"
            >
              {isEn ? "All positions →" : "Xem tất cả →"}
            </Link>
          </div>

          <div className="divide-y divide-zinc-200 border-t border-b border-zinc-200">
            {FEATURED_ROLES.map((role) => (
              <Link
                key={role.title}
                href="/jobs"
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 group hover:bg-zinc-50/70 -mx-3 px-3 rounded-md transition-colors"
              >
                <div>
                  <h3 className="text-sm sm:text-base font-medium text-zinc-900 group-hover:text-brand-600 transition-colors">
                    {role.title}
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">{role.department}</p>
                </div>
                <div className="flex items-center gap-6 text-xs text-zinc-500 shrink-0">
                  <span>{role.location}</span>
                  <span>{role.experience}</span>
                  <span className="text-brand-600 font-medium">
                    {isEn ? "Apply" : "Ứng tuyển"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Hiring Process (3 concise steps) */}
      <section className="py-16 bg-[#f8f9fa]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <h2 className="text-xl sm:text-2xl font-semibold text-zinc-900 tracking-tight">
            {isEn ? "Hiring process" : "Quy trình tuyển dụng"}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2 border-t-2 border-brand-600 pt-4">
              <span className="text-xs font-semibold text-brand-600 tabular-nums">01</span>
              <h3 className="text-base font-semibold text-zinc-900">
                {isEn ? "Application" : "Nộp hồ sơ"}
              </h3>
              <p className="text-sm text-zinc-600 leading-relaxed">
                {isEn
                  ? "Submit your CV in PDF or DOCX and receive a tracking code immediately."
                  : "Tải lên CV định dạng PDF hoặc DOCX và nhận mã tra cứu hồ sơ ngay."}
              </p>
            </div>

            <div className="space-y-2 border-t-2 border-zinc-300 pt-4">
              <span className="text-xs font-semibold text-zinc-400 tabular-nums">02</span>
              <h3 className="text-base font-semibold text-zinc-900">
                {isEn ? "Screening & interview" : "Sàng lọc & Phỏng vấn"}
              </h3>
              <p className="text-sm text-zinc-600 leading-relaxed">
                {isEn
                  ? "Recruiters review core qualifications before scheduling a technical interview."
                  : "HR đánh giá hồ sơ và sắp xếp buổi phỏng vấn chuyên môn cùng trưởng bộ phận."}
              </p>
            </div>

            <div className="space-y-2 border-t-2 border-zinc-300 pt-4">
              <span className="text-xs font-semibold text-zinc-400 tabular-nums">03</span>
              <h3 className="text-base font-semibold text-zinc-900">
                {isEn ? "Decision & offer" : "Kết quả & Đề nghị"}
              </h3>
              <p className="text-sm text-zinc-600 leading-relaxed">
                {isEn
                  ? "Structured scorecard evaluation followed by a clear hiring decision."
                  : "Đánh giá minh bạch qua phiếu điểm và gửi phản hồi rõ ràng tới ứng viên."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-zinc-200 bg-white py-8 text-xs text-zinc-500">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <BrandLogo variant="public" size="sm" />
            <span className="text-zinc-400">© 2026 RecoverX</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/jobs" className="hover:text-zinc-900 transition-colors">
              {isEn ? "Open positions" : "Tuyển dụng"}
            </Link>
            <Link href="/jobs/tracker" className="hover:text-zinc-900 transition-colors">
              {isEn ? "Track application" : "Tra cứu hồ sơ"}
            </Link>
            <Link href="/admin/login" className="text-brand-600 hover:text-brand-700 font-medium">
              {isEn ? "Recruiter portal" : "Cổng nhà tuyển dụng"}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
