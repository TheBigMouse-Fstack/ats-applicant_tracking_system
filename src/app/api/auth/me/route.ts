import { NextResponse } from "next/server";
import { getCurrentSession } from "@/server/dal";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sessionUser = await getCurrentSession();

    if (!sessionUser) {
      return NextResponse.json({
        success: false,
        user: null,
      });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: sessionUser.id,
        fullName: sessionUser.fullName,
        email: sessionUser.email,
        role: sessionUser.role,
      },
    });
  } catch {
    return NextResponse.json({ success: false, user: null });
  }
}
