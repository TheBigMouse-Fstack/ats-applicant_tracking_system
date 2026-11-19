# 🎯 ATS — Applicant Tracking System
### Hệ Thống Quản Trị & Tự Động Hóa Tuyển Dụng Doanh Nghiệp

[![Tests](https://img.shields.io/badge/tests-161%20passed-brightgreen.svg)](tests/run-tests.js)
[![Framework](https://img.shields.io/badge/framework-Next.js%2014%20App%20Router-black.svg)](https://nextjs.org)
[![Database](https://img.shields.io/badge/database-Neon%20PostgreSQL-00E599.svg)](https://neon.tech)
[![AI Engine](https://img.shields.io/badge/AI-Google%20Gemini%202.5-4285F4.svg)](https://aistudio.google.com)
[![Storage](https://img.shields.io/badge/storage-Neon%20S3%20Object%20Storage-blue.svg)](https://neon.tech)
[![Security](https://img.shields.io/badge/security-HMAC%20SHA--256%20%7C%20PII%20Shield-success.svg)](src/lib/auth.ts)

---

## 📌 1. Giới Thiệu Dự Án

**ATS — Applicant Tracking System** là nền tảng quản trị quy trình tuyển dụng thông minh được phát triển nhằm hiện đại hóa toàn diện công tác thu hút, sàng lọc và tuyển dụng nhân tài cho doanh nghiệp. 

Hệ thống được thiết kế theo tiêu chuẩn phần mềm doanh nghiệp (Enterprise SaaS), tích hợp công nghệ **Hybrid AI (Lớp 1 NLP cục bộ + Lớp 2 Google Gemini)**, tự động hóa quy trình đa kênh qua **n8n (Gmail, Telegram Bot, Google Calendar)**, cơ sở dữ liệu serverless đám mây **Neon PostgreSQL** và giải pháp lưu trữ tệp tin an toàn **Neon Object Storage**.

Hệ thống hiện đã hoàn thiện đầy đủ các khâu kiểm thử khắt khe (**161/161 test cases PASS**) và sẵn sàng đưa vào **thử nghiệm thực tế 1 tuần** dành cho Bộ phận Nhân sự (HR) và Hội đồng Tuyển dụng.

---

## 🌐 2. Cổng Truy Cập Hệ Thống

Hệ thống phân tách rạch ròi giữa **Cổng Thông Tin Công Khai** dành cho Ứng viên và **Cổng Quản Trị Vận Hành** dành cho Cán bộ Nội bộ:

### A. Cổng Thông Tin Tuyển Dụng Dành Cho Ứng Viên (Public Portal)
* **Trang chủ Doanh nghiệp:**  
  👉 Đường dẫn: `/`  
  *Giới thiệu tổng quan về thương hiệu RecoverX, văn hóa doanh nghiệp và cơ hội nghề nghiệp.*
* **Cổng Tuyển Dụng & Nộp CV Trực Tuyến:**  
  👉 Đường dẫn: `/jobs`  
  *Khám phá các vị trí tuyển dụng đang mở, xem yêu cầu chi tiết (JD), tải CV lên để tự động điền form (Auto-fill) và nộp đơn ứng tuyển trực tuyến.*
* **Cổng Tra Cứu Tiến Độ Hồ Sơ Theo Thời Gian Thực (Candidate Tracker):**  
  👉 Đường dẫn: `/jobs/tracker` *(Tích hợp ngay trong trang Tuyển dụng)*  
  *Cho phép ứng viên chủ động kiểm tra trạng thái xét duyệt, thời gian và địa điểm phỏng vấn (Online Meet hoặc Văn phòng) thông qua Email và Số điện thoại/Mã hồ sơ.*

> [!NOTE]
> Toàn bộ các đường dẫn và nút bấm quản trị nội bộ đã được gỡ bỏ khỏi giao diện công khai để đảm bảo tính chuyên nghiệp và bảo mật tuyệt đối cho cổng tuyển dụng.

### B. Cổng Quản Trị & Điều Phối Tuyển Dụng Nội Bộ (Internal ATS Portal)
* **Trang Đăng Nhập Bảo Mật:**  
  👉 Đường dẫn: `/admin/login`  
  *Cổng đăng nhập tập trung được bảo vệ bởi xác thực phân quyền RBAC và mã hóa phiên HMAC-SHA256.*
* **Bảng Điều Khiển Vận Hành Theo Vai Trò (Operational Dashboard):**  
  👉 Đường dẫn: `/admin/dashboard`  
  *Cung cấp số liệu thống kê thời gian thực: Hàng đợi hồ sơ mới, cảnh báo vi phạm SLA (>48h), tiến độ phỏng vấn và chỉ tiêu tuyển dụng theo từng vai trò.*
* **Bảng Điều Phối Kanban 5 Giai Đoạn (Pipeline Board):**  
  👉 Đường dẫn: `/admin/pipeline`  
  *Kéo thả hồ sơ trực quan qua 5 cột (`NEW` ➔ `SCREENING` ➔ `INTERVIEW` ➔ `HIRED` / `REJECTED`), xem chi tiết hồ sơ trong Drawer 5 tab, xem tệp CV gốc và chấm điểm Scorecard.*
* **Quản Lý Vị Trí Tuyển Dụng (Job Management):**  
  👉 Đường dẫn: `/admin/jobs`  
  *Tạo mới JD, thiết lập chỉ tiêu tuyển dụng (`targetHeadcount`) và giới hạn phỏng vấn đồng thời (`maxActiveInterviews`).*
* **Kho Dữ Liệu Nhân Tài & CRM (Talent Pool):**  
  👉 Đường dẫn: `/admin/talent-pool`  
  *Lưu trữ và phân loại các ứng viên tiềm năng (Silver Medalist, Đang chờ đợt sau, Dự phòng 180 ngày) phục vụ tái tuyển dụng.*

---

## 👥 3. Tài Khoản Thử Nghiệm 1 Tuần Dành Cho Doanh Nghiệp

Để Ban Giám đốc, HR và Quản lý Chuyên môn trải nghiệm đầy đủ các phân quyền trong đợt thử nghiệm:

| Vai Trò (Role) | Tài Khoản Đăng Nhập | Mật Khẩu Mặc Định | Quyền Hạn Nghiệp Vụ Cốt Lõi |
| :--- | :--- | :---: | :--- |
| **Quản trị viên (Admin)** | `admin@ats.vn` | `Admin@123456` | Toàn quyền cấu hình hệ thống, tạo tài khoản người dùng, xem toàn cảnh 360 độ và nhật ký kiểm toán (Audit Trail). |
| **Trưởng nhóm Tuyển dụng (HR Lead)** | `hr@ats.vn` | `Hr@123456` | Tiếp nhận CV đầu phễu, sàng lọc tiêu chuẩn (`NEW ➔ SCREENING`), chỉnh sửa thủ công 5 trường thông tin CV, quản lý kho nhân tài. |
| **Quản lý Chuyên môn (Hiring Manager)** | `manager@ats.vn` | `Manager@123456` | Xem hồ sơ đã qua sơ tuyển, thiết lập lịch phỏng vấn Online/Offline, chấm điểm Phiếu đánh giá Scorecard và duyệt tuyển (`SCREENING ➔ INTERVIEW ➔ HIRED`). |

---

## 🚀 4. Kịch Bản Thử Nghiệm Chuẩn 7 Bước (1-Week Trial Workflow)

1. **Bước 1 — Nộp đơn ứng tuyển:** Ứng viên truy cập `/jobs`, chọn vị trí mong muốn, tải tệp CV (.pdf hoặc .docx). Hệ thống tự động bóc tách thông tin điền trước vào form.
2. **Bước 2 — Thông báo đẩy tức thì:** Ngay khi ứng viên nộp đơn thành công, bot Telegram `@Rec_Hr_rBot` sẽ gửi thông báo đến nhóm HR kèm thông tin vị trí và ứng viên.
3. **Bước 3 — Sàng lọc tự động bằng AI:** Hệ thống chấm điểm độ phù hợp (Match Score %) và giải trình lý do theo 3 mức màu:
   * 🟢 **Xanh lá (≥ 75%):** Phù hợp cao, ưu tiên phỏng vấn.
   * 🟡 **Vàng (50% – 74%):** Tiềm năng, cân nhắc phỏng vấn vòng phụ.
   * 🔴 **Đỏ (< 50%):** Không đáp ứng yêu cầu tối thiểu.
4. **Bước 4 — Tiếp nhận & Sơ tuyển (HR):** HR đăng nhập `/admin/login`, kiểm tra hàng đợi tại `/admin/pipeline`, mở Drawer xem CV gốc và xác nhận chuyển sang `SCREENING`.
5. **Bước 5 — Xếp lịch Phỏng vấn (Hiring Manager):** Chọn hình thức **🌐 Online (Google Meet)** hoặc **🏢 Offline (Tại Văn phòng)**. Hệ thống tự động tạo mẫu thư mời chuyên nghiệp và hỗ trợ đồng bộ Google Calendar.
6. **Bước 6 — Đánh giá năng lực chuyên sâu (Scorecard):** Hội đồng phỏng vấn chấm điểm 3 tiêu chí theo trọng số chuẩn mực:
   * **Chuyên môn kỹ thuật (40%)**
   * **Giao tiếp & Thuyết trình (30%)**
   * **Độ phù hợp văn hóa & Làm việc nhóm (30%)**  
   *(Khóa chặt quy tắc BRL-06: Bắt buộc phải có Scorecard đạt chuẩn mới được phép duyệt trúng tuyển `HIRED`)*.
7. **Bước 7 — Quyết định tuyển dụng hoặc Lưu trữ nhân tài:**
   * **Nếu Trúng tuyển:** Chuyển sang cột `HIRED`, hệ thống tự động trừ chỉ tiêu và tự đóng tin khi đã đủ quân số (`BRL-13`).
   * **Nếu Chưa phù hợp:** Bắt buộc nhập lý do từ chối cụ thể (`BRL-11`). Hệ thống tự động kích hoạt bộ đệm hoãn gửi thư từ chối 12–24h (`BRL-05`) và lưu hồ sơ vào Kho Nhân Tài (`Talent Pool`).

---

## 🛡️ 5. Kiến Trúc An Ninh & Chống Tấn Công / Đánh Cắp Dữ Liệu

Hệ thống được rà soát và cài đặt các cơ chế bảo mật nghiêm ngặt nhằm triệt tiêu nguy cơ rò rỉ dữ liệu hoặc bị xâm nhập:

* **Không Lưu Trữ Secret / Token trên Git:** Toàn bộ thông tin nhạy cảm (`DATABASE_URL`, `GEMINI_API_KEY`, `SESSION_SECRET`, `AWS_SECRET_ACCESS_KEY`) được quản lý bằng biến môi trường `.env` riêng biệt, đã bị loại bỏ 100% khỏi lịch sử Git index.
* **Bảo Vệ Tệp Tin CV & Quyền Riêng Tư (PII Shield):** Tệp CV gốc được lưu trữ trên Bucket riêng tư (Private S3) của Neon Cloud. Trình duyệt không thể truy cập trực tiếp URL của S3 mà phải thông qua Proxy route nội bộ `/api/applications/storage/[...key]`. Endpoint này kiểm tra phiên đăng nhập của HR/Admin và chặn đứng 100% các cuộc tấn công vượt cấp thư mục (**Path Traversal `../`**).
* **Mã Hóa Phiên Đăng Nhập HMAC-SHA256 & Timing-Safe:** Cookie phiên làm việc được ký bằng chuỗi bí mật entropy cao (256-bit). Thuật toán giải mã sử dụng `crypto.timingSafeEqual` để vô hiệu hóa hoàn toàn tấn công giả mạo quyền hạn (Privilege Escalation) và tấn công đo thời gian (Timing Attacks).
* **Hàng Rào Chống Vượt Rào Mệnh Lệnh (Anti-Prompt-Injection Guardrails):** Văn bản CV của ứng viên được cô lập hoàn toàn bên trong thẻ XML `<candidate_cv_raw_text>` kèm các chỉ thị hệ thống nghiêm ngặt, ngăn chặn ứng viên chèn các lệnh bí mật nhằm đánh lừa AI nâng điểm hoặc trích xuất dữ liệu nội bộ.
* **Chống Thư Rác & Tấn Công Từ Chối Dịch Vụ (Rate Limiting HTTP 429):** Bộ giới hạn tần suất giới hạn tối đa 10 lượt nộp hồ sơ / 10 phút trên mỗi địa chỉ IP.
* **Xác Thực Magic Bytes Nhị Phân:** Hệ thống đọc trực tiếp 4 bytes đầu của tệp tin (`%PDF` và `PK\x03\x04`), từ chối lập tức các tệp mã độc thực thi (`.exe`, `.sh`, `.php`, script HTML) giả danh phần mở rộng tài liệu.

---

## 💻 6. Hướng Dẫn Cài Đặt & Vận Hành Cục Bộ

### Yêu cầu môi trường:
* **Node.js:** Phiên bản 18.x trở lên (khuyên dùng Node.js 20+ LTS).
* **NPM:** Phiên bản 9.x trở lên.

### Các bước khởi động:
```bash
# 1. Cài đặt các thư viện phụ thuộc
npm install

# 2. Khởi tạo và đồng bộ cơ sở dữ liệu
npx prisma db push

# 3. Nạp dữ liệu mẫu ban đầu (Người dùng, Vị trí tuyển dụng, Hồ sơ mẫu)
npx ts-node prisma/seed.ts

# 4. Chạy bộ kiểm thử tự động toàn diện (Xác nhận 161/161 tests PASS)
node tests/run-tests.js

# 5. Khởi động máy chủ phát triển
npm run dev
```

Truy cập hệ thống tại: **`http://localhost:3000`**

---

## 📋 7. Cấu Trúc Mã Nguồn & Tài Liệu Kỹ Thuật

```text
ATS-Project/
├── docs/
│   ├── ba/                       # Hồ sơ Nghiệp vụ BA (BRD, BPMN, Use Cases, RTM ma trận truy vết)
│   └── dev-context/              # Ngữ cảnh Kỹ thuật (ERD, Kiến trúc hệ thống, API Docs, Staging Guide)
├── prisma/
│   ├── schema.prisma             # Lược đồ Cơ sở dữ liệu chuẩn PostgreSQL / SQLite
│   └── seed.ts                   # Dữ liệu khởi tạo mặc định cho đợt thử nghiệm
├── src/
│   ├── app/                      # Next.js 14 App Router (Public routes & Internal admin routes)
│   ├── components/               # Các khối giao diện: Kanban, Drawer, Scorecard, Form ứng tuyển
│   └── lib/                      # Thư viện dùng chung: Hybrid AI parser, Auth HMAC, Storage S3, i18n
└── tests/
    └── run-tests.js              # Bộ kiểm thử nghiệp vụ & an ninh tự động (161 tests)
```

---
© 2026 **ATS — Applicant Tracking System**. Bảo lưu mọi quyền. Đã sẵn sàng cho giai đoạn Thử nghiệm Doanh nghiệp & Triển khai Đám mây.
