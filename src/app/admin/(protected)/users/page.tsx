"use client";

import { useState, useEffect } from "react";
import { AlertCircle, X, Search, Loader2, CheckCircle2 } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";
import { useSession } from "@/contexts/SessionContext";
import { clientCache } from "@/lib/client-cache";

interface UserItem {
  id: number;
  fullName: string;
  email: string;
  phone?: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  _count?: {
    jobs: number;
    evaluations: number;
  };
}

export default function UserManagementPage() {
  const { t, locale } = useLanguage();
  const { user: currentUser } = useSession();
  const isEn = locale === "en";
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  // Create User Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("HR");
  const [submitting, setSubmitting] = useState(false);
  const [modalGeneralError, setModalGeneralError] = useState("");
  const [errorField, setErrorField] = useState<string>("");
  const [fieldErrorMsg, setFieldErrorMsg] = useState("");

  // Edit User Modal (Admin edits name, email, phone, role, or resets password)
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [editFullName, setEditFullName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editRole, setEditRole] = useState("HR");
  const [editNewPassword, setEditNewPassword] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editGeneralError, setEditGeneralError] = useState("");
  const [editErrorField, setEditErrorField] = useState<string>("");
  const [editFieldErrorMsg, setEditFieldErrorMsg] = useState("");

  const fetchUsers = async (isSilent = false) => {
    try {
      if (!isSilent) {
        setUsers((prev) => {
          if (!prev || prev.length === 0) setLoading(true);
          return prev;
        });
      }
      const res = await fetch("/api/users");
      const data = await res.json();
      if (data.success) {
        setUsers(data.data);
        clientCache.set("admin_users_list", data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const cached = clientCache.getStale<UserItem[]>("admin_users_list");
    if (cached && cached.length > 0) {
      setUsers(cached);
      setLoading(false);
      fetchUsers(true);
    } else {
      fetchUsers(false);
    }
  }, []);

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 4000);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalGeneralError("");
    setErrorField("");
    setFieldErrorMsg("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, phone, password, role }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        if (data.field) {
          setErrorField(data.field);
          setFieldErrorMsg(data.error);
        } else {
          setModalGeneralError(data.error || "Không thể tạo tài khoản");
        }
        return;
      }

      setIsModalOpen(false);
      setFullName("");
      setEmail("");
      setPhone("");
      setPassword("");
      setRole("HR");
      clientCache.invalidate("admin_users_list");
      fetchUsers(true);
      showNotice("Đã tạo tài khoản thành công.");
    } catch {
      setModalGeneralError("Lỗi kết nối máy chủ");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (u: UserItem) => {
    setEditingUser(u);
    setEditFullName(u.fullName);
    setEditEmail(u.email);
    setEditPhone(u.phone || "");
    setEditRole(u.role);
    setEditNewPassword("");
    setEditGeneralError("");
    setEditErrorField("");
    setEditFieldErrorMsg("");
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setEditGeneralError("");
    setEditErrorField("");
    setEditFieldErrorMsg("");

    if (editNewPassword && editNewPassword.length < 8) {
      setEditErrorField("newPassword");
      setEditFieldErrorMsg("Mật khẩu mới phải có ít nhất 8 ký tự.");
      return;
    }

    setEditSubmitting(true);
    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: editingUser.id,
          fullName: editFullName,
          email: editEmail,
          phone: editPhone,
          role: editRole,
          ...(editNewPassword ? { newPassword: editNewPassword } : {}),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        if (data.field) {
          setEditErrorField(data.field);
          setEditFieldErrorMsg(data.error);
        } else {
          setEditGeneralError(data.error || "Không thể cập nhật tài khoản");
        }
        return;
      }

      setEditingUser(null);
      clientCache.invalidate("admin_users_list");
      fetchUsers(true);
      showNotice(
        editNewPassword
          ? `Đã cập nhật thông tin và đặt lại mật khẩu cho ${editFullName}.`
          : `Đã cập nhật thông tin tài khoản ${editFullName}.`
      );
    } catch {
      setEditGeneralError("Lỗi kết nối máy chủ");
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleToggleActive = async (userId: number, currentActive: boolean) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, isActive: !currentActive } : u))
    );
    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, isActive: !currentActive }),
      });
      if (res.ok) {
        clientCache.invalidate("admin_users_list");
        fetchUsers(true);
      } else {
        fetchUsers(true);
      }
    } catch (e) {
      console.error(e);
      fetchUsers(true);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.phone || "").toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">
          {t("usersAdmin.title")}
        </h1>

        <button
          onClick={() => {
            setErrorField("");
            setFieldErrorMsg("");
            setModalGeneralError("");
            setIsModalOpen(true);
          }}
          className="inline-flex items-center px-4 py-2 rounded-md bg-brand-600 hover:bg-brand-700 text-white font-medium text-sm transition-colors self-start sm:self-auto cursor-pointer whitespace-nowrap"
        >
          {t("usersAdmin.createBtn")}
        </button>
      </div>

      {notice && (
        <div className="p-3 rounded-md bg-emerald-50 flex items-center justify-between gap-2 text-xs font-medium text-emerald-800">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            {notice}
          </span>
          <button onClick={() => setNotice(null)} className="text-emerald-600 hover:text-emerald-800 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-lg border border-zinc-200 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              isEn
                ? "Search by name, email, or phone..."
                : "Tìm theo tên, email, số điện thoại..."
            }
            className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-md text-sm focus:outline-none focus:border-zinc-900 text-zinc-900 placeholder:text-zinc-400"
          />
        </div>
        <div className="text-xs text-zinc-500 whitespace-nowrap">
          {isEn ? "Total:" : "Tổng:"}{" "}
          <strong className="text-zinc-900">{filteredUsers.length}</strong>{" "}
          {isEn ? "accounts" : "tài khoản"}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-zinc-500 text-sm">
            {isEn ? "Loading users..." : "Đang tải danh sách người dùng..."}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 text-sm">
            {isEn ? "No accounts found." : "Không tìm thấy tài khoản nào"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 text-xs font-medium">
                  <th className="py-3 px-4">{isEn ? "Member" : "Thành viên"}</th>
                  <th className="py-3 px-4">{isEn ? "Email & Phone" : "Email & SĐT"}</th>
                  <th className="py-3 px-4">{isEn ? "Role" : "Vai trò"}</th>
                  <th className="py-3 px-4">{isEn ? "Status" : "Trạng thái"}</th>
                  <th className="py-3 px-4 text-right">{isEn ? "Actions" : "Thao tác"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-zinc-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <p className="font-medium text-zinc-900 leading-tight">{user.fullName}</p>
                      <p className="text-xs text-zinc-400 mt-0.5">{formatDateTime(user.createdAt)}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="text-zinc-700 font-mono text-xs">{user.email}</p>
                      {user.phone && (
                        <p className="text-xs text-zinc-400 mt-0.5 tabular-nums">{user.phone}</p>
                      )}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {user.role === "ADMIN" && (
                        <span className="text-xs font-semibold text-brand-600">Admin</span>
                      )}
                      {user.role === "HR" && (
                        <span className="text-xs font-semibold text-zinc-800">HR Lead</span>
                      )}
                      {user.role === "HIRING_MANAGER" && (
                        <span className="text-xs font-semibold text-zinc-700">Hiring Manager</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {user.isActive ? (
                        <span className="text-xs font-medium text-emerald-700">
                          {isEn ? "Active" : "Đang hoạt động"}
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-zinc-400">
                          {isEn ? "Locked" : "Đã khóa"}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-4">
                        <button
                          onClick={() => handleOpenEdit(user)}
                          className="text-xs font-medium text-zinc-700 hover:text-zinc-900 transition-colors cursor-pointer whitespace-nowrap"
                        >
                          {isEn ? "Edit" : "Chỉnh sửa"}
                        </button>
                        <button
                          onClick={() => handleToggleActive(user.id, user.isActive)}
                          disabled={user.id === currentUser?.id}
                          title={
                            user.id === currentUser?.id
                              ? isEn
                                ? "You cannot lock your own account"
                                : "Không thể tự khóa tài khoản của chính mình"
                              : undefined
                          }
                          className={`text-xs font-medium transition-colors whitespace-nowrap ${
                            user.id === currentUser?.id
                              ? "text-zinc-300 cursor-not-allowed"
                              : user.isActive
                              ? "text-brand-600 hover:text-brand-700 cursor-pointer"
                              : "text-emerald-700 hover:text-emerald-800 cursor-pointer"
                          }`}
                        >
                          {user.isActive
                            ? isEn
                              ? "Lock"
                              : "Khóa"
                            : isEn
                            ? "Unlock"
                            : "Mở khóa"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Chỉnh Sửa Tài Khoản (Admin đổi tên, email, sđt, vai trò, mật khẩu) */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-zinc-900/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full shadow-xl border border-zinc-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
              <h3 className="font-semibold text-zinc-900 text-sm">
                {isEn ? "Edit Account" : "Chỉnh sửa tài khoản"}
              </h3>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1 rounded text-zinc-400 hover:text-zinc-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-4">
              {editGeneralError && (
                <div className="p-3 rounded-md bg-red-50 text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{editGeneralError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  {isEn ? "Full Name" : "Họ và tên"}
                </label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => {
                    setEditFullName(e.target.value);
                    if (editErrorField === "fullName") {
                      setEditErrorField("");
                      setEditFieldErrorMsg("");
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-md text-sm text-zinc-900 ${
                    editErrorField === "fullName"
                      ? "border-red-500 focus:outline-none"
                      : "border-zinc-300 focus:outline-none focus:border-zinc-900"
                  }`}
                />
                {editErrorField === "fullName" && (
                  <p className="text-xs text-red-600 mt-1">{editFieldErrorMsg}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => {
                    setEditEmail(e.target.value);
                    if (editErrorField === "email") {
                      setEditErrorField("");
                      setEditFieldErrorMsg("");
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-md text-sm text-zinc-900 ${
                    editErrorField === "email"
                      ? "border-red-500 focus:outline-none"
                      : "border-zinc-300 focus:outline-none focus:border-zinc-900"
                  }`}
                />
                {editErrorField === "email" && (
                  <p className="text-xs text-red-600 mt-1">{editFieldErrorMsg}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  {isEn ? "Phone Number" : "Số điện thoại"}
                </label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => {
                    setEditPhone(e.target.value);
                    if (editErrorField === "phone") {
                      setEditErrorField("");
                      setEditFieldErrorMsg("");
                    }
                  }}
                  placeholder="0901 234 567"
                  className={`w-full px-3 py-2 border rounded-md text-sm text-zinc-900 ${
                    editErrorField === "phone"
                      ? "border-red-500 focus:outline-none"
                      : "border-zinc-300 focus:outline-none focus:border-zinc-900"
                  }`}
                />
                {editErrorField === "phone" && (
                  <p className="text-xs text-red-600 mt-1">{editFieldErrorMsg}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  {isEn ? "Role" : "Vai trò"}
                </label>
                <select
                  value={editRole}
                  disabled={editingUser?.id === currentUser?.id}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm focus:outline-none focus:border-zinc-900 bg-white text-zinc-900 disabled:bg-zinc-100 disabled:text-zinc-500 disabled:cursor-not-allowed"
                >
                  <option value="HR">HR Lead</option>
                  <option value="HIRING_MANAGER">Hiring Manager</option>
                  <option value="ADMIN">Admin</option>
                </select>
                {editingUser?.id === currentUser?.id && (
                  <p className="text-[11px] text-zinc-500 mt-1">
                    {isEn
                      ? "You cannot downgrade your own Administrator role."
                      : "Bạn không thể tự hạ quyền Quản trị viên của chính mình."}
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-zinc-100">
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  {isEn ? "Reset Password (optional)" : "Đặt lại mật khẩu mới (tuỳ chọn)"}
                </label>
                <input
                  type="password"
                  value={editNewPassword}
                  onChange={(e) => {
                    setEditNewPassword(e.target.value);
                    if (editErrorField === "newPassword") {
                      setEditErrorField("");
                      setEditFieldErrorMsg("");
                    }
                  }}
                  placeholder={
                    isEn
                      ? "Leave blank to keep current password (min 8 chars)"
                      : "Để trống nếu giữ mật khẩu cũ (tối thiểu 8 ký tự)"
                  }
                  className={`w-full px-3 py-2 border rounded-md text-sm text-zinc-900 ${
                    editErrorField === "newPassword"
                      ? "border-red-500 focus:outline-none"
                      : "border-zinc-300 focus:outline-none focus:border-zinc-900"
                  }`}
                />
                {editErrorField === "newPassword" && (
                  <p className="text-xs text-red-600 mt-1">{editFieldErrorMsg}</p>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 border border-zinc-200 text-zinc-700 text-xs font-medium rounded-md hover:bg-zinc-50 transition-colors cursor-pointer whitespace-nowrap"
                >
                  {isEn ? "Cancel" : "Hủy"}
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-medium rounded-md transition-colors disabled:opacity-60 cursor-pointer whitespace-nowrap"
                >
                  {editSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isEn ? "Save Changes" : "Lưu thay đổi"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Thêm Người Dùng Mới */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-zinc-900/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full shadow-xl border border-zinc-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
              <h3 className="font-semibold text-zinc-900 text-sm">Thêm tài khoản mới</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded text-zinc-400 hover:text-zinc-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-5 space-y-4">
              {modalGeneralError && (
                <div className="p-3 rounded-md bg-red-50 text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{modalGeneralError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  {isEn ? "Full Name" : "Họ và tên"}
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (errorField === "fullName") {
                      setErrorField("");
                      setFieldErrorMsg("");
                    }
                  }}
                  placeholder="Nguyễn Văn B"
                  className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm text-zinc-900 focus:outline-none focus:border-zinc-900"
                />
                {errorField === "fullName" && (
                  <p className="text-xs text-red-600 mt-1">{fieldErrorMsg}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorField === "email") {
                      setErrorField("");
                      setFieldErrorMsg("");
                    }
                  }}
                  placeholder="hr@ats.vn"
                  className={`w-full px-3 py-2 border rounded-md text-sm text-zinc-900 ${
                    errorField === "email"
                      ? "border-red-500 focus:outline-none"
                      : "border-zinc-300 focus:outline-none focus:border-zinc-900"
                  }`}
                />
                {errorField === "email" && (
                  <p className="text-xs text-red-600 mt-1">{fieldErrorMsg}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Số điện thoại (tuỳ chọn)
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0901 234 567"
                  className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm text-zinc-900 focus:outline-none focus:border-zinc-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Mật khẩu</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorField === "password") {
                      setErrorField("");
                      setFieldErrorMsg("");
                    }
                  }}
                  placeholder="Tối thiểu 8 ký tự"
                  className={`w-full px-3 py-2 border rounded-md text-sm text-zinc-900 ${
                    errorField === "password"
                      ? "border-red-500 focus:outline-none"
                      : "border-zinc-300 focus:outline-none focus:border-zinc-900"
                  }`}
                />
                {errorField === "password" && (
                  <p className="text-xs text-red-600 mt-1">{fieldErrorMsg}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  {isEn ? "Role" : "Vai trò"}
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm focus:outline-none focus:border-zinc-900 bg-white text-zinc-900"
                >
                  <option value="HR">HR Lead</option>
                  <option value="HIRING_MANAGER">Hiring Manager</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-zinc-200 text-zinc-700 text-xs font-medium rounded-md hover:bg-zinc-50 transition-colors cursor-pointer whitespace-nowrap"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-medium rounded-md transition-colors disabled:opacity-60 cursor-pointer whitespace-nowrap"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Tạo tài khoản</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
