"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Loader2,
  Sparkles,
  UserCheck,
  ShieldCheck,
  Users,
} from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [quickLoadingRole, setQuickLoadingRole] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState("");
  const [errorField, setErrorField] = useState<"email" | "password" | "">("");
  const [fieldMessage, setFieldMessage] = useState("");

  const submitLogin = async (loginEmail: string, loginPass: string) => {
    setGeneralError("");
    setErrorField("");
    setFieldMessage("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPass }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        if (data.field) {
          setErrorField(data.field);
          setFieldMessage(data.error);
        } else {
          setGeneralError(data.error || "Đăng nhập thất bại");
        }
        return;
      }

      const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
      const redirectTarget = params?.get("from") || "/admin/dashboard";
      router.push(redirectTarget);
      router.refresh();
    } catch {
      setGeneralError("Không thể kết nối đến máy chủ. Vui lòng thử lại.");
    } finally {
      setLoading(false);
      setQuickLoadingRole(null);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitLogin(email, password);
  };

  const handleQuickLogin = async (roleName: string, roleEmail: string, rolePass: string) => {
    setQuickLoadingRole(roleName);
    setEmail(roleEmail);
    setPassword(rolePass);
    await submitLogin(roleEmail, rolePass);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-10 sm:px-6 lg:px-8">
      {/* Brand & Heading */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center gap-2.5 mb-3">
          <div className="w-11 h-11 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm">
            <Briefcase className="w-5 h-5" />
          </div>
          <span className="text-2xl font-bold text-slate-900 tracking-tight">
            ATS
          </span>
        </div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Applicant Tracking System
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Cổng Đăng Nhập Hệ Thống Tuyển Dụng Nội Bộ
        </p>
      </div>

      {/* Main Container */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md space-y-4">
        {/* Quick Demo Login Card (Dành cho Reviewer & Tech Senior) */}
        <div className="bg-gradient-to-br from-indigo-50/80 via-white to-sky-50/80 p-5 rounded-2xl border border-indigo-100/90 shadow-2xs">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">
                Thử Nghiệm Nhanh 1-Chạm (Dành cho Reviewer / Senior)
              </h3>
              <p className="text-[11px] text-slate-500">
                Bấm vào vai trò để đăng nhập ngay mà không cần nhập mật khẩu:
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 pt-1">
            {/* 1. HR Lead */}
            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuickLogin("HR", "hr@ats.vn", "Hr@123456")}
              className="flex items-center justify-between p-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/90 hover:border-indigo-300 text-left transition-all group disabled:opacity-60 cursor-pointer shadow-2xs"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900">HR Lead</span>
                    <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      Sàng Lọc Đầu Phễu
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">
                    Quản lý New ➔ Screening, chỉnh sửa CV, Talent Pool
                  </p>
                </div>
              </div>
              {quickLoadingRole === "HR" ? (
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600 shrink-0" />
              ) : (
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all shrink-0" />
              )}
            </button>

            {/* 2. Hiring Manager */}
            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuickLogin("MANAGER", "manager@ats.vn", "Manager@123456")}
              className="flex items-center justify-between p-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/90 hover:border-purple-300 text-left transition-all group disabled:opacity-60 cursor-pointer shadow-2xs"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Users className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900">Hiring Manager</span>
                    <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 border border-purple-200">
                      Phỏng Vấn & Đánh Giá
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">
                    Lên lịch Meet, chấm Scorecard, duyệt Hired hoặc Rejected
                  </p>
                </div>
              </div>
              {quickLoadingRole === "MANAGER" ? (
                <Loader2 className="w-4 h-4 animate-spin text-purple-600 shrink-0" />
              ) : (
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all shrink-0" />
              )}
            </button>

            {/* 3. Admin */}
            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuickLogin("ADMIN", "admin@ats.vn", "Admin@123456")}
              className="flex items-center justify-between p-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/90 hover:border-rose-300 text-left transition-all group disabled:opacity-60 cursor-pointer shadow-2xs"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900">Quản Trị Viên (Admin)</span>
                    <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-200">
                      Toàn Quyền
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">
                    Xem 360 độ Dashboard, quản lý User & Audit Trail
                  </p>
                </div>
              </div>
              {quickLoadingRole === "ADMIN" ? (
                <Loader2 className="w-4 h-4 animate-spin text-rose-600 shrink-0" />
              ) : (
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-rose-600 group-hover:translate-x-0.5 transition-all shrink-0" />
              )}
            </button>
          </div>
        </div>

        {/* Standard Login Card */}
        <div className="bg-white py-6 px-6 shadow-sm sm:rounded-2xl sm:px-8 border border-slate-200">
          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-2.5 text-slate-400 font-medium">
                Hoặc nhập tài khoản thủ công
              </span>
            </div>
          </div>

          {/* Lỗi chung nếu có */}
          {generalError && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{generalError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Trường Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email tài khoản <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div
                  className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none ${
                    errorField === "email" ? "text-red-400" : "text-slate-400"
                  }`}
                >
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorField === "email") {
                      setErrorField("");
                      setFieldMessage("");
                    }
                  }}
                  placeholder="admin@ats.vn hoặc hr@ats.vn"
                  className={`w-full pl-10 pr-3.5 py-2 border rounded-xl text-sm transition-all text-slate-900 ${
                    errorField === "email"
                      ? "border-red-500 bg-red-50/20 text-red-900 placeholder:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                      : "border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 placeholder:text-slate-400"
                  }`}
                />
              </div>
              {errorField === "email" && (
                <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fieldMessage}</span>
                </p>
              )}
            </div>

            {/* Trường Mật khẩu */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Mật khẩu <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div
                  className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none ${
                    errorField === "password" ? "text-red-400" : "text-slate-400"
                  }`}
                >
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorField === "password") {
                      setErrorField("");
                      setFieldMessage("");
                    }
                  }}
                  placeholder="Nhập mật khẩu của bạn"
                  className={`w-full pl-10 pr-3.5 py-2 border rounded-xl text-sm transition-all text-slate-900 ${
                    errorField === "password"
                      ? "border-red-500 bg-red-50/20 text-red-900 placeholder:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                      : "border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 placeholder:text-slate-400"
                  }`}
                />
              </div>
              {errorField === "password" && (
                <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fieldMessage}</span>
                </p>
              )}
            </div>

            {/* Nút Đăng nhập */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-semibold text-sm shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/20"
            >
              {loading && !quickLoadingRole ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang xác thực...</span>
                </>
              ) : (
                <>
                  <span>Đăng nhập hệ thống</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] text-slate-400">
          Chỉ dành riêng cho nhân sự được phân quyền truy cập hệ thống ATS nội bộ
        </p>
      </div>
    </div>
  );
}
