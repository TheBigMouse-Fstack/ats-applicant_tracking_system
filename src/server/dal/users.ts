import "server-only";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { requirePermission } from "./auth";
import { DalError } from "./errors";

const ALLOWED_ROLES = new Set(["ADMIN", "HR", "HIRING_MANAGER"]);

export async function listInternalUsers() {
  await requirePermission("users:read", {
    vi: "Chỉ Quản trị viên mới có quyền xem danh sách nhân sự.",
    en: "Only Administrators can view the staff list.",
  });

  return prisma.user.findMany({
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      createdAt: true,
      _count: {
        select: { jobs: true, evaluations: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createInternalUser(body: Record<string, unknown>) {
  await requirePermission("users:write", {
    vi: "Chỉ Quản trị viên mới có quyền tạo tài khoản nhân viên.",
    en: "Only Administrators can create staff accounts.",
  });

  const fullName = typeof body.fullName === "string" ? body.fullName : "";
  const email = typeof body.email === "string" ? body.email : "";
  const phone = body.phone;
  const password = typeof body.password === "string" ? body.password : "";
  const role = body.role;

  if (!fullName.trim()) {
    throw new DalError("AUTH_VALIDATION_ERROR", {
      messageVi: "Vui lòng nhập đầy đủ Họ và Tên nhân viên",
      messageEn: "Please enter the staff member's full name.",
      field: "fullName",
    });
  }

  if (!email.trim()) {
    throw new DalError("AUTH_VALIDATION_ERROR", {
      messageVi: "Vui lòng nhập địa chỉ Email công ty",
      messageEn: "Please enter the company email address.",
      field: "email",
    });
  }

  if (!password) {
    throw new DalError("AUTH_VALIDATION_ERROR", {
      messageVi: "Vui lòng nhập Mật khẩu",
      messageEn: "Please enter a password.",
      field: "password",
    });
  }

  if (password.length < 8) {
    throw new DalError("AUTH_PASSWORD_WEAK", {
      messageVi: `Mật khẩu hiện có ${password.length} ký tự. Vui lòng nhập tối thiểu 8 ký tự.`,
      messageEn: `Password has ${password.length} characters. Please enter at least 8 characters.`,
      field: "password",
    });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, fullName: true },
  });

  if (existing) {
    throw new DalError("CONFLICT", {
      messageVi: `Email "${email}" đã được đăng ký bởi nhân viên "${existing.fullName}" trong hệ thống.`,
      messageEn: `Email "${email}" is already registered to "${existing.fullName}".`,
      field: "email",
    });
  }

  const cleanFullName = fullName.replace(/\s*\(.*?\)\s*/g, " ").trim();
  const normalizedPhone = typeof phone === "string" && phone.trim() ? phone.trim() : null;
  const normalizedRole = ALLOWED_ROLES.has(String(role || "").toUpperCase())
    ? String(role).toUpperCase()
    : "HR";

  const hashedPassword = hashPassword(password);

  const newUser = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        fullName: cleanFullName,
        email: normalizedEmail,
        phone: normalizedPhone,
        passwordHash: hashedPassword,
        role: normalizedRole,
        isActive: true,
      },
    });
    await tx.authAccount.upsert({
      where: {
        providerId_accountId: {
          providerId: "credential",
          accountId: String(created.id),
        },
      },
      update: { password: hashedPassword },
      create: {
        userId: created.id,
        accountId: String(created.id),
        providerId: "credential",
        password: hashedPassword,
      },
    });
    return created;
  });

  return {
    id: newUser.id,
    fullName: newUser.fullName,
    email: newUser.email,
    phone: newUser.phone,
    role: newUser.role,
  };
}

export async function updateInternalUser(body: Record<string, unknown>) {
  const sessionUser = await requirePermission("users:write", {
    vi: "Chỉ Quản trị viên mới có quyền chỉnh sửa tài khoản.",
    en: "Only Administrators can edit staff accounts.",
  });

  const { userId, isActive, role, fullName, email, phone, newPassword } = body;

  if (!userId) {
    throw new DalError("BAD_REQUEST", {
      messageVi: "Thiếu ID người dùng",
      messageEn: "Missing user ID.",
    });
  }

  const targetId = Number(userId);
  if (!Number.isInteger(targetId) || targetId <= 0) {
    throw new DalError("BAD_REQUEST", {
      messageVi: "ID người dùng không hợp lệ",
      messageEn: "Invalid user ID.",
    });
  }

  const updateData: Record<string, unknown> = {};

  if (typeof isActive === "boolean") {
    updateData.isActive = isActive;
  }

  if (typeof role === "string" && role.trim()) {
    const normalizedRole = role.toUpperCase().trim();
    if (!ALLOWED_ROLES.has(normalizedRole)) {
      throw new DalError("AUTH_VALIDATION_ERROR", {
        messageVi: "Vai trò không hợp lệ.",
        messageEn: "Invalid role.",
        field: "role",
      });
    }
    updateData.role = normalizedRole;
  }

  // P1-02: Chống Admin tự khóa hoặc tự hạ quyền chính mình
  if (targetId === sessionUser.id) {
    const attemptingSelfLock = updateData.isActive === false;
    const attemptingSelfDowngrade =
      typeof updateData.role === "string" && updateData.role !== "ADMIN";
    if (attemptingSelfLock || attemptingSelfDowngrade) {
      throw new DalError("SELF_LOCKOUT_PREVENTED");
    }
  }

  if (typeof fullName === "string") {
    const trimmedName = fullName.trim();
    if (!trimmedName) {
      throw new DalError("AUTH_VALIDATION_ERROR", {
        messageVi: "Họ và tên không được để trống.",
        messageEn: "Full name cannot be empty.",
        field: "fullName",
      });
    }
    updateData.fullName = trimmedName;
  }

  if (typeof email === "string") {
    const normalizedEmail = email.toLowerCase().trim();
    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      throw new DalError("AUTH_VALIDATION_ERROR", {
        messageVi: "Địa chỉ Email không hợp lệ.",
        messageEn: "Invalid email address.",
        field: "email",
      });
    }
    const duplicate = await prisma.user.findFirst({
      where: { email: normalizedEmail, id: { not: targetId } },
      select: { id: true, fullName: true },
    });
    if (duplicate) {
      throw new DalError("CONFLICT", {
        messageVi: `Email "${normalizedEmail}" đã được sử dụng bởi ${duplicate.fullName}.`,
        messageEn: `Email "${normalizedEmail}" is already used by ${duplicate.fullName}.`,
        field: "email",
      });
    }
    updateData.email = normalizedEmail;
  }

  if (phone !== undefined) {
    const trimmedPhone = typeof phone === "string" ? phone.trim() : "";
    if (trimmedPhone && !/^[0-9+\-\s().]{8,20}$/.test(trimmedPhone)) {
      throw new DalError("AUTH_VALIDATION_ERROR", {
        messageVi: "Số điện thoại không hợp lệ (8–20 ký tự số).",
        messageEn: "Invalid phone number (8–20 digits).",
        field: "phone",
      });
    }
    updateData.phone = trimmedPhone || null;
  }

  if (typeof newPassword === "string" && newPassword.length > 0) {
    if (newPassword.length < 8) {
      throw new DalError("AUTH_PASSWORD_WEAK", { field: "newPassword" });
    }
    updateData.passwordHash = hashPassword(newPassword);
  }

  const shouldRevokeSessions =
    updateData.isActive === false ||
    typeof updateData.role === "string" ||
    typeof updateData.passwordHash === "string";

  // P1-02: Gộp cập nhật user + auth_accounts + thu hồi phiên vào 1 prisma.$transaction nguyên tử
  const updated = await prisma.$transaction(async (tx) => {
    const saved = await tx.user.update({
      where: { id: targetId },
      data: updateData,
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (typeof updateData.passwordHash === "string") {
      await tx.authAccount.upsert({
        where: {
          providerId_accountId: {
            providerId: "credential",
            accountId: String(targetId),
          },
        },
        update: { password: updateData.passwordHash },
        create: {
          userId: targetId,
          accountId: String(targetId),
          providerId: "credential",
          password: updateData.passwordHash,
        },
      });
    }

    if (shouldRevokeSessions) {
      await tx.authSession.deleteMany({
        where: { userId: targetId },
      });
    }

    return saved;
  });

  return updated;
}
