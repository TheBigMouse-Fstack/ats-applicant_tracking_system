"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { SessionUser } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n";
import { ChevronDown, Check } from "lucide-react";

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

  const roleLabels: Record<string, { label: string; textClass: string }> = {
    ADMIN: {
      label: t("userMenu.roleAdmin", "Quản trị viên"),
      textClass: "text-brand-600",
    },
    HR: {
      label: t("userMenu.roleHr", "Chuyên viên HR"),
      textClass: "text-zinc-700",
    },
    HIRING_MANAGER: {
      label: t("userMenu.roleManager", "Hiring Manager"),
      textClass: "text-zinc-700",
    },
  };

  const roleConfig = roleLabels[user.role] || {
    label: user.role,
    textClass: "text-zinc-600",
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger: Avatar-free clean text trigger */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-1.5 py-1.5 px-2 rounded-md hover:bg-zinc-100 transition-colors cursor-pointer"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <span className="text-sm font-medium text-zinc-900 whitespace-nowrap max-w-[160px] truncate">
          {user.fullName}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-150 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-64 bg-white rounded-lg shadow-lg border border-zinc-200 py-1.5 z-50">
          {/* Account Summary */}
          <div className="px-4 py-2.5 border-b border-zinc-100">
            <p className="font-semibold text-sm text-zinc-900 truncate" title={user.fullName}>
              {user.fullName}
            </p>
            <p className="text-xs text-zinc-500 truncate mt-0.5" title={user.email}>
              {user.email}
            </p>
            <p className={`text-xs font-medium mt-1 ${roleConfig.textClass}`}>
              {roleConfig.label}
            </p>
          </div>

          {/* Language Switch */}
          <div className="px-4 py-2.5 border-b border-zinc-100">
            <p className="text-xs text-zinc-400 mb-1.5">{t("userMenu.language", "Ngôn ngữ")}</p>
            <div className="grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={() => setLocale("vi")}
                className={`flex items-center justify-center gap-1 py-1 rounded text-xs transition-colors cursor-pointer ${
                  locale === "vi"
                    ? "bg-zinc-100 text-zinc-900 font-semibold"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                <span>Tiếng Việt</span>
                {locale === "vi" && <Check className="w-3 h-3 text-brand-600" />}
              </button>
              <button
                type="button"
                onClick={() => setLocale("en")}
                className={`flex items-center justify-center gap-1 py-1 rounded text-xs transition-colors cursor-pointer ${
                  locale === "en"
                    ? "bg-zinc-100 text-zinc-900 font-semibold"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                <span>English</span>
                {locale === "en" && <Check className="w-3 h-3 text-brand-600" />}
              </button>
            </div>
          </div>

          {/* Settings Link (Personal Info & Password Change) */}
          <div className="py-1 border-b border-zinc-100">
            <Link
              href="/admin/settings"
              onClick={() => setIsOpen(false)}
              className="block px-4 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
            >
              {locale === "en" ? "Account Settings & Password" : "Cài đặt tài khoản & Đổi mật khẩu"}
            </Link>
          </div>

          {/* Logout */}
          <div className="py-1">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
              className="w-full text-left px-4 py-2 text-xs font-medium text-brand-600 hover:bg-zinc-50 transition-colors cursor-pointer"
            >
              {t("userMenu.logout", "Đăng xuất")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
