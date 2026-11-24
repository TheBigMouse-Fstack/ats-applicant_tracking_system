"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SessionUser } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n";
import { useSession } from "@/contexts/SessionContext";
import BrandLogo from "@/components/common/BrandLogo";
import UserMenu from "./UserMenu";

interface AdminNavbarProps {
  initialUser?: SessionUser | null;
}

export default function AdminNavbar({ initialUser = null }: AdminNavbarProps) {
  const pathname = usePathname();
  const { user: sessionUser, logout } = useSession();
  const { t } = useLanguage();

  // Prefer live context user, fall back immediately to server-rendered initialUser (zero skeleton flash)
  const currentUser = sessionUser || initialUser;

  if (pathname === "/admin/login") {
    return null;
  }

  if (!currentUser) {
    return (
      <header className="h-14 bg-white border-b border-zinc-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          <BrandLogo variant="internal" size="sm" />
        </div>
      </header>
    );
  }

  const handleLogout = async () => {
    await logout();
  };

  const navLinks = [
    { href: "/admin/dashboard", label: t("nav.dashboard", "Tổng quan") },
    { href: "/admin/pipeline", label: t("nav.pipeline", "Pipeline") },
    { href: "/admin/candidates", label: t("nav.candidates", "Ứng viên") },
    { href: "/admin/jobs", label: t("nav.jobs", "Tin tuyển dụng") },
    { href: "/admin/talent-pool", label: t("nav.talentPool", "Kho nhân tài"), hideForManager: true },
    { href: "/admin/users", label: t("nav.users", "Người dùng"), adminOnly: true },
  ];

  return (
    <header className="bg-white border-b border-zinc-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo & Underline Navigation */}
          <div className="flex items-center gap-8 h-full">
            <Link
              href="/admin/dashboard"
              className="shrink-0"
              aria-label="ATS — Applicant Tracking System"
              title="ATS — Applicant Tracking System"
            >
              <BrandLogo variant="internal" size="sm" />
            </Link>

            <nav className="hidden md:flex items-center gap-6 h-full" aria-label="Điều hướng chính">
              {navLinks.map((link) => {
                const isActive = pathname.startsWith(link.href);
                if (link.adminOnly && currentUser.role !== "ADMIN") return null;
                if (link.hideForManager && currentUser.role === "HIRING_MANAGER") return null;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`h-full inline-flex items-center text-sm whitespace-nowrap border-b-2 transition-colors ${
                      isActive
                        ? "border-brand-600 text-zinc-900 font-semibold"
                        : "border-transparent text-zinc-500 hover:text-zinc-900 font-medium"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Actions: Public Portal text link + Avatar-free UserMenu */}
          <div className="flex items-center gap-5">
            <Link
              href="/jobs"
              target="_blank"
              className="hidden sm:inline-block text-xs font-medium text-zinc-500 hover:text-brand-600 transition-colors whitespace-nowrap"
            >
              {t("public.jobs", "Trang tuyển dụng")}
            </Link>
            <UserMenu user={currentUser} onLogout={handleLogout} />
          </div>
        </div>

        {/* Mobile Navigation Strip */}
        <nav className="flex md:hidden items-center gap-5 overflow-x-auto -mb-px">
          {navLinks.map((link) => {
            const isActive = pathname.startsWith(link.href);
            if (link.adminOnly && currentUser.role !== "ADMIN") return null;
            if (link.hideForManager && currentUser.role === "HIRING_MANAGER") return null;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`py-2.5 text-xs whitespace-nowrap border-b-2 transition-colors ${
                  isActive
                    ? "border-brand-600 text-zinc-900 font-semibold"
                    : "border-transparent text-zinc-500 font-medium"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
