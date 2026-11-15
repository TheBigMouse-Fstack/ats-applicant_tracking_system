# ĐẶC TẢ MỞ RỘNG PHẠM VI & TÍNH NĂNG NÂNG CAO (SCOPE EXPANSION & ADVANCED FEATURES)

> **Dự án:** ReCoverX Career — Applicant Tracking System (ATS)  
> **Tài liệu tham chiếu:** `docs/10_Scope_and_System_Comparison.md`, `docs/02_BRD_Updated_Full.md`  
> **Mục tiêu:** Chuyển hóa các tính năng từng nằm ngoài phạm vi (Out-of-Scope) hoặc bị thiếu sót trong vận hành thành các module thực tế có giá trị cao, nâng tầm trải nghiệm của Ứng viên (Candidate Experience - CX) và hiệu quả của Nhà tuyển dụng (Recruiter Efficiency).

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

## III. BẢNG ÁNH XẠ CẬP NHẬT TRẠNG THÁI SCOPE

| Tính năng | Trạng thái ban đầu | Trạng thái mới sau Mở rộng | Vai trò hưởng lợi chính |
| :--- | :---: | :---: | :--- |
| **Lên lịch Phỏng vấn & Thư mời trực tiếp** | *Out-of-Scope* | **IN-SCOPE (Đã hoàn thiện)** | Chuyên viên HR, Hiring Manager |
| **Cổng Tra cứu Tiến độ cho Ứng viên** | *Chưa có* | **IN-SCOPE (Đã hoàn thiện)** | Ứng viên (Candidate Experience) |
| **Công cụ Dọn dẹp Vòng đời 6 tháng (BRL-10)** | *Tài liệu có, Code thiếu* | **IN-SCOPE (Đã hoàn thiện)** | Quản trị viên (System Admin) |

