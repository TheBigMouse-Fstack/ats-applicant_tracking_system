"use client";

import { useState } from "react";
import { useSession } from "@/contexts/SessionContext";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Quản trị viên (Admin)",
  HR: "Chuyên viên tuyển dụng (HR)",
  HIRING_MANAGER: "Quản lý chuyên môn (Hiring Manager)",
};

export default function AdminSettingsPage() {
  const { user } = useSession();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorField, setErrorField] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorField("");
    setErrorMessage("");
    setSuccessMessage("");

    if (newPassword.length < 8) {
      setErrorField("newPassword");
      setErrorMessage("Mật khẩu mới phải có ít nhất 8 ký tự.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorField("confirmPassword");
      setErrorMessage("Xác nhận mật khẩu mới không khớp.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        if (data.field) setErrorField(data.field);
        setErrorMessage(data.error || "Không thể đổi mật khẩu.");
        return;
      }

      setSuccessMessage("Đổi mật khẩu thành công.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setErrorMessage("Lỗi kết nối máy chủ. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">Cài đặt tài khoản</h1>
      </div>

      {/* Personal Information */}
      <section className="bg-white rounded-lg border border-zinc-200">
        <div className="px-6 py-4 border-b border-zinc-100">
          <h2 className="text-sm font-semibold text-zinc-900">Thông tin cá nhân</h2>
        </div>
        <dl className="divide-y divide-zinc-100 text-sm">
          <div className="px-6 py-3.5 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <dt className="text-zinc-500">Họ và tên</dt>
            <dd className="sm:col-span-2 font-medium text-zinc-900">{user?.fullName || "—"}</dd>
          </div>
          <div className="px-6 py-3.5 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <dt className="text-zinc-500">Email</dt>
            <dd className="sm:col-span-2 text-zinc-900">{user?.email || "—"}</dd>
          </div>
          <div className="px-6 py-3.5 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <dt className="text-zinc-500">Vai trò</dt>
            <dd className="sm:col-span-2 font-medium text-brand-600">
              {user?.role ? ROLE_LABELS[user.role] || user.role : "—"}
            </dd>
          </div>
          <div className="px-6 py-3.5 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <dt className="text-zinc-500">Trạng thái</dt>
            <dd className="sm:col-span-2 font-medium text-emerald-700">Đang hoạt động</dd>
          </div>
        </dl>
      </section>

      {/* Change Password */}
      <section className="bg-white rounded-lg border border-zinc-200">
        <div className="px-6 py-4 border-b border-zinc-100">
          <h2 className="text-sm font-semibold text-zinc-900">Đổi mật khẩu</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-w-md">
          {successMessage && (
            <div className="p-3 rounded-md bg-emerald-50 flex items-center gap-2 text-xs font-medium text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && !errorField && (
            <div className="p-3 rounded-md bg-red-50 flex items-center gap-2 text-xs font-medium text-red-700">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1.5">
              Mật khẩu hiện tại
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => {
                setCurrentPassword(e.target.value);
                if (errorField === "currentPassword") {
                  setErrorField("");
                  setErrorMessage("");
                }
              }}
              className={`w-full px-3 py-2 border rounded-md text-sm text-zinc-900 transition-colors ${
                errorField === "currentPassword"
                  ? "border-red-500 focus:outline-none focus:border-red-600"
                  : "border-zinc-300 focus:outline-none focus:border-zinc-900"
              }`}
            />
            {errorField === "currentPassword" && (
              <p className="text-xs text-red-600 mt-1">{errorMessage}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1.5">
              Mật khẩu mới (tối thiểu 8 ký tự)
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                if (errorField === "newPassword") {
                  setErrorField("");
                  setErrorMessage("");
                }
              }}
              className={`w-full px-3 py-2 border rounded-md text-sm text-zinc-900 transition-colors ${
                errorField === "newPassword"
                  ? "border-red-500 focus:outline-none focus:border-red-600"
                  : "border-zinc-300 focus:outline-none focus:border-zinc-900"
              }`}
            />
            {errorField === "newPassword" && (
              <p className="text-xs text-red-600 mt-1">{errorMessage}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1.5">
              Xác nhận mật khẩu mới
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (errorField === "confirmPassword") {
                  setErrorField("");
                  setErrorMessage("");
                }
              }}
              className={`w-full px-3 py-2 border rounded-md text-sm text-zinc-900 transition-colors ${
                errorField === "confirmPassword"
                  ? "border-red-500 focus:outline-none focus:border-red-600"
                  : "border-zinc-300 focus:outline-none focus:border-zinc-900"
              }`}
            />
            {errorField === "confirmPassword" && (
              <p className="text-xs text-red-600 mt-1">{errorMessage}</p>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer whitespace-nowrap"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Cập nhật mật khẩu</span>
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
