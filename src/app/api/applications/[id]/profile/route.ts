import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/applications/[id]/profile
 * Cho phép HR và Admin chỉnh sửa / bổ sung thủ công các trường thông tin đã trích xuất từ CV
 * (Họ tên, Email, SĐT, Kỹ năng, Số năm kinh nghiệm, Học vấn, Kinh nghiệm) nhằm khắc phục sai sót bóc tách.
 * Tự động tính toán lại đối chiếu kỹ năng và kinh nghiệm so với yêu cầu JD.
 */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const sessionUser = getSessionUser();
    if (!sessionUser) {
      return NextResponse.json(
        { success: false, error: "Yêu cầu đăng nhập tài khoản nội bộ để chỉnh sửa hồ sơ" },
        { status: 401 }
      );
    }

    // Chỉ HR và ADMIN được chỉnh sửa dữ liệu trích xuất hồ sơ ứng viên
    if (sessionUser.role === "HIRING_MANAGER") {
      return NextResponse.json(
        {
          success: false,
          error:
            "Quản lý chuyên môn (Hiring Manager) chỉ có quyền xem hồ sơ và đánh giá; quyền chuẩn hóa dữ liệu trích xuất CV thuộc bộ phận HR.",
          rule: "RBAC-PROFILE-EDIT",
        },
        { status: 403 }
      );
    }

    const applicationId = Number(params.id);
    if (!applicationId) {
      return NextResponse.json(
        { success: false, error: "ID hồ sơ không hợp lệ" },
        { status: 400 }
      );
    }

    const app = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        candidate: true,
        job: true,
      },
    });

    if (!app) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy hồ sơ ứng tuyển" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const {
      fullName,
      email,
      phone,
      experienceYears,
      skills,
      education,
      experience,
    } = body;

    // Validation cơ bản cho các trường cốt lõi
    const nextFullName =
      typeof fullName === "string" ? fullName.trim() : app.candidate.fullName;
    const nextEmail =
      typeof email === "string" ? email.trim().toLowerCase() : app.candidate.email;
    const nextPhone =
      typeof phone === "string" ? phone.trim() : app.candidate.phone;

    if (!nextFullName || nextFullName.length < 2) {
      return NextResponse.json(
        { success: false, error: "Họ và tên ứng viên phải có ít nhất 2 ký tự." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!nextEmail || !emailRegex.test(nextEmail)) {
      return NextResponse.json(
        { success: false, error: "Địa chỉ Email không đúng định dạng hợp lệ." },
        { status: 400 }
      );
    }

    const nextExpYears =
      experienceYears !== undefined && experienceYears !== null
        ? Math.max(0, Math.min(50, Number(experienceYears)))
        : app.candidate.experienceYears;

    if (isNaN(nextExpYears)) {
      return NextResponse.json(
        { success: false, error: "Số năm kinh nghiệm phải là một số hợp lệ." },
        { status: 400 }
      );
    }

    // Chuẩn hóa danh sách kỹ năng (loại trùng lặp, trim khoảng trắng)
    let nextSkills: string[] = [];
    if (Array.isArray(skills)) {
      const seen = new Set<string>();
      for (const raw of skills) {
        const s = String(raw).trim();
        if (s && !seen.has(s.toLowerCase())) {
          seen.add(s.toLowerCase());
          nextSkills.push(s);
        }
      }
    } else {
      try {
        nextSkills = JSON.parse(app.candidate.parsedSkills || "[]");
      } catch {
        nextSkills = [];
      }
    }

    // Kiểm tra xem (email, phone) mới có trùng với một Candidate khác trong DB không
    if (nextEmail !== app.candidate.email || nextPhone !== app.candidate.phone) {
      const conflict = await prisma.candidate.findFirst({
        where: {
          id: { not: app.candidateId },
          email: nextEmail,
          phone: nextPhone,
        },
      });
      if (conflict) {
        return NextResponse.json(
          {
            success: false,
            error: "Cặp Email và Số điện thoại này đã thuộc về một ứng viên khác trong hệ thống.",
            rule: "BRL-02",
          },
          { status: 400 }
        );
      }
    }

    // Đối chiếu lại kỹ năng & kinh nghiệm với yêu cầu JD (BRL-04)
    let requiredSkills: string[] = [];
    try {
      requiredSkills = JSON.parse(app.job.requiredSkills || "[]");
    } catch {
      requiredSkills = [];
    }

    const matchedSkills: string[] = [];
    const missingSkills: string[] = [];

    requiredSkills.forEach((reqSkill) => {
      const reqLower = reqSkill.toLowerCase();
      const matched = nextSkills.some(
        (s) =>
          s.toLowerCase() === reqLower ||
          s.toLowerCase().includes(reqLower) ||
          reqLower.includes(s.toLowerCase())
      );
      if (matched) {
        matchedSkills.push(reqSkill);
      } else {
        missingSkills.push(reqSkill);
      }
    });

    const skillScore =
      requiredSkills.length > 0
        ? (matchedSkills.length / requiredSkills.length) * 100
        : 60;
    const minExp = app.job.minExperienceYears || 1;
    const expScore = Math.min(1.0, nextExpYears / minExp) * 100;
    const recalculatedMatchScore = Math.round(skillScore * 0.6 + expScore * 0.4);

    // Ghi nhận danh sách trường đã thay đổi vào AuditLog
    const changedFields: string[] = [];
    if (nextFullName !== app.candidate.fullName) changedFields.push("Họ tên");
    if (nextEmail !== app.candidate.email) changedFields.push("Email");
    if (nextPhone !== app.candidate.phone) changedFields.push("SĐT");
    if (nextExpYears !== app.candidate.experienceYears) changedFields.push("Kinh nghiệm");
    if (Array.isArray(skills)) changedFields.push("Kỹ năng");
    if (Array.isArray(education)) changedFields.push("Học vấn");
    if (Array.isArray(experience)) changedFields.push("Lịch sử công tác");

    const candidateUpdateData: any = {
      fullName: nextFullName,
      email: nextEmail,
      phone: nextPhone,
      experienceYears: nextExpYears,
      parsedSkills: JSON.stringify(nextSkills),
    };

    if (Array.isArray(education)) {
      candidateUpdateData.parsedEducation = JSON.stringify(education);
    }
    if (Array.isArray(experience)) {
      candidateUpdateData.parsedExperience = JSON.stringify(experience);
    }

    await prisma.$transaction([
      prisma.candidate.update({
        where: { id: app.candidateId },
        data: candidateUpdateData,
      }),
      prisma.application.update({
        where: { id: app.id },
        data: {
          aiMatchScore: recalculatedMatchScore,
          aiMatchedSkills: JSON.stringify(matchedSkills),
          aiMissingSkills: JSON.stringify(missingSkills),
        },
      }),
      prisma.auditLog.create({
        data: {
          applicationId: app.id,
          userId: sessionUser.id,
          fromStage: app.currentStage,
          toStage: app.currentStage,
          action: "PROFILE_EDITED",
          reason:
            changedFields.length > 0
              ? `Chỉnh sửa thủ công: ${changedFields.join(", ")}`
              : "Cập nhật thông tin hồ sơ ứng viên",
        },
      }),
    ]);

    // Trả về dữ liệu Application đầy đủ mới nhất
    const updatedApplication = await prisma.application.findUnique({
      where: { id: app.id },
      include: {
        candidate: {
          include: {
            applications: {
              where: { id: { not: app.id } },
              include: { job: { select: { id: true, title: true, department: true } } },
              orderBy: { createdAt: "desc" },
            },
          },
        },
        job: {
          select: {
            id: true,
            title: true,
            department: true,
            requirementsJd: true,
            requiredSkills: true,
            minExperienceYears: true,
          },
        },
        evaluations: {
          include: {
            evaluator: {
              select: { id: true, fullName: true, email: true, role: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        auditLogs: {
          include: {
            user: {
              select: { id: true, fullName: true, role: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Đã lưu chỉnh sửa thông tin hồ sơ và cập nhật đối chiếu JD thành công.",
      data: updatedApplication,
    });
  } catch (error: any) {
    console.error("PATCH /api/applications/[id]/profile error:", error);
    return NextResponse.json(
      { success: false, error: "Không thể cập nhật thông tin hồ sơ: " + error.message },
      { status: 500 }
    );
  }
}
