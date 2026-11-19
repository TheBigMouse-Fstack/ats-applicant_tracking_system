"use client";

import { useState } from "react";
import Link from "next/link";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import { useLanguage } from "@/lib/i18n";
import {
  Code2,
  Server,
  Cloud,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Award,
  Globe2,
  Users,
  Laptop,
  HeartHandshake,
  Send,
  Mail,
  Phone,
  MapPin,
  ChevronRight,
  Layers,
  Search,
  Clock,
  Terminal,
  Cpu,
  Database,
  Check,
  Briefcase,
} from "lucide-react";

export default function HomePage() {
  const { t, locale } = useLanguage();
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactCompany, setContactCompany] = useState("");
  const [contactService, setContactService] = useState("Software Engineering");
  const [contactMessage, setContactMessage] = useState("");
  const [contactSubmitted, setContactSubmitted] = useState(false);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-brand-500 selection:text-white">
      {/* 1. Header Navigation */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-50 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-brand-700 via-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-brand-600/20 group-hover:scale-105 transition-all">
              <Code2 className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-2xl tracking-tight text-slate-900 group-hover:text-brand-600 transition-colors">
                RecoverX
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 -mt-1">
                Technology Solutions
              </span>
            </div>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#about" className="hover:text-brand-600 transition-colors">
              {t("home.nav.about", "Về RecoverX")}
            </a>
            <a href="#solutions" className="hover:text-brand-600 transition-colors">
              {t("home.nav.solutions", "Dịch vụ & Giải pháp")}
            </a>
            <a href="#culture" className="hover:text-brand-600 transition-colors">
              {t("home.nav.culture", "Văn hóa & Đãi ngộ")}
            </a>
            <Link href="/jobs" className="hover:text-brand-600 transition-colors">
              {t("home.nav.jobs", "Tuyển dụng")}
            </Link>
            <a href="#contact" className="hover:text-brand-600 transition-colors">
              {t("home.nav.contact", "Liên hệ")}
            </a>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white via-slate-50 to-slate-100/60 pt-20 pb-24 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8 relative z-10">
          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-[1.15] max-w-5xl mx-auto">
            {t("home.hero.title1", "Tiên Phong Kiến Tạo Phần Mềm &")}{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600">
              {t("home.hero.title2", "Giải Pháp Công Nghệ Cao")}
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
            {t("home.hero.subtitle", "RecoverX cung cấp dịch vụ kỹ thuật phần mềm chuẩn mực Châu Âu, hiện đại hóa Cloud, kiến trúc Microservices và đảm bảo chất lượng toàn diện (QA) cho các tập đoàn tài chính, y tế và công nghệ hàng đầu thế giới.")}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              href="/jobs"
              className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-xl shadow-brand-600/25 hover:shadow-brand-600/35 hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              <span>{t("home.hero.ctaJobs", "Gia Nhập Đội Ngũ Kỹ Sư RecoverX")}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <a
              href="#contact"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm border border-slate-300 shadow-xs hover:border-slate-400 transition-all cursor-pointer"
            >
              <Mail className="w-4 h-4 text-brand-600" />
              <span>{t("home.hero.ctaContact", "Liên Hệ Hợp Tác Doanh Nghiệp")}</span>
            </a>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-10 border-t border-slate-200/80">
            <div className="p-4 rounded-2xl bg-white/70 backdrop-blur-xs border border-slate-200/80 text-center">
              <span className="block text-3xl font-black text-slate-900">15+</span>
              <span className="text-xs font-semibold text-slate-500 mt-1 block">
                {locale === "en" ? "Years Engineering Experience" : "Năm Kinh Nghiệm Kỹ Thuật"}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-white/70 backdrop-blur-xs border border-slate-200/80 text-center">
              <span className="block text-3xl font-black text-slate-900">350+</span>
              <span className="text-xs font-semibold text-slate-500 mt-1 block">
                {locale === "en" ? "Elite Software Engineers" : "Kỹ Sư Phần Mềm Xuất Sắc"}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-white/70 backdrop-blur-xs border border-slate-200/80 text-center">
              <span className="block text-3xl font-black text-slate-900">120+</span>
              <span className="text-xs font-semibold text-slate-500 mt-1 block">
                {locale === "en" ? "Enterprise Projects Deployed" : "Dự Án Enterprise Triển Khai"}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-white/70 backdrop-blur-xs border border-slate-200/80 text-center">
              <span className="block text-3xl font-black text-brand-600">99.2%</span>
              <span className="text-xs font-semibold text-slate-500 mt-1 block">
                {locale === "en" ? "Global Client Satisfaction" : "Khách Hàng Quốc Tế Hài Lòng"}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Section: Về RecoverX (Who We Are) */}
      <section id="about" className="py-20 bg-white border-b border-slate-200/80 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
                <Globe2 className="w-3.5 h-3.5" />
                Về Chúng Tôi &bull; Who We Are
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Kỹ Thuật Phần Mềm Chuẩn Mực Châu Âu Kết Hợp Tài Năng Việt Nam
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                Thành lập với sứ mệnh đồng hành cùng các tập đoàn hàng đầu thế giới trong công cuộc chuyển đổi số, RecoverX kết hợp phương pháp quản lý chuẩn mực Thụy Sĩ/Châu Âu với năng lực phát triển vượt trội của đội ngũ kỹ sư phần mềm Việt Nam.
              </p>

              <div className="space-y-3.5 pt-2">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Quy Trình Chuẩn Mực CMMI & ISO 27001</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Mọi dòng mã và giải pháp đều tuân thủ nghiêm ngặt chuẩn an toàn thông tin và bảo mật dữ liệu quốc tế.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Agile & Continuous Delivery Thực Thụ</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Đội ngũ kỹ sư làm việc trực tiếp theo Scrum, kiểm thử tự động CI/CD và bàn giao tính năng định kỳ hàng tuần.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Đầu Tư Phát Triển Con Người Bền Vững</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Chương trình đào tạo Fast-track cho Trainee và ngân sách chứng chỉ quốc tế không giới hạn cho Senior Engineers.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Box */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 text-white shadow-2xl space-y-6 relative overflow-hidden">
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-400">RecoverX Tech Ecosystem</span>
                <h3 className="text-2xl font-bold">Hạ Tầng Kỹ Thuật Hiện Đại</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Chúng tôi xây dựng môi trường kỹ thuật đỉnh cao để mỗi kỹ sư có thể sáng tạo và phát triển tối đa năng lực bản thân.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-white/10 border border-white/10 space-y-1">
                  <Server className="w-5 h-5 text-brand-400 mb-1" />
                  <span className="font-bold block">Cloud-Native Architecture</span>
                  <span className="text-slate-400 text-[11px]">AWS, Azure & Kubernetes</span>
                </div>
                <div className="p-3.5 rounded-xl bg-white/10 border border-white/10 space-y-1">
                  <Cpu className="w-5 h-5 text-indigo-400 mb-1" />
                  <span className="font-bold block">Microservices & Event-Driven</span>
                  <span className="text-slate-400 text-[11px]">Spring Boot, Kafka, .NET</span>
                </div>
                <div className="p-3.5 rounded-xl bg-white/10 border border-white/10 space-y-1">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 mb-1" />
                  <span className="font-bold block">Automation QA & Security</span>
                  <span className="text-slate-400 text-[11px]">Playwright, CI/CD, OWASP</span>
                </div>
                <div className="p-3.5 rounded-xl bg-white/10 border border-white/10 space-y-1">
                  <Laptop className="w-5 h-5 text-purple-400 mb-1" />
                  <span className="font-bold block">Modern Web & Mobile</span>
                  <span className="text-slate-400 text-[11px]">React, TypeScript, Figma</span>
                </div>
              </div>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                <span>Văn phòng: TP.HCM &bull; Thụy Sĩ &bull; Singapore</span>
                <span className="text-emerald-400 font-bold">● Active 24/7 Operations</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Section: Năng Lực & Dịch Vụ Công Nghệ (Solutions) */}
      <section id="solutions" className="py-20 bg-slate-50 border-b border-slate-200/80 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200">
              <Layers className="w-3.5 h-3.5 text-brand-600" />
              Dịch Vụ & Lĩnh Vực Chuyên Môn
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Giải Pháp Phần Mềm Toàn Diện Cho Doanh Nghiệp
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Cung cấp trọn gói từ tư vấn kiến trúc, phát triển phần mềm, kiểm thử tự động tới vận hành Cloud.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all space-y-3.5 group">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Server className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Enterprise Backend & Microservices</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Thiết kế hệ thống chịu tải cao với Java Spring Boot, .NET Core, phân tán sự kiện qua Apache Kafka và bộ nhớ đệm Redis.
              </p>
              <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1 text-[11px] font-semibold text-slate-600">
                <span className="px-2 py-0.5 rounded bg-slate-100">Java</span>
                <span className="px-2 py-0.5 rounded bg-slate-100">Spring Boot</span>
                <span className="px-2 py-0.5 rounded bg-slate-100">Kafka</span>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all space-y-3.5 group">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Cloud className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Cloud Migration & DevOps Automation</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Triển khai hạ tầng dưới dạng mã (Terraform), vận hành cụm Kubernetes (EKS/AKS) và chuẩn hóa pipeline CI/CD tự động.
              </p>
              <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1 text-[11px] font-semibold text-slate-600">
                <span className="px-2 py-0.5 rounded bg-slate-100">AWS</span>
                <span className="px-2 py-0.5 rounded bg-slate-100">Kubernetes</span>
                <span className="px-2 py-0.5 rounded bg-slate-100">Terraform</span>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all space-y-3.5 group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Quality Assurance & Automation QA</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Kiểm thử toàn diện từ API, UI với Playwright, Selenium, tích hợp kiểm thử hiệu năng k6 và kiểm thử bảo mật định kỳ.
              </p>
              <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1 text-[11px] font-semibold text-slate-600">
                <span className="px-2 py-0.5 rounded bg-slate-100">Playwright</span>
                <span className="px-2 py-0.5 rounded bg-slate-100">Selenium</span>
                <span className="px-2 py-0.5 rounded bg-slate-100">k6</span>
              </div>
            </div>

            {/* Card 4 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all space-y-3.5 group">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Laptop className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Modern Web & Product Engineering</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Xây dựng nền tảng Design System chuẩn mực, phát triển Web Application mượt mà với React, Next.js và Tailwind CSS.
              </p>
              <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1 text-[11px] font-semibold text-slate-600">
                <span className="px-2 py-0.5 rounded bg-slate-100">React</span>
                <span className="px-2 py-0.5 rounded bg-slate-100">TypeScript</span>
                <span className="px-2 py-0.5 rounded bg-slate-100">Figma</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Section: Văn Hóa & Đãi Ngộ (Life at RecoverX) */}
      <section id="culture" className="py-20 bg-white border-b border-slate-200/80 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
              <Award className="w-3.5 h-3.5" />
              Chế Độ Đãi Ngộ & Môi Trường
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Tại Sao Kỹ Sư Công Nghệ Chọn RecoverX?
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Chúng tôi tin rằng phần mềm xuất sắc chỉ được tạo nên bởi những con người được chăm sóc và truyền cảm hứng tốt nhất.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl border border-slate-200/90 bg-slate-50/60 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                1
              </div>
              <h3 className="text-base font-bold text-slate-900">Thu Nhập & Thưởng Cạnh Tranh</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Mức lương cạnh tranh theo chuẩn thị trường quốc tế, lương tháng 13 đảm bảo cùng thưởng hiệu suất (Performance Bonus) theo từng dự án.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200/90 bg-slate-50/60 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center font-bold">
                2
              </div>
              <h3 className="text-base font-bold text-slate-900">Trang Thiết Bị Làm Việc Cao Cấp</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                100% kỹ sư được cung cấp MacBook Pro M-series mới nhất cùng màn hình phụ 4K chuyên dụng tại văn phòng hạng A Quận 1.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200/90 bg-slate-50/60 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                3
              </div>
              <h3 className="text-base font-bold text-slate-900">Tài Trợ Chứng Chỉ Quốc Tế 100%</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Ngân sách học tập không giới hạn cho các chứng chỉ AWS Solutions Architect, CKA, ISTQB, Scrum Master và đào tạo ngoại ngữ.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200/90 bg-slate-50/60 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                4
              </div>
              <h3 className="text-base font-bold text-slate-900">Chăm Sóc Sức Khỏe Toàn Diện</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Gói bảo hiểm sức khỏe quốc tế cao cấp (Bảo Việt / PVI Health Care) với quyền lợi nội trú & ngoại trú cho nhân viên và người thân.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200/90 bg-slate-50/60 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                5
              </div>
              <h3 className="text-base font-bold text-slate-900">Mô Hình Làm Việc Hybrid Linh Hoạt</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Linh hoạt lựa chọn làm việc tại văn phòng hoặc từ xa (Remote/Hybrid), hỗ trợ cân bằng hoàn hảo giữa công việc và cuộc sống.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200/90 bg-slate-50/60 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                6
              </div>
              <h3 className="text-base font-bold text-slate-900">Cơ Hội Onsite Châu Âu & Singapore</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Trải nghiệm làm việc trực tiếp tại các trụ sở đối tác tại Thụy Sĩ, Đức và Singapore với phụ cấp công tác quốc tế hấp dẫn.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Section: Cơ Hội Tuyển Dụng Nổi Bật (Careers Preview) */}
      <section className="py-20 bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-bold border border-brand-500/30">
                <Users className="w-3.5 h-3.5" />
                Gia Nhập RecoverX Team
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight">
                Vị Trí Tuyển Dụng Đang Mở (Open Roles)
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Tìm kiếm cơ hội nghề nghiệp phù hợp với đam mê và định hướng phát triển của bạn.
              </p>
            </div>

            <Link
              href="/jobs"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md transition-all self-start md:self-auto"
            >
              <span>Xem Tất Cả 8+ Vị Trí</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Job Preview 1 */}
            <Link
              href="/jobs"
              className="p-5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all space-y-3 group block"
            >
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Trainee / Fast-Track
                </span>
                <span className="text-[11px] text-slate-400">0 năm KN</span>
              </div>
              <h4 className="text-sm font-bold text-white group-hover:text-brand-400 transition-colors">
                Software Engineer Trainee (Java / Spring Boot & React)
              </h4>
              <p className="text-xs text-slate-400">Phát triển Phần mềm &bull; Trợ cấp 8 - 12 triệu</p>
            </Link>

            {/* Job Preview 2 */}
            <Link
              href="/jobs"
              className="p-5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all space-y-3 group block"
            >
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Junior / Mid
                </span>
                <span className="text-[11px] text-slate-400">2 năm KN</span>
              </div>
              <h4 className="text-sm font-bold text-white group-hover:text-brand-400 transition-colors">
                Fullstack Developer (Node.js & React / TypeScript)
              </h4>
              <p className="text-xs text-slate-400">Phát triển Phần mềm &bull; Lương 22 - 35 triệu</p>
            </Link>

            {/* Job Preview 3 */}
            <Link
              href="/jobs"
              className="p-5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all space-y-3 group block"
            >
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Senior Specialist
                </span>
                <span className="text-[11px] text-slate-400">4+ năm KN</span>
              </div>
              <h4 className="text-sm font-bold text-white group-hover:text-brand-400 transition-colors">
                Senior Backend Engineer (Java / Microservices & Cloud AWS)
              </h4>
              <p className="text-xs text-slate-400">Kiến trúc & Backend &bull; Lương 45 - 65 triệu</p>
            </Link>

            {/* Job Preview 4 */}
            <Link
              href="/jobs"
              className="p-5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all space-y-3 group block"
            >
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  QA Trainee
                </span>
                <span className="text-[11px] text-slate-400">0 năm KN</span>
              </div>
              <h4 className="text-sm font-bold text-white group-hover:text-brand-400 transition-colors">
                QA / QC Tester Trainee (Manual & Automation Basics)
              </h4>
              <p className="text-xs text-slate-400">Đảm bảo Chất lượng &bull; Đào tạo ISTQB miễn phí</p>
            </Link>

            {/* Job Preview 5 */}
            <Link
              href="/jobs"
              className="p-5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all space-y-3 group block"
            >
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Senior QA
                </span>
                <span className="text-[11px] text-slate-400">3+ năm KN</span>
              </div>
              <h4 className="text-sm font-bold text-white group-hover:text-brand-400 transition-colors">
                Senior Automation QA Engineer (Playwright & CI/CD)
              </h4>
              <p className="text-xs text-slate-400">Đảm bảo Chất lượng &bull; Lương 30 - 45 triệu</p>
            </Link>

            {/* Job Preview 6 */}
            <Link
              href="/jobs"
              className="p-5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all space-y-3 group block"
            >
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Product Design
                </span>
                <span className="text-[11px] text-slate-400">2+ năm KN</span>
              </div>
              <h4 className="text-sm font-bold text-white group-hover:text-brand-400 transition-colors">
                UI/UX Designer (Design System & Enterprise SaaS)
              </h4>
              <p className="text-xs text-slate-400">Thiết kế Sản phẩm &bull; Lương 25 - 40 triệu</p>
            </Link>
          </div>
        </div>
      </section>

      {/* 7. Section: Liên Hệ Hợp Tác Doanh Nghiệp (Contact Us) */}
      <section id="contact" className="py-20 bg-white scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Info */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
                <HeartHandshake className="w-3.5 h-3.5 text-brand-600" />
                Liên Hệ & Hợp Tác Doanh Nghiệp
              </div>

              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Bạn Có Dự Án Cần Tư Vấn Kỹ Thuật Chuyên Sâu?
              </h2>

              <p className="text-sm text-slate-600 leading-relaxed">
                Đội ngũ kỹ sư trưởng và chuyên gia giải pháp của RecoverX luôn sẵn sàng lắng nghe bài toán kinh doanh và đề xuất giải pháp kỹ thuật tối ưu nhất cho quý doanh nghiệp.
              </p>

              <div className="space-y-4 pt-4 text-xs text-slate-700">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 text-brand-600 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block">Trụ sở chính (TP. Hồ Chí Minh):</span>
                    <span>Tầng 18, RecoverX Innovation Tower, 12 Lê Duẩn, Bến Nghé, Quận 1, TP.HCM</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 text-brand-600 flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block">Tổng đài hỗ trợ:</span>
                    <span>+84 (28) 3822 9999 &bull; Giờ làm việc: Thứ 2 – Thứ 6 (08:30 – 18:00)</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 text-brand-600 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block">Hộp thư điện tử:</span>
                    <span>Hợp tác kinh doanh: <strong>contact@recoverx.io</strong></span>
                    <span className="block mt-0.5">Tuyển dụng nhân tài: <strong>careers@recoverx.io</strong></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Contact Form */}
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200/90 shadow-sm">
              {contactSubmitted ? (
                <div className="py-12 text-center space-y-4 animate-in fade-in">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Cảm Ơn Quý Khách Đã Liên Hệ!</h3>
                  <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                    Yêu cầu tư vấn của bạn đã được chuyển tới Giám đốc Kỹ thuật RecoverX. Chúng tôi sẽ phản hồi qua email <strong>{contactEmail}</strong> trong vòng 24 giờ làm việc.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setContactSubmitted(false);
                      setContactMessage("");
                    }}
                    className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-white border border-slate-200 hover:bg-slate-100 text-slate-700"
                  >
                    Gửi tin nhắn khác
                  </button>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-900">Gửi Tin Nhắn Tư Vấn Dự Án</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Họ và Tên <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="Nguyễn Văn A"
                        className="w-full text-xs rounded-xl border border-slate-200 bg-white py-2.5 px-3 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Email Doanh Nghiệp <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="a.nguyen@company.com"
                        className="w-full text-xs rounded-xl border border-slate-200 bg-white py-2.5 px-3 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Số Điện Thoại Liên Hệ
                      </label>
                      <input
                        type="tel"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="+84 90 123 4567"
                        className="w-full text-xs rounded-xl border border-slate-200 bg-white py-2.5 px-3 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Tên Tổ Chức / Doanh Nghiệp
                      </label>
                      <input
                        type="text"
                        value={contactCompany}
                        onChange={(e) => setContactCompany(e.target.value)}
                        placeholder="Tập đoàn ABC Corp"
                        className="w-full text-xs rounded-xl border border-slate-200 bg-white py-2.5 px-3 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Lĩnh Vực Cần Tư Vấn
                    </label>
                    <select
                      value={contactService}
                      onChange={(e) => setContactService(e.target.value)}
                      className="w-full text-xs rounded-xl border border-slate-200 bg-white py-2.5 px-3 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                      <option value="Software Engineering">Phát Triển Phần Mềm Doanh Nghiệp (Custom Software)</option>
                      <option value="Cloud Migration">Hiện Đại Hóa & Chuyển Đổi Cloud (AWS/Azure/K8s)</option>
                      <option value="Automation QA">Kiểm Thử Tự Động & Đảm Bảo Chất Lượng (QA/QC)</option>
                      <option value="UI/UX Engineering">Thiết Kế Sản Phẩm & UI/UX Design System</option>
                      <option value="Dedicated Team">Đội Ngũ Kỹ Sư Chuyên Dụng (Dedicated Dev Team)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Nội Dung Yêu Cầu / Mô Tả Bài Toán
                    </label>
                    <textarea
                      rows={3}
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      placeholder="Mô tả sơ lược về quy mô dự án, công nghệ kỳ vọng hoặc thời gian mong muốn triển khai..."
                      className="w-full text-xs rounded-xl border border-slate-200 bg-white py-2 px-3 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 px-6 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>Gửi Yêu Cầu Tư Vấn Giải Pháp</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 8. Professional Footer */}
      <footer className="border-t border-slate-200 bg-white py-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold">
                <Code2 className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <span className="font-bold text-base text-slate-900 tracking-tight">RecoverX</span>
                <span className="block text-[10px] text-slate-400 font-semibold">Technology Solutions Co., Ltd.</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-slate-600">
              <a href="#about" className="hover:text-brand-600 transition-colors">Về Chúng Tôi</a>
              <a href="#solutions" className="hover:text-brand-600 transition-colors">Dịch Vụ & Giải Pháp</a>
              <Link href="/jobs" className="hover:text-brand-600 transition-colors">Cơ Hội Việc Làm</Link>
              <Link href="/jobs/tracker" className="hover:text-brand-600 transition-colors">Tra Cứu Hồ Sơ</Link>
              <a href="#contact" className="hover:text-brand-600 transition-colors">Liên Hệ Doanh Nghiệp</a>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left text-[11px] text-slate-400">
            <p>&copy; 2026 RecoverX Technology Solutions Co., Ltd. Bảo lưu mọi quyền.</p>
            <p>Trụ sở chính: Tầng 18, RecoverX Innovation Tower, Quận 1, TP. Hồ Chí Minh &bull; Thụy Sĩ &bull; Singapore</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
