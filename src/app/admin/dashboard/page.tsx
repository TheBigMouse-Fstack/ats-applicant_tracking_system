import { Suspense } from "react";
import type { Metadata } from "next";
import OperationalDashboard from "@/components/admin/OperationalDashboard";

export const metadata: Metadata = {
  title: "Bảng Điều Khiển Tổng Quan",
  description: "Tổng quan vận hành phễu tuyển dụng, cảnh báo SLA và hàng đợi tác nghiệp theo vai trò",
};

export default function AdminDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="h-32 bg-white border border-slate-200 rounded-2xl animate-pulse" />
        </div>
      }
    >
      <OperationalDashboard />
    </Suspense>
  );
}
