import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/realtime/notifications?since=<ISOString>
 * Endpoint thăm dò siêu nhẹ (Ultra-lightweight realtime polling)
 * Phát hiện ngay lập tức các hồ sơ ứng viên mới nộp vào hệ thống
 */
export async function GET(req: NextRequest) {
  try {
    const user = getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Chưa đăng nhập" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sinceParam = searchParams.get("since");

    // Mặc định kiểm tra trong vòng 15 giây vừa qua nếu không truyền `since`
    const sinceDate = sinceParam ? new Date(sinceParam) : new Date(Date.now() - 15000);

    const newApplications = await prisma.application.findMany({
      where: {
        createdAt: {
          gt: sinceDate,
        },
      },
      include: {
        candidate: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
        job: {
          select: {
            id: true,
            title: true,
            department: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      count: newApplications.length,
      applications: newApplications,
    });
  } catch (error: any) {
    console.error("Lỗi Realtime Notifications:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi máy chủ khi thăm dò thông báo thời gian thực" },
      { status: 500 }
    );
  }
}
