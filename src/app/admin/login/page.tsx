"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, ArrowRight, Loader2 } from "lucide-react";
import { useSession } from "@/contexts/SessionContext";
import BrandLogo from "@/components/common/BrandLogo";

export default function AdminLoginPage() {
  const router = useRouter();
  const { setUser } = useSession();
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

      // Sync session context immediately so AdminNavbar renders without skeleton delay
      if (data.user) {
        setUser(data.user);
      }

      const params =
        typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
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
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md space-y-6">
        {/* Brand */}
        <div className="flex flex-col items-center text-center gap-2">
          <Link href="/" className="hover:opacity-85 transition-opacity" aria-label="ATS — Applicant Tracking System">
            <BrandLogo variant="internal" size="md" />
          </Link>
          <p className="text-xs text-zinc-500">Applicant Tracking System</p>
        </div>

        {/* Main Card */}
        <div className="bg-white p-6 sm:p-8 rounded-lg border border-zinc-200 space-y-6">
          {/* Quick 1-click Demo Access */}
          <div className="space-y-2.5">
            <p className="text-xs font-medium text-zinc-500">Đăng nhập nhanh theo vai trò</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleQuickLogin("HR", "hr@ats.vn", "Hr@123456")}
                className="px-3 py-2 rounded-md border border-zinc-200 hover:border-zinc-900 bg-white text-xs font-medium text-zinc-800 transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
              >
                {quickLoadingRole === "HR" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto text-brand-600" />
                ) : (
                  "HR Lead"
                )}
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleQuickLogin("MANAGER", "manager@ats.vn", "Manager@123456")}
                className="px-3 py-2 rounded-md border border-zinc-200 hover:border-zinc-900 bg-white text-xs font-medium text-zinc-800 transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
              >
                {quickLoadingRole === "MANAGER" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto text-brand-600" />
                ) : (
                  "Hiring Manager"
                )}
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleQuickLogin("ADMIN", "admin@ats.vn", "Admin@123456")}
                className="px-3 py-2 rounded-md border border-zinc-200 hover:border-brand-600 bg-white text-xs font-medium text-brand-600 transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
              >
                {quickLoadingRole === "ADMIN" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto text-brand-600" />
                ) : (
                  "Admin"
                )}
              </button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-2.5 text-zinc-400">hoặc đăng nhập thủ công</span>
            </div>
          </div>

          {generalError && (
            <div className="p-3 rounded-md bg-red-50 flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{generalError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1.5">Email</label>
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
                placeholder="hr@ats.vn"
                className={`w-full px-3 py-2 border rounded-md text-sm text-zinc-900 placeholder:text-zinc-400 transition-colors ${
                  errorField === "email"
                    ? "border-red-500 focus:outline-none focus:border-red-600"
                    : "border-zinc-300 focus:outline-none focus:border-zinc-900"
                }`}
              />
              {errorField === "email" && (
                <p className="text-xs text-red-600 mt-1">{fieldMessage}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1.5">Mật khẩu</label>
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
                placeholder="Nhập mật khẩu"
                className={`w-full px-3 py-2 border rounded-md text-sm text-zinc-900 placeholder:text-zinc-400 transition-colors ${
                  errorField === "password"
                    ? "border-red-500 focus:outline-none focus:border-red-600"
                    : "border-zinc-300 focus:outline-none focus:border-zinc-900"
                }`}
              />
              {errorField === "password" && (
                <p className="text-xs text-red-600 mt-1">{fieldMessage}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-md bg-brand-600 hover:bg-brand-700 text-white font-medium text-sm transition-colors disabled:opacity-60 cursor-pointer"
            >
              {loading && !quickLoadingRole ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang xác thực...</span>
                </>
              ) : (
                <>
                  <span>Đăng nhập</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="text-center">
          <Link href="/jobs" className="text-xs text-zinc-500 hover:text-zinc-900 transition-colors">
            ← Quay lại trang tuyển dụng
          </Link>
        </div>
      </div>
    </div>
  );
}
