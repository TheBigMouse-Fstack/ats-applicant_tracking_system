"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type Locale = "vi" | "en";

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: (key: string, fallback?: string) => string;
}

// Từ điển chuẩn hóa song ngữ (Gọn gàng, đúng thuật ngữ tuyển dụng, không giải thích dài dòng)
export const dictionary: Record<Locale, Record<string, string>> = {
  vi: {
    // Thanh điều hướng (Navbar)
    "nav.brand": "ATS",
    "nav.brandSubtitle": "Applicant Tracking System",
    "nav.internal": "Nội bộ",
    "nav.dashboard": "Tổng quan",
    "nav.pipeline": "Pipeline",
    "nav.candidates": "Ứng viên",
    "nav.jobs": "Tin tuyển dụng",
    "nav.talentPool": "Kho nhân tài",
    "nav.users": "Người dùng",
    "nav.logout": "Đăng xuất",

    // Vòng tuyển dụng (Stages)
    "stage.NEW": "Mới tiếp nhận",
    "stage.SCREENING": "Sàng lọc",
    "stage.INTERVIEW": "Phỏng vấn",
    "stage.OFFER": "Đề nghị",
    "stage.HIRED": "Tuyển chọn",
    "stage.REJECTED": "Từ chối",

    // Mô tả từng vòng tuyển
    "stageDesc.NEW": "CV nộp qua cổng hoặc tải lên",
    "stageDesc.SCREENING": "Đánh giá sơ bộ hồ sơ",
    "stageDesc.INTERVIEW": "Đang đánh giá vòng chuyên môn",
    "stageDesc.OFFER": "Gửi thư mời & thương lượng đãi ngộ",
    "stageDesc.HIRED": "Đã hoàn thành đánh giá phỏng vấn",
    "stageDesc.REJECTED": "Tạm lưu trữ hồ sơ chưa phù hợp",

    // Menu Avatar Người Dùng (User Menu)
    "userMenu.language": "Ngôn ngữ",
    "userMenu.settings": "Cài đặt & Giao diện",
    "userMenu.roleAdmin": "Quản Trị Viên",
    "userMenu.roleHr": "Chuyên Viên Tuyển Dụng",
    "userMenu.roleManager": "Quản Lý Chuyên Môn",
    "userMenu.logout": "Đăng xuất tài khoản",

    // Drawer Hành động
    "drawer.moveStage": "Chuyển vòng tuyển:",
    "drawer.loading": "Đang tải hồ sơ...",
    "drawer.current": "Hiện tại",

    // Lọc & Thao tác Kanban
    "kanban.searchPlaceholder": "Tìm tên, email hoặc kỹ năng...",
    "kanban.allJobs": "Tất cả vị trí",
    "kanban.allSources": "Tất cả nguồn",
    "kanban.starredOnly": "Có gắn sao",
    "kanban.unviewedOnly": "Chưa xem",
    "kanban.addCandidate": "+ Thêm ứng viên",
    "kanban.exportCsv": "Xuất CSV",
    "kanban.loadMore": "Tải thêm hồ sơ",
    "kanban.slaWarning": "Vi phạm SLA",
    "kanban.hmNotice": "Chế độ đánh giá chuyên môn: Xem hồ sơ và ghi nhận đánh giá phỏng vấn.",
    "kanban.transitionBlocked": "Chưa thể chuyển giai đoạn",
    "kanban.pipelineNotice": "Thông báo tuyển dụng",
    "kanban.systemError": "Thông báo hệ thống",

    // Tab trong CandidateDrawer
    "tab.overview": "Hồ sơ",
    "tab.jd": "Tiêu chuẩn JD",
    "tab.cv": "CV Gốc",
    "tab.interview": "Lịch phỏng vấn",
    "tab.evaluation": "Phiếu đánh giá",
    "tab.history": "Nhật ký",

    // Mức độ phù hợp AI (AI Match Tier)
    "tier.HIGH": "Phù hợp cao",
    "tier.MEDIUM": "Tiềm năng",
    "tier.LOW": "Phù hợp thấp",
    "tier.PENDING": "Đang đối chiếu",

    // Lịch phỏng vấn (Interview Tab)
    "interview.title": "Lịch Hẹn Phỏng Vấn",
    "interview.subtitle": "Quản lý lịch hẹn, hình thức họp và thư mời ứng viên.",
    "interview.hasSchedule": "Lịch hẹn đã xếp",
    "interview.noSchedule": "Chưa xếp lịch phỏng vấn",
    "interview.format": "Hình thức phỏng vấn",
    "interview.online": "Trực tuyến (Online)",
    "interview.onlineDesc": "Google Meet, Zoom, MS Teams",
    "interview.offline": "Tại văn phòng (Offline)",
    "interview.offlineDesc": "Phòng họp trụ sở công ty",
    "interview.time": "Thời gian phỏng vấn",
    "interview.locationOnline": "Đường dẫn phòng họp online *",
    "interview.locationOffline": "Địa điểm & phòng họp trực tiếp *",
    "interview.notesCandidate": "Ghi chú gửi ứng viên (trong email)",
    "interview.notesInterviewer": "Lưu ý hội đồng phỏng vấn (nội bộ)",
    "interview.postNotes": "Biên bản sau phỏng vấn",
    "interview.saveNotes": "Lưu biên bản",
    "interview.emailMethod": "Phương thức xử lý thư mời",
    "interview.emailAuto": "Gửi thư mời tự động",
    "interview.emailAutoDesc": "Tự động gửi thư mời & đồng bộ lịch hẹn cho ứng viên",
    "interview.emailCustom": "Tự viết mail & lưu trữ",
    "interview.emailCustomDesc": "Soạn thư tùy chỉnh và lưu vào hồ sơ hệ thống",
    "interview.emailNone": "Không gửi email",
    "interview.emailNoneDesc": "Đã liên hệ trực tiếp, chỉ lưu lịch nội bộ",
    "interview.customSubject": "Tiêu đề Email *",
    "interview.customBody": "Nội dung Email lưu trữ *",
    "interview.saveSchedule": "Xác nhận & Lưu lịch hẹn",
    "interview.updateSchedule": "Lưu thay đổi lịch hẹn",
    "interview.cancelSchedule": "Hủy lịch hẹn",
    "interview.joinMeeting": "Vào phòng họp",
    "interview.copyEmail": "Sao chép thư",
    "interview.quickSlots": "Chọn nhanh:",

    // Phiếu đánh giá (Scorecard)
    "scorecard.title": "Phiếu Đánh Giá Phỏng Vấn",
    "scorecard.scoreFormula": "Chuyên môn 40% • Giao tiếp 30% • Văn hóa 30%",
    "scorecard.newTitle": "Nhập Phiếu Đánh Giá Mới",
    "scorecard.round": "Vòng Phỏng Vấn",
    "scorecard.level": "Khuyến Nghị Cấp Bậc (Level)",
    "scorecard.criteria": "Tiêu Chí Đánh Giá Năng Lực",
    "scorecard.technical": "Kỹ năng chuyên môn (Trọng số 40%)",
    "scorecard.technicalPlaceholder": "Nhận xét chuyên môn: Kiến trúc, giải thuật, bài test...",
    "scorecard.communication": "Kỹ năng giao tiếp & thuyết trình (Trọng số 30%)",
    "scorecard.communicationPlaceholder": "Nhận xét giao tiếp: Diễn đạt mạch lạc, phản biện, ngoại ngữ...",
    "scorecard.culture": "Độ phù hợp văn hóa & làm việc nhóm (Trọng số 30%)",
    "scorecard.culturePlaceholder": "Nhận xét văn hóa: Tinh thần hợp tác, kỷ luật, chủ động...",
    "scorecard.overallScore": "Điểm Tổng Hợp",
    "scorecard.recommendation": "Khuyến Nghị Tuyển Dụng",
    "scorecard.recommendStrongHire": "🌟 Xuất sắc — Tuyển ngay (Strong Hire)",
    "scorecard.recommendHire": "✅ Đạt chuẩn — Đề xuất tuyển (Hire)",
    "scorecard.recommendReject": "⚠️ Chưa đạt — Cân nhắc loại (No Hire)",
    "scorecard.recommendStrongReject": "⛔ Không phù hợp (Strong No Hire)",
    "scorecard.strengths": "Điểm mạnh nổi bật (Căn cứ quyết định)",
    "scorecard.strengthsPlaceholder": "Căn cứ nổi bật để đánh giá...",
    "scorecard.weaknesses": "Điểm cần cải thiện / Đào tạo thêm",
    "scorecard.weaknessesPlaceholder": "Điểm cần lưu ý hoặc đào tạo bổ sung...",
    "scorecard.conclusion": "Kết luận chung",
    "scorecard.conclusionPlaceholder": "Tóm tắt ngắn gọn căn cứ tuyển hoặc loại...",
    "scorecard.save": "Lưu Phiếu Đánh Giá",
    "scorecard.saving": "Đang lưu phiếu...",
    "scorecard.cancel": "Hủy bỏ",
    "scorecard.submittedList": "Danh Sách Phiếu Đánh Giá Đã Nộp",
    "scorecard.noScorecard": "Chưa có phiếu đánh giá nào được ghi nhận cho hồ sơ này.",
    "scorecard.qualified": "Đủ điều kiện Tuyển chọn",
    "scorecard.needScorecard": "Cần phiếu đạt chuẩn trước khi Tuyển chọn",

    // Modal từ chối (RejectReasonModal)
    "reject.title": "Xác Nhận Từ Chối Hồ Sơ",
    "reject.quickReasons": "Chọn nhanh lý do phổ biến",
    "reject.detailReason": "Lý do từ chối chi tiết",
    "reject.placeholder": "Nhập lý do cụ thể (tối thiểu 5 ký tự)...",
    "reject.confirmBtn": "Xác Nhận Từ Chối",
    "reject.cancelBtn": "Hủy bỏ",
    "reject.minError": "Vui lòng nhập lý do cụ thể (tối thiểu 5 ký tự).",

    // Bảng điều hành (Operational Dashboard)
    "dashboard.title": "Bảng Điều Hành Tuyển Dụng",
    "dashboard.funnelTitle": "Phễu Chuyển Đổi Tuyển Dụng",
    "dashboard.funnelDesc": "Tỷ lệ chuyển đổi và phân bổ hồ sơ qua từng vòng tuyển dụng.",
    "dashboard.totalCandidates": "Tổng hồ sơ",
    "dashboard.activeJobs": "vị trí đang mở",
    "dashboard.slaBreaches": "Hồ sơ quá hạn SLA",
    "dashboard.inInterview": "Đang phỏng vấn",
    "dashboard.hired": "Đã Tuyển chọn",
    "dashboard.activeUsers": "Tài khoản hoạt động",

    // Nút chung & Thông báo
    "common.save": "Lưu",
    "common.cancel": "Hủy",
    "common.edit": "Chỉnh sửa",
    "common.delete": "Xóa",
    "common.close": "Đóng",
    "common.confirm": "Xác nhận",
    "common.loading": "Đang xử lý...",
    "common.success": "Thao tác thành công",
    "common.viewDetails": "Xem chi tiết",
    "common.download": "Tải về",

    // Cổng tuyển dụng công khai (Public Careers)
    "public.home": "Trang chủ",
    "public.jobs": "Tuyển dụng",
    "public.track": "Tra cứu hồ sơ",
    "public.internalPortal": "Cổng Tuyển Dụng Nội Bộ",
    "public.heroTitle": "Khởi Đầu Sự Nghiệp Công Nghệ Tại RecoverX",
    "public.heroSubtitle": "Môi trường chuyên nghiệp, dự án quy mô toàn cầu và chế độ đãi ngộ hàng đầu.",
    "public.exploreJobs": "Khám phá cơ hội",
    "public.applyNow": "Ứng tuyển ngay",
    "public.uploadResume": "Tải lên tệp CV (PDF/DOCX)",
    "public.fullName": "Họ và tên *",
    "public.email": "Email liên hệ *",
    "public.phone": "Số điện thoại *",
    "public.submitApplication": "Gửi hồ sơ ứng tuyển",

    // Trang chủ RecoverX (Homepage)
    "home.nav.about": "Về chúng tôi",
    "home.nav.solutions": "Dịch vụ & Giải pháp",
    "home.nav.culture": "Văn hóa & Đãi ngộ",
    "home.nav.jobs": "Tuyển dụng",
    "home.nav.contact": "Liên hệ",
    "home.nav.cta": "Cơ Hội Tuyển Dụng",
    "home.hero.title1": "Tiên Phong Kiến Tạo Phần Mềm &",
    "home.hero.title2": "Giải Pháp Công Nghệ Cao",
    "home.hero.subtitle": "RecoverX cung cấp dịch vụ kỹ thuật phần mềm chuẩn mực Châu Âu, hiện đại hóa Cloud, kiến trúc Microservices và đảm bảo chất lượng toàn diện (QA) cho các tập đoàn tài chính, y tế và công nghệ hàng đầu thế giới.",
    "home.hero.ctaJobs": "Gia Nhập Đội Ngũ Kỹ Sư RecoverX",
    "home.hero.ctaContact": "Liên Hệ Hợp Tác Kỹ Thuật",
    "home.stats.delivery": "Tỷ lệ giao hàng đúng hạn",
    "home.stats.clients": "Khách hàng doanh nghiệp toàn cầu",
    "home.stats.engineers": "Kỹ sư công nghệ tinh hoa",
    "home.stats.uptime": "Thời gian sẵn sàng hệ thống",
    "home.solutions.badge": "HỆ SINH THÁI DỊCH VỤ",
    "home.solutions.title": "Giải Pháp Công Nghệ & Kỹ Thuật Đỉnh Cao",
    "home.solutions.desc": "Được thiết kế để giải quyết các bài toán kỹ thuật phức tạp nhất với hiệu năng vượt trội và độ tin cậy tuyệt đối.",
    "home.culture.badge": "MÔI TRƯỜNG LÀM VIỆC",
    "home.culture.title": "Văn Hóa Tinh Hoa & Đãi Ngộ Hàng Đầu",
    "home.culture.desc": "Tại RecoverX, con người là tài sản quý giá nhất. Chúng tôi kiến tạo không gian làm việc truyền cảm hứng, khuyến khích sáng tạo và trao quyền tối đa.",
    "home.contact.badge": "KẾT NỐI HỢP TÁC",
    "home.contact.title": "Liên Hệ Với Đội Ngũ Chuyên Gia RecoverX",
    "home.contact.desc": "Hãy để lại thông tin để cùng thảo luận về giải pháp kỹ thuật, hợp tác dự án hoặc cơ hội nghề nghiệp.",

    // Trang Tuyển dụng (Jobs Page)
    "jobs.badge": "Cơ Hội Phát Triển Sự Nghiệp Công Nghệ 2026",
    "jobs.title": "Xây Dựng Sự Nghiệp Đỉnh Cao Cùng RecoverX",
    "jobs.subtitle": "Khám phá các vị trí công việc đa dạng từ cấp bậc Trainee, Junior đến Senior và Tech Lead trong môi trường công nghệ hiện đại chuẩn quốc tế.",
    "jobs.departments": "Phòng ban:",
    "jobs.listTitle": "Các Vị Trí Đang Tuyển Dụng",
    "jobs.listSubtitle": "Hồ sơ ứng tuyển được bảo mật thông tin tuyệt đối",
    "jobs.emptyTitle": "Hiện chưa có vị trí nào đang mở tuyển",
    "jobs.emptyDesc": "Vui lòng quay lại sau hoặc liên hệ bộ phận tuyển dụng.",
    "jobs.trackerBanner.title": "Bạn đã nộp hồ sơ ứng tuyển tại RecoverX?",
    "jobs.trackerBanner.desc": "Tra cứu tiến độ xét duyệt hồ sơ, lịch phỏng vấn và phản hồi nhanh chóng theo thời gian thực.",
    "jobs.trackerBanner.button": "Tra Cứu Hồ Sơ Ngay",
    "jobs.salary": "Mức lương:",
    "jobs.experience": "Kinh nghiệm:",
    "jobs.location": "Địa điểm:",
    "jobs.negotiable": "Thỏa thuận",
    "jobs.years": "năm",
    "jobs.viewJob": "Chi tiết & Ứng tuyển",

    // Trang Tra cứu Hồ sơ (Tracker Page)
    "tracker.badge": "Tra Cứu Hồ Sơ",
    "tracker.heading": "Tra Cứu Tiến Độ Tuyển Dụng Theo Thời Gian Thực",
    "tracker.subheading": "Nhập địa chỉ Email cùng Số điện thoại hoặc Mã đơn ứng tuyển để theo dõi trạng thái hồ sơ của bạn một cách minh bạch.",
    "tracker.emailLabel": "1. Email Ứng Tuyển",
    "tracker.emailPlaceholder": "nhap_email_cua_ban@example.com",
    "tracker.idLabel": "2. Số Điện Thoại hoặc Mã Ứng Tuyển",
    "tracker.idPlaceholder": "0912345678 hoặc mã #4",
    "tracker.searchButton": "Tra Cứu Hồ Sơ",
    "tracker.searching": "Đang tra cứu dữ liệu...",
    "tracker.backToJobs": "Xem việc làm",
    "tracker.resultTitle": "Thông Tin Hồ Sơ Ứng Tuyển",
    "tracker.position": "Vị trí tuyển dụng",
    "tracker.appliedAt": "Thời gian nộp đơn",
    "tracker.currentStatus": "Trạng thái hiện tại",
    "tracker.timelineTitle": "Hành Trình Tuyển Dụng Của Bạn",
    "tracker.step1": "Tiếp nhận hồ sơ",
    "tracker.step2": "Sàng lọc tiêu chuẩn",
    "tracker.step3": "Phỏng vấn chuyên môn",
    "tracker.step4": "Quyết định & Kết quả",

    // Danh sách ứng viên (Candidate Directory)
    "candidates.title": "Danh Sách Ứng Viên",
    "candidates.countSubtitle": "hồ sơ ứng viên",
    "candidates.searchPlaceholder": "Tìm tên, email hoặc kỹ năng (VD: Java, React, BA)...",
    "candidates.allJobs": "Tất cả vị trí",
    "candidates.allStages": "Tất cả giai đoạn",
    "candidates.starred": "Gắn sao",
    "candidates.unviewed": "Chưa xem",
    "candidates.sortNewest": "Mới nhất",
    "candidates.sortOldest": "Cũ nhất",
    "candidates.sortUnviewed": "Chưa xem trước",
    "candidates.sortStarred": "Gắn sao trước",
    "candidates.sortName": "Tên (A - Z)",
    "candidates.thCandidate": "Ứng viên",
    "candidates.thPositionExp": "Vị trí & Kinh nghiệm",
    "candidates.thSkills": "Kỹ năng trích xuất",
    "candidates.thMatch": "Độ phù hợp",
    "candidates.thStatus": "Trạng thái",
    "candidates.yearsExp": "năm kinh nghiệm",
    "candidates.empty": "Không tìm thấy hồ sơ nào phù hợp với điều kiện tìm kiếm.",
    "candidates.addBtn": "Tiếp nhận CV",

    // Quy trình Tuyển dụng (Pipeline)
    "pipeline.title": "Quy Trình Tuyển Dụng",
    "pipeline.descAdmin": "Theo dõi và luân chuyển hồ sơ ứng viên qua 5 giai đoạn.",
    "pipeline.descHr": "Phạm vi HR: Sơ loại hồ sơ mới và chuyển tối đa đến Sàng lọc tiêu chuẩn.",
    "pipeline.descHm": "Phạm vi Hiring Manager: Duyệt Phỏng vấn từ vòng Sàng lọc, đánh giá và quyết định Tuyển chọn.",
    "pipeline.loading": "Đang tải dữ liệu...",
    "pipeline.addCandidate": "Tiếp nhận CV",
    "pipeline.starredOnly": "Gắn sao",
    "pipeline.unviewedOnly": "Chưa xem",
    "pipeline.slaBreach": "Quá hạn SLA",
    "pipeline.highMatch": "Phù hợp cao (≥75%)",
    "pipeline.sortScore": "Điểm AI cao nhất",
    "pipeline.sortSla": "Ưu tiên vi phạm SLA",
    "pipeline.searchTip": "Nhập từ 2 ký tự trở lên để tìm theo Họ tên, Email, SĐT hoặc Kỹ năng.",
    "pipeline.filteringBy": "Đang lọc:",
    "pipeline.keyword": "Từ khóa:",
    "pipeline.foundCandidates": "Tìm thấy {count} hồ sơ",
    "pipeline.resetFilters": "Đặt lại tất cả lọc",
    "pipeline.targetHeadcount": "Chỉ tiêu: {hired}/{target} đã tuyển",
    "pipeline.activeInterviews": "Đang phỏng vấn: {active}/{cap}",
    "pipeline.headcountFull": "Đã tuyển đủ chỉ tiêu — tin tuyển dụng đã đóng",
    "pipeline.interviewCapReached": "Đã đủ hạn mức phỏng vấn cùng lúc",
    "pipeline.noMatch": "Không có hồ sơ khớp",
    "pipeline.emptyColumn": "Chưa có hồ sơ",
    "pipeline.noKeywordMatch": "Không có ứng viên nào khớp từ khóa ở cột này",
    "pipeline.emptyColumnDesc": "Kéo thả hồ sơ vào đây hoặc tiếp nhận ứng viên mới",
    "card.matchedSkill": "Khớp kỹ năng:",
    "card.matchedEmail": "Khớp email:",
    "card.matchedPhone": "Khớp SĐT:",
    "card.suspectedDuplicate": "Nghi trùng hồ sơ",
    "card.mismatchWarning": "Thông tin CV không khớp",
    "card.unviewedTooltip": "Hồ sơ mới chưa xem",

    // Tiếp nhận hồ sơ mới (AddCandidateModal)
    "intake.modalTitle": "Tiếp Nhận Hồ Sơ Mới",
    "intake.modalSubtitle": "Nhập hồ sơ từ LinkedIn, giới thiệu nội bộ hoặc kênh tuyển dụng",
    "intake.jobLabel": "VỊ TRÍ TUYỂN DỤNG *",
    "intake.sourceLabel": "NGUỒN ỨNG VIÊN",
    "intake.cvLabel": "HỒ SƠ CV (.PDF, .DOCX) *",
    "intake.uploadPrompt": "Bấm để tải lên hoặc kéo thả tệp CV vào đây",
    "intake.uploadSub": "Hỗ trợ PDF, DOCX (Tối đa 10MB)",
    "intake.nameLabel": "HỌ VÀ TÊN *",
    "intake.emailLabel": "EMAIL LIÊN HỆ *",
    "intake.phoneLabel": "SỐ ĐIỆN THOẠI *",
    "intake.certLabel": "BẰNG CẤP & CHỨNG CHỈ ĐÍNH KÈM",
    "intake.certOptional": "Tùy chọn • Tối đa 5 ảnh/tệp",
    "intake.certUpload": "Đính kèm ảnh bằng cấp, chứng chỉ (PNG, JPG, PDF)",
    "intake.cancelBtn": "Hủy bỏ",
    "intake.submitBtn": "Tiếp Nhận Hồ Sơ",
    "intake.submitting": "Đang xử lý & phân tích AI...",

    // Quản lý Tin Tuyển Dụng (Jobs Admin)
    "jobsAdmin.title": "Quản Lý Tin Tuyển Dụng",
    "jobsAdmin.subtitle": "Quản lý các vị trí, phòng ban, định biên tuyển dụng và tiêu chuẩn JD",
    "jobsAdmin.createBtn": "+ Tạo Tin Tuyển Dụng",
    "jobsAdmin.thTitle": "Vị trí & Phòng ban",
    "jobsAdmin.thHeadcount": "Định biên",
    "jobsAdmin.thMaxInterviews": "Trần PV cùng lúc",
    "jobsAdmin.thStatus": "Trạng thái",
    "jobsAdmin.thActions": "Thao tác",
    "jobsAdmin.statusActive": "Đang mở",
    "jobsAdmin.statusClosed": "Đã đóng",
    "jobsAdmin.statusDraft": "Bản nháp",

    // Kho Nhân Tài (Talent Pool)
    "talentPool.title": "Kho Nhân Tài",
    "talentPool.subtitle": "Lưu trữ và tái kích hoạt các ứng viên tiềm năng cho các đợt tuyển dụng tiếp theo",
    "talentPool.thCandidate": "Ứng viên",
    "talentPool.thPosition": "Vị trí đã ứng tuyển",
    "talentPool.thReason": "Nhóm lưu trữ",
    "talentPool.thActions": "Thao tác",
    "talentPool.repoolBtn": "Tái kích hoạt",

    // Quản trị Người Dùng (Users Admin)
    "usersAdmin.title": "Quản Trị Người Dùng",
    "usersAdmin.subtitle": "Quản lý danh sách tài khoản, phân quyền vai trò RBAC và trạng thái truy cập",
    "usersAdmin.createBtn": "+ Thêm Người Dùng",
    "usersAdmin.thUser": "Người dùng",
    "usersAdmin.thRole": "Vai trò (RBAC)",
    "usersAdmin.thStatus": "Trạng thái",
    "usersAdmin.thActions": "Thao tác",
  },

  en: {
    // Navigation (Navbar)
    "nav.brand": "ATS",
    "nav.brandSubtitle": "Applicant Tracking System",
    "nav.internal": "Internal",
    "nav.dashboard": "Dashboard",
    "nav.pipeline": "Pipeline",
    "nav.candidates": "Candidates",
    "nav.jobs": "Job Openings",
    "nav.talentPool": "Talent Pool",
    "nav.users": "Users",
    "nav.logout": "Sign Out",

    // Recruitment Stages
    "stage.NEW": "New",
    "stage.SCREENING": "Screening",
    "stage.INTERVIEW": "Interview",
    "stage.OFFER": "Offer",
    "stage.HIRED": "Hired",
    "stage.REJECTED": "Rejected",

    // Stage Descriptions
    "stageDesc.NEW": "Applications submitted or uploaded",
    "stageDesc.SCREENING": "Initial resume screening",
    "stageDesc.INTERVIEW": "Under technical interview evaluation",
    "stageDesc.OFFER": "Offer letter & compensation review",
    "stageDesc.HIRED": "Completed evaluations & hired",
    "stageDesc.REJECTED": "Archived unselected profiles",

    // User Avatar Menu
    "userMenu.language": "Language",
    "userMenu.settings": "Settings & Preferences",
    "userMenu.roleAdmin": "Administrator",
    "userMenu.roleHr": "Talent Acquisition (HR)",
    "userMenu.roleManager": "Hiring Manager (HM)",
    "userMenu.logout": "Sign Out",

    // Drawer Actions
    "drawer.moveStage": "Move pipeline stage:",
    "drawer.loading": "Loading candidate...",
    "drawer.current": "Current",

    // Filters & Actions
    "kanban.searchPlaceholder": "Search by name, email or skill...",
    "kanban.allJobs": "All Roles",
    "kanban.allSources": "All Sources",
    "kanban.starredOnly": "Starred",
    "kanban.unviewedOnly": "Unviewed",
    "kanban.addCandidate": "+ Add Candidate",
    "kanban.exportCsv": "Export CSV",
    "kanban.loadMore": "Load More",
    "kanban.slaWarning": "SLA Breach",
    "kanban.hmNotice": "Interviewer Mode: View candidates and submit interview scorecards.",
    "kanban.transitionBlocked": "Stage Transition Restricted",
    "kanban.pipelineNotice": "Recruitment Notification",
    "kanban.systemError": "System Notice",

    // CandidateDrawer Tabs
    "tab.overview": "Profile",
    "tab.jd": "Job Specs",
    "tab.cv": "Original CV",
    "tab.interview": "Interview",
    "tab.evaluation": "Scorecards",
    "tab.history": "Audit Log",

    // AI Match Tiers
    "tier.HIGH": "Strong Match",
    "tier.MEDIUM": "Moderate Match",
    "tier.LOW": "Low Match",
    "tier.PENDING": "Analyzing",

    // Interview Tab
    "interview.title": "Interview Scheduling",
    "interview.subtitle": "Manage schedules, interview formats, and invitations.",
    "interview.hasSchedule": "Scheduled",
    "interview.noSchedule": "No Interview Scheduled",
    "interview.format": "Interview Format",
    "interview.online": "Online Meeting",
    "interview.onlineDesc": "Google Meet, Zoom, MS Teams",
    "interview.offline": "On-Site (Office)",
    "interview.offlineDesc": "Company headquarters / Meeting room",
    "interview.time": "Interview Time",
    "interview.locationOnline": "Online Meeting URL *",
    "interview.locationOffline": "Office Location & Room *",
    "interview.notesCandidate": "Candidate Instructions (in email)",
    "interview.notesInterviewer": "Interviewer Notes (internal only)",
    "interview.postNotes": "Post-Interview Summary",
    "interview.saveNotes": "Save Summary",
    "interview.emailMethod": "Invitation Delivery Method",
    "interview.emailAuto": "Automated invitation",
    "interview.emailAutoDesc": "Automatically send HTML invitation & sync calendar",
    "interview.emailCustom": "Custom Email & Archive",
    "interview.emailCustomDesc": "Draft tailored email and archive in candidate record",
    "interview.emailNone": "Do Not Send Email",
    "interview.emailNoneDesc": "Already contacted directly, internal log only",
    "interview.customSubject": "Email Subject *",
    "interview.customBody": "Archived Email Body *",
    "interview.saveSchedule": "Confirm & Save Schedule",
    "interview.updateSchedule": "Update Schedule",
    "interview.cancelSchedule": "Cancel Schedule",
    "interview.joinMeeting": "Join Meeting",
    "interview.copyEmail": "Copy Letter",
    "interview.quickSlots": "Quick Pick:",

    // Scorecard
    "scorecard.title": "Interview Scorecard",
    "scorecard.scoreFormula": "Technical 40% • Communication 30% • Culture 30%",
    "scorecard.newTitle": "Submit New Scorecard",
    "scorecard.round": "Interview Round",
    "scorecard.level": "Recommended Level",
    "scorecard.criteria": "Competency Evaluation Criteria",
    "scorecard.technical": "Technical Competency (Weight 40%)",
    "scorecard.technicalPlaceholder": "Technical evaluation: Architecture, problem solving, code...",
    "scorecard.communication": "Communication & Presentation (Weight 30%)",
    "scorecard.communicationPlaceholder": "Communication evaluation: Articulation, reasoning, English...",
    "scorecard.culture": "Cultural Fit & Teamwork (Weight 30%)",
    "scorecard.culturePlaceholder": "Cultural evaluation: Collaboration, ownership, adaptability...",
    "scorecard.overallScore": "Overall Score",
    "scorecard.recommendation": "Hiring Recommendation",
    "scorecard.recommendStrongHire": "🌟 Exceptional — Strong Hire",
    "scorecard.recommendHire": "✅ Meets Standard — Hire",
    "scorecard.recommendReject": "⚠️ Below Standard — No Hire",
    "scorecard.recommendStrongReject": "⛔ Not a Fit — Strong No Hire",
    "scorecard.strengths": "Key Strengths (Decision Basis)",
    "scorecard.strengthsPlaceholder": "Key highlights and strengths...",
    "scorecard.weaknesses": "Areas for Improvement / Training",
    "scorecard.weaknessesPlaceholder": "Points to note or train...",
    "scorecard.conclusion": "Overall Conclusion",
    "scorecard.conclusionPlaceholder": "Brief summary of hire/reject rationale...",
    "scorecard.save": "Save Scorecard",
    "scorecard.saving": "Saving Scorecard...",
    "scorecard.cancel": "Cancel",
    "scorecard.submittedList": "Submitted Scorecards",
    "scorecard.noScorecard": "No scorecards recorded for this candidate yet.",
    "scorecard.qualified": "Eligible for Hire",
    "scorecard.needScorecard": "Passing Scorecard Required",

    // Rejection Modal
    "reject.title": "Confirm Candidate Rejection",
    "reject.quickReasons": "Common Rejection Reasons",
    "reject.detailReason": "Detailed Rejection Reason",
    "reject.placeholder": "Enter specific reason (at least 5 characters)...",
    "reject.confirmBtn": "Confirm Rejection",
    "reject.cancelBtn": "Cancel",
    "reject.minError": "Please enter a specific reason (at least 5 characters).",

    // Operational Dashboard
    "dashboard.title": "Recruitment Dashboard",
    "dashboard.funnelTitle": "Conversion Funnel",
    "dashboard.funnelDesc": "Candidate progression and conversion distribution across stages.",
    "dashboard.totalCandidates": "Total Candidates",
    "dashboard.activeJobs": "open positions",
    "dashboard.slaBreaches": "SLA Breaches",
    "dashboard.inInterview": "In Interview",
    "dashboard.hired": "Hired",
    "dashboard.activeUsers": "Active Users",

    // Common Actions & Notifications
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.edit": "Edit",
    "common.delete": "Delete",
    "common.close": "Close",
    "common.confirm": "Confirm",
    "common.loading": "Processing...",
    "common.success": "Action Successful",
    "common.viewDetails": "View Details",
    "common.download": "Download",

    // Public Careers Portal
    "public.home": "Home",
    "public.jobs": "Careers",
    "public.track": "Track Application",
    "public.internalPortal": "Internal ATS Portal",
    "public.heroTitle": "Build Your Tech Career at RecoverX",
    "public.heroSubtitle": "Elite engineering environment, global scale, and competitive packages.",
    "public.exploreJobs": "Explore Roles",
    "public.applyNow": "Apply Now",
    "public.uploadResume": "Upload Resume (PDF/DOCX)",
    "public.fullName": "Full Name *",
    "public.email": "Email Address *",
    "public.phone": "Phone Number *",
    "public.submitApplication": "Submit Application",

    // RecoverX Homepage
    "home.nav.about": "About Us",
    "home.nav.solutions": "Services & Solutions",
    "home.nav.culture": "Culture & Benefits",
    "home.nav.jobs": "Careers",
    "home.nav.contact": "Contact",
    "home.nav.cta": "Explore Careers",
    "home.hero.title1": "Pioneering Software Engineering &",
    "home.hero.title2": "High-Tech Solutions",
    "home.hero.subtitle": "RecoverX delivers European-standard software engineering, cloud modernization, microservices architecture, and end-to-end quality assurance (QA) for leading enterprises worldwide.",
    "home.hero.ctaJobs": "Join Our Engineering Team",
    "home.hero.ctaContact": "Partner With Us",
    "home.stats.delivery": "On-Time Delivery Rate",
    "home.stats.clients": "Global Enterprise Clients",
    "home.stats.engineers": "Senior Elite Engineers",
    "home.stats.uptime": "System SLA Uptime",
    "home.solutions.badge": "SERVICE ECOSYSTEM",
    "home.solutions.title": "Engineering Capabilities & High-Tech Services",
    "home.solutions.desc": "Engineered to solve complex technical challenges with outstanding performance and uncompromising reliability.",
    "home.culture.badge": "WORKPLACE CULTURE",
    "home.culture.title": "Elite Culture & Industry-Leading Benefits",
    "home.culture.desc": "At RecoverX, our people are our greatest asset. We cultivate an inspiring, creative, and empowering workplace.",
    "home.contact.badge": "GET IN TOUCH",
    "home.contact.title": "Connect with RecoverX Experts",
    "home.contact.desc": "Leave your information to discuss technical solutions, partnership opportunities, or career paths.",

    // Jobs Page
    "jobs.badge": "Tech Career Growth Opportunities 2026",
    "jobs.title": "Build an Exceptional Career with RecoverX",
    "jobs.subtitle": "Explore diverse opportunities from Trainee, Junior to Senior and Tech Lead in a modern international tech environment.",
    "jobs.departments": "Departments:",
    "jobs.listTitle": "Open Positions",
    "jobs.listSubtitle": "Candidate data is strictly confidential",
    "jobs.emptyTitle": "No open positions at the moment",
    "jobs.emptyDesc": "Please check back later or contact our talent team.",
    "jobs.trackerBanner.title": "Already applied at RecoverX?",
    "jobs.trackerBanner.desc": "Track your review progress, interview schedule, and feedback in real-time.",
    "jobs.trackerBanner.button": "Track Application Now",
    "jobs.salary": "Salary:",
    "jobs.experience": "Experience:",
    "jobs.location": "Location:",
    "jobs.negotiable": "Competitive",
    "jobs.years": "yrs",
    "jobs.viewJob": "Details & Apply",

    // Tracker Page
    "tracker.badge": "Application Tracker",
    "tracker.heading": "Real-Time Application Status Tracking",
    "tracker.subheading": "Enter your Email and Phone Number or Application ID to transparently monitor your application journey.",
    "tracker.emailLabel": "1. Applied Email Address",
    "tracker.emailPlaceholder": "your_email@example.com",
    "tracker.idLabel": "2. Phone Number or Application ID",
    "tracker.idPlaceholder": "0912345678 or code #4",
    "tracker.searchButton": "Track Application",
    "tracker.searching": "Searching records...",
    "tracker.backToJobs": "View Job Openings",
    "tracker.resultTitle": "Application Details",
    "tracker.position": "Applied Role",
    "tracker.appliedAt": "Submission Date",
    "tracker.currentStatus": "Current Stage",
    "tracker.timelineTitle": "Your Recruitment Journey",
    "tracker.step1": "Application Intake",
    "tracker.step2": "Standard Screening",
    "tracker.step3": "Technical Interview",
    "tracker.step4": "Decision & Offer",

    // Candidates Directory
    "candidates.title": "Candidate Directory",
    "candidates.countSubtitle": "candidate profiles",
    "candidates.searchPlaceholder": "Search by name, email or skills (e.g. Java, React, BA)...",
    "candidates.allJobs": "All positions",
    "candidates.allStages": "All stages",
    "candidates.starred": "Starred",
    "candidates.unviewed": "Unread",
    "candidates.sortNewest": "Newest",
    "candidates.sortOldest": "Oldest",
    "candidates.sortUnviewed": "Unread first",
    "candidates.sortStarred": "Starred first",
    "candidates.sortName": "Name (A - Z)",
    "candidates.thCandidate": "Candidate",
    "candidates.thPositionExp": "Position & Experience",
    "candidates.thSkills": "Extracted Skills",
    "candidates.thMatch": "Match Rate",
    "candidates.thStatus": "Status",
    "candidates.yearsExp": "yrs experience",
    "candidates.empty": "No candidates found matching the search criteria.",
    "candidates.addBtn": "Intake CV",

    // Recruitment Pipeline
    "pipeline.title": "Recruitment Pipeline",
    "pipeline.descAdmin": "Track and transition candidate profiles across 5 stages.",
    "pipeline.descHr": "HR Scope: Screen new applications and advance up to Screening stage.",
    "pipeline.descHm": "Hiring Manager Scope: Advance from Screening to Interview, evaluate, and Hire.",
    "pipeline.loading": "Loading data...",
    "pipeline.addCandidate": "Intake CV",
    "pipeline.starredOnly": "Starred",
    "pipeline.unviewedOnly": "Unviewed",
    "pipeline.slaBreach": "SLA Overdue",
    "pipeline.highMatch": "High Match (≥75%)",
    "pipeline.sortScore": "Highest Match Score",
    "pipeline.sortSla": "SLA Overdue First",
    "pipeline.searchTip": "Type 2+ characters to search by candidate Name, Email, Phone, or Skill.",
    "pipeline.filteringBy": "Active filters:",
    "pipeline.keyword": "Keyword:",
    "pipeline.foundCandidates": "Found {count} candidate(s)",
    "pipeline.resetFilters": "Reset all filters",
    "pipeline.targetHeadcount": "Target: {hired}/{target} hired",
    "pipeline.activeInterviews": "Interviewing: {active}/{cap}",
    "pipeline.headcountFull": "Headcount target fulfilled — requisition closed",
    "pipeline.interviewCapReached": "Interview capacity reached",
    "pipeline.noMatch": "No matching candidates",
    "pipeline.emptyColumn": "No candidates",
    "pipeline.noKeywordMatch": "No candidate matches this keyword in this stage",
    "pipeline.emptyColumnDesc": "Drag candidates here or intake a new profile",
    "card.matchedSkill": "Matched skill:",
    "card.matchedEmail": "Matched email:",
    "card.matchedPhone": "Matched phone:",
    "card.suspectedDuplicate": "Suspected duplicate",
    "card.mismatchWarning": "CV details mismatch",
    "card.unviewedTooltip": "Unviewed new candidate",

    // Candidate Intake (AddCandidateModal)
    "intake.modalTitle": "New Candidate Intake",
    "intake.modalSubtitle": "Import candidate profile from LinkedIn, referral, or recruitment channels",
    "intake.jobLabel": "JOB POSITION *",
    "intake.sourceLabel": "CANDIDATE SOURCE",
    "intake.cvLabel": "RESUME / CV FILE (.PDF, .DOCX) *",
    "intake.uploadPrompt": "Click to upload or drag & drop CV file here",
    "intake.uploadSub": "Supports PDF, DOCX (Max 10MB)",
    "intake.nameLabel": "FULL NAME *",
    "intake.emailLabel": "CONTACT EMAIL *",
    "intake.phoneLabel": "PHONE NUMBER *",
    "intake.certLabel": "CERTIFICATES & DIPLOMAS",
    "intake.certOptional": "Optional • Up to 5 files",
    "intake.certUpload": "Attach certificate & diploma files (PNG, JPG, PDF)",
    "intake.cancelBtn": "Cancel",
    "intake.submitBtn": "Submit Intake",
    "intake.submitting": "Processing & AI Parsing...",

    // Job Openings Management (Jobs Admin)
    "jobsAdmin.title": "Job Openings Management",
    "jobsAdmin.subtitle": "Manage job requisitions, departments, headcount targets, and JD requirements",
    "jobsAdmin.createBtn": "+ Create Job Opening",
    "jobsAdmin.thTitle": "Position & Department",
    "jobsAdmin.thHeadcount": "Target Headcount",
    "jobsAdmin.thMaxInterviews": "Max Active Interviews",
    "jobsAdmin.thStatus": "Status",
    "jobsAdmin.thActions": "Actions",
    "jobsAdmin.statusActive": "Active",
    "jobsAdmin.statusClosed": "Closed",
    "jobsAdmin.statusDraft": "Draft",

    // Talent Pool
    "talentPool.title": "Talent Pool",
    "talentPool.subtitle": "Archive and re-engage qualified talent for future recruitment drives",
    "talentPool.thCandidate": "Candidate",
    "talentPool.thPosition": "Applied Position",
    "talentPool.thReason": "Pool Classification",
    "talentPool.thActions": "Actions",
    "talentPool.repoolBtn": "Re-engage Candidate",

    // User Management (Users Admin)
    "usersAdmin.title": "User Management",
    "usersAdmin.subtitle": "Manage internal accounts, RBAC roles, and access credentials",
    "usersAdmin.createBtn": "+ Add User",
    "usersAdmin.thUser": "User",
    "usersAdmin.thRole": "Role (RBAC)",
    "usersAdmin.thStatus": "Status",
    "usersAdmin.thActions": "Actions",
  },
};

const I18nContext = createContext<I18nContextType>({
  locale: "vi",
  setLocale: () => {},
  toggleLocale: () => {},
  t: (key: string, fallback?: string) => fallback || key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("vi");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("ats_lang") as Locale | null;
      if (saved === "vi" || saved === "en") {
        setLocaleState(saved);
      }
    } catch {}
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem("ats_lang", newLocale);
    } catch {}
  };

  const toggleLocale = () => {
    setLocale(locale === "vi" ? "en" : "vi");
  };

  const t = (key: string, fallback?: string): string => {
    const dict = dictionary[locale];
    if (dict && dict[key]) {
      return dict[key];
    }
    // Fallback sang tiếng Việt nếu key không tìm thấy ở locale hiện tại
    if (dictionary.vi && dictionary.vi[key]) {
      return dictionary.vi[key];
    }
    return fallback || key;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, toggleLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useLanguage() {
  return useContext(I18nContext);
}
