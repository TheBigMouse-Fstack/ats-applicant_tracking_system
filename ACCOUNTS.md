# 🔐 DANH SÁCH TÀI KHOẢN ĐĂNG NHẬP NỘI BỘ (ATS SYSTEM)
### Hệ Thống Quản Trị & Tự Động Hóa Tuyển Dụng Doanh Nghiệp

> 🌐 **Cổng Đăng Nhập Trực Tuyến (Production Cloud):** [https://ats-applicant-tracking-system.vercel.app/admin/login](https://ats-applicant-tracking-system.vercel.app/admin/login)  
> 💻 **Cổng Đăng Nhập Cục Bộ (Localhost):** `http://localhost:3000/admin/login`  
> 
> Toàn bộ tài khoản thử nghiệm dành cho Doanh nghiệp đã được đồng bộ trực tiếp vào cơ sở dữ liệu **Neon Cloud PostgreSQL**, mã hóa mật khẩu an toàn bằng thuật toán chuẩn NIST **PBKDF2 (100,000 vòng lặp có Salt ngẫu nhiên)**.

---

### 📋 Bảng Danh Sách Tài Khoản & Phân Quyền (RBAC)

| STT | Vai Trò (Role) | Họ và Tên | Email Đăng Nhập Chính | Mật Khẩu | Email Thay Thế (Alias) | Phạm Vi Quyền Hạn Nghiệp Vụ Cốt Lõi |
| :---: | :--- | :--- | :---: | :---: | :---: | :--- |
| **1** | **Quản Trị Viên (Admin)** | **Nguyễn Văn An** | `admin@ats.vn` | **`Admin@123456`** | `admin@recoverx.career` | • Toàn quyền cấu hình hệ thống & người dùng.<br>• Xem toàn cảnh 360 độ Dashboard & Nhật ký kiểm toán (Audit Trail).<br>• Ghi đè chỉ tiêu hoặc mở lại tin tuyển dụng khi cần thiết. |
| **2** | **Trưởng Nhóm Tuyển Dụng (HR Lead)** | **Nguyễn Thu Hà** | `hr@ats.vn` | **`Hr@123456`** | `hr@recoverx.career` | • Tiếp nhận hồ sơ mới đầu phễu (`NEW`).<br>• Sàng lọc tiêu chuẩn (`NEW ➔ SCREENING`).<br>• Chỉnh sửa thủ công 5 trường thông tin CV trích xuất.<br>• Quản lý và tái khai thác Kho Nhân Tài (`Talent Pool`).<br>• Không thể can thiệp duyệt `INTERVIEW` hay `HIRED`. |
| **3** | **Quản Lý Chuyên Môn (Hiring Manager)** | **Trần Minh Quân** | `manager@ats.vn` | **`Manager@123456`** | `techlead@recoverx.career` | • Phụ trách vòng chuyên môn (`SCREENING ➔ INTERVIEW ➔ HIRED`).<br>• Thiết lập lịch phỏng vấn Online (Google Meet) hoặc Offline.<br>• Chấm điểm Phiếu Đánh Giá (Scorecard 3 tiêu chuẩn trọng số).<br>• Bắt buộc có Scorecard đạt chuẩn mới được phép duyệt `HIRED`.<br>• Bắt buộc nhập lý do chi tiết khi từ chối hồ sơ (`REJECTED`). |

---

### 💡 Hướng Dẫn Kiểm Thử Phân Quyền Vòng Tuyển (RBAC Workflow)

1. **Đăng nhập với HR Lead (`hr@ats.vn` / `Hr@123456`):**
   - Vào `/admin/pipeline`, mở Drawer xem hồ sơ mới ở cột `NEW`.
   - Xem CV gốc qua Proxy bảo mật PII, chỉnh sửa 5 trường thông tin nếu cần.
   - Kéo thẻ sang `SCREENING`.
   - *Thử kéo tiếp sang `INTERVIEW` hoặc `HIRED`: Hệ thống sẽ tự động chặn và thông báo giới hạn phân quyền của HR.*

2. **Đăng xuất & Đăng nhập với Hiring Manager (`manager@ats.vn` / `Manager@123456`):**
   - Vào `/admin/pipeline`, mở hồ sơ đang ở cột `SCREENING`.
   - Kéo thẻ sang `INTERVIEW`.
   - Mở Drawer, vào tab **"Lịch Phỏng Vấn"**: Chọn Google Meet hoặc Tại Văn phòng và lưu lịch.
   - Vào tab **"Phiếu Đánh Giá"**: Chấm điểm Chuyên môn (40%), Giao tiếp (30%), Văn hóa (30%) và lưu phiếu.
   - Sau khi có phiếu đạt chuẩn, kéo thẻ sang `HIRED` thành công.
   - *Thử kéo hồ sơ chưa chấm điểm sang `HIRED`: Hệ thống sẽ chặn cứng theo quy tắc BRL-06.*

3. **Đăng nhập với Quản Trị Viên (`admin@ats.vn` / `Admin@123456`):**
   - Xem Bảng điều hành tổng quan (`/admin/dashboard`), theo dõi phễu chuyển đổi và cảnh báo vi phạm SLA (>48h).
   - Kiểm tra toàn bộ quy trình vận hành và nhật ký kiểm toán hệ thống.

---
© 2026 **ATS — Applicant Tracking System**. Bản quyền thuộc về Đội ngũ Kỹ thuật Dự án.
