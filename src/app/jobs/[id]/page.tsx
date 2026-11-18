import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import JobApplicationForm from "@/components/candidate/JobApplicationForm";
import {
  Briefcase,
  MapPin,
  Clock,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Building2,
  Layers,
  ShieldCheck,
  Award,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface JobDetailPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: JobDetailPageProps) {
  const jobId = Number(params.id);
  if (isNaN(jobId)) return { title: "Vị trí tuyển dụng | RecoverX" };

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: { title: true, department: true },
  });

  if (!job) return { title: "Không tìm thấy việc làm | RecoverX" };
  return {
    title: `${job.title} (${job.department}) | RecoverX`,
    description: `Ứng tuyển vị trí ${job.title} tại RecoverX Technology Solutions.`,
  };
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const jobId = Number(params.id);
  if (isNaN(jobId)) notFound();

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      applications: {
        where: { currentStage: "HIRED" },
        select: { id: true },
      },
    },
  });

  if (!job) notFound();

  const hiredCount = job.applications.length;
  const targetHeadcount = job.targetHeadcount || 1;
  const remainingSlots = Math.max(0, targetHeadcount - hiredCount);
  const isJobOpen = job.status === "ACTIVE" && remainingSlots > 0;

  let requiredSkills: string[] = [];
  try {
    requiredSkills = JSON.parse(job.requiredSkills || "[]");
  } catch {
    requiredSkills = [];
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* 1. Header Public */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/jobs" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg text-slate-900 tracking-tight">
                RecoverX
              </span>
              <span className="ml-2 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
                Tuyển Dụng
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/jobs"
              className="text-xs font-semibold text-slate-600 hover:text-brand-600 transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Tất cả vị trí
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Main Content Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {/* Breadcrumb navigation */}
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-6">
          <Link href="/" className="hover:text-slate-600">Trang chủ</Link>
          <span>/</span>
          <Link href="/jobs" className="hover:text-slate-600">Tuyển dụng</Link>
          <span>/</span>
          <span className="text-slate-700 font-semibold">{job.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* CỘT TRÁI (7 Cột): Thông tin chi tiết JD */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-2xs space-y-6">
              {/* Tiêu đề & Metadata */}
              <div className="space-y-3 pb-6 border-b border-slate-100">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-brand-50 text-brand-700 border border-brand-200">
                    {job.department}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-md text-xs font-semibold border ${
                      isJobOpen
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-slate-100 text-slate-600 border-slate-200"
                    }`}
                  >
                    {isJobOpen ? `Đang tuyển (${remainingSlots} vị trí)` : "Đã tuyển đủ nhân sự"}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {job.title}
                </h1>

                <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-slate-500 pt-1">
                  <span className="flex items-center gap-1.5 font-medium">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    {job.location}
                  </span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <Clock className="w-4 h-4 text-slate-400" />
                    {job.employmentType}
                  </span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <Award className="w-4 h-4 text-slate-400" />
                    Tối thiểu {job.minExperienceYears} năm kinh nghiệm
                  </span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    {new Date(job.createdAt).toLocaleDateString("vi-VN")}
                  </span>
                </div>
              </div>

              {/* Kỹ năng trọng yếu (Required Skills) */}
              {requiredSkills.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-brand-600" />
                    Kỹ năng chuyên môn yêu cầu
                  </h3>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {requiredSkills.map((skill) => (
                      <span
                        key={skill}
                        className="px-3 py-1 rounded-xl text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200/80"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Mô tả công việc & Tiêu chuẩn chi tiết (JD Content) */}
              <div className="space-y-3 pt-2">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Mô tả công việc & Yêu cầu chi tiết
                </h3>
                <div className="prose prose-sm text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50/70 p-5 rounded-xl border border-slate-200">
                  {job.requirementsJd}
                </div>
              </div>

              {/* Quyền lợi ứng viên */}
              <div className="space-y-3 pt-2">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Quyền lợi & Môi trường làm việc
                </h3>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Thu nhập cạnh tranh theo năng lực</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Thưởng KPI & hiệu suất dự án hàng quý</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Bảo hiểm sức khỏe cao cấp & khám định kỳ</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Môi trường trẻ trung, cởi mở, trang thiết bị Mac/PC</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI (5 Cột): Form ứng tuyển */}
          <div className="lg:col-span-5 sticky top-24">
            {isJobOpen ? (
              <JobApplicationForm jobId={job.id} jobTitle={job.title} />
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-slate-900">
                    Vị trí này đã tạm đóng nhận hồ sơ
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Hiện vị trí <strong>{job.title}</strong> đã hoàn tất chỉ tiêu tuyển dụng. Bạn có thể tham khảo các vị trí khác đang mở tại RecoverX.
                  </p>
                </div>
                <Link
                  href="/jobs"
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Xem các vị trí đang tuyển</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-center text-xs text-slate-500">
        <p>© 2026 RecoverX Technology Solutions Co., Ltd. Bảo lưu mọi quyền.</p>
      </footer>
    </div>
  );
}

