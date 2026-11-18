---
id: "UC-ATS-05"
title: "Đặc tả Chi tiết Use Case Chuẩn Alistair Cockburn (UC-00 đến UC-07)"
type: "srs"
version: "2.1.0"
status: "approved"
owner: "ReCoverX BA Team"
domain: "recruitment-ats"
tags:
  - "use-case"
  - "cockburn-12-parts"
  - "srs"
upstream_deps:
  - "BRD-ATS-01"
  - "FDD-ATS-04"
downstream_deps:
  - "FSM-ATS-06"
  - "API-ATS-15"
  - "UAT-ATS-18"
last_updated: "2026-11-18"
---

# ĐẶC TẢ CHI TIẾT USE CASE CHUẨN ALISTAIR COCKBURN

> **Dự án:** ReCoverX Career — Applicant Tracking System (ATS)  
> **Tiêu chuẩn biên soạn:** Universal BA Toolkit (`RULE-06` — Khung 12 thành phần Alistair Cockburn, `RULE-16` — Chống mơ hồ, `RULE-18`, `RULE-19`)

## Lịch Sử Phiên Bản (Revision History)

| Phiên Bản | Ngày Phát Hành | Tác Giả | Phân Loại | Tóm Tắt Thay Đổi | Người Phê Duyệt |
| :---: | :---: | :--- | :---: | :--- | :--- |
| `v1.0.0` | 2026-11-12 | BA Team | **Initial** | Đặc tả sơ bộ 5 Use Case ban đầu (`UC-01` đến `UC-05`). | Product Owner |
| `v2.0.0` | 2026-11-15 | BA Team | **Added** | Bổ sung `UC-00`, `UC-01A` (Public Tracker), `UC-05A` (Interview Lifecycle), `UC-06`, `UC-07` và Deep Scorecard. | Tech Lead |
| `v2.1.0` | 2026-11-18 | BA Team | **Changed** | Tái cấu trúc toàn bộ theo chuẩn 12 thành phần Cockburn; loại bỏ văn phong hội thoại chat & logic cũ "AI tự loại"; bổ sung luồng 5 trường cốt lõi + HR sửa tay, phân quyền HR (max `SCREENING`) vs Hiring Manager (`INTERVIEW`/`HIRED`) và bắt buộc lý do `REJECTED` (`BRL-11`). | Product Owner & Tech Lead |

---

## UC-00: ĐĂNG NHẬP & QUẢN TRỊ NGƯỜI DÙNG NỘI BỘ

| Thành Phần Cockburn | Nội Dung Đặc Tả |
| :--- | :--- |
| **1. Mã & Tên Use Case** | `UC-AUTH-00`: Đăng nhập hệ thống nội bộ & Quản trị tài khoản nhân viên |
| **2. Cấp độ (Goal Level)** | `User-Goal Level` (Mục tiêu người dùng) |
| **3. Tác nhân chính** | Quản trị viên (`ADMIN`), Chuyên viên HR (`HR`), Quản lý chuyên môn (`HIRING_MANAGER`) |
| **4. Các bên liên quan & Quyền lợi** | • Nhân viên nội bộ: Đăng nhập an toàn, truy cập đúng chức năng theo vai trò.<br>• Admin: Quản lý vòng đời tài khoản nhân viên, ngăn truy cập trái phép. |
| **5. Tiền điều kiện** | Tài khoản nội bộ đã tồn tại và có trạng thái `isActive = true`. |
| **6. Hậu điều kiện tối thiểu** | Không cấp phiên cookie nếu xác thực thất bại; chặn truy cập `/admin/*` ở tầng Edge Middleware (HTTP 307). |
| **7. Hậu điều kiện thành công** | Cấp cookie `ats_user_session` ký số HMAC-SHA256 (`HttpOnly`, hạn 7 ngày); chuyển hướng vào `/admin/pipeline`. |
| **8. Sự kiện kích hoạt** | Người dùng nhập Email/Mật khẩu tại `/admin/login` hoặc Admin mở `/admin/users`. |
| **9. Kịch bản chính (Main Success Scenario)** | 1. Người dùng truy cập `/admin/login`, nhập Email & Mật khẩu và nhấn "Đăng nhập".<br>2. Hệ thống (`POST /api/auth/login`) tìm tài khoản và đối soát mật khẩu qua thuật toán NIST PBKDF2-SHA512 (100,000 vòng lặp).<br>3. Hệ thống phát hành cookie `ats_user_session` có chữ ký số HMAC-SHA256 và chuyển hướng vào `/admin/pipeline`.<br>4. Nếu là `ADMIN`, truy cập `/admin/users` để tạo tài khoản mới (`HR` / `HIRING_MANAGER`) với mật khẩu ≥ 8 ký tự. |
| **10. Luồng ngoại lệ & Mở rộng** | • `2a.` Sai mật khẩu / Email không tồn tại ➔ Trả `401 Unauthorized` (`ERR-AUTH-401-01`).<br>• `2b.` Tài khoản bị khóa (`isActive = false`) ➔ Trả `403 Forbidden` (`ERR-AUTH-403-01`).<br>• `4a.` Tài khoản `HR` hoặc `HIRING_MANAGER` truy cập `/admin/users` ➔ `middleware.ts` chuyển hướng HTTP 307 về `/admin/pipeline?error=forbidden`. |
| **11. Yêu cầu đặc biệt** | Phòng thủ biên Server (Zero-Trust Edge Middleware) ngăn hoàn toàn hiện tượng Flash of Unauthenticated Content (FOUC). |
| **12. Quy tắc nghiệp vụ liên quan** | `BRL-Auth`, `NFR-SEC-02`. |

---

## UC-01: NỘP HỒ SƠ ỨNG TUYỂN TRỰC TUYẾN & TRA CỨU TIẾN ĐỘ (UC-01 / UC-01A)

| Thành Phần Cockburn | Nội Dung Đặc Tả |
| :--- | :--- |
| **1. Mã & Tên Use Case** | `UC-PORT-01`: Nộp hồ sơ ứng tuyển trực tuyến & Tra cứu tiến độ hồ sơ |
| **2. Cấp độ (Goal Level)** | `User-Goal Level` |
| **3. Tác nhân chính** | Ứng viên (Candidate / Public) |
| **4. Các bên liên quan & Quyền lợi** | • Ứng viên: Nộp CV dễ dàng không cần tài khoản và chủ động theo dõi tiến độ tránh Ghosting.<br>• HR: Nhận hồ sơ sạch, đúng định dạng, không spam/trùng lặp. |
| **5. Tiền điều kiện** | Vị trí tuyển dụng có `status = "ACTIVE"` trên Cổng nghề nghiệp `/jobs`. |
| **6. Hậu điều kiện tối thiểu** | Không lưu tệp rác/tệp giả mạo; giữ nguyên dữ liệu đã điền khi có lỗi validation. |
| **7. Hậu điều kiện thành công** | Lưu tệp CV & chứng chỉ; tạo/gộp bản ghi `Candidate`; khởi tạo `Application` ở trạng thái `NEW` kèm điểm đối chiếu JD; cấp mã hồ sơ để tra cứu tại `/jobs/tracker`. |
| **8. Sự kiện kích hoạt** | Ứng viên chọn vị trí tại `/jobs/[id]` và nhấn "Gửi Hồ Sơ Ứng Tuyển". |
| **9. Kịch bản chính (Main Success Scenario)** | 1. Ứng viên xem chi tiết JD tại `/jobs/[id]`, điền Họ tên, Email, SĐT, tải tệp CV (`.pdf`/`.docx` ≤ 10MB) và tùy chọn đính kèm ảnh/PDF bằng cấp chứng chỉ.<br>2. Ứng viên nhấn "Gửi Hồ Sơ Ứng Tuyển" (`POST /api/applications`).<br>3. Hệ thống kiểm tra Rate Limit (`≤ 5 lượt/10 phút/IP`), định dạng/dung lượng (`BRL-01`) và chữ ký nhị phân Magic Bytes (`%PDF-` hoặc `PK`).<br>4. Hệ thống kiểm tra khử trùng lặp 30 ngày cùng Job (`BRL-02`) và hạn ngạch ≤ 3 Job/90 ngày (`BRL-09`).<br>5. Hệ thống trích xuất text thô bằng `pdf-parse`, gọi Hybrid AI đối chiếu JD (`BRL-03`, `BRL-04`) và khởi tạo thẻ tại cột `NEW`.<br>6. Hệ thống trả về mã hồ sơ thành công; ứng viên có thể nhập mã này tại `/jobs/tracker` (`UC-01A`) để xem lộ trình 4 bước (ẩn hoàn toàn điểm AI & nhận xét nội bộ theo `NFR-SEC-04`). |
| **10. Luồng ngoại lệ & Mở rộng** | • `3a.` Vượt Rate Limit ➔ Trả `429 Too Many Requests` (`ERR-SYS-429-01`).<br>• `3b.` Sai định dạng, > 10MB hoặc file giả mạo Magic Bytes ➔ Trả `400 Bad Request` (`ERR-APP-400-01` / `ERR-APP-400-02`).<br>• `4a.` Nộp trùng cùng Job trong 30 ngày ➔ Trả `400` (`ERR-APP-409-01`).<br>• `4b.` Nộp vị trí thứ 4 trong 90 ngày ➔ Trả `400` (`ERR-APP-422-01`).<br>• `5a.` Gemini API lỗi/timeout ➔ Tự động fallback sang Heuristic NLP nội bộ, không mất hồ sơ. |
| **11. Yêu cầu đặc biệt** | Thời gian xử lý & bóc tách ≤ 5.0 giây/CV; Responsive 100% trên Desktop & Mobile. |
| **12. Quy tắc nghiệp vụ liên quan** | `BRL-01`, `BRL-02`, `BRL-03`, `BRL-04`, `BRL-09`, `NFR-SEC-03`, `NFR-SEC-04`. |

---

## UC-02: NẠP CV NỘI BỘ, HIỂN THỊ 5 TRƯỜNG CỐT LÕI & CHỈNH SỬA THỦ CÔNG

| Thành Phần Cockburn | Nội Dung Đặc Tả |
| :--- | :--- |
| **1. Mã & Tên Use Case** | `UC-INTK-02`: Tải lên CV nội bộ, trích xuất 5 trường cốt lõi & HR chỉnh sửa dữ liệu |
| **2. Cấp độ (Goal Level)** | `User-Goal Level` |
| **3. Tác nhân chính** | Chuyên viên HR (`HR`), Quản trị viên (`ADMIN`) |
| **4. Các bên liên quan & Quyền lợi** | • HR: Nạp nhanh CV từ nguồn săn chủ động và sửa ngay nếu công cụ bóc text sai tên, sai số năm kinh nghiệm hoặc sót kỹ năng.<br>• Hiring Manager: Đọc dữ liệu đã được HR chuẩn hóa sạch đẹp, đúng 5 trường theo JD. |
| **5. Tiền điều kiện** | Người dùng đã đăng nhập với vai trò `HR` hoặc `ADMIN`. |
| **6. Hậu điều kiện tối thiểu** | Không ghi đè dữ liệu nếu validation thất bại hoặc vi phạm trùng lặp `(email, phone)` với ứng viên khác. |
| **7. Hậu điều kiện thành công** | Lưu hồ sơ ở cột `NEW`; mở Drawer hiển thị gọn đúng 5 trường (Họ tên, Email, Vị trí, Kỹ năng, Số năm kinh nghiệm); mọi chỉnh sửa thủ công tự động tính lại độ khớp JD và ghi `AuditLog` (`PROFILE_EDITED`). |
| **8. Sự kiện kích hoạt** | HR nhấn "+ Tiếp nhận CV mới" (`AddCandidateModal`) hoặc nhấn "Chỉnh sửa" trong `CandidateDrawer`. |
| **9. Kịch bản chính (Main Success Scenario)** | 1. HR mở `AddCandidateModal`, chọn Job, chọn nguồn (`LINKEDIN`, `REFERRAL`, `HEADHUNTER`), nhập thông tin cơ bản, tải tệp CV và chứng chỉ đính kèm.<br>2. Hệ thống thực thi pipeline validation, khử trùng lặp, bóc tách `pdf-parse` + Hybrid AI và tạo thẻ tại cột `NEW`.<br>3. Khi mở `CandidateDrawer`, hệ thống hiển thị mặc định **đúng 5 trường cốt lõi theo JD** (Họ tên, Email, Vị trí ứng tuyển, Kỹ năng, Số năm kinh nghiệm).<br>4. Nếu cần xem thêm Học vấn, Lịch sử công tác chi tiết, SĐT hoặc Chứng chỉ, HR/Manager nhấn nút **"Xem chi tiết hồ sơ"**.<br>5. Nếu phát hiện máy bóc sai tên, sai kinh nghiệm hoặc thiếu kỹ năng, HR nhấn **"Chỉnh sửa"**, cập nhật giá trị hoặc thêm/xóa tag kỹ năng và nhấn **"Lưu thay đổi"** (`PATCH /api/applications/[id]/profile`).<br>6. Hệ thống cập nhật `Candidate`, tự động tính lại `aiMatchedSkills`, `aiMissingSkills`, `aiMatchScore` và ghi `AuditLog` (`PROFILE_EDITED`). |
| **10. Luồng ngoại lệ & Mở rộng** | • `5a.` `HIRING_MANAGER` cố gọi API sửa hồ sơ ➔ Trả `403 Forbidden` (`ERR-PROF-403-01`).<br>• `5b.` Email sửa mới không hợp lệ hoặc cặp `(email, phone)` trùng với ứng viên khác ➔ Trả `400 Bad Request`. |
| **11. Yêu cầu đặc biệt** | Tự động làm mới điểm khớp JD ngay sau khi HR lưu chỉnh sửa (≤ 1.0 giây). |
| **12. Quy tắc nghiệp vụ liên quan** | `BRL-01`, `BRL-02`, `BRL-03`, `RBAC-PROFILE-EDIT`. |

---

## UC-03: ĐỐI CHIẾU HYBRID AI & PHẢN HỒI TỪ CHỐI CÓ BỘ ĐỆM 12 GIỜ

| Thành Phần Cockburn | Nội Dung Đặc Tả |
| :--- | :--- |
| **1. Mã & Tên Use Case** | `UC-AI-03`: Đối chiếu tiêu chuẩn JD bằng Hybrid AI & Tự động hoãn gửi thư từ chối |
| **2. Cấp độ (Goal Level)** | `Subfunction Level` (Hỗ trợ tự động) |
| **3. Tác nhân chính** | Hệ thống ATS & Hybrid AI Engine (Primary System Actor), Chuyên viên HR / Hiring Manager (Kiểm duyệt), Ứng viên (Secondary Recipient) |
| **4. Các bên liên quan & Quyền lợi** | • Doanh nghiệp: Không bỏ sót nhân tài nhờ nguyên tắc *Human-in-the-loop*.<br>• Ứng viên: Không bị từ chối tức thì kiểu máy móc, nhận thư lịch sự sau 12 giờ. |
| **5. Tiền điều kiện** | Tệp CV đã trích xuất được văn bản thô (`cvRawText`) và `Job` có cấu hình `requiredSkills` / `minExperienceYears`. |
| **6. Hậu điều kiện tối thiểu** | Tuyệt đối **không tự động chuyển thẻ sang `REJECTED`** sau lưng con người; fallback cục bộ khi AI cloud lỗi. |
| **7. Hậu điều kiện thành công** | Lưu điểm đối chiếu, kỹ năng khớp/thiếu và tóm tắt giải trình; thẻ nằm tại `NEW`; nếu người có thẩm quyền chuyển sang `REJECTED` (có lý do), tự động hẹn `emailScheduledAt = now() + 12h`. |
| **8. Sự kiện kích hoạt** | Hoàn tất tải CV (`UC-01`/`UC-02`) hoặc kích hoạt `POST /api/applications/[id]/re-parse`. |
| **9. Kịch bản chính (Main Success Scenario)** | 1. Máy chủ gọi `parseAndScoreCv` với văn bản thô `cvRawText` và tiêu chuẩn JD.<br>2. Hệ thống gửi Prompt chuẩn hóa lên Google Gemini (`gemini-2.5-flash`, `temperature: 0`, JSON mode).<br>3. Hệ thống chuẩn hóa kết quả `ParsedCvResult` (lọc sạch các chuỗi hiển thị % thừa) và lưu vào DB với `currentStage = "NEW"`.<br>4. Khi HR hoặc Hiring Manager chuyển thẻ sang `REJECTED` kèm lý do (`BRL-11`), hệ thống tự động đặt lịch gửi email từ chối sau 12 giờ (`BRL-05`) và đồng bộ hồ sơ vào Talent Pool. |
| **10. Luồng ngoại lệ & Mở rộng** | • `2a.` Mất mạng / thiếu `GEMINI_API_KEY` / hết quota ➔ Tự động kích hoạt `heuristicParseAndMatch` (60% Kỹ năng + 40% Kinh nghiệm).<br>• `4a.` HR hoặc Hiring Manager kéo thẻ rời khỏi `REJECTED` trong vòng 12 giờ ➔ Hệ thống tự động hủy lịch gửi email (`emailScheduledAt = null`) và xóa `rejectionReason`. |
| **11. Yêu cầu đặc biệt** | `temperature: 0` đảm bảo cùng 1 CV + 1 JD luôn ra kết quả tất định. |
| **12. Quy tắc nghiệp vụ liên quan** | `BRL-04`, `BRL-05`, `BRL-11`. |

---

## UC-04: QUẢN LÝ QUY TRÌNH ỨNG VIÊN TRÊN KANBAN PIPELINE (PHÂN QUYỀN HR vs HIRING MANAGER)

| Thành Phần Cockburn | Nội Dung Đặc Tả |
| :--- | :--- |
| **1. Mã & Tên Use Case** | `UC-PIPE-04`: Luân chuyển hồ sơ ứng viên trên Kanban 5 cột theo State Machine & RBAC |
| **2. Cấp độ (Goal Level)** | `User-Goal Level` |
| **3. Tác nhân chính** | Chuyên viên HR (`HR`), Quản lý Chuyên môn (`HIRING_MANAGER`), Quản trị viên (`ADMIN`) |
| **4. Các bên liên quan & Quyền lợi** | • HR: Sơ loại, làm sạch hồ sơ và đẩy ứng viên đạt vòng sơ loại lên `SCREENING`.<br>• Hiring Manager: Kiểm soát toàn diện chất lượng chuyên môn tại vòng `INTERVIEW` và quyết định `HIRED`. |
| **5. Tiền điều kiện** | Người dùng đã đăng nhập và mở `/admin/pipeline`. |
| **6. Hậu điều kiện tối thiểu** | Rollback vị trí thẻ về cột cũ nếu vi phạm RBAC, State Order, thiếu lý do từ chối hoặc thiếu Scorecard. |
| **7. Hậu điều kiện thành công** | Cập nhật `currentStage`, `stageUpdatedAt`, `rejectionReason` (nếu có) và ghi vết `AuditLog` (`STAGE_CHANGE`) trong 1 Prisma Transaction. |
| **8. Sự kiện kích hoạt** | Người dùng kéo-thả thẻ trên Kanban hoặc nhấn nút chuyển vòng trong Footer của `CandidateDrawer`. |
| **9. Kịch bản chính (Main Success Scenario)** | 1. Hệ thống hiển thị Kanban 5 cột (`NEW`, `SCREENING`, `INTERVIEW`, `HIRED`, `REJECTED`) kèm bộ lọc (Chưa xem — viền xanh nhấp nháy, Đánh sao, Tìm kiếm, Vị trí) và cảnh báo SLA đỏ (`NEW > 48h`, `SCREENING > 72h`).<br>2. **Vòng HR:** `HR` kiểm tra thẻ tại `NEW`, kéo sang `SCREENING` (hoặc `REJECTED` kèm lý do qua `RejectReasonModal`).<br>3. **Vòng Hiring Manager:** `HIRING_MANAGER` thẩm định thẻ tại `SCREENING`, kéo sang `INTERVIEW` (hoặc `REJECTED` kèm lý do).<br>4. Sau phỏng vấn và hoàn tất Scorecard đạt chuẩn (`BRL-06`), `HIRING_MANAGER` kéo thẻ từ `INTERVIEW` sang `HIRED`.<br>5. Backend (`POST /api/pipeline/move`) chạy `validateStageTransition` (`src/lib/stage-rules.ts`), cập nhật DB và ghi `AuditLog`. |
| **10. Luồng ngoại lệ & Mở rộng** | • `2a.` `HR` cố kéo sang `INTERVIEW`/`HIRED` hoặc tác động thẻ ở `INTERVIEW` ➔ Chặn HTTP 403 (`ERR-PIPE-403-01`).<br>• `3a.` `HIRING_MANAGER` cố kéo thẻ từ `NEW` ➔ Chặn HTTP 403 (`ERR-PIPE-403-01`).<br>• `3b.` Kéo nhảy cóc (`NEW ➔ INTERVIEW`, `SCREENING ➔ HIRED`) ➔ Chặn HTTP 400 (`ERR-PIPE-422-01`).<br>• `3c.` Hồ sơ thiếu tiêu chuẩn JD (< 60%) khi kéo sang `SCREENING`/`INTERVIEW` ➔ Bật `StageMismatchConfirmModal` xác nhận tránh bấm nhầm.<br>• `4a.` Chưa có Scorecard đạt chuẩn khi kéo sang `HIRED` ➔ Chặn HTTP 400 (`ERR-PIPE-422-02`).<br>• `4b.` Kéo thẻ sang `REJECTED` thiếu lý do (< 5 ký tự) ➔ Bật `RejectReasonModal` / Chặn HTTP 400 (`ERR-PIPE-422-03`).<br>• `4c.` Cố kéo thẻ đã `HIRED` ra ngoài ➔ Chặn HTTP 400 (`ERR-PIPE-409-01`). |
| **11. Yêu cầu đặc biệt** | Phản hồi thao tác lọc và kéo-thả ≤ 1.5 – 3.0 giây (`NFR-PER-01`). |
| **12. Quy tắc nghiệp vụ liên quan** | `BRL-05`, `BRL-06`, `BRL-07`, `BRL-11`, `BRL-STAGE-ORDER`, `BRL-STAGE-TERMINAL`, `RBAC-STAGE-LIMIT`. |

---

## UC-05: LÊN LỊCH PHỎNG VẤN & ĐÁNH GIÁ SCORECARD CHUYÊN SÂU (UC-05 / UC-05A)

| Thành Phần Cockburn | Nội Dung Đặc Tả |
| :--- | :--- |
| **1. Mã & Tên Use Case** | `UC-EVAL-05`: Quản lý vòng đời lịch phỏng vấn & Đánh giá ứng viên bằng Scorecard chuyên sâu |
| **2. Cấp độ (Goal Level)** | `User-Goal Level` |
| **3. Tác nhân chính** | Quản lý Chuyên môn (`HIRING_MANAGER`), Chuyên viên HR (`HR` — chấm Scorecard & ghi chú), Quản trị viên (`ADMIN`) |
| **4. Các bên liên quan & Quyền lợi** | • Hiring Manager: Chủ động xếp/sửa/hủy lịch hẹn phỏng vấn và ghi nhận căn cứ đậu/rớt rõ ràng.<br>• Ban Giám Đốc / HR: Xem lại lịch sử đánh giá đa vòng, hiểu rõ lý do tuyển chọn từng nhân sự. |
| **5. Tiền điều kiện** | Hồ sơ đang ở cột `SCREENING` hoặc `INTERVIEW` (đối với xếp lịch PV). |
| **6. Hậu điều kiện tối thiểu** | Không cho phép chỉnh sửa phiếu đánh giá của giám khảo khác; không cho phép `HR` tự ý xếp/hủy lịch phỏng vấn. |
| **7. Hậu điều kiện thành công** | Lưu lịch hẹn (ngày giờ, link họp, ghi chú 3 lớp), sinh thư mời tự động; lưu phiếu Scorecard độc lập có điểm trọng số 5.0★ và mở khóa chốt chặn `BRL-06`. |
| **8. Sự kiện kích hoạt** | Hiring Manager nhấn "+ Lên Lịch Phỏng Vấn" / "Sửa Lịch Hẹn" / "Hủy Lịch" hoặc Giám khảo nhấn "+ Đánh Giá Phỏng Vấn". |
| **9. Kịch bản chính (Main Success Scenario)** | 1. **Xếp lịch (`UC-05A`):** Tại cột `SCREENING` hoặc `INTERVIEW`, `HIRING_MANAGER`/`ADMIN` mở modal lịch hẹn, nhập ngày giờ, hình thức (`ONLINE`/`OFFLINE`), link Google Meet/phòng họp và ghi chú 3 lớp (`POST /api/interviews/schedule`). Hệ thống lưu lịch, chuyển sang `INTERVIEW` và sinh mẫu Thư mời phỏng vấn.<br>2. **Đánh giá (`UC-05`):** Sau phỏng vấn, giám khảo mở `ScorecardModal`, chọn vòng phỏng vấn, cấp bậc đề xuất (`Trainee..Lead`), chấm 3 tiêu chí (Chuyên môn 40%, Giao tiếp 30%, Văn hóa 30%), chọn khuyến nghị và nhập **Căn cứ tuyển dụng (Điểm mạnh nổi bật)** cùng điểm cần đào tạo hội nhập.<br>3. Hệ thống (`POST /api/scorecards`) tính điểm trọng số `BRL-08`, lưu phiếu độc lập theo giám khảo và ghi `AuditLog` (`SCORECARD_EVALUATE`). |
| **10. Luồng ngoại lệ & Mở rộng** | • `1a.` Đổi lịch (Reschedule) hoặc Hủy lịch (`DELETE /api/interviews/schedule`) ➔ Cập nhật/xóa lịch và ghi `AuditLog` (`INTERVIEW_RESCHEDULED` / `INTERVIEW_CANCELLED`).<br>• `1b.` `HR` cố xếp/sửa/hủy lịch ➔ Trả `403 Forbidden` (`ERR-INTV-403-01`).<br>• `2a.` Đề xuất `HIRE`/`STRONG_HIRE` nhưng bỏ trống Điểm mạnh nổi bật ➔ Báo lỗi validation tại form. |
| **11. Yêu cầu đặc biệt** | Giao diện Scorecard tối giản chuẩn nội bộ: không hiển thị công thức toán thô hay icon AI phô trương. |
| **12. Quy tắc nghiệp vụ liên quan** | `BRL-06`, `BRL-08`, `RBAC-STAGE-LIMIT`, `BRL-STAGE-ORDER`. |

---

## UC-06 & UC-07: KHO NHÂN TÀI, REPOOLING, DỌN DẸP 180 NGÀY & XUẤT CSV

| Thành Phần Cockburn | Nội Dung Đặc Tả |
| :--- | :--- |
| **1. Mã & Tên Use Case** | `UC-POOL-06` & `UC-RPT-07`: Quản trị Kho nhân tài, Luân chuyển vị trí, Dọn dẹp 6 tháng & Xuất báo cáo CSV |
| **2. Cấp độ (Goal Level)** | `User-Goal Level` |
| **3. Tác nhân chính** | Chuyên viên HR (`HR` — Tra cứu, Repooling, Xuất CSV), Quản trị viên (`ADMIN` — Toàn quyền + Purge 180 ngày) |
| **4. Các bên liên quan & Quyền lợi** | • HR: Tái khai thác ứng viên dự phòng nhanh, xuất Excel báo cáo lãnh đạo.<br>• Pháp chế / Admin: Tuân thủ Nghị định 13/2023/NĐ-CP bằng cách xóa vĩnh viễn hồ sơ `REJECTED` quá 6 tháng. |
| **5. Tiền điều kiện** | Người dùng đăng nhập vai trò `HR` hoặc `ADMIN`, truy cập `/admin/talent-pool`. |
| **6. Hậu điều kiện tối thiểu** | Không bao giờ xóa hồ sơ `HIRED`, `INTERVIEW`, `SCREENING`, `NEW` hoặc `REJECTED` dưới 180 ngày. |
| **7. Hậu điều kiện thành công** | Repooling tạo `Application` mới bảo lưu lịch sử cũ; Purge xóa vĩnh viễn bản ghi quá 180 ngày; Export tải về tệp `.csv` có UTF-8 BOM. |
| **8. Sự kiện kích hoạt** | HR nhấn "Chuyển vị trí (Repooling)" / "Xuất CSV" hoặc Admin nhấn "Quét & Dọn dẹp 6 tháng (BRL-10)". |
| **9. Kịch bản chính (Main Success Scenario)** | 1. **Tra cứu & Repooling (`UC-06`):** HR lọc ứng viên tại `/admin/talent-pool`, chọn vị trí mới đang mở và xác nhận (`POST /api/talent-pool`). Hệ thống tạo đợt ứng tuyển mới mà ứng viên không cần nộp lại CV.<br>2. **Dọn dẹp vòng đời (`UC-06A`):** `ADMIN` gọi `POST /api/talent-pool/cleanup` quét toàn bộ hồ sơ `REJECTED` có `stageUpdatedAt <= now() - 180 ngày` và thực thi Hard Delete.<br>3. **Xuất CSV (`UC-07`):** HR/Admin gọi `GET /api/export`; hệ thống sinh tệp `.csv` gắn tiền tố `\uFEFF` (UTF-8 BOM) mở chuẩn tiếng Việt trên Microsoft Excel. |
| **10. Luồng ngoại lệ & Mở rộng** | • `2a.` `HR` hoặc `HIRING_MANAGER` cố gọi `POST /api/talent-pool/cleanup` ➔ Chặn HTTP 403 (`ERR-POOL-403-01`).<br>• `3a.` `HIRING_MANAGER` cố gọi `GET /api/export` ➔ Chặn HTTP 403. |
| **11. Yêu cầu đặc biệt** | Tệp CSV phải chứa ký tự Byte Order Mark (`0xFEFF`) ở byte đầu tiên. |
| **12. Quy tắc nghiệp vụ liên quan** | `BRL-10`, `NFR-SEC-05`. |
