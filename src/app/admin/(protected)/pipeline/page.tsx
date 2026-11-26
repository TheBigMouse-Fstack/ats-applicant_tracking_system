import { Metadata } from "next";
import KanbanBoard from "@/components/kanban/KanbanBoard";

export const metadata: Metadata = {
  title: "Quy Trình Tuyển Dụng",
  description: "Theo dõi và quản lý hồ sơ ứng viên qua 5 giai đoạn tuyển dụng (ATS)",
};

export default function AdminPipelinePage() {
  return (
    <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <KanbanBoard />
    </div>
  );
}

