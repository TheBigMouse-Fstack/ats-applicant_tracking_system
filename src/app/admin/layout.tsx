import type { Metadata } from "next";
import { SessionProvider } from "@/contexts/SessionContext";

export const metadata: Metadata = {
  title: {
    default: "ATS — Applicant Tracking System",
    template: "%s | ATS — Applicant Tracking System",
  },
  description:
    "Hệ thống Quản lý & Theo dõi Hồ sơ Ứng viên Nội bộ (ATS — Applicant Tracking System)",
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SessionProvider initialUser={null}>{children}</SessionProvider>;
}
