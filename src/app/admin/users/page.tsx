"use client";

import { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  Briefcase,
  Lock,
  Unlock,
  AlertCircle,
  X,
  Search,
  Loader2,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";
import { clientCache } from "@/lib/client-cache";

interface UserItem {
  id: number;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  _count?: {
    jobs: number;
    evaluations: number;
  };
}

export default function UserManagementPage() {
  const { t } = useLanguage();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form thêm User mới
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("HR");
  const [submitting, setSubmitting] = useState(false);

  // Trạng thái đánh đỏ lỗi từng ô (UI/UX Guidelines)
  const [modalGeneralError, setModalGeneralError] = useState("");
  const [errorField, setErrorField] = useState<"fullName" | "email" | "password" | "">("");
  const [fieldErrorMsg, setFieldErrorMsg] = useState("");

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
    // 1. Kiểm tra cache: Nếu có dữ liệu người dùng, hiển thị ngay tức thì (0ms)
    const cached = clientCache.getStale<UserItem[]>("admin_users_list");
    if (cached && cached.length > 0) {
      setUsers(cached);
      setLoading(false);
      fetchUsers(true);
    } else {
      fetchUsers(false);
    }
  }, []);

  // Xử lý tạo User mới
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
        body: JSON.stringify({ fullName, email, password, role }),
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

      // Thành công
      setIsModalOpen(false);
      setFullName("");
      setEmail("");
      setPassword("");
      setErrorField("");
      setFieldErrorMsg("");
      clientCache.invalidate("admin_users_list");
      fetchUsers(true);
    } catch {
      setModalGeneralError("Lỗi kết nối máy chủ");
    } finally {
      setSubmitting(false);
    }
  };

  // Khóa / Mở khóa tài khoản
  const handleToggleActive = async (userId: number, currentStatus: boolean) => {
    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, isActive: !currentStatus }),
      });
      if (res.ok) {
        clientCache.invalidate("admin_users_list");
        fetchUsers(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
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

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm theo tên, email, vai trò..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-800 placeholder:text-slate-400"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Tổng số: <span className="font-bold text-slate-900">{filteredUsers.length}</span> tài khoản
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-sm">Đang tải danh sách người dùng...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">Không tìm thấy tài khoản nào</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-semibold">
                  <th className="py-3.5 px-4">Thành viên</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">Vai trò</th>
                  <th className="py-3.5 px-4">Trạng thái</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-zinc-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <p className="font-medium text-zinc-900 leading-tight">{user.fullName}</p>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {formatDateTime(user.createdAt)}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 text-zinc-600 font-mono text-xs">{user.email}</td>
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
                          Đang hoạt động
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-zinc-400">
                          Đã khóa
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleToggleActive(user.id, user.isActive)}
                        className={`text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                          user.isActive
                            ? "text-brand-600 hover:text-brand-700"
                            : "text-emerald-700 hover:text-emerald-800"
                        }`}
                      >
                        {user.isActive ? "Khóa" : "Mở khóa"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Thêm Người Dùng Mới (Tuân thủ UI/UX Guidelines) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Thêm Tài Khoản Nhân Viên Mới</h3>
                <p className="text-xs text-slate-500 mt-0.5">Thiết lập thông tin và phân quyền người dùng</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-5 space-y-4">
              {modalGeneralError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{modalGeneralError}</span>
                </div>
              )}

              {/* Họ tên */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Họ và tên nhân viên <span className="text-red-500">*</span>
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
                  placeholder="Ví dụ: Lê Bảo Hoàng"
                  className={`w-full px-3.5 py-2.5 border rounded-xl text-sm transition-all text-slate-900 ${
                    errorField === "fullName"
                      ? "border-red-500 bg-red-50/20 text-red-900 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                      : "border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  }`}
                />
                {errorField === "fullName" && (
                  <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{fieldErrorMsg}</span>
                  </p>
                )}
              </div>

              {/* Email (Có kiểm tra trùng lặp) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email công ty <span className="text-red-500">*</span>
                </label>
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
                  placeholder="hoang.le@recoverx.career"
                  className={`w-full px-3.5 py-2.5 border rounded-xl text-sm transition-all text-slate-900 ${
                    errorField === "email"
                      ? "border-red-500 bg-red-50/20 text-red-900 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                      : "border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  }`}
                />
                {errorField === "email" && (
                  <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{fieldErrorMsg}</span>
                  </p>
                )}
              </div>

              {/* Mật khẩu (Có kiểm tra tối thiểu 8 ký tự BRL-Auth) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mật khẩu khởi tạo <span className="text-red-500">*</span>
                </label>
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
                  className={`w-full px-3.5 py-2.5 border rounded-xl text-sm transition-all text-slate-900 ${
                    errorField === "password"
                      ? "border-red-500 bg-red-50/20 text-red-900 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                      : "border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  }`}
                />
                {errorField === "password" ? (
                  <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{fieldErrorMsg}</span>
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-400 mt-1">Tối thiểu 8 ký tự.</p>
                )}
              </div>

              {/* Vai trò */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phân quyền vai trò <span className="text-red-500">*</span>
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white text-slate-900"
                >
                  <option value="HR">HR LEAD — Quản lý tuyển dụng và phê duyệt hồ sơ</option>
                  <option value="HIRING_MANAGER">HIRING MANAGER — Hội đồng chuyên môn & Đánh giá phỏng vấn</option>
                  <option value="ADMIN">ADMIN — Quản trị toàn bộ hệ thống</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all disabled:opacity-60 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang lưu vào CSDL...</span>
                    </>
                  ) : (
                    <span>Tạo Tài Khoản</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
