import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractTextFromCv, parseAndScoreCv } from "@/lib/ai-parser";
import { getSessionUser } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

// Rate Limiter trượt trong bộ nhớ: Tối đa 5 lần nộp / 10 phút trên mỗi IP (NFR-SEC-03)
const ipSubmissionTimestamps = new Map<string, number[]>();

// GET: Lấy danh sách hồ sơ ứng tuyển (dành cho API nội bộ hoặc xuất báo cáo)
export async function GET(req: Request) {
  try {
    const sessionUser = getSessionUser();
    if (!sessionUser) {
      return NextResponse.json(
        { success: false, error: "Yêu cầu đăng nhập tài khoản nội bộ để xem danh sách hồ sơ" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get("jobId");
    const stage = searchParams.get("stage");
    const source = searchParams.get("source");
    const search = searchParams.get("search");
    const sortBy = searchParams.get("sortBy") || "NEWEST";
    const starredOnly = searchParams.get("starred") === "true";
    const unviewedOnly = searchParams.get("unviewed") === "true";
    const unevaluatedOnly = searchParams.get("unevaluated") === "true";

    const where: any = {};
    if (jobId && jobId !== "ALL") where.jobId = Number(jobId);
    if (stage && stage !== "ALL") where.currentStage = stage;
    if (source && source !== "ALL") where.source = source;
    if (starredOnly) where.isStarred = true;
    if (unviewedOnly) where.isViewed = false;
    if (unevaluatedOnly) where.evaluations = { none: {} };

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { candidate: { fullName: { contains: q } } },
        { candidate: { email: { contains: q } } },
        { candidate: { phone: { contains: q } } },
        { candidate: { parsedSkills: { contains: q } } },
        { job: { title: { contains: q } } },
      ];
    }

    let orderBy: any = { createdAt: "desc" };
    if (sortBy === "OLDEST") {
      orderBy = { createdAt: "asc" };
    } else if (sortBy === "NAME_ASC") {
      orderBy = { candidate: { fullName: "asc" } };
    }

    const applications = await prisma.application.findMany({
      where,
      include: {
        candidate: true,
        job: true,
        evaluations: true,
      },
      orderBy,
    });

    // Sắp xếp tùy biến ở tầng server cho các tiêu chí phức tạp
    if (sortBy === "STARRED_FIRST") {
      applications.sort((a, b) => {
        if (a.isStarred !== b.isStarred) return b.isStarred ? 1 : -1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    } else if (sortBy === "UNVIEWED_FIRST") {
      applications.sort((a, b) => {
        if (a.isViewed !== b.isViewed) return a.isViewed ? 1 : -1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    } else if (sortBy === "UNEVALUATED_FIRST") {
      applications.sort((a, b) => {
        const aHasEval = a.evaluations && a.evaluations.length > 0;
        const bHasEval = b.evaluations && b.evaluations.length > 0;
        if (aHasEval !== bHasEval) return aHasEval ? 1 : -1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    }

    return NextResponse.json({ success: true, data: applications });
  } catch (error: any) {
    console.error("GET /api/applications error:", error);
    return NextResponse.json(
      { success: false, error: "Không thể lấy danh sách ứng viên" },
      { status: 500 }
    );
  }
}

// POST: Nộp hồ sơ ứng tuyển từ cổng Public Careers (SCR-02)
export async function POST(req: Request) {
  try {
    // 0. BẢO VỆ CHỐNG BOT/SPAM BẰNG RATE LIMITING (NFR-SEC-03: Tối đa 5 requests/10 phút/IP)
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";
    const nowMs = Date.now();
    const windowMs = 10 * 60 * 1000;
    const history = (ipSubmissionTimestamps.get(clientIp) || []).filter(
      (t) => nowMs - t < windowMs
    );

    if (history.length >= 5) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Hệ thống phát hiện tần suất nộp hồ sơ vượt quá giới hạn an toàn từ IP của bạn. Vui lòng chờ 10 phút trước khi thử lại theo quy định NFR-SEC-03.",
          rule: "NFR-SEC-03",
        },
        { status: 429 }
      );
    }

    const formData = await req.formData();
    const jobIdStr = formData.get("jobId") as string;
    const fullName = (formData.get("fullName") as string)?.trim() || "";
    const email = (formData.get("email") as string)?.trim().toLowerCase() || "";
    const phone = (formData.get("phone") as string)?.trim() || "";
    const file = formData.get("cvFile") as File | null;

    const fieldErrors: Record<string, string> = {};

    // 1. Kiểm tra tính hợp lệ cơ bản của Form (UI/UX Inline errors)
    if (!jobIdStr) {
      fieldErrors.jobId = "Vui lòng chọn vị trí tuyển dụng";
    }
    if (!fullName || fullName.length < 2) {
      fieldErrors.fullName = "Họ và tên bắt buộc và phải từ 2 ký tự trở lên";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      fieldErrors.email = "Địa chỉ email không hợp lệ (VD: ungvien@gmail.com)";
    }
    const phoneRegex = /^(0|\+84)[0-9]{9,10}$/;
    if (!phone || !phoneRegex.test(phone.replace(/\s+/g, ""))) {
      fieldErrors.phone = "Số điện thoại không hợp lệ (Phải từ 10 chữ số, bắt đầu bằng 0 hoặc +84)";
    }
    if (!file) {
      fieldErrors.cvFile = "Vui lòng tải lên tệp CV của bạn";
    }

    if (Object.keys(fieldErrors).length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Dữ liệu nhập vào chưa chính xác. Vui lòng kiểm tra lại các trường được đánh dấu đỏ.",
          fieldErrors,
        },
        { status: 400 }
      );
    }

    const jobId = Number(jobIdStr);

    // 2. Kiểm tra Vị trí tuyển dụng (Job) có tồn tại và đang mở không
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return NextResponse.json(
        { success: false, error: "Vị trí tuyển dụng không tồn tại" },
        { status: 404 }
      );
    }

    if (job.status !== "ACTIVE") {
      return NextResponse.json(
        {
          success: false,
          error: "Vị trí tuyển dụng này hiện đã đóng hoặc tạm dừng nhận hồ sơ",
        },
        { status: 400 }
      );
    }

    // 3. KIỂM TRA BRL-01: Định dạng và dung lượng tệp
    const validExtensions = [".pdf", ".docx"];
    const fileName = file!.name;
    const fileExt = fileName.slice(fileName.lastIndexOf(".")).toLowerCase();
    const maxSizeBytes = 10 * 1024 * 1024; // 10MB

    if (!validExtensions.includes(fileExt)) {
      return NextResponse.json(
        {
          success: false,
          error: "Định dạng tệp không hợp lệ. Hệ thống chỉ chấp nhận định dạng PDF hoặc DOCX.",
          fieldErrors: {
            cvFile: "Chỉ chấp nhận định dạng tệp .pdf hoặc .docx",
          },
          rule: "BRL-01",
        },
        { status: 400 }
      );
    }

    if (file!.size > maxSizeBytes) {
      return NextResponse.json(
        {
          success: false,
          error: `Dung lượng tệp (${(file!.size / (1024 * 1024)).toFixed(1)}MB) vượt quá giới hạn tối đa 10MB cho phép.`,
          fieldErrors: {
            cvFile: "Dung lượng tệp vượt quá 10MB",
          },
          rule: "BRL-01",
        },
        { status: 400 }
      );
    }

    // 4. KIỂM TRA BRL-02: Khử trùng lặp trong 30 ngày (Deduplication)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const existingDuplicate = await prisma.application.findFirst({
      where: {
        jobId,
        candidate: {
          OR: [{ email }, { phone }],
        },
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      include: { candidate: true },
    });

    if (existingDuplicate) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Ứng viên đã nộp hồ sơ cho vị trí này trong vòng 30 ngày qua. Vui lòng không nộp lặp lại.",
          fieldErrors: {
            email: "Email này đã ứng tuyển vị trí này trong 30 ngày qua",
            phone: "Số điện thoại này đã ứng tuyển vị trí này trong 30 ngày qua",
          },
          rule: "BRL-02",
        },
        { status: 400 }
      );
    }

    // 5. KIỂM TRA BRL-09: Hạn mức ứng tuyển (Quota: Tối đa 3 Jobs trong 90 ngày)
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const candidatePastAppsCount = await prisma.application.count({
      where: {
        candidate: {
          OR: [{ email }, { phone }],
        },
        createdAt: {
          gte: ninetyDaysAgo,
        },
      },
    });

    if (candidatePastAppsCount >= 3) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Bạn đã nộp tối đa 3 vị trí công việc trong vòng 90 ngày qua. Vui lòng chờ kết quả phản hồi theo quy tắc hạn mức BRL-09.",
          rule: "BRL-09",
        },
        { status: 400 }
      );
    }

    // 6. KIỂM TRA CHỮ KÝ NHỊ PHÂN (MAGIC BYTES) & Lưu file vào ổ cứng (public/uploads/)
    const arrayBuffer = await file!.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Chặn tệp tin đổi đuôi giả mạo (Polyglot / Fake Extension Attack)
    if (fileExt === ".pdf") {
      const isPdf =
        buffer.length >= 4 &&
        buffer[0] === 0x25 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x44 &&
        buffer[3] === 0x46; // %PDF
      if (!isPdf) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Tệp tin không đúng định dạng PDF hợp lệ (Chữ ký nhị phân Magic Bytes không khớp).",
            fieldErrors: {
              cvFile: "Nội dung tệp không phải PDF chuẩn hoặc đã bị đổi đuôi giả mạo",
            },
          },
          { status: 400 }
        );
      }
    } else if (fileExt === ".docx") {
      const isDocx =
        buffer.length >= 2 && buffer[0] === 0x50 && buffer[1] === 0x4b; // PK (Zip)
      if (!isDocx) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Tệp tin không đúng định dạng DOCX hợp lệ (Chữ ký nhị phân Magic Bytes không khớp).",
            fieldErrors: {
              cvFile: "Nội dung tệp không phải DOCX chuẩn hoặc đã bị đổi đuôi giả mạo",
            },
          },
          { status: 400 }
        );
      }
    }

    // Ghi nhận IP đã nộp hồ sơ hợp lệ vào Rate Limiter
    history.push(nowMs);
    ipSubmissionTimestamps.set(clientIp, history);

    const safeFileName = `cv_${Date.now()}_${path.basename(fileName).replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch {}
    const filePath = path.join(uploadDir, safeFileName);
    await writeFile(filePath, buffer);
    const cvFileUrl = `/uploads/${safeFileName}`;

    // 6.5. Xử lý các tệp Bằng cấp / Chứng chỉ đính kèm (Certificates & Attachments)
    const certFiles = formData.getAll("certificates") as File[];
    const source = (formData.get("source") as string)?.trim() || "CAREER_SITE";
    const newCertificates: any[] = [];

    if (certFiles && certFiles.length > 0) {
      const certDir = path.join(uploadDir, "certificates");
      try {
        await mkdir(certDir, { recursive: true });
      } catch {}

      for (const certFile of certFiles) {
        if (!certFile || !(certFile instanceof File) || certFile.size === 0) continue;
        const cExt = certFile.name.slice(certFile.name.lastIndexOf(".")).toLowerCase();
        const validCertExts = [".jpg", ".jpeg", ".png", ".webp", ".pdf"];
        if (!validCertExts.includes(cExt)) continue;
        if (certFile.size > 10 * 1024 * 1024) continue; // Tối đa 10MB

        const cSafeName = `cert_${Date.now()}_${path.basename(certFile.name).replace(/[^a-zA-Z0-9._-]/g, "_")}`;
        const cPath = path.join(certDir, cSafeName);
        const cBuffer = Buffer.from(await certFile.arrayBuffer());
        await writeFile(cPath, cBuffer);

        newCertificates.push({
          id: `cert_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          name: certFile.name,
          fileUrl: `/uploads/certificates/${cSafeName}`,
          fileType: cExt === ".pdf" ? "pdf" : "image",
          size: certFile.size,
          uploadedAt: new Date().toISOString(),
        });
      }
    }

    // 7. Bóc tách nội dung CV (Layer 1 Text Extraction)
    const cvRawText = await extractTextFromCv(buffer, fileName);

    // 8. Chạy AI Phân tích & So khớp CV (Layer 2 Hybrid AI Matching)
    let requiredSkillsArray: string[] = [];
    try {
      requiredSkillsArray = JSON.parse(job.requiredSkills || "[]");
    } catch {
      requiredSkillsArray = [];
    }

    const aiResult = await parseAndScoreCv(cvRawText, {
      title: job.title,
      requirementsJd: job.requirementsJd,
      requiredSkills: requiredSkillsArray,
      minExperienceYears: job.minExperienceYears,
    });

    // 9. Tìm hoặc cập nhật Hồ sơ Candidate trong CSDL
    let candidate = await prisma.candidate.findFirst({
      where: {
        OR: [{ email }, { phone }],
      },
    });

    if (candidate) {
      let existingCerts: any[] = [];
      try {
        existingCerts = JSON.parse(candidate.certificates || "[]");
      } catch {
        existingCerts = [];
      }
      const combinedCerts = [...existingCerts, ...newCertificates];

      // Cập nhật thông tin mới nhất
      candidate = await prisma.candidate.update({
        where: { id: candidate.id },
        data: {
          fullName,
          email,
          phone,
          experienceYears: aiResult.experienceYears,
          parsedSkills: JSON.stringify(aiResult.skills),
          parsedEducation: JSON.stringify(aiResult.education),
          parsedExperience: JSON.stringify(aiResult.experience),
          certificates: JSON.stringify(combinedCerts),
          cvFileUrl,
          cvText: cvRawText.slice(0, 10000),
        },
      });
    } else {
      // Tạo mới ứng viên
      candidate = await prisma.candidate.create({
        data: {
          fullName,
          email,
          phone,
          experienceYears: aiResult.experienceYears,
          parsedSkills: JSON.stringify(aiResult.skills),
          parsedEducation: JSON.stringify(aiResult.education),
          parsedExperience: JSON.stringify(aiResult.experience),
          certificates: JSON.stringify(newCertificates),
          cvFileUrl,
          cvText: cvRawText.slice(0, 10000),
        },
      });
    }

    // 10. Tạo đơn ứng tuyển Application mới (Kanban cột NEW)
    const application = await prisma.application.create({
      data: {
        candidateId: candidate.id,
        jobId: job.id,
        source,
        currentStage: "NEW",
        aiMatchScore: aiResult.matchScore,
        aiMatchRationale: aiResult.rationale,
        aiMatchedSkills: JSON.stringify(aiResult.matchedSkills),
        aiMissingSkills: JSON.stringify(aiResult.missingSkills),
      },
    });

    // 11. Ghi nhận AuditLog hành động nộp CV
    await prisma.auditLog.create({
      data: {
        applicationId: application.id,
        fromStage: null,
        toStage: "NEW",
        action: "CV_UPLOAD",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Hồ sơ của bạn đã được tiếp nhận và phân tích AI thành công!",
      data: {
        applicationId: application.id,
        candidateName: candidate.fullName,
        jobTitle: job.title,
        aiMatchScore: aiResult.matchScore,
        aiMatchRationale: aiResult.rationale,
        matchedSkills: aiResult.matchedSkills,
        missingSkills: aiResult.missingSkills,
      },
    });
  } catch (error: any) {
    console.error("POST /api/applications error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Lỗi hệ thống khi xử lý hồ sơ ứng tuyển: " + (error.message || "Unknown error"),
      },
      { status: 500 }
    );
  }
}

