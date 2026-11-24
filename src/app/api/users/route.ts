import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, hashPassword } from "@/lib/auth";

const ALLOWED_ROLES = new Set(["ADMIN", "HR", "HIRING_MANAGER"]);

// GET: Lấy danh sách toàn bộ User nội bộ (Chỉ Admin mới có quyền)
export async function GET() {
  try {
    const sessionUser = getSessionUser();
    if (!sessionUser || sessionUser.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Chỉ Quản trị viên (Admin) mới có quyền xem danh sách nhân sự." },
        { status: 403 }
      );
    }
    const users = await prisma.user.findMany({
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

    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    console.error("Fetch users error:", error);
    return NextResponse.json(
      { success: false, error: "Không thể lấy danh sách người dùng" },
      { status: 500 }
    );
  }
}

// POST: Tạo người dùng mới (Chỉ Admin mới có quyền theo BRL-Auth & RBAC)
export async function POST(req: Request) {
  try {
    const sessionUser = getSessionUser();
    if (sessionUser && sessionUser.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Chỉ Quản trị viên (Admin) mới có quyền tạo tài khoản nhân viên." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { fullName, email, phone, password, role } = body;

    if (!fullName || !fullName.trim()) {
      return NextResponse.json(
        { success: false, error: "Vui lòng nhập đầy đủ Họ và Tên nhân viên", field: "fullName" },
        { status: 400 }
      );
    }

    if (!email || !email.trim()) {
      return NextResponse.json(
        { success: false, error: "Vui lòng nhập địa chỉ Email công ty", field: "email" },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { success: false, error: "Vui lòng nhập Mật khẩu", field: "password" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          error: `Mật khẩu hiện có ${password.length} ký tự. Vui lòng nhập tối thiểu 8 ký tự.`,
          field: "password",
        },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: `Email "${email}" đã được đăng ký bởi nhân viên "${existing.fullName}" trong hệ thống.`,
          field: "email",
        },
        { status: 409 }
      );
    }

    const cleanFullName = fullName.replace(/\s*\(.*?\)\s*/g, " ").trim();
    const normalizedPhone = typeof phone === "string" && phone.trim() ? phone.trim() : null;
    const normalizedRole = ALLOWED_ROLES.has(String(role || "").toUpperCase())
      ? String(role).toUpperCase()
      : "HR";

    const newUser = await prisma.user.create({
      data: {
        fullName: cleanFullName,
        email: normalizedEmail,
        phone: normalizedPhone,
        passwordHash: hashPassword(password),
        role: normalizedRole,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Tạo tài khoản người dùng thành công",
      data: {
        id: newUser.id,
        fullName: newUser.fullName,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error("Create user error:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi hệ thống khi tạo người dùng" },
      { status: 500 }
    );
  }
}

// PATCH: Admin cập nhật thông tin (tên, email, sđt, vai trò, mật khẩu, trạng thái khóa) của người dùng
export async function PATCH(req: Request) {
  try {
    const sessionUser = getSessionUser();
    if (!sessionUser || sessionUser.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Chỉ Quản trị viên (Admin) mới có quyền chỉnh sửa tài khoản." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { userId, isActive, role, fullName, email, phone, newPassword } = body;

    if (!userId) {
      return NextResponse.json({ success: false, error: "Thiếu ID người dùng" }, { status: 400 });
    }

    const targetId = Number(userId);
    const updateData: Record<string, unknown> = {};

    if (typeof isActive === "boolean") {
      updateData.isActive = isActive;
    }

    if (typeof role === "string" && role.trim()) {
      const normalizedRole = role.toUpperCase().trim();
      if (!ALLOWED_ROLES.has(normalizedRole)) {
        return NextResponse.json(
          { success: false, error: "Vai trò không hợp lệ.", field: "role" },
          { status: 400 }
        );
      }
      updateData.role = normalizedRole;
    }

    if (typeof fullName === "string") {
      const trimmedName = fullName.trim();
      if (!trimmedName) {
        return NextResponse.json(
          { success: false, error: "Họ và tên không được để trống.", field: "fullName" },
          { status: 400 }
        );
      }
      updateData.fullName = trimmedName;
    }

    if (typeof email === "string") {
      const normalizedEmail = email.toLowerCase().trim();
      if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        return NextResponse.json(
          { success: false, error: "Địa chỉ Email không hợp lệ.", field: "email" },
          { status: 400 }
        );
      }
      const duplicate = await prisma.user.findFirst({
        where: { email: normalizedEmail, id: { not: targetId } },
        select: { id: true, fullName: true },
      });
      if (duplicate) {
        return NextResponse.json(
          {
            success: false,
            error: `Email "${normalizedEmail}" đã được sử dụng bởi ${duplicate.fullName}.`,
            field: "email",
          },
          { status: 409 }
        );
      }
      updateData.email = normalizedEmail;
    }

    if (phone !== undefined) {
      const trimmedPhone = typeof phone === "string" ? phone.trim() : "";
      if (trimmedPhone && !/^[0-9+\-\s().]{8,20}$/.test(trimmedPhone)) {
        return NextResponse.json(
          { success: false, error: "Số điện thoại không hợp lệ (8–20 ký tự số).", field: "phone" },
          { status: 400 }
        );
      }
      updateData.phone = trimmedPhone || null;
    }

    if (typeof newPassword === "string" && newPassword.length > 0) {
      if (newPassword.length < 8) {
        return NextResponse.json(
          {
            success: false,
            error: "Mật khẩu mới phải có ít nhất 8 ký tự.",
            field: "newPassword",
          },
          { status: 400 }
        );
      }
      updateData.passwordHash = hashPassword(newPassword);
    }

    const updated = await prisma.user.update({
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

    return NextResponse.json({
      success: true,
      message: "Cập nhật tài khoản thành công",
      data: updated,
    });
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json(
      { success: false, error: "Không thể cập nhật người dùng" },
      { status: 500 }
    );
  }
}
