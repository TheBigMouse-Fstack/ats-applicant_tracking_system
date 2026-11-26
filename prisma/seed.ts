import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const iterations = 100000;
  const derivedKey = crypto
    .pbkdf2Sync(password, salt, iterations, 64, "sha512")
    .toString("hex");
  return `pbkdf2$${iterations}$${salt}$${derivedKey}`;
}

async function upsertInternalUser(params: {
  fullName: string;
  email: string;
  password: string;
  role: "ADMIN" | "HR" | "HIRING_MANAGER";
}) {
  const passwordHash = hashPassword(params.password);
  const user = await prisma.user.upsert({
    where: { email: params.email },
    update: { fullName: params.fullName, role: params.role, passwordHash, isActive: true },
    create: {
      fullName: params.fullName,
      email: params.email,
      passwordHash,
      role: params.role,
      isActive: true,
    },
  });

  await prisma.authAccount.upsert({
    where: {
      providerId_accountId: {
        providerId: "credential",
        accountId: String(user.id),
      },
    },
    update: { password: passwordHash },
    create: {
      userId: user.id,
      accountId: String(user.id),
      providerId: "credential",
      password: passwordHash,
    },
  });

  return user;
}

async function main() {
  console.log("🌱 Bắt đầu nạp dữ liệu mẫu (Seeding)...");

  // 1. Tạo đủ 6 tài khoản nội bộ chuẩn PBKDF2-SHA512 + Better Auth auth_accounts (P1-05)
  await upsertInternalUser({
    fullName: "Nguyễn Văn An",
    email: "admin@ats.vn",
    password: process.env.SEED_ADMIN_PASSWORD || "Admin@123456",
    role: "ADMIN",
  });
  await upsertInternalUser({
    fullName: "Nguyễn Thu Hà",
    email: "hr@ats.vn",
    password: process.env.SEED_HR_PASSWORD || "Hr@123456",
    role: "HR",
  });
  await upsertInternalUser({
    fullName: "Trần Minh Quân",
    email: "manager@ats.vn",
    password: process.env.SEED_MANAGER_PASSWORD || "Manager@123456",
    role: "HIRING_MANAGER",
  });
  await upsertInternalUser({
    fullName: "Nguyễn Văn An",
    email: "admin@recoverx.career",
    password: process.env.SEED_ADMIN_PASSWORD || "Admin@123456",
    role: "ADMIN",
  });
  const hrUser = await upsertInternalUser({
    fullName: "Nguyễn Thu Hà",
    email: "hr@recoverx.career",
    password: process.env.SEED_HR_PASSWORD || "Hr@123456",
    role: "HR",
  });
  const hiringManager = await upsertInternalUser({
    fullName: "Trần Minh Quân",
    email: "techlead@recoverx.career",
    password: process.env.SEED_MANAGER_PASSWORD || "Manager@123456",
    role: "HIRING_MANAGER",
  });

  console.log("✅ Tạo 6 tài khoản nội bộ PBKDF2 + Better Auth thành công.");

  // 2. Tạo 2 vị trí tuyển dụng mẫu (Jobs)
  const job1 = await prisma.job.create({
    data: {
      creatorId: hrUser.id,
      title: "Senior Fullstack Developer (Next.js & TypeScript)",
      department: "Khối Công nghệ & Sản phẩm",
      location: "Quận 1, TP. Hồ Chí Minh",
      employmentType: "Toàn thời gian",
      requirementsJd: `Mô tả công việc:
- Phát triển các module quản lý tuyển dụng thời gian thực với Next.js 14 và React.
- Thiết kế và tối ưu CSDL quan hệ với Prisma ORM và PostgreSQL.
- Tích hợp các dịch vụ AI LLM (Gemini API) cho tính năng bóc tách CV tự động.

Yêu cầu ứng viên:
- Tối thiểu 3 năm kinh nghiệm với React/Next.js và TypeScript.
- Thành thạo Tailwind CSS và kỹ thuật tối ưu Server/Client Components.
- Có kinh nghiệm làm việc với CSDL quan hệ (PostgreSQL / SQLite).
- Kỹ năng tư duy logic và giải quyết vấn đề tốt.`,
      minExperienceYears: 3,
      requiredSkills: JSON.stringify([
        "Next.js",
        "React",
        "TypeScript",
        "Tailwind CSS",
        "Prisma",
        "PostgreSQL",
      ]),
      status: "ACTIVE",
    },
  });

  const job2 = await prisma.job.create({
    data: {
      creatorId: hrUser.id,
      title: "Chuyên viên Tuyển dụng & Vận hành Nhân sự (Senior Recruiter)",
      department: "Phòng Nhân sự (HR Department)",
      location: "Quận 1, TP. Hồ Chí Minh",
      employmentType: "Toàn thời gian",
      requirementsJd: `Mô tả công việc:
- Quản lý toàn bộ kênh tuyển dụng, sàng lọc và điều phối phỏng vấn ứng viên.
- Sử dụng hệ thống ATS để theo dõi pipeline ứng viên và tổng hợp Scorecard.
- Chăm sóc trải nghiệm ứng viên chuyên nghiệp và nhân văn.

Yêu cầu ứng viên:
- Tối thiểu 2 năm kinh nghiệm tuyển dụng mảng Công nghệ thông tin (IT Recruiter).
- Kỹ năng giao tiếp, thương lượng và quản lý thời gian xuất sắc.`,
      minExperienceYears: 2,
      requiredSkills: JSON.stringify([
        "IT Recruitment",
        "Sourcing",
        "Interviewing",
        "Talent Acquisition",
      ]),
      status: "ACTIVE",
    },
  });

  console.log("✅ Tạo 2 công việc mẫu thành công.");

  // 3. Tạo các ứng viên mẫu (Candidates) và Hồ sơ ứng tuyển (Applications)
  const candidate1 = await prisma.candidate.create({
    data: {
      fullName: "Đặng Hoàng Long",
      email: "hoanglong.dang@gmail.com",
      phone: "0901234567",
      experienceYears: 4,
      parsedSkills: JSON.stringify([
        "TypeScript",
        "Next.js",
        "React",
        "NodeJS",
        "Prisma",
        "Tailwind CSS",
      ]),
      parsedEducation: JSON.stringify([
        {
          institution: "Đại học Bách Khoa TP.HCM",
          degree: "Cử nhân Kỹ thuật Phần mềm",
          grad_year: 2021,
        },
      ]),
      parsedExperience: JSON.stringify([
        {
          company: "Công ty Công nghệ Alpha",
          position: "Frontend & Fullstack Engineer",
          duration: "2021 - 2024",
          summary: "Xây dựng dashboard kéo thả Kanban với Next.js và Tailwind.",
        },
      ]),
      cvFileUrl: "/uploads/sample_cv_long.pdf",
      cvText: "Kỹ sư phần mềm 4 năm kinh nghiệm chuyên sâu React, Next.js, TypeScript và Prisma...",
    },
  });

  const candidate2 = await prisma.candidate.create({
    data: {
      fullName: "Vũ Thị Bích Ngọc",
      email: "bichngoc.vu@gmail.com",
      phone: "0912345678",
      experienceYears: 3,
      parsedSkills: JSON.stringify(["React", "JavaScript", "CSS3", "HTML5", "REST API"]),
      cvFileUrl: "/uploads/sample_cv_ngoc.pdf",
      cvText: "Frontend Developer 3 năm kinh nghiệm với ReactJS, JavaScript thuần...",
    },
  });

  const candidate3 = await prisma.candidate.create({
    data: {
      fullName: "Phạm Quốc Tuấn",
      email: "quoctuan.pham@outlook.com",
      phone: "0987654321",
      experienceYears: 1,
      parsedSkills: JSON.stringify(["PHP", "MySQL", "jQuery", "Bootstrap"]),
      cvFileUrl: "/uploads/sample_cv_tuan.pdf",
      cvText: "Lập trình viên web PHP/Laravel cơ bản 1 năm kinh nghiệm...",
    },
  });

  // Tạo Applications gán vào các cột Kanban
  const app1 = await prisma.application.create({
    data: {
      candidateId: candidate1.id,
      jobId: job1.id,
      currentStage: "INTERVIEW",
      aiMatchScore: 92.0,
      aiMatchRationale:
        "Ứng viên đáp ứng xuất sắc 6/6 kỹ năng cốt lõi (Next.js, TypeScript, Tailwind, Prisma). Có 4 năm kinh nghiệm thực tế vượt mức yêu cầu 3 năm.",
      aiMatchedSkills: JSON.stringify([
        "Next.js",
        "React",
        "TypeScript",
        "Tailwind CSS",
        "Prisma",
      ]),
      aiMissingSkills: JSON.stringify([]),
    },
  });

  // Tạo Scorecard mẫu cho app1
  await prisma.evaluation.create({
    data: {
      applicationId: app1.id,
      evaluatorId: hiringManager.id,
      technicalScore: 5,
      communicationScore: 4,
      culturalFitScore: 5,
      overallScore: 4.7,
      comments:
        "Ứng viên nắm rất vững kiến trúc Next.js App Router, giao tiếp mạch lạc và tư duy giải quyết vấn đề xuất sắc.",
      recommendation: "STRONG_HIRE",
    },
  });

  await prisma.application.create({
    data: {
      candidateId: candidate2.id,
      jobId: job1.id,
      currentStage: "SCREENING",
      aiMatchScore: 72.0,
      aiMatchRationale:
        "Ứng viên có nền tảng React và JavaScript vững (3 năm), tuy nhiên chưa thấy đề cập TypeScript và Prisma trong CV.",
      aiMatchedSkills: JSON.stringify(["React"]),
      aiMissingSkills: JSON.stringify(["TypeScript", "Next.js", "Prisma"]),
    },
  });

  await prisma.application.create({
    data: {
      candidateId: candidate3.id,
      jobId: job1.id,
      currentStage: "REJECTED",
      aiMatchScore: 35.0,
      aiMatchRationale:
        "Kỹ năng công nghệ không tương thích (chủ yếu PHP/jQuery thay vì React/TypeScript) và số năm kinh nghiệm (1 năm) chưa đạt yêu cầu tối thiểu (3 năm).",
      aiMatchedSkills: JSON.stringify([]),
      aiMissingSkills: JSON.stringify([
        "Next.js",
        "React",
        "TypeScript",
        "Tailwind CSS",
        "Prisma",
      ]),
      emailScheduledAt: new Date(Date.now() + 12 * 60 * 60 * 1000), // Hoãn 12 tiếng
      isEmailSent: false,
    },
  });

  console.log("✅ Nạp 3 hồ sơ ứng viên và phiếu chấm điểm mẫu thành công.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
