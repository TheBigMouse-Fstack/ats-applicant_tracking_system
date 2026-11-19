"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  Kanban,
  Users,
  Database,
  UserCheck,
} from "lucide-react";
import { SessionUser } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n";
import { useSession } from "@/contexts/SessionContext";
import UserMenu from "./UserMenu";

interface AdminNavbarProps {
  initialUser?: SessionUser | null;
}

export default function AdminNavbar({ initialUser = null }: AdminNavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user: currentUser, logout } = useSession();
  const { t } = useLanguage();

  // Tuyệt đối không hiển thị Navbar trên trang Login
  if (pathname === "/admin/login") {
    return null;
  }

  // Nếu chưa có phiên xác thực, hiển thị thanh tải tinh gọn tránh Flash giao diện nội bộ
  if (!currentUser) {
    return (
      <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 animate-pulse">
        <div className="h-6 w-36 bg-slate-200 rounded-md" />
        <div className="h-8 w-24 bg-slate-200 rounded-lg" />
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
  };

  const navLinks = [
    { href: "/admin/dashboard", label: t("nav.dashboard", "Tổng quan"), icon: LayoutDashboard },
    { href: "/admin/pipeline", label: t("nav.pipeline", "Pipeline"), icon: Kanban },
    { href: "/admin/candidates", label: t("nav.candidates", "Ứng viên"), icon: UserCheck },
    { href: "/admin/jobs", label: t("nav.jobs", "Tin tuyển dụng"), icon: Briefcase },
    { href: "/admin/talent-pool", label: t("nav.talentPool", "Kho nhân tài"), icon: Database, hideForManager: true },
    { href: "/admin/users", label: t("nav.users", "Người dùng"), icon: Users, adminOnly: true },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Navigation */}
          <div className="flex items-center gap-6">
            <Link href="/admin/dashboard" className="flex items-center gap-2.5 shrink-0">
              <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-sm shadow-brand-500/30">
                <Briefcase className="w-5 h-5" />
              </div>
              <div className="leading-tight">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-base text-slate-900 tracking-tight">ATS</span>
                  <span className="text-[10px] font-semibold text-brand-700 px-1.5 py-0.5 bg-brand-50 border border-brand-100 rounded">
                    Internal
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium hidden sm:block">
                  Applicant Tracking System
                </p>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname.startsWith(link.href);
                // Ẩn tab User nếu không phải Admin
                if (link.adminOnly && currentUser?.role !== "ADMIN") return null;
                // Ẩn tab Kho nhân tài nếu là Hiring Manager (theo RBAC-NFR-08)
                if (link.hideForManager && currentUser?.role === "HIRING_MANAGER") return null;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? "bg-brand-50 text-brand-700 font-semibold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="whitespace-nowrap">{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* User Profile Avatar Menu (Gọn gàng, chuẩn Enterprise, không bị đè nút) */}
          <div className="flex items-center gap-3">
            {currentUser && (
              <UserMenu user={currentUser} onLogout={handleLogout} />
            )}
          </div>
        </div>

        {/* Mobile Navigation Strip */}
        <nav className="flex md:hidden items-center gap-1 overflow-x-auto pb-2.5 -mx-1 px-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname.startsWith(link.href);
            if (link.adminOnly && currentUser?.role !== "ADMIN") return null;
            if (link.hideForManager && currentUser?.role === "HIRING_MANAGER") return null;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-all ${
                  isActive
                    ? "bg-brand-50 text-brand-700 font-semibold"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}