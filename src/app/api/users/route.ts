import { NextResponse } from "next/server";
import {
  listInternalUsers,
  createInternalUser,
  updateInternalUser,
  isDalError,
  toHttpErrorResponse,
} from "@/server/dal";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const users = await listInternalUsers();
    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    if (isDalError(error)) return toHttpErrorResponse(error, req);
    console.error("Fetch users error:", error);
    return NextResponse.json(
      { success: false, error: "Không thể lấy danh sách người dùng" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const created = await createInternalUser(body || {});
    return NextResponse.json({
      success: true,
      message: "Tạo tài khoản người dùng thành công",
      data: created,
    });
  } catch (error) {
    if (isDalError(error)) return toHttpErrorResponse(error, req);
    console.error("Create user error:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi hệ thống khi tạo người dùng" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const updated = await updateInternalUser(body || {});
    return NextResponse.json({
      success: true,
      message: "Cập nhật tài khoản thành công",
      data: updated,
    });
  } catch (error) {
    if (isDalError(error)) return toHttpErrorResponse(error, req);
    console.error("Update user error:", error);
    return NextResponse.json(
      { success: false, error: "Không thể cập nhật người dùng" },
      { status: 500 }
    );
  }
}
