import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Helper chuyển đổi trạng thái thành mô tả thân thiện cho ứng viên (Tuân thủ Data Privacy NFR-SEC-04)
function getCandidateStageInfo(stage: string, interviewDetails?: {
  date: Date | null;
  format: string | null;
  location: string | null;
  notes: string | null;
}) {
  switch (stage) {
    case "NEW":
      return {
        title: "Đã tiếp nhận hồ sơ",
        stepIndex: 1,
        statusColor: "blue",
        description:
          "Hồ sơ của bạn đã được ghi nhận trên hệ thống tuyển dụng RecoverX. Đội ngũ tuyển dụng sẽ xem xét thông tin trong thời gian sớm nhất.",
      };
    case "SCREENING":
      return {
        title: "Đang sàng lọc tiêu chuẩn",
        stepIndex: 2,
        statusColor: "amber",
        description:
          "Hồ sơ của bạn đã vượt qua bước nộp ban đầu và đang được chuyên viên tuyển dụng rà soát tiêu chuẩn năng lực chuyên môn.",
      };
    case "INTERVIEW":
      return {
        title: "Vòng phỏng vấn chuyên môn",
        stepIndex: 3,
        statusColor: "purple",
        description: interviewDetails?.date
          ? `Bạn đã được xếp lịch phỏng vấn vào lúc ${new Date(
            interviewDetails.date
          ).toLocaleString("vi-VN")}. Vui lòng kiểm tra email thư mời chi tiết.`
          : "Chúc mừng bạn đã vượt qua vòng sơ tuyển! Chuyên viên nhân sự đang sắp xếp lịch phỏng vấn và sẽ gửi email thông báo cụ thể.",
        hasInterview: !!interviewDetails?.date,
        interviewDate: interviewDetails?.date,
        interviewFormat: interviewDetails?.format,
        interviewLocation: interviewDetails?.location,
        interviewNotes: interviewDetails?.notes,
      };
    case "HIRED":
      return {
        title: "Trúng tuyển chính thức",
        stepIndex: 4,
        statusColor: "emerald",
        description:
          "Chúc mừng bạn đã hoàn thành xuất sắc các vòng phỏng vấn và trúng tuyển! Bộ phận Nhân sự sẽ gửi Thư mời nhận việc (Offer Letter) và liên hệ qua điện thoại.",
      };
    case "REJECTED":
      return {
        title: "Lưu trữ hồ sơ nhân tài",
        stepIndex: 4,
        statusColor: "slate",
        description:
          "Cảm ơn bạn đã dành thời gian ứng tuyển vào công ty. Dù hiện tại chưa thể đồng hành ở vị trí này, thông tin của bạn đã được bảo lưu an toàn trong Kho Nhân Tài để ưu tiên liên hệ cho các dự án tiếp theo.",
      };
    default:
      return {
        title: "Đang xử lý hồ sơ",
        stepIndex: 1,
        statusColor: "slate",
        description: "Hồ sơ của bạn đang được xử lý trong quy trình tuyển dụng.",
      };
  }
}

// Xử lý tra cứu hồ sơ (Hỗ trợ cả GET qua Query params hoặc POST qua JSON body)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, identifier } = body;

    if (!email || !email.trim()) {
      return NextResponse.json(
        { success: false, error: "Vui lòng nhập địa chỉ Email bạn đã dùng khi ứng tuyển" },
        { status: 400 }
      );
    }

    if (!identifier || !identifier.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Vui lòng nhập Mã đơn ứng tuyển (VD: #4 hoặc 4) hoặc Số điện thoại",
        },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanId = identifier.trim().replace(/^#/, "");
    const numericAppId = /^\d+$/.test(cleanId) ? parseInt(cleanId, 10) : null;

    // Tìm ứng viên theo Email
    const candidate = await prisma.candidate.findFirst({
      where: {
        email: cleanEmail,
      },
      include: {
        applications: {
          include: {
            job: {
              select: {
                id: true,
                title: true,
                department: true,
                location: true,
                status: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!candidate || candidate.applications.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Không tìm thấy hồ sơ nào ứng tuyển với địa chỉ email này. Vui lòng kiểm tra lại email.",
        },
        { status: 404 }
      );
    }

    // Đối chiếu theo Mã đơn (Application ID) hoặc Số điện thoại
    let matchedApp = null;

    if (numericAppId) {
      matchedApp = candidate.applications.find((app) => app.id === numericAppId);
    }

    // Nếu không khớp ID hoặc identifier là số điện thoại, thử đối soát với số điện thoại ứng viên
    if (!matchedApp) {
      const candPhoneDigits = candidate.phone.replace(/\D/g, "");
      const inputPhoneDigits = cleanId.replace(/\D/g, "");
      if (
        candPhoneDigits.length >= 7 &&
        inputPhoneDigits.length >= 7 &&
        candPhoneDigits.endsWith(inputPhoneDigits.slice(-7))
      ) {
        // Lấy đơn mới nhất của ứng viên
        matchedApp = candidate.applications[0];
      }
    }

    if (!matchedApp) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Thông tin Email khớp nhưng không tìm thấy Mã hồ sơ hoặc Số điện thoại tương ứng. Vui lòng kiểm tra lại mã số trong thư xác nhận ứng tuyển.",
        },
        { status: 404 }
      );
    }

    // Lấy thông tin trạng thái thân thiện (KHÔNG để lộ điểm AI hay đánh giá nhạy cảm)
    const stageInfo = getCandidateStageInfo(matchedApp.currentStage, {
      date: matchedApp.interviewDate,
      format: matchedApp.interviewFormat,
      location: matchedApp.interviewLocation,
      notes: matchedApp.interviewNotes,
    });

    // Cấu trúc 4 bước hành trình tuyển dụng
    const timeline = [
      {
        step: 1,
        title: "Tiếp nhận hồ sơ",
        date: matchedApp.createdAt,
        status: "COMPLETED",
        description: "Hệ thống đã ghi nhận CV và thông tin liên hệ.",
      },
      {
        step: 2,
        title: "Sàng lọc tiêu chuẩn CV",
        date: matchedApp.stageUpdatedAt,
        status:
          matchedApp.currentStage === "NEW"
            ? "IN_PROGRESS"
            : ["SCREENING", "INTERVIEW", "HIRED", "REJECTED"].includes(
              matchedApp.currentStage
            )
              ? "COMPLETED"
              : "WAITING",
        description: "Đối chiếu kinh nghiệm và năng lực chuyên môn.",
      },
      {
        step: 3,
        title: "Phỏng vấn chuyên môn",
        date: matchedApp.interviewDate || null,
        status:
          matchedApp.currentStage === "INTERVIEW"
            ? "IN_PROGRESS"
            : matchedApp.currentStage === "HIRED"
              ? "COMPLETED"
              : matchedApp.currentStage === "REJECTED"
                ? "SKIPPED"
                : "WAITING",
        description: matchedApp.interviewDate
          ? `Lịch hẹn: ${new Date(matchedApp.interviewDate).toLocaleString("vi-VN")}`
          : "Trao đổi kỹ năng & văn hóa doanh nghiệp.",
      },
      {
        step: 4,
        title: "Quyết định & Kết quả",
        date: null,
        status:
          matchedApp.currentStage === "HIRED"
            ? "COMPLETED"
            : matchedApp.currentStage === "REJECTED"
              ? "ARCHIVED"
              : "WAITING",
        description:
          matchedApp.currentStage === "HIRED"
            ? "Đã trúng tuyển và ban hành Thư mời nhận việc."
            : matchedApp.currentStage === "REJECTED"
              ? "Lưu hồ sơ vào Kho tài năng dự phòng."
              : "Chờ quyết định chính thức từ Hội đồng Tuyển dụng.",
      },
    ];

    return NextResponse.json({
      success: true,
      data: {
        applicationId: matchedApp.id,
        candidateName: candidate.fullName,
        candidateEmail: candidate.email,
        candidatePhone: candidate.phone ? `${candidate.phone.slice(0, 3)}****${candidate.phone.slice(-3)}` : "",
        appliedAt: matchedApp.createdAt,
        jobTitle: matchedApp.job.title,
        jobDepartment: matchedApp.job.department,
        jobLocation: matchedApp.job.location,
        currentStage: matchedApp.currentStage,
        stageInfo,
        timeline,
      },
    });
  } catch (error: any) {
    console.error("Lỗi tra cứu hồ sơ ứng tuyển:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi hệ thống khi tra cứu hồ sơ: " + error.message },
      { status: 500 }
    );
  }
}

// GET handler cho phép tra cứu qua query parameters
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email") || "";
  const identifier = searchParams.get("id") || searchParams.get("identifier") || searchParams.get("phone") || "";

  if (!email || !identifier) {
    return NextResponse.json(
      { success: false, error: "Vui lòng cung cấp email và mã hồ sơ/số điện thoại để tra cứu." },
      { status: 400 }
    );
  }

  // Chuyển hướng sang logic POST
  const fakeReq = new Request("http://localhost/api/tracker", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, identifier }),
  });
  return POST(fakeReq);
}

