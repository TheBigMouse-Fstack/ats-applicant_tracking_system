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
| **2. Secondary Actor** *(Tác nhân phụ)* | Dịch vụ AI phân tích ngôn ngữ (Google Gemini), Dịch vụ gửi Email | Hỗ trợ phân tích ngữ nghĩa hồ sơ CV và gửi thông báo phỏng vấn/từ chối. |
| **3. System / Daemon Actor** *(Tác nhân ngầm)* | Lớp bảo vệ truy cập hệ thống, Bộ phân tích CV dự phòng nội bộ, Bộ theo dõi hồ sơ quá hạn, Bộ hoãn gửi thư từ chối 12 giờ | Tự động bảo vệ truy cập trái phép, cảnh báo hồ sơ chờ quá hạn, hoãn thư từ chối và dự phòng khi mất kết nối AI. |
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
> * **`-` :** Không có quyền truy cập (Ẩn trên giao diện và tự động chặn trên hệ thống).

| STT | Phân hệ & Chức năng nghiệp vụ | 👤 Ứng viên (Public) | 👔 Chuyên viên HR | 💼 Hiring Manager | 🛠️ Quản trị viên (Admin) | Ghi chú ràng buộc bảo mật & Thực thi Code |
| :---: | :--- | :---: | :---: | :---: | :---: | :--- |
| **0** | **Bảng điều khiển Tổng quan Vận hành (Operational Dashboard)** | | | | | |
| 0a | Truy cập Dashboard Tổng quan | **`-` (CẤM)** | **R** *(Góc nhìn Đầu phễu)* | **R** *(Góc nhìn Chuyên môn)* | **R** *(Toàn cảnh 360°)* | **Phân tách dữ liệu theo đúng vai trò:** Mỗi vai trò chỉ nhận đúng chỉ số và danh sách việc cần xử lý thuộc phạm vi trách nhiệm; không phải báo cáo BI phức tạp. |
| 0b | Hàng đợi CV `NEW` chưa xem & SLA >48h (Đầu phễu HR) | - | **R** | - | **R** | HR thấy ngay CV cần sơ loại; Manager không bị nhiễu bởi CV chưa qua vòng HR. |
| 0c | Hàng đợi duyệt Phỏng vấn (`SCREENING`), thiếu Scorecard (`INTERVIEW`) & Lịch PV | - | - | **R** | **R** | Hiring Manager tập trung ra quyết định chuyên môn (`SCREENING ➔ INTERVIEW ➔ HIRED`). |
| 0d | Giám sát Quản trị (User hoạt động, Hồ sơ quá hạn 180 ngày BRL-10, AuditLog gần nhất) | - | **`-` (CẤM)** | **`-` (CẤM)** | **R** | API không trả trường `adminStats` / `recentAuditLogs` cho `HR` và `HIRING_MANAGER`. |
| **I** | **Cổng ứng tuyển & Tra cứu trực tuyến** | | | | | |
| 1 | Xem danh sách tin tuyển dụng & JD | **R** | **R** | **R** | **R** | Truy cập công khai tại `/jobs` |
| 2 | Nộp hồ sơ & Tải CV, chứng chỉ (.pdf, .docx ≤ 10MB) | **C** | - | - | - | Chống spam tối đa 5 lượt/10 phút và kiểm tra tính xác thực tệp gốc |
| 3 | Tra cứu tiến độ hồ sơ ứng tuyển (Công khai) | **R** | **R** | **R** | **R** | Tra cứu qua Mã hồ sơ; **ẩn hoàn toàn điểm AI & nhận xét nội bộ** |
| **II**| **Quản lý Vị trí tuyển dụng (Jobs Management)** | | | | | |
| 4 | Tạo mới & Chỉnh sửa JD tuyển dụng | - | **C, R, U** | **R** *(chỉ đọc)* | **C, R, U, D** | **Quản lý chuyên môn chỉ xem, không tạo/sửa JD** |
| 5 | Đóng / Mở đợt tuyển dụng (Trạng thái Active/Closed)| - | **U** | - | **U** | Cập nhật trạng thái tiếp nhận hồ sơ |
| 6 | Xóa vị trí tuyển dụng | - | - | - | **D** | Chỉ Quản trị viên có thẩm quyền xóa tin tuyển dụng |
| **III**| **Tiếp nhận, Trích xuất 5 trường & Chỉnh sửa CV**| | | | | |
| 7 | Tải lên CV nội bộ & đính kèm chứng chỉ | - | **C** | - | **C** | Phân loại nguồn (LinkedIn, Giới thiệu nội bộ, Săn đầu người) |
| 8 | Xem 5 trường cốt lõi & Mở rộng chi tiết hồ sơ / CV gốc | - | **R** | **R** | **R** | Mặc định hiện 5 trường theo JD; bấm "Xem chi tiết hồ sơ" để mở rộng |
| 9 | **Chỉnh sửa / Bổ sung thủ công trường trích xuất CV** | - | **U** | **`-` (CẤM)** | **U** | HR sửa tên, email, năm KN, thêm/xóa kỹ năng + hệ thống tự tính lại độ khớp JD |
| 10 | Thử đánh giá lại AI (chỉ khi AI gặp sự cố) | - | **U** | - | **U** | Chỉ hiển thị nút thử lại khi AI chưa chấm được điểm do lỗi mạng/máy chủ |
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
| 25 | Tra cứu Kho Nhân Tài (3 nhóm dự phòng, không gồm hồ sơ mới & đã tuyển) | - | **R** | **`-` (CẤM)** | **R** | Tìm kiếm ứng viên dự bị và khôi phục sang vị trí mới |
| 26 | Truy cập Quản trị Người dùng | - | **`-` (CẤM)** | **`-` (CẤM)** | **C, R, U, D** | Tự động chặn và chuyển về Tổng quan nếu không phải Quản trị viên |
| 27 | Phân quyền tài khoản nội bộ (HR, Hiring Manager) | - | - | - | **U** | Quản lý tạo mới và tạm khóa tài khoản nhân viên |
| 28 | Xóa vĩnh viễn hồ sơ từ chối quá hạn 180 ngày | - | **`-` (CẤM)** | **`-` (CẤM)** | **D** | Chỉ Quản trị viên có quyền xóa vĩnh viễn hồ sơ quá hạn 6 tháng |
| 29 | Xuất dữ liệu danh sách ứng viên ra Excel | - | **R** | - | **R** | Xuất tệp bảng tính CSV mở chuẩn tiếng Việt có dấu trên Excel |
| 30 | Xem nhật ký lịch sử hoạt động | - | **R** | **R** | **R** | Theo dõi lịch sử chuyển vòng, lý do từ chối và chỉnh sửa hồ sơ |

---

# MỤC 14: YÊU CẦU PHI CHỨC NĂNG (NON-FUNCTIONAL REQUIREMENTS - NFR)

Tài liệu phân loại các yêu cầu chất lượng hệ thống theo tiêu chuẩn quốc tế **ISO/IEC 25010** bằng ngôn ngữ dễ đo lường cho Ban quản trị và Đội kỹ thuật:

### 1. Hiệu năng & Tốc độ xử lý (Performance)

| Mã NFR | Tiêu chí | Mô tả yêu cầu thực tế | Chỉ số cam kết |
| :---: | :--- | :--- | :--- |
| **NFR-PER-01** | **Tốc độ tìm kiếm & lọc hồ sơ** | Tốc độ tải bảng Tổng quan, Pipeline, tìm kiếm từ khóa (không phân biệt chữ hoa/thường), lọc đa tiêu chí và chuyển vòng hồ sơ. | **≤ 1.5 – 3.0 giây** trong điều kiện mạng tiêu chuẩn. |
| **NFR-PER-02** | **Tốc độ đọc & đánh giá CV tự động** | Thời gian đọc nội dung CV, bóc tách 5 trường cốt lõi và chấm mức độ phù hợp 3 mức màu theo JD. | **≤ 5.0 giây / CV**. |
| **NFR-PER-03** | **Tiếp nhận tệp CV & Chứng chỉ** | Hỗ trợ tải lên tệp CV (`.pdf`, `.docx` ≤ 10MB) kèm nhiều ảnh/PDF bằng cấp chứng chỉ trong cùng 1 lần nộp. | Mượt mà, không treo màn hình. |
| **NFR-PER-04** | **Khả năng chịu tải đồng thời** | Đáp ứng ổn định trong các đợt tuyển dụng cao điểm của doanh nghiệp. | Tối thiểu **100 nhân sự nội bộ** và **500 ứng viên** truy cập cùng lúc. |

---

### 2. Độ ổn định & Khả năng dự phòng (Reliability)

| Mã NFR | Tiêu chí | Mô tả yêu cầu thực tế | Chỉ số cam kết |
| :---: | :--- | :--- | :--- |
| **NFR-REL-01** | **Tính sẵn sàng hệ thống** | Hệ thống vận hành liên tục phục vụ tiếp nhận và xử lý tuyển dụng. | **≥ 99.5%** thời gian hoạt động trong năm. |
| **NFR-REL-02** | **Sao lưu dữ liệu định kỳ** | Dữ liệu hồ sơ ứng viên và lịch sử tuyển dụng được sao lưu tự động định kỳ hàng ngày. | Lưu giữ bản sao lưu tối thiểu **30 ngày**. |
| **NFR-REL-03** | **Dự phòng khi AI gặp sự cố** | Khi dịch vụ AI bên ngoài mất mạng hoặc quá tải, hệ thống tự động dùng bộ phân tích dự phòng nội bộ và vẫn lưu đầy đủ hồ sơ ở cột Mới nộp. | **0% thất lạc hồ sơ** trong mọi tình huống mất kết nối AI. |

---

### 3. Bảo mật & Tuân thủ Pháp lý (Security & Compliance)

| Mã NFR | Tiêu chí | Mô tả yêu cầu bảo mật | Cơ chế đảm bảo *(chi tiết kỹ thuật tại Tài liệu số 13 & 15)* |
| :---: | :--- | :--- | :--- |
| **NFR-SEC-01** | **Mã hóa kết nối truyền tải** | Toàn bộ dữ liệu ứng viên và tài khoản truyền qua Internet đều được mã hóa. | Kết nối bảo mật chuẩn **HTTPS**. |
| **NFR-SEC-02** | **An toàn Mật khẩu & Phiên làm việc** | Bảo vệ tài khoản nội bộ chống đánh cắp mật khẩu, chống giả mạo phiên đăng nhập và chặn truy cập trái phép. | Mật khẩu mã hóa một chiều an toàn; phiên làm việc chống giả mạo tự hết hạn sau 7 ngày; tự động chuyển về trang đăng nhập nếu chưa xác thực. |
| **NFR-SEC-03** | **Chống nộp đơn rác & Tệp giả mạo** | Ngăn chặn gửi đơn hàng loạt tự động và chặn tệp mã độc đổi tên thành `.pdf`/`.docx`. | Giới hạn tối đa **5 lượt nộp / 10 phút** từ cùng địa chỉ mạng và kiểm tra cấu trúc thực của tệp tin gốc trước khi lưu. |
| **NFR-SEC-04** | **Bảo mật dữ liệu theo vai trò & Trang công khai** | Mỗi vai trò chỉ thấy đúng dữ liệu trong phạm vi trách nhiệm; ứng viên không thấy dữ liệu nội bộ. | Dashboard phân tách dữ liệu ngay từ máy chủ; Cổng tra cứu ứng viên ẩn 100% điểm AI và nhận xét phỏng vấn. |
| **NFR-SEC-05** | **Nhật ký kiểm toán bất biến** | Mọi thay đổi trạng thái, lý do từ chối, chỉnh sửa hồ sơ và chấm điểm đều được ghi nhận đầy đủ để đối soát. | Chỉ cho phép ghi bổ sung, tuyệt đối không cho sửa hay xóa lịch sử hoạt động. |

---

### 4. Tính dễ sử dụng & Khả năng mở rộng (Usability & Maintainability)

| Mã NFR | Tiêu chí | Mô tả yêu cầu thực tế | Tiêu chuẩn nghiệm thu |
| :---: | :--- | :--- | :--- |
| **NFR-USA-01** | **Tương thích đa thiết bị** | Hiển thị rõ ràng trên máy tính bàn, laptop, máy tính bảng và điện thoại di động. | Tương thích tốt trên Chrome, Edge, Safari, Firefox. |
| **NFR-USA-02** | **Giao diện dịu mắt & Dễ làm quen** | Thiết kế tối giản, không chớp nháy gây mỏi mắt, tách bạch Tổng quan và Chi tiết 5 tab, thông báo lỗi tiếng Việt thân thiện không chứa mã kỹ thuật. | Nhân sự tuyển dụng sử dụng thành thạo sau **dưới 01 giờ** làm quen. |
| **NFR-MNT-01** | **Dễ dàng mở rộng & nâng cấp AI** | Kiến trúc tách rời phần gọi dịch vụ AI và sẵn sàng tích hợp gửi Email tự động trong tương lai đúng yêu cầu đề bài. | Nâng cấp mô hình AI hoặc kết nối hệ thống gửi mail mà không phải làm lại giao diện. |
| **NFR-MNT-02** | **Kiểm thử tự động đảm bảo chất lượng** | Tích hợp bộ kịch bản kiểm thử tự động rà soát toàn bộ quy tắc nghiệp vụ, phân quyền và vòng đời hồ sơ sau mỗi lần cập nhật. | Duy trì tỷ lệ **100% kiểm thử đạt chuẩn** (hiện đạt **112/112 kịch bản**). |

