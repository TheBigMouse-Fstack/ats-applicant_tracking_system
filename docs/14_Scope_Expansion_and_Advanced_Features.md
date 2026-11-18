---
id: "EXP-ATS-14"
title: "Đặc tả Mở rộng Phạm vi & Tính năng Nâng cao (Change Request Log)"
type: "cr"
version: "2.1.0"
status: "approved"
owner: "ReCoverX BA & Engineering Team"
domain: "recruitment-ats"
tags:
  - "scope-expansion"
  - "change-request"
  - "interview-lifecycle"
  - "tracker"
upstream_deps:
  - "BRD-ATS-01"
  - "SCOPE-ATS-10"
downstream_deps:
  - "UC-ATS-05"
  - "API-ATS-15"
last_updated: "2026-11-18"
---

# ĐẶC TẢ MỞ RỘNG PHẠM VI & TÍNH NĂNG NÂNG CAO (SCOPE EXPANSION & ADVANCED FEATURES)

> **Dự án:** ReCoverX Career — Applicant Tracking System (ATS)  
> **Tài liệu tham chiếu:** `docs/10_Scope_and_System_Comparison.md`, `docs/02_BRD_Updated_Full.md`  
> **Mục tiêu:** Chuyển hóa các tính năng từng nằm ngoài phạm vi (Out-of-Scope) hoặc bị thiếu sót trong vận hành thành các module thực tế có giá trị cao, nâng tầm trải nghiệm của Ứng viên (Candidate Experience - CX) và hiệu quả của Nhà tuyển dụng (Recruiter Efficiency).

---

## Lịch Sử Phiên Bản (Revision History)

| Phiên Bản | Ngày Phát Hành | Tác Giả | Phân Loại | Tóm Tắt Thay Đổi | Phê Duyệt |
| :---: | :---: | :--- | :---: | :--- | :--- |
| `v2.1.0` | 2026-11-18 | ReCoverX BA Team | **Changed** | Chuẩn hóa tài liệu theo bộ tiêu chuẩn Universal BA Toolkit (YAML Metadata, SemVer, đồng bộ 100% mã nguồn hiện tại). | Product Owner |

---

## I. BỐI CẢNH & QUYẾT ĐỊNH MỞ RỘNG PHẠM VI (SCOPE PROMOTION)

Sau phiên rà soát nghiệp vụ thực tế (Persona Audit) theo 4 vai trò (*Ứng viên, HR Lead, Hiring Manager, System Admin*), hội đồng phân tích nhận diện **3 nút thắt lớn nhất** cần được đưa từ Out-of-Scope vào phạm vi triển khai ngay:

```text
       [ CÁC HẠNG MỤC MỞ RỘNG PHẠM VI - SCOPE PROMOTION ]
       ----------------------------------------------------
       1. Module Lên lịch Phỏng vấn & Thư mời (Interview Scheduling)
          ➔ Đưa từ Out-of-Scope vào In-Scope
       2. Cổng Tra cứu Tiến độ Hồ sơ Ứng viên (Candidate Tracker)
          ➔ Tính năng mới giải quyết bài toán chống "Ghosting"
       3. Tác vụ Dọn dẹp Vòng đời Dữ liệu 6 tháng (BRL-10 Purge)
          ➔ Hiện thực hóa 100% quy tắc bảo mật dữ liệu lưu trữ
```

---

## II. ĐẶC TẢ CHI TIẾT 3 TÍNH NĂNG MỞ RỘNG

### 1. Module Lên lịch Phỏng vấn & Thư mời Tự động (UC-05A: Interview Scheduling)
* **Vấn đề giải quyết:** Trước đây khi kéo thẻ sang cột `INTERVIEW`, hệ thống chỉ đổi trạng thái mà không có nơi lưu ngày giờ, hình thức phỏng vấn hay link họp online. HR vẫn phải mở Zalo/Outlook để ghi nhớ thủ công.
* **Quy chuẩn triển khai:**
  * **Cơ sở dữ liệu:** Bổ sung vào bảng `Application` các trường:
    * `interviewDate`: Thời gian diễn ra phỏng vấn (DateTime).
    * `interviewFormat`: Hình thức (`ONLINE` qua Google Meet/Zoom hoặc `OFFLINE` tại phòng họp công ty).
    * `interviewLocation`: Đường dẫn phòng họp trực tuyến hoặc số phòng họp thực tế.
    * `interviewNotes`: Ghi chú dặn dò ứng viên (chuẩn bị slide, portfolio, trang phục).
  * **Giao diện:**
    * Modal đặt lịch hẹn phỏng vấn tích hợp ngay khi chuyển sang cột `INTERVIEW` hoặc thao tác trong `CandidateDrawer`.
    * Khung xem trước (Preview) **Email Mời Phỏng vấn Tự động** chuẩn chuyên nghiệp chèn biến động `{Candidate_Name}`, `{Job_Title}`, `{Interview_Time}`, `{Location_Or_Link}`.
  * **Quyền hạn RBAC:** Chỉ Chuyên viên HR và Admin có quyền đặt/sửa lịch phỏng vấn. Hiring Manager được quyền xem lịch.

---

### 2. Cổng Tra cứu Tiến độ Hồ sơ Trực tuyến (UC-01A: Candidate Application Tracker)
* **Vấn đề giải quyết:** Hơn 80% ứng viên trên thị trường chịu đựng cảm giác "Ghosting" (nộp đơn rồi bặt vô âm tín, không biết hồ sơ đang ở đâu).
* **Đường dẫn truy cập:** Công khai tại `/jobs/tracker` (không cần tài khoản nội bộ).
* **Cơ chế xác thực tra cứu:**
  * Ứng viên nhập cặp thông tin: **Email** + **Mã đơn ứng tuyển (#ID)** hoặc **Số điện thoại**.
  * Hệ thống kiểm tra đối chiếu CSDL và hiển thị dòng thời gian trực quan (Visual Step Timeline):
    * `Bước 1: Đã tiếp nhận hồ sơ (Application Received)`
    * `Bước 2: Sàng lọc tiêu chuẩn CV (Screening Review)`
    * `Bước 3: Vòng phỏng vấn chuyên môn (Interview Stage)` — Hiển thị ngày giờ và link phỏng vấn nếu đã được HR lên lịch!
    * `Bước 4: Quyết định tuyển dụng (Final Decision)`
* **Bảo mật thông tin (Data Privacy):** Tuyệt đối **không hiển thị** điểm AI Match Score nội bộ, ghi chú nhạy cảm của người phỏng vấn hay mức lương đề xuất. Chỉ hiển thị thông điệp tiến độ lịch sự và minh bạch.

---

### 3. Công cụ Dọn dẹp Vòng đời Dữ liệu 6 tháng (UC-06A: BRL-10 Data Retention Purge)
* **Vấn đề giải quyết:** Tuân thủ quy tắc **BRL-10** và chuẩn an toàn thông tin ISO-27001 / GDPR: Hồ sơ ứng viên ở trạng thái `REJECTED` trong Kho nhân tài chỉ được lưu trữ tối đa 06 tháng. Sau thời hạn này phải được xóa vĩnh viễn (Hard Delete) để giải phóng tài nguyên và bảo vệ quyền riêng tư.
* **Quy chuẩn triển khai:**
  * **API Backend:** `POST /api/talent-pool/cleanup` (Được bảo vệ nghiêm ngặt, chỉ `role === "ADMIN"` mới có quyền gọi).
  * **Logic nghiệp vụ:**
    * Quét toàn bộ hồ sơ có `currentStage === "REJECTED"` và thời gian lưu `stageUpdatedAt` đã quá 180 ngày (6 tháng).
    * Hỗ trợ cờ mô phỏng (`simulateDays`) để phục vụ thuyết trình và kiểm thử đồ án tức thì.
    * Xóa hồ sơ trong CSDL và ghi nhận vết kiểm toán: `AuditLog` với `action: "RETENTION_PURGE"`.
  * **Giao diện:** Nút bấm trực quan *"🧹 Quét & Dọn dẹp hồ sơ quá hạn 6 tháng (BRL-10)"* trên trang Kho nhân tài (`/admin/talent-pool`) dành riêng cho Admin.

---

### 4. Cổng Nộp Hồ Sơ Nội Bộ & Quản Lý Chứng Chỉ (UC-01B: Internal Candidate Sourcing & Certificate Gallery)
* **Vấn đề giải quyết:** Trong thực tế, nhiều ứng viên không nộp đơn qua website công khai mà được Recruiter săn đón (Sourcing) qua LinkedIn, được nhân viên nội bộ giới thiệu (Referral) hoặc qua Đối tác Headhunter. Ngoài ra, ứng viên thường có các chứng chỉ ngoại ngữ (IELTS/TOEIC), chứng chỉ nghề nghiệp dạng ảnh chụp (JPG, PNG) thay vì gom vào file PDF.
* **Quy chuẩn triển khai:**
  * **Modal Nộp Hồ sơ Nội bộ (`AddCandidateModal.tsx`):**
    * Cho phép HR/Admin chọn linh hoạt: Chọn vị trí tuyển dụng trước rồi chọn CV, hoặc tải CV lên trước để hệ thống bóc tách rồi mới gắn vào vị trí tuyển dụng.
    * Phân loại nguồn ứng viên: *Website Careers*, *LinkedIn Sourcing*, *Referral (Giới thiệu)*, *Đối tác săn đầu người*.
    * Hỗ trợ tải đồng thời tệp CV chính (PDF, DOCX) và danh sách chứng chỉ / bằng cấp dạng ảnh (PNG, JPG, WebP).
  * **Trình xem trước hồ sơ tích hợp (Inline PDF & Image Lightbox):**
    * Tích hợp bộ đọc CV định dạng PDF trực tiếp trên web không cần tải về máy.
    * Thư viện ảnh chứng chỉ (Certificate Gallery) cho phép HR phóng to xem chi tiết bằng cấp/chứng chỉ gốc của ứng viên.

---

### 5. Cảnh Báo Hồ Sơ Thiếu Tiêu Chuẩn Tránh Thao Tác Nhầm (BRL-Gate: Stage Mismatch Confirmation Modal)
* **Vấn đề giải quyết:** Khi HR thao tác kéo thả nhanh trên Kanban hoặc chuyển trạng thái sang `SCREENING` hoặc `INTERVIEW`, nếu ứng viên còn thiếu nhiều kỹ năng cốt lõi hoặc chưa đủ số năm kinh nghiệm tối thiểu theo JD, HR có thể vô tình bấm nhầm hoặc bỏ sót.
* **Quy chuẩn triển khai:**
  * **Hệ thống kiểm soát:** Khi phát hiện ứng viên có điểm đối chiếu < 60% hoặc thiếu từ 2 kỹ năng bắt buộc trở lên, hoặc thiếu năm kinh nghiệm so với yêu cầu JD, hệ thống kích hoạt modal cảnh báo `StageMismatchConfirmModal`.
  * **Thông tin cảnh báo:** Liệt kê cụ thể danh sách kỹ năng còn thiếu, số năm kinh nghiệm chênh lệch, và giải trình sơ bộ.
  * **Quyền quyết định của HR:** HR có thể chọn *"Hủy bỏ (Giữ nguyên vòng cũ)"* hoặc xác nhận *"Tiếp tục đặc cách duyệt ứng viên"* với lý do cân nhắc cụ thể.

---

### 6. Quản Lý Vòng Đời Phỏng Vấn Toàn Diện (Interview Lifecycle: Reschedule & Cancellation)
* **Vấn đề giải quyết:** Trước đây hệ thống chỉ cho phép lên lịch từ đầu một lần. Khi ứng viên bận đột xuất hoặc muốn đổi lịch, HR không thể sửa hoặc hủy lịch mà bị ép phải tạo mới.
* **Quy chuẩn triển khai:**
  * **Khi đã có lịch phỏng vấn:** Hệ thống hiển thị trạng thái *"Đang có lịch phỏng vấn"*, thông tin phòng họp, ngày giờ cụ thể.
  * **Chỉnh sửa lịch (Reschedule):** Cho phép HR cập nhật lại ngày giờ, hình thức họp (Google Meet / Trực tiếp) và tự động tạo lại mẫu thư cập nhật.
  * **Hủy lịch hẹn (Cancel Interview):** Cung cấp nút *Hủy Lịch Phỏng Vấn* an toàn với hộp thoại xác nhận, xóa thông tin lịch và ghi nhận nhật ký kiểm toán `INTERVIEW_CANCELLED`.
  * **Hệ thống ghi chú 3 lớp:**
    * *Ghi chú dặn dò ứng viên:* Lời nhắc chuẩn bị slide, kiểm tra mic/camera trước 5 phút.
    * *Lưu ý cho hội đồng phỏng vấn:* Gợi ý trọng tâm câu hỏi kỹ thuật/kiến trúc cho giám khảo.
    * *Biên bản sau phỏng vấn:* Ô nhận xét sau phỏng vấn có nút lưu nhanh độc lập cho HR và giám khảo.

---

### 7. Sắp Xếp Danh Sách Đa Tiêu Chí, Đánh Sáng CV Mới Chưa Xử Lý & Gắn Sao Kiểu Gmail
* **Vấn đề giải quyết:** Tuyển dụng viên quản lý hàng trăm hồ sơ dễ bị trôi tin, bỏ sót các ứng viên mới nộp hoặc không đánh dấu được các ứng viên tiềm năng đặc biệt.
* **Quy chuẩn triển khai:**
  * **Sắp xếp đa tiêu chí (Sorting):** Áp dụng đồng bộ trên Bảng Kanban, Danh sách Ứng viên (`/admin/candidates`) và Kho Nhân tài (`/admin/talent-pool`):
    * `Mới nhất trước (NEWEST)`
    * `Cũ nhất trước (OLDEST)`
    * `Ưu tiên gắn sao ⭐ (STARRED_FIRST)`
    * `Chưa xem trước 🔔 (UNVIEWED_FIRST)`
    * `Chưa đánh giá 📝 (UNEVALUATED_FIRST)`
  * **Đánh sáng CV vòng NEW chưa xử lý:**
    * Hồ sơ nằm ở cột `NEW` và chưa được HR mở xem (`isViewed === false`) sẽ phát sáng với viền gradient xanh và huy hiệu nhấp nháy: `MỚI TIẾP NHẬN • CHƯA XEM`.
    * Ngay khi HR mở xem hồ sơ trong `CandidateDrawer`, hệ thống tự động ghi nhận `isViewed: true` và `viewedAt: now()`, tắt hiệu ứng phát sáng cảnh báo.
  * **Gắn sao một chạm kiểu Gmail (⭐ Star Toggle):**
    * Tích hợp nút sao một chạm trực tiếp trên thẻ Kanban, từng dòng danh sách bảng và tiêu đề Drawer.
    * Trạng thái `isStarred` lưu trực tiếp vào cơ sở dữ liệu và ghi vết `AuditLog` (`STARRED` / `UNSTARRED`).

---

### 8. Phiếu Đánh Giá Chuyên Sâu (Deep Scorecard) & Lịch Sử Toàn Diện Của Ứng Viên (UC-05B)
* **Vấn đề giải quyết:** Phiếu đánh giá cũ quá sơ sài, chỉ có điểm sao chung chung mà không nêu rõ cụ thể **tại sao người này đậu (trúng tuyển)** hoặc tại sao bị từ chối; không lưu được lịch sử các lần ứng tuyển trước đó.
* **Quy chuẩn triển khai:**
  * **Mở rộng bảng `Evaluation`:**
    * `round`: Vòng phỏng vấn (*Vòng 1 Kỹ thuật & Chuyên môn*, *Vòng 2 Văn hóa & Quản lý*, *Vòng Tổng hợp*).
    * `levelRecommendation`: Cấp bậc đề xuất (*Trainee*, *Junior*, *Middle*, *Senior*, *Tech Lead*).
    * `strengths`: **Căn cứ tuyển dụng (Điểm mạnh nổi bật — Lý do chính giúp ứng viên đạt chuẩn)**. Bắt buộc nhập khi đề xuất HIRE/STRONG_HIRE.
    * `weaknesses`: Điểm cần lưu ý / Rủi ro & Kế hoạch đào tạo bổ trợ trong giai đoạn thử việc.
    * `technicalNotes`, `communicationNotes`, `cultureNotes`: Nhận xét chi tiết cho từng tiêu chí trọng số (40% - 30% - 30%).
    * `hireReason`: Tóm tắt kết luận của Giám khảo / Hội đồng phỏng vấn.
  * **Lịch sử toàn diện của ứng viên:**
    * Hiển thị danh sách các đợt ứng tuyển trước đây của ứng viên tại các vị trí khác trong công ty.
    * Hiển thị chi tiết từng phiếu đánh giá của từng giám khảo qua từng vòng độc lập (không ghi đè).
    * Dòng thời gian luân chuyển kiểm toán (Audit Trail) trực quan từ khi nộp đơn đến khi ra quyết định cuối cùng.

---

### 9. Chuẩn Hóa Nhận Diện & Loại Bỏ Khẩu Hiệu AI Phô Trương (Clean Authentic IT Portal)
* **Vấn đề giải quyết:** Ứng viên cảm thấy e ngại và thiếu công bằng nếu biết hồ sơ bị AI đánh giá bằng các câu chữ khoa trương hoặc điểm số máy móc. Đồng thời các khẩu hiệu học thuật làm mất tính chuyên nghiệp của website doanh nghiệp.
* **Quy chuẩn triển khai:**
  * **Loại bỏ triệt để:** Xóa bỏ hoàn toàn các cụm từ *"Mô hình Lai (Hybrid AI)"*, *"Bóc tách ngữ nghĩa LLM"*, *"BPMN 2.0 & BRL-05"*, *"Đối Tác Kỹ Thuật Số & Phát Triển Phần Mềm Doanh Nghiệp Chuẩn Quốc Tế"*, *"Kỹ năng yêu cầu trọng tâm (Được AI đối chiếu)"*.
  * **Tôn trọng tính khách quan của HR:** Điểm số AI không còn hiển thị thô bạo trên trang ứng tuyển công khai hay tự động quyết định đậu/rớt; hệ thống chỉ đóng vai trò trợ lý hỗ trợ đối chiếu kỹ năng và làm nổi bật thông tin cho HR kiểm tra.
  * **Bộ dữ liệu tuyển dụng IT chuẩn mực:** Nạp dữ liệu 8 vị trí công việc chân thật trải dài từ Trainee, Junior, Middle, Senior đến Tech Lead/QA/Designer theo chuẩn công ty phần mềm hiện đại RecoverX.

---

## III. BẢNG ÁNH XẠ CẬP NHẬT TRẠNG THÁI SCOPE TOÀN DIỆN

| Tính năng / Module | Trạng thái ban đầu | Trạng thái hiện tại | Vai trò hưởng lợi chính |
| :--- | :---: | :---: | :--- |
| **Lên lịch Phỏng vấn & Thư mời trực tiếp** | *Out-of-Scope* | **IN-SCOPE (Hoàn thiện 100%)** | Chuyên viên HR, Hiring Manager |
| **Cổng Tra cứu Tiến độ cho Ứng viên** | *Chưa có* | **IN-SCOPE (Hoàn thiện 100%)** | Ứng viên (Candidate Experience) |
| **Dọn dẹp Vòng đời Dữ liệu 6 tháng (BRL-10)** | *Chỉ có tài liệu* | **IN-SCOPE (Hoàn thiện 100%)** | Quản trị viên (System Admin) |
| **Cổng Nộp Hồ Sơ Nội Bộ & Quản Lý Bằng Cấp Ảnh** | *Chưa có* | **IN-SCOPE (Hoàn thiện 100%)** | Chuyên viên HR, Recruiter, Admin |
| **Cảnh Báo Chuyển Trạng Thái Thiếu Tiêu Chuẩn** | *Chưa có* | **IN-SCOPE (Hoàn thiện 100%)** | Chuyên viên HR (Tránh thao tác nhầm) |
| **Quản Lý Vòng Đời Phỏng Vấn (Đổi lịch, Hủy lịch)** | *Chưa có* | **IN-SCOPE (Hoàn thiện 100%)** | Chuyên viên HR, Hội đồng Phỏng vấn |
| **Sắp Xếp Danh Sách, Đánh Sáng CV & Gắn Sao ⭐** | *Chưa có* | **IN-SCOPE (Hoàn thiện 100%)** | Tuyển dụng viên, Quản trị viên |
| **Phiếu Đánh Giá Chuyên Sâu & Lịch Sử Toàn Diện** | *Sơ sài* | **IN-SCOPE (Hoàn thiện 100%)** | Hiring Manager, Ban Lãnh Đạo, HR |
| **Làm Sạch Dữ Liệu & Chuẩn Hóa Nhận Diện IT** | *Chưa chuẩn* | **IN-SCOPE (Hoàn thiện 100%)** | Doanh nghiệp RecoverX & Ứng viên |

