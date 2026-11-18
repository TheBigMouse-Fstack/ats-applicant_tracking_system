---
id: "RBAC-NFR-08"
title: "Phân loại Tác nhân, Ma trận Phân quyền RBAC & Yêu cầu Phi chức năng (ISO/IEC 25010)"
type: "srs"
version: "2.1.0"
status: "approved"
owner: "ReCoverX BA & Security Team"
domain: "recruitment-ats"
tags:
  - "rbac"
  - "nfr-iso-25010"
  - "actor-taxonomy"
  - "security"
upstream_deps:
  - "BRD-ATS-01"
  - "FDD-ATS-04"
downstream_deps:
  - "API-ATS-15"
  - "BR-ERR-17"
last_updated: "2026-11-18"
---

# PHÂN LOẠI TÁC NHÂN, MA TRẬN PHÂN QUYỀN (RBAC) & YÊU CẦU PHI CHỨC NĂNG (NFR)

> **Dự án:** ReCoverX Career — Applicant Tracking System (ATS)  
> **Tiêu chuẩn áp dụng:** Universal BA Toolkit (`RULE-04` ISO/IEC 25010, `RULE-17` Actor Taxonomy & Least Privilege, `RULE-18`, `RULE-19`).

## Lịch Sử Phiên Bản (Revision History)

| Phiên Bản | Ngày Phát Hành | Tác Giả | Phân Loại | Tóm Tắt Thay Đổi | Người Phê Duyệt |
| :---: | :---: | :--- | :---: | :--- | :--- |
| `v1.0.0` | 2026-11-12 | BA Team | **Initial** | Khởi tạo Ma trận phân quyền RBAC và NFR ban đầu. | Product Owner |
| `v2.0.0` | 2026-11-15 | BA & Security Team | **Security** | Đồng bộ chuẩn băm mật khẩu NIST PBKDF2-SHA512, chữ ký phiên HMAC-SHA256, Magic Bytes và Edge Middleware. | Tech Lead |
| `v2.1.0` | 2026-11-18 | BA & Security Team | **Changed** | Bổ sung Phân loại 4 nhóm Tác nhân (`RULE-17`); phân tách thẩm quyền vòng tuyển: `HR` max `SCREENING` + sửa 5 trường CV; `HIRING_MANAGER` phụ trách `INTERVIEW`/`HIRED` & lịch phỏng vấn. | Product Owner & Tech Lead |
| `v2.2.0` | 2026-11-18 | BA & Security Team | **Added** | Đặc tả phân quyền **Operational Dashboard** (`/admin/dashboard`) theo từng vai trò (Least Privilege + Job-to-be-Done) và tách biệt thương hiệu Nội bộ (`ATS — Applicant Tracking System`) vs Public (`RecoverX`). | Product Owner & Tech Lead |

---

# MỤC 13: PHÂN LOẠI TÁC NHÂN & MA TRẬN PHÂN QUYỀN (RBAC)

### 0. Phân Loại 4 Nhóm Tác Nhân Hệ Thống (Actor Taxonomy — RULE-17)

| Nhóm Tác Nhân | Tác Nhân Cụ Thể Trong ReCoverX Career ATS | Vai Trò Tương Tác |
| :--- | :--- | :--- |
| **1. Primary Actor** *(Tác nhân chính)* | Ứng viên (`Public`), Chuyên viên HR (`HR`), Quản lý Chuyên môn (`HIRING_MANAGER`), Quản trị viên (`ADMIN`) | Trực tiếp khởi xướng thao tác nghiệp vụ trên hệ thống. |
| **2. Secondary Actor** *(Tác nhân phụ)* | Google Gemini API (`@google/genai`), Dịch vụ gửi Email (SMTP/Resend) | Tiếp nhận yêu cầu từ hệ thống chính để phân tích ngữ nghĩa CV và gửi thư mời/từ chối. |
| **3. System / Daemon Actor** *(Tác nhân ngầm)* | Edge Middleware (`src/middleware.ts`), Hybrid AI Fallback (`pdf-parse` + Heuristic NLP), SLA Checker, Rejection Delay Queue (12h) | Thực thi tự động bảo vệ biên, kiểm tra SLA, đệm trễ email và dự phòng offline. |
| **4. Off-stage Stakeholder** *(Bên liên quan thụ hưởng)* | Ban Giám đốc (C-Level), Pháp chế / Kiểm toán (Nghị định 13/2023/NĐ-CP) | Thụ hưởng báo cáo CSV, Audit Trail bất biến và đảm bảo tuân thủ bảo mật dữ liệu cá nhân. |

### 1. Định nghĩa các Vai trò người dùng (User Roles)
1. **Ứng viên (Candidate / Public):** Người dùng bên ngoài, truy cập công khai vào Cổng tuyển dụng để xem tin, nộp hồ sơ, đính kèm chứng chỉ và tra cứu tiến độ ứng tuyển trực tuyến (Public Tracker), không cần tài khoản đăng nhập.
2. **Chuyên viên HR (Recruiter):** Phụ trách giai đoạn đầu phễu tuyển dụng: quản lý tin tuyển dụng (JD), nạp CV nội bộ, **chỉnh sửa/bổ sung thủ công 5 trường thông tin trích xuất từ CV** (tránh lỗi bóc text), đánh dấu sao, xuất báo cáo CSV, Repooling và **luân chuyển hồ sơ tối đa đến cột `SCREENING` (Sàng lọc tiêu chuẩn)** hoặc `REJECTED` (kèm lý do bắt buộc). **Không được phép tự ý chuyển hồ sơ sang `INTERVIEW` hay `HIRED`.**
3. **Quản lý chuyên môn (Hiring Manager / Tech Lead):** Phụ trách giai đoạn chuyên môn từ vòng `SCREENING` trở đi: xem hồ sơ ứng viên, **duyệt chuyển từ `SCREENING ➔ INTERVIEW`**, quản lý lịch phỏng vấn (xếp lịch, đổi lịch, hủy lịch), lập Phiếu đánh giá chuyên sâu (Scorecard), và **quyết định cuối cùng `INTERVIEW ➔ HIRED`** (khi đủ điều kiện BRL-06) hoặc `REJECTED` (kèm lý do bắt buộc BRL-11). **Không can thiệp vòng `NEW`, không tạo/xóa JD, không sửa dữ liệu bóc tách CV.**
4. **Quản trị viên (Admin):** Quản lý toàn diện hệ thống; quản trị tài khoản người dùng nội bộ (`/admin/users`), phân quyền vai trò, hỗ trợ điều phối mọi chuyển đổi hợp lệ theo State Machine và là tác nhân duy nhất có thẩm quyền thực thi tác vụ xóa vĩnh viễn (Hard Delete) hồ sơ quá hạn 6 tháng theo BRL-10.

---

### 2. Bảng Ma trận Phân quyền chi tiết (RBAC Matrix)

> **Ký hiệu quyền hạn:**
> * **C (Create):** Quyền tạo mới / Tải lên / Thiết lập.
> * **R (Read):** Quyền xem / Đọc dữ liệu / Tra cứu.
> * **U (Update):** Quyền chỉnh sửa / Kéo-thả chuyển trạng thái / Ghi nhận.
> * **D (Delete):** Quyền xóa (Soft Delete: Ẩn/Đóng; Hard Delete: Xóa vĩnh viễn khỏi CSDL và ổ đĩa).
> * **`-` :** Không có quyền truy cập (Bị ẩn giao diện hoặc chặn ở tầng Backend/Middleware).

| STT | Phân hệ & Chức năng nghiệp vụ | 👤 Ứng viên (Public) | 👔 Chuyên viên HR | 💼 Hiring Manager | 🛠️ Quản trị viên (Admin) | Ghi chú ràng buộc bảo mật & Thực thi Code |
| :---: | :--- | :---: | :---: | :---: | :---: | :--- |
| **0** | **Bảng điều khiển Tổng quan Vận hành (Operational Dashboard)** | | | | | |
| 0a | Truy cập Dashboard Tổng quan (`/admin/dashboard`, `GET /api/dashboard`) | **`-` (CẤM)** | **R** *(Góc nhìn Đầu phễu)* | **R** *(Góc nhìn Chuyên môn)* | **R** *(Toàn cảnh 360°)* | **Phân quyền dữ liệu tại Backend API:** Mỗi Role chỉ nhận đúng KPI và hàng đợi thuộc phạm vi trách nhiệm; không phải BI Analytics Dashboard (tôn trọng Out-of-Scope đề bài). |
| 0b | Hàng đợi CV `NEW` chưa xem & SLA >48h (Đầu phễu HR) | - | **R** | - | **R** | HR thấy ngay CV cần sơ loại; Manager không bị nhiễu bởi CV chưa qua vòng HR. |
| 0c | Hàng đợi duyệt Phỏng vấn (`SCREENING`), thiếu Scorecard (`INTERVIEW`) & Lịch PV | - | - | **R** | **R** | Hiring Manager tập trung ra quyết định chuyên môn (`SCREENING ➔ INTERVIEW ➔ HIRED`). |
| 0d | Giám sát Quản trị (User hoạt động, Hồ sơ quá hạn 180 ngày BRL-10, AuditLog gần nhất) | - | **`-` (CẤM)** | **`-` (CẤM)** | **R** | API không trả trường `adminStats` / `recentAuditLogs` cho `HR` và `HIRING_MANAGER`. |
| **I** | **Cổng ứng tuyển & Tra cứu trực tuyến** | | | | | |
| 1 | Xem danh sách tin tuyển dụng & JD | **R** | **R** | **R** | **R** | Truy cập công khai tại `/jobs` |
| 2 | Nộp hồ sơ & Tải CV, chứng chỉ (.pdf, .docx ≤ 10MB) | **C** | - | - | - | Chống spam: Rate Limit 5 lần/10 phút & Magic Bytes |
| 3 | Tra cứu tiến độ hồ sơ ứng tuyển (Public Tracker) | **R** | **R** | **R** | **R** | Tra cứu qua Mã hồ sơ; **Bảo mật NFR-SEC-04: Ẩn điểm AI & nhận xét nội bộ** |
| **II**| **Quản lý Vị trí tuyển dụng (Jobs Management)** | | | | | |
| 4 | Tạo mới & Chỉnh sửa JD tuyển dụng | - | **C, R, U** | **R** *(chỉ đọc)* | **C, R, U, D** | **Chặn Manager tạo/sửa JD** (kiểm tra quyền tại API) |
| 5 | Đóng / Mở đợt tuyển dụng (Trạng thái Active/Closed)| - | **U** | - | **U** | Cập nhật cờ trạng thái tiếp nhận hồ sơ |
| 6 | Xóa vị trí tuyển dụng | - | - | - | **D** | Chỉ Admin có thẩm quyền xóa tin tuyển dụng |
| **III**| **Tiếp nhận, Trích xuất 5 trường & Chỉnh sửa CV**| | | | | |
| 7 | Tải lên CV nội bộ & đính kèm chứng chỉ (Add Candidate) | - | **C** | - | **C** | Phân loại nguồn (`LINKEDIN`, `REFERRAL`, `HEADHUNTER`) |
| 8 | Xem 5 trường cốt lõi & Mở rộng chi tiết hồ sơ / CV gốc | - | **R** | **R** | **R** | Mặc định hiện 5 trường theo JD; bấm "Xem chi tiết" để mở rộng |
| 9 | **Chỉnh sửa / Bổ sung thủ công trường trích xuất CV** | - | **U** | **`-` (CẤM)** | **U** | **`PATCH /api/applications/[id]/profile`: HR sửa tên, email, KN, thêm/xóa kỹ năng + tự tính lại khớp JD** |
| 10 | Kích hoạt phân tích lại AI (Re-parse CV) | - | **U** | - | **U** | Kích hoạt khi có sự cố mạng hoặc muốn cập nhật phân tích |
| **IV**| **Quản lý Pipeline Kanban (Phân tách theo Vòng)** | | | | | |
| 11 | Xem bảng Kanban 5 cột (`NEW` ➔ `REJECTED`) | - | **R** | **R** | **R** | Toàn bộ 5 cột hiển thị minh bạch cho cả HR & Manager |
| 12 | **Chuyển `NEW ➔ SCREENING` (Sàng lọc tiêu chuẩn)** | - | **U** *(Max của HR)* | **`-` (CẤM)** | **U** | **`RBAC-STAGE-LIMIT`: HR chỉ được kéo tối đa đến `SCREENING`** |
| 13 | **Chuyển `SCREENING ➔ INTERVIEW` (Duyệt Phỏng vấn)** | - | **`-` (CẤM)** | **U** | **U** | **`RBAC-STAGE-LIMIT`: Chỉ Hiring Manager / Admin được duyệt Phỏng vấn** |
| 14 | **Chuyển `INTERVIEW ➔ HIRED` (Quyết định Tuyển chọn)** | - | **`-` (CẤM)** | **U** *(Bắt buộc Scorecard)* | **U** *(Bắt buộc Scorecard)* | **`BRL-06` + `RBAC-STAGE-LIMIT`: Cần ≥ 1 Scorecard đạt chuẩn** |
| 15 | **Chuyển sang `REJECTED` (Bắt buộc có Lý do — BRL-11)** | - | **U** *(vòng NEW/SCREENING)* | **U** *(vòng SCREENING/INTERVIEW)* | **U** | **`BRL-11`: Bắt buộc nhập Lý do từ chối ≥ 5 ký tự qua Modal** |
| 16 | Đánh dấu sao (Starred) & Lọc hồ sơ nâng cao | - | **R, U** | **R** | **R, U** | Lọc theo Chưa xem (Unviewed), Đánh sao, Chưa đánh giá |
| 17 | Luân chuyển vị trí ứng viên (Repooling) | - | **C, U** | - | **C, U** | Tạo đợt ứng tuyển mới ở Job đích, bảo lưu lịch sử cũ |
| **V** | **Lịch phỏng vấn & Đánh giá Scorecard** | | | | | |
| 18 | **Lên lịch, đổi lịch (Reschedule), hủy lịch (Cancel)** | - | **`-` (CẤM)** | **C, R, U, D** | **C, R, U, D** | **Phân quyền mới: Chỉ Hiring Manager & Admin quản lý lịch phỏng vấn** |
| 19 | Ghi chú trước và sau phỏng vấn | - | **C, R, U** | **C, R, U** | **C, R, U** | Lưu vết lưu ý nghiệp vụ trong quá trình phỏng vấn |
| 20 | Chấm điểm Scorecard 3 tiêu chí có trọng số (BRL-08) | - | **C, R, U** | **C, R, U** | **R, C** | Chuyên môn 40%, Giao tiếp 30%, Văn hóa 30% |
| 21 | Chỉnh sửa phiếu đánh giá của giám khảo khác | - | **`-` (CẤM)** | **`-` (CẤM)** | **`-` (CẤM)** | **Nguyên tắc độc lập: Chỉ người chấm được sửa phiếu của mình** |
| 22 | Xem điểm tổng hợp & lịch sử đánh giá đa vòng | - | **R** | **R** | **R** | Hiển thị minh bạch lịch sử và căn cứ tuyển dụng |
| **VI**| **Tự động hóa & Email** | | | | | |
| 23 | Tự động hoãn gửi Email từ chối 12–24h (BRL-05) | - | - | - | - | Hệ thống tự động kích hoạt khi thẻ vào cột `REJECTED` |
| 24 | Hủy lịch gửi email từ chối khi phục hồi thẻ | - | **U** *(về NEW/SCREENING)* | **U** *(về INTERVIEW)* | **U** | Kéo thẻ rời khỏi cột `REJECTED` tự động hủy lịch gửi |
| **VII**| **Kho nhân tài & Quản trị Hệ thống** | | | | | |
| 25 | Tra cứu Kho nhân tài (Talent Pool) | - | **R** | - | **R** | Tìm kiếm ứng viên dự phòng và kích hoạt Re-pooling |
| 26 | Truy cập Trang Quản trị người dùng (`/admin/users`) | - | **`-` (CẤM)** | **`-` (CẤM)** | **C, R, U, D** | **Server Middleware chặn 307 Redirect về Pipeline nếu không phải Admin** |
| 27 | Phân quyền tài khoản nội bộ (`HR`, `HIRING_MANAGER`) | - | - | - | **U** | Quản lý vòng đời tài khoản nhân viên |
| 28 | Xóa vĩnh viễn hồ sơ quá hạn 6 tháng (BRL-10 Purge) | - | **`-` (CẤM)** | **`-` (CẤM)** | **D (Hard Delete)**| **BRL-10: Chỉ Admin có quyền xóa vĩnh viễn DB và file tệp CV** |
| 29 | Xuất dữ liệu danh sách ứng viên (CSV Export) | - | **R** | - | **R** | Xuất file CSV mã hóa chuẩn UTF-8 BOM cho Excel |
| 30 | Xem nhật ký kiểm toán hệ thống (Audit Log) | - | **R** | **R** | **R** | Theo dõi lịch sử thao tác, lý do từ chối và chỉnh sửa hồ sơ |

---

# MỤC 14: YÊU CẦU PHI CHỨC NĂNG (NON-FUNCTIONAL REQUIREMENTS - NFR)

Tài liệu được phân loại theo tiêu chuẩn quốc tế **ISO/IEC 25010** và chuẩn hóa chính xác theo các cơ chế bảo mật, kiến trúc mã nguồn và bộ kiểm thử tự động của hệ thống:

### 1. Hiệu năng & Khả năng chịu tải (Performance & Scalability)

| Mã NFR | Tiêu chí | Mô tả yêu cầu kỹ thuật thực tế | Chỉ số đo lường (Metric / SLA) |
| :---: | :--- | :--- | :--- |
| **NFR-PER-01** | **Tốc độ phản hồi giao diện** | Thời gian phản hồi cho các tác vụ tải dữ liệu Pipeline, tìm kiếm từ khóa, lọc đa tiêu chí (Đánh sao, Chưa xem, Chưa đánh giá) và kéo-thả thẻ Kanban. | **≤ 1.5 – 3.0 giây** trong điều kiện mạng tiêu chuẩn. |
| **NFR-PER-02** | **Tốc độ bóc tách AI (AI Parsing)** | Mô hình Lai (Hybrid Model): Lớp 1 bóc tách text thô cục bộ bằng `pdf-parse` (< 1.0s); Lớp 2 gọi Gemini API (`temperature: 0`) đối chiếu JD và tính điểm Match. | **≤ 5.0 giây/CV**. |
| **NFR-PER-03** | **Xử lý tệp & Đính kèm chứng chỉ** | Tiếp nhận tệp CV chính (.pdf, .docx ≤ 10MB) và nhiều tệp bằng cấp/chứng chỉ ảnh/PDF đính kèm đồng thời qua luồng xử lý `FormData`. | Tiếp nhận và xử lý mượt mà, không gây treo giao diện hoặc tràn bộ nhớ đệm. |
| **NFR-PER-04** | **Số lượng người dùng đồng thời** | Kiến trúc phi trạng thái (Stateless Next.js Server Components & Route Handlers) chịu tải đồng thời. | Tối thiểu **100 người dùng nội bộ** và **500 ứng viên vãng lai** truy cập đồng thời. |

---

### 2. Độ sẵn sàng & Khả năng phục hồi (Availability & Reliability)

| Mã NFR | Tiêu chí | Mô tả yêu cầu kỹ thuật thực tế | Chỉ số đo lường (Metric / SLA) |
| :---: | :--- | :--- | :--- |
| **NFR-REL-01** | **Thời gian hoạt động (Uptime)** | Tỷ lệ hệ thống hoạt động liên tục, sẵn sàng phục vụ tuyển dụng và nhận hồ sơ. | Đạt **≥ 99.5%** thời gian trong năm (ngoại trừ lịch bảo trì định kỳ có thông báo trước). |
| **NFR-REL-02** | **Cơ sở dữ liệu & Sao lưu (Backup)** | Sử dụng Prisma ORM làm việc với SQLite (`dev.db`) trên môi trường phát triển và PostgreSQL trên môi trường sản xuất. Tự động sao lưu định kỳ hàng ngày. | Sao lưu tự động **hàng ngày (Daily snapshot)**, lưu trữ bản sao lưu trong 30 ngày. |
| **NFR-REL-03** | **Dung sai lỗi AI (Fault Tolerance)** | Khi Gemini API gặp sự cố quá tải hoặc mất kết nối, hệ thống vẫn lưu an toàn đơn nộp ở trạng thái `NEW` với `aiMatchScore = null` và cung cấp nút chạy lại cho HR. | **0% mất mát dữ liệu hồ sơ** khi bên thứ 3 (AI service) gián đoạn. |

---

### 3. An toàn thông tin & Bảo mật (Security & Compliance)

| Mã NFR | Tiêu chí | Mô tả yêu cầu kỹ thuật thực tế | Phương pháp triển khai trong Code |
| :---: | :--- | :--- | :--- |
| **NFR-SEC-01** | **Mã hóa đường truyền** | Toàn bộ lưu lượng giao tiếp giữa Client, Server và AI APIs bắt buộc phải được mã hóa. | Sử dụng giao thức **HTTPS (TLS 1.3)** với chứng chỉ SSL hợp lệ. |
| **NFR-SEC-02** | **Bảo mật Mật khẩu & Phiên đăng nhập** | Bảo vệ tuyệt đối thông tin định danh và tài khoản nội bộ chống tấn công Brute-force/Rainbow Table. | • Băm mật khẩu chuẩn NIST bằng **PBKDF2 với SHA-512, Salt ngẫu nhiên 16 bytes và 100,000 vòng lặp**.<br>• Phiên đăng nhập được ký số bằng **HMAC-SHA256** lưu trong HttpOnly Cookie chống giả mạo session.<br>• Xác thực Edge Middleware ngăn chặn FOUC. |
| **NFR-SEC-03** | **Chống Spam & Tệp giả mạo** | Chặn bot spam đơn nộp và ngăn chặn tấn công tải lên tệp mã độc (Polyglot File Upload). | • **Rate Limiting trượt:** Tối đa 05 lượt nộp / 10 phút trên mỗi IP.<br>• **Kiểm tra Magic Bytes nhị phân:** Bắt buộc `%PDF-` cho file PDF và `PK` cho file DOCX ở tầng Backend. |
| **NFR-SEC-04** | **Bảo mật phân quyền cấp hàng (RLS)** | Giấu các thông tin bảo mật theo phân quyền người dùng và bảo vệ quyền riêng tư trên cổng tra cứu công khai. | • **Ẩn thông tin nhạy cảm** (mức lương kỳ vọng) đối với tài khoản `HIRING_MANAGER`.<br>• Cổng Public Tracker **ẩn hoàn toàn điểm AI, giải trình đánh giá và nhận xét của ban giám khảo**. |
| **NFR-SEC-05** | **Ghi vết kiểm toán (Audit Trail)** | Lưu vết bất biến toàn bộ hành vi thay đổi dữ liệu nhạy cảm, luân chuyển trạng thái thẻ, lên lịch phỏng vấn và chấm điểm. | Tự động ghi vào bảng `AuditLog` gồm: `applicationId`, `userId`, `fromStage`, `toStage`, `action`, `createdAt`. Bảng là **Append-only (Chỉ ghi thêm, cấm sửa/xóa)**. |

---

### 4. Tính khả dụng & Khả năng bảo trì (Usability & Maintainability)

| Mã NFR | Tiêu chí | Mô tả yêu cầu kỹ thuật thực tế | Tiêu chuẩn đánh giá |
| :---: | :--- | :--- | :--- |
| **NFR-USA-01** | **Tính tương thích đa thiết bị** | Cổng ứng tuyển công khai và bảng Kanban hiển thị tối ưu trên cả máy tính, máy tính bảng và điện thoại. | **Responsive 100%** với Tailwind CSS, hỗ trợ Chrome, Safari, Edge, Firefox và trình duyệt di động. |
| **NFR-USA-02** | **Độ dễ sử dụng & Cảnh báo trực quan** | Trải nghiệm kéo-thả Kanban mượt mà qua `@hello-pangea/dnd`; cảnh báo đổi màu viền đỏ khi vi phạm SLA (BRL-07); đánh sáng viền thẻ chưa xem chống bỏ sót. | Toast thông báo rõ ràng cho mọi tác vụ thành công hoặc thất bại; nhân viên sử dụng thành thạo sau **dưới 01 giờ**. |
| **NFR-MNT-01** | **Kiến trúc mô hình hóa AI (Agnostic)** | Tách biệt tầng logic gọi AI qua interface mô hình hóa (`src/lib/ai-parser.ts`), cấu hình `temperature: 0` và strict JSON Schema. | Có thể nâng cấp hoặc chuyển đổi giữa **Gemini 1.5 Flash, GPT-4o, Claude 3.5** mà không cần sửa đổi giao diện người dùng. |
| **NFR-MNT-02** | **Kiểm thử tự động & Độ tin cậy mã nguồn** | Mã nguồn viết hoàn toàn bằng TypeScript Strict Mode, phân tách rõ ràng giữa API Routes, Server Actions và Client Components. | Tích hợp bộ **97 kiểm thử tự động (Unit & Integration Tests)** đạt tỷ lệ thành công **100% (97/97 Passed)**, bảo vệ toàn bộ BRL, State Machine và RBAC. |

