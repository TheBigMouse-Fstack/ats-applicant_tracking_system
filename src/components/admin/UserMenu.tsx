"use client";

import { useState, useRef, useEffect } from "react";
import { SessionUser } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n";
import {
  LogOut,
  ChevronDown,
  Globe,
  Settings,
  Shield,
  Briefcase,
  UserCheck,
  Check,
} from "lucide-react";

interface UserMenuProps {
  user: SessionUser;
  onLogout: () => Promise<void> | void;
}

export function getInitials(name: string): string {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function UserMenu({ user, onLogout }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { locale, setLocale, t } = useLanguage();

  // Đóng dropdown khi click ra ngoài hoặc bấm Escape
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const initials = getInitials(user.fullName);

  // Nhãn vai trò & màu sắc chuẩn Enterprise
  const roleMap: Record<
    string,
    {
      label: string;
      badge: string;
      dot: string;
      icon: any;
    }
  > = {
    ADMIN: {
      label: t("userMenu.roleAdmin", "Quản Trị Viên"),
      badge: "bg-emerald-50 text-emerald-800 border-emerald-200",
      dot: "bg-emerald-500",
      icon: Shield,
    },
    HR: {
      label: t("userMenu.roleHr", "Chuyên Viên Tuyển Dụng"),
      badge: "bg-blue-50 text-blue-800 border-blue-200",
      dot: "bg-blue-500",
      icon: UserCheck,
    },
    HR_MANAGER: {
      label: t("userMenu.roleHr", "Trưởng Phòng Tuyển Dụng"),
      badge: "bg-blue-50 text-blue-800 border-blue-200",
      dot: "bg-blue-500",
      icon: UserCheck,
    },
    HIRING_MANAGER: {
      label: t("userMenu.roleManager", "Quản Lý Chuyên Môn"),
      badge: "bg-purple-50 text-purple-800 border-purple-200",
      dot: "bg-purple-500",
      icon: Briefcase,
    },
    INTERVIEWER: {
      label: t("userMenu.roleManager", "Hội Đồng Phỏng Vấn"),
      badge: "bg-purple-50 text-purple-800 border-purple-200",
      dot: "bg-purple-500",
      icon: Briefcase,
    },
  };

  const roleConfig = roleMap[user.role] || {
    label: user.role,
    badge: "bg-slate-50 text-slate-700 border-slate-200",
    dot: "bg-slate-400",
    icon: Briefcase,
  };

  const RoleIcon = roleConfig.icon;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Nút Avatar Kích thước Cố định — Tránh tuyệt đối tình trạng Tên Dài Bị Đè Nút */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-full border border-slate-200/90 hover:border-brand-300 hover:bg-slate-50 transition-all cursor-pointer group focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        title={`${user.fullName} (${roleConfig.label})`}
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs group-hover:scale-105 transition-transform">
          {initials}
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Menu Thả Xuống (Dropdown Popover) */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-2xl border border-slate-200/90 py-2.5 z-50 animate-in fade-in zoom-in-95 duration-150">
          {/* Header: Thông tin Người Dùng & Vai Trò */}
          <div className="px-4 py-3 border-b border-slate-100">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm text-slate-900 truncate" title={user.fullName}>
                  {user.fullName}
                </p>
                <p className="text-xs text-slate-500 truncate mt-0.5" title={user.email}>
                  {user.email}
                </p>
                <div className="mt-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${roleConfig.badge}`}
                  >
                    <RoleIcon className="w-3 h-3 shrink-0" />
                    <span>{roleConfig.label}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Chuyển đổi Ngôn ngữ (VI • EN) ngay bên trong Avatar */}
          <div className="px-4 py-3 border-b border-slate-100">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-slate-600 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                <span>{t("userMenu.language", "Ngôn ngữ")}</span>
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                {locale === "vi" ? "Tiếng Việt" : "English"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200/80">
              <button
                type="button"
                onClick={() => setLocale("vi")}
                className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  locale === "vi"
                    ? "bg-white text-brand-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>Tiếng Việt</span>
                {locale === "vi" && <Check className="w-3 h-3 text-brand-600" />}
              </button>

              <button
                type="button"
                onClick={() => setLocale("en")}
                className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  locale === "en"
                    ? "bg-white text-brand-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>English</span>
                {locale === "en" && <Check className="w-3 h-3 text-brand-600" />}
              </button>
            </div>
          </div>

          {/* Section: Cài đặt hệ thống / Phiên bản */}
          <div className="px-2 py-1.5 border-b border-slate-100">
            <div className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-2">
                <Settings className="w-3.5 h-3.5 text-slate-400" />
                <span>{t("userMenu.settings", "Cài đặt & Giao diện")}</span>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                v2.6 Enterprise
              </span>
            </div>
          </div>

          {/* Action: Đăng Xuất */}
          <div className="p-1.5">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-rose-500" />
              <span>{t("userMenu.logout", "Đăng xuất tài khoản")}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
