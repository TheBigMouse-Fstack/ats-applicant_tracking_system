import type { Metadata } from "next";
import AdminNavbar from "@/components/admin/Navbar";
import { getSessionUser } from "@/lib/auth";
import { SessionProvider } from "@/contexts/SessionContext";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: {
    default: "ATS — Applicant Tracking System",
    template: "%s | ATS — Applicant Tracking System",
  },
  description: "Hệ thống Quản lý & Theo dõi Hồ sơ Ứng viên Nội bộ (ATS — Applicant Tracking System)",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = headers();
  const pathname = headersList.get("x-pathname") || "";
  const sessionUser = getSessionUser();

  // Phòng thủ lớp 2 (Defense in Depth): Nếu không phải trang login và thiếu session, chặn ngay tại Server
  if (pathname && pathname !== "/admin/login" && !sessionUser) {
    redirect("/admin/login");
  }

  return (
    <SessionProvider initialUser={sessionUser}>
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <AdminNavbar initialUser={sessionUser} />
        <main className="flex-1">{children}</main>
      </div>
    </SessionProvider>
  );
}
