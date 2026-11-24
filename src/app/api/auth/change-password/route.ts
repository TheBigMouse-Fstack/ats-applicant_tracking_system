import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, verifyPassword, hashPassword } from "@/lib/auth";

export async function PATCH(req: Request) {
  try {
    const sessionUser = getSessionUser();
    if (!sessionUser) {
      return NextResponse.json(
        { success: false, error: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { currentPassword, newPassword, confirmPassword } = body || {};

    if (!currentPassword) {
      return NextResponse.json(
        { success: false, error: "Vui lòng nhập mật khẩu hiện tại.", field: "currentPassword" },
        { status: 400 }
      );
    }

    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 8) {
      return NextResponse.json(
        { success: false, error: "Mật khẩu mới phải có ít nhất 8 ký tự.", field: "newPassword" },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: "Xác nhận mật khẩu mới không khớp.", field: "confirmPassword" },
        { status: 400 }
      );
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        {
          success: false,
          error: "Mật khẩu mới không được trùng với mật khẩu hiện tại.",
          field: "newPassword",
        },
        { status: 400 }
      );
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: { id: true, passwordHash: true, isActive: true },
    });

    if (!dbUser || !dbUser.isActive) {
      return NextResponse.json(
        { success: false, error: "Tài khoản không tồn tại hoặc đã bị khóa." },
        { status: 403 }
      );
    }

    const isCurrentValid = verifyPassword(currentPassword, dbUser.passwordHash);
    if (!isCurrentValid) {
      return NextResponse.json(
        { success: false, error: "Mật khẩu hiện tại không chính xác.", field: "currentPassword" },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { id: dbUser.id },
      data: { passwordHash: hashPassword(newPassword) },
    });

    return NextResponse.json({
      success: true,
      message: "Đổi mật khẩu thành công.",
    });
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json(
      { success: false, error: "Không thể cập nhật mật khẩu. Vui lòng thử lại." },
      { status: 500 }
    );
  }
}
