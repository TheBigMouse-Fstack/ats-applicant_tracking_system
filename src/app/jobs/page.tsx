import { prisma } from "@/lib/prisma";
import JobsPublicClient from "@/components/candidate/JobsPublicClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Cơ Hội Nghề Nghiệp | RecoverX",
  description:
    "Khám phá các cơ hội nghề nghiệp công nghệ hấp dẫn từ Trainee, Dev, QA đến UI/UX tại RecoverX Technology Solutions.",
};

export default async function JobsPublicPage() {
  const jobs = await prisma.job.findMany({
    where: { status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      department: true,
      location: true,
      employmentType: true,
      minExperienceYears: true,
      requiredSkills: true,
      createdAt: true,
    },
  });

  // Gom nhóm phòng ban để hiển thị tag
  const departments = Array.from(new Set(jobs.map((j) => j.department)));

  return <JobsPublicClient jobs={jobs as any} departments={departments} />;
}
