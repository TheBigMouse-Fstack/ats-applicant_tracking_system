import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// POST: Tác vụ Dọn dẹp Vòng đời Dữ liệu Lưu trữ (BRL-10 Data Retention Purge)
// Chỉ Admin có thẩm quyền gọi; xóa vĩnh viễn hồ sơ REJECTED đã quá hạn 180 ngày (hoặc số ngày mô phỏng)
export async function POST(req: Request) {
  try {
    const sessionUser = getSessionUser();
    if (!sessionUser) {
      return NextResponse.json(
        { success: false, error: "Yêu cầu đăng nhập tài khoản Quản trị viên để thực hiện thao tác này" },
        { status: 401 }
      );
    }

    // RBAC: Chỉ duy nhất ADMIN mới có quyền thực hiện Purge dữ liệu
    if (sessionUser.role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          error: "Truy cập bị từ chối: Chỉ Quản trị viên (Admin) mới có quyền thực thi tác vụ dọn dẹp vòng đời hồ sơ BRL-10.",
        },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const days = typeof body.days === "number" && body.days >= 0 ? body.days : 180;
    const dryRun = Boolean(body.dryRun);

    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Tìm tất cả các hồ sơ ở trạng thái REJECTED đã lưu quá cutoffDate
    const expiredApps = await prisma.application.findMany({
      where: {
        currentStage: "REJECTED",
        stageUpdatedAt: {
          lte: cutoffDate,
        },
      },
      include: {
        candidate: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        job: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    const summaryItems = expiredApps.map((app) => ({
      applicationId: app.id,
      candidateId: app.candidateId,
      candidateName: app.candidate.fullName,
      candidateEmail: app.candidate.email,
      jobTitle: app.job.title,
      stageUpdatedAt: app.stageUpdatedAt,
      daysInPool: Math.floor(
        (Date.now() - new Date(app.stageUpdatedAt).getTime()) / (1000 * 60 * 60 * 24)
      ),
    }));

    if (dryRun) {
      return NextResponse.json({
        success: true,
        dryRun: true,
        retentionDays: days,
        cutoffDate: cutoffDate.toISOString(),
        eligibleCount: expiredApps.length,
        items: summaryItems,
        message: `Chế độ mô phỏng: Tìm thấy ${expiredApps.length} hồ sơ từ chối đã lưu trữ quá ${days} ngày đủ điều kiện dọn dẹp theo BRL-10.`,
      });
    }

    // Thực hiện Hard Delete vĩnh viễn
    const appIds = expiredApps.map((a) => a.id);
    let deletedAppsCount = 0;
    let deletedCandidatesCount = 0;

    if (appIds.length > 0) {
      // 1. Xóa các đơn ứng tuyển hết hạn
      const deleteResult = await prisma.application.deleteMany({
        where: {
          id: { in: appIds },
        },
      });
      deletedAppsCount = deleteResult.count;

      // 2. Dọn dẹp ứng viên mồ côi (nếu không còn đơn ứng tuyển nào khác)
      const candidateIds = Array.from(new Set(expiredApps.map((a) => a.candidateId)));
      for (const cId of candidateIds) {
        const remaining = await prisma.application.count({
          where: { candidateId: cId },
        });
        if (remaining === 0) {
          await prisma.candidate.delete({ where: { id: cId } }).catch(() => {});
          deletedCandidatesCount++;
        }
      }
    }

    console.log(
      `[BRL-10 AUDIT] Admin ${sessionUser.email} executed Data Retention Purge: deleted ${deletedAppsCount} applications, ${deletedCandidatesCount} orphan candidates older than ${days} days.`
    );

    return NextResponse.json({
      success: true,
      dryRun: false,
      retentionDays: days,
      cutoffDate: cutoffDate.toISOString(),
      purgedApplicationsCount: deletedAppsCount,
      purgedCandidatesCount: deletedCandidatesCount,
      items: summaryItems,
      message: `Đã dọn dẹp thành công ${deletedAppsCount} hồ sơ quá hạn ${days} ngày khỏi hệ thống tuân thủ quy tắc BRL-10.`,
    });
  } catch (error: any) {
    console.error("Lỗi khi thực hiện dọn dẹp Talent Pool (BRL-10):", error);
    return NextResponse.json(
      { success: false, error: "Lỗi hệ thống khi dọn dẹp dữ liệu: " + error.message },
      { status: 500 }
    );
  }
}
