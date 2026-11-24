"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import {
  Sparkles,
  UserCheck,
  Users,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Loader2,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import { UserRole } from "@/types";

interface DemoRoleBarProps {
  currentRole?: UserRole;
  currentUser?: string;
}

export default function DemoRoleBar({ currentRole, currentUser }: DemoRoleBarProps) {
  const pathname = usePathname();
  const [minimized, setMinimized] = useState(true);
  const [switching, setSwitching] = useState<string | null>(null);

  // Không hiển thị trên màn hình login
  if (pathname === "/admin/login" || !currentRole) {
    return null;
  }

  const handleSwitchRole = async (targetRole: string, email: string, pass: string) => {
    if (switching) return;
    setSwitching(targetRole);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pass }),
      });
      if (res.ok) {
        window.location.reload();
      }
    } catch (e) {
      console.error("Error switching role:", e);
    } finally {
      setSwitching(null);
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case "HR":
        return {
          label: "HR Lead (Sàng Lọc)",
          color: "bg-blue-50 text-blue-700 border-blue-200",
          dot: "bg-blue-500",
        };
      case "HIRING_MANAGER":
        return {
          label: "Hiring Manager (Phỏng Vấn & Đánh Giá)",
          color: "bg-purple-50 text-purple-700 border-purple-200",
          dot: "bg-purple-500",
        };
      case "ADMIN":
        return {
          label: "Admin (Toàn Quyền Quản Trị)",
          color: "bg-rose-50 text-rose-700 border-rose-200",
          dot: "bg-rose-500",
        };
      default:
        return {
          label: role,
          color: "bg-slate-100 text-slate-700 border-slate-200",
          dot: "bg-slate-400",
        };
    }
  };

  const currentBadge = getRoleBadge(currentRole);

  if (minimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-2">
        <button
          onClick={() => setMinimized(false)}
          className="flex items-center gap-2 px-3 py-2 rounded-full bg-slate-900 text-white shadow-lg hover:bg-slate-800 transition-all text-xs font-semibold cursor-pointer border border-slate-700 hover:scale-105 active:scale-95"
          title="Mở thanh điều hướng Demo Role"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Demo Role Switcher</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 max-w-4xl w-[95%] sm:w-auto animate-in fade-in slide-in-from-bottom-3">
      <div className="bg-slate-900/95 backdrop-blur-md text-white rounded-2xl p-2.5 px-4 shadow-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Vai trò hiện tại */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400">Đang đóng vai:</span>
              <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] border ${currentBadge.color}`}>
                {currentBadge.label}
              </span>
            </div>
          </div>
        </div>

        {/* Nút chuyển đổi vai trò nhanh 1-chạm */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[11px] text-slate-400 hidden md:inline">Đổi vai trò:</span>

          {/* 1. HR */}
          <button
            type="button"
            disabled={currentRole === "HR" || !!switching}
            onClick={() => handleSwitchRole("HR", "hr@ats.vn", "Hr@123456")}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition-all cursor-pointer ${
              currentRole === "HR"
                ? "bg-blue-600 text-white shadow-xs cursor-default"
                : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 disabled:opacity-50"
            }`}
          >
            {switching === "HR" ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <UserCheck className="w-3 h-3 text-blue-400" />
            )}
            <span>HR Lead</span>
          </button>

          {/* 2. Hiring Manager */}
          <button
            type="button"
            disabled={currentRole === "HIRING_MANAGER" || !!switching}
            onClick={() => handleSwitchRole("MANAGER", "manager@ats.vn", "Manager@123456")}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition-all cursor-pointer ${
              currentRole === "HIRING_MANAGER"
                ? "bg-purple-600 text-white shadow-xs cursor-default"
                : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 disabled:opacity-50"
            }`}
          >
            {switching === "MANAGER" ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Users className="w-3 h-3 text-purple-400" />
            )}
            <span>Hiring Manager</span>
          </button>

          {/* 3. Admin */}
          <button
            type="button"
            disabled={currentRole === "ADMIN" || !!switching}
            onClick={() => handleSwitchRole("ADMIN", "admin@ats.vn", "Admin@123456")}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition-all cursor-pointer ${
              currentRole === "ADMIN"
                ? "bg-rose-600 text-white shadow-xs cursor-default"
                : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 disabled:opacity-50"
            }`}
          >
            {switching === "ADMIN" ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <ShieldCheck className="w-3 h-3 text-rose-400" />
            )}
            <span>Admin</span>
          </button>
        </div>

        {/* Thông số chất lượng & Nút thu gọn */}
        <div className="flex items-center gap-2 shrink-0 border-l border-slate-800 pl-3">
          <div className="hidden lg:flex items-center gap-1 text-[11px] font-bold text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>162/162 Tests Pass</span>
          </div>

          <button
            type="button"
            onClick={() => setMinimized(true)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Thu nhỏ thanh điều hướng"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
