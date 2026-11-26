import { redirect } from "next/navigation";
import AdminNavbar from "@/components/admin/Navbar";
import RealtimeNotifications from "@/components/admin/RealtimeNotifications";
import DemoRoleBar from "@/components/admin/DemoRoleBar";
import { SessionProvider } from "@/contexts/SessionContext";
import { getCurrentSession } from "@/server/dal";

/**
 * P1-06: Fail-Closed Server Layout cho toàn bộ trang nội bộ `/admin/*` (trừ `/admin/login`).
 * Không phụ thuộc `x-pathname` hay Edge Middleware — luôn gọi `getCurrentSession()` từ DAL.
 * P1-08: Chỉ render `<RealtimeNotifications />` khi có phiên xác thực hợp lệ.
 */
export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessionUser = await getCurrentSession();
  if (!sessionUser) {
    redirect("/admin/login");
  }

  const clientUser = {
    id: sessionUser.id,
    fullName: sessionUser.fullName,
    email: sessionUser.email,
    role: sessionUser.role,
  };

  return (
    <SessionProvider initialUser={clientUser}>
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <AdminNavbar initialUser={clientUser} />
        {Boolean(clientUser) && <RealtimeNotifications />}
        <main className="flex-1">{children}</main>
        <DemoRoleBar currentRole={clientUser.role} currentUser={clientUser.fullName} />
      </div>
    </SessionProvider>
  );
}
