import { redirect } from "next/navigation";
import { getCurrentSession } from "@/server/dal";

export default async function AdminUsersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessionUser = await getCurrentSession();
  if (!sessionUser) {
    redirect("/admin/login");
  }
  if (sessionUser.role !== "ADMIN") {
    redirect("/admin/dashboard?error=forbidden");
  }
  return <>{children}</>;
}
