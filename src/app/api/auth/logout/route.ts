import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/lib/better-auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    await auth.api.signOut({ headers: req.headers });
  } catch {
    // Phiên có thể đã hết hạn hoặc không tồn tại
  }

  try {
    cookies().delete("ats_user_session");
  } catch {
    // ignore
  }

  return NextResponse.json({ success: true, message: "Đã đăng xuất" });
}
