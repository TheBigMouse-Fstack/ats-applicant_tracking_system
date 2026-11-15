# MA TR?N PH?N QUY?N (RBAC) & Y?U C?U PHI CH?C N?NG (NFR)

> **D? ?n:** ReCoverX Career - ATS

---

Dưới đây là tài liệu chi tiết cho **Nhóm Phân quyền (Mục 13)** và **Yêu cầu Phi chức năng (Mục 14)** của hệ thống **ReCoverX Career (ATS)** theo chuẩn kỹ thuật phần mềm:

---

# MỤC 13: MA TRẬN PHÂN QUYỀN (RBAC - ROLE-BASED ACCESS CONTROL)

### 1. Định nghĩa các Vai trò người dùng (User Roles)
1. **Ứng viên (Candidate / Public):** Người dùng bên ngoài, truy cập công khai vào Cổng tuyển dụng để xem tin, nộp hồ sơ, đính kèm chứng chỉ và tra cứu tiến độ ứng tuyển trực tuyến (Public Tracker), không cần tài khoản đăng nhập.
2. **Chuyên viên HR (Recruiter):** Người vận hành chính của hệ thống; quản lý toàn bộ vòng đời tuyển dụng (JD, nạp CV, kéo-thả Kanban, xếp lịch & điều phối phỏng vấn, gửi thư mời/thư từ chối, đánh giá Scorecard, xuất báo cáo CSV và luân chuyển ứng viên Repooling).
3. **Quản lý chuyên môn (Hiring Manager / Tech Lead):** Trưởng bộ phận hoặc giám khảo phỏng vấn kỹ thuật; được phân quyền xem hồ sơ ứng viên, mở Drawer xem CV gốc, ghi chú trước/sau phỏng vấn và lập Phiếu đánh giá chuyên môn (Scorecard). **Bị chặn tuyệt đối quyền kéo-thả chuyển trạng thái Kanban, chặn tạo JD, chặn xếp lịch phỏng vấn và bị ẩn thông tin tài chính/mức lương.**
4. **Quản trị viên (Admin):** Quản lý toàn diện hệ thống; quản trị tài khoản người dùng nội bộ (`/admin/users`), phân quyền vai trò, cấu hình hệ thống và là tác nhân duy nhất có thẩm quyền thực thi tác vụ xóa vĩnh viễn (Hard Delete) hồ sơ quá hạn 6 tháng theo BRL-10.

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
| **I** | **Cổng ứng tuyển & Tra cứu trực tuyến** | | | | | |
| 1 | Xem danh sách tin tuyển dụng & JD | **R** | **R** | **R** | **R** | Truy cập công khai tại `/jobs` |
| 2 | Nộp hồ sơ & Tải CV, chứng chỉ (.pdf, .docx ≤ 10MB) | **C** | - | - | - | Chống spam: Rate Limit 5 lần/10 phút & Magic Bytes |
| 3 | Tra cứu tiến độ hồ sơ ứng tuyển (Public Tracker) | **R** | **R** | **R** | **R** | Tra cứu qua Mã hồ sơ; **Bảo mật NFR-SEC-04: Ẩn điểm AI & nhận xét nội bộ** |
| **II**| **Quản lý Vị trí tuyển dụng (Jobs Management)** | | | | | |
| 4 | Tạo mới & Chỉnh sửa JD tuyển dụng | - | **C, R, U** | **R** *(chỉ đọc)* | **C, R, U, D** | **Chặn Manager tạo/sửa JD** (kiểm tra quyền tại API) |
| 5 | Đóng / Mở đợt tuyển dụng (Trạng thái Active/Closed)| - | **U** | - | **U** | Cập nhật cờ trạng thái tiếp nhận hồ sơ |
| 6 | Xóa vị trí tuyển dụng | - | - | - | **D** | Chỉ Admin có thẩm quyền xóa tin tuyển dụng |
| **III**| **Tiếp nhận & Bóc tách hồ sơ (CV Intake & AI Engine)**| | | | | |
| 7 | Tải lên CV nội bộ & đính kèm chứng chỉ (Add Candidate) | - | **C** | - | **C** | Phân loại nguồn (`LINKEDIN`, `REFERRAL`, `HEADHUNTER`) |
| 8 | Xem trước tệp CV gốc và chứng chỉ (Preview) | - | **R** | **R** | **R** | Xem trực tiếp trên trình duyệt qua Candidate Drawer |
| 9 | Xác nhận gộp hồ sơ trùng lặp (Deduplication BRL-02) | - | **U** | - | **U** | Gộp dữ liệu mới vào hồ sơ cũ, không sinh bản ghi rác |
| 10 | Kích hoạt phân tích lại AI (Re-parse CV) | - | **U** | - | **U** | Kích hoạt khi có sự cố mạng hoặc muốn cập nhật phân tích |
| **IV**| **Quản lý Pipeline Kanban** | | | | | |
| 11 | Xem bảng Kanban 5 cột (`NEW` ➔ `REJECTED`) | - | **R** | **R** *(chế độ xem)* | **R** | Manager xem danh sách ứng viên các vị trí liên quan |
| 12 | Kéo - thả chuyển cột trạng thái | - | **U** | **`-` (CẤM TUYỆT ĐỐI)**| **U** | **Mục 13 RBAC: API chặn 403 Forbidden nếu Manager kéo thả** |
| 13 | Đánh dấu sao (Starred) hồ sơ tiềm năng | - | **U** | - | **U** | Ghim hồ sơ ưu tiên, lưu nhật ký kiểm toán |
| 14 | Tìm kiếm, sắp xếp & lọc nâng cao | - | **R** | **R** | **R** | Lọc theo Chưa xem (Unviewed), Đánh sao, Chưa đánh giá |
| 15 | Xem thông tin bảo mật / Mức lương kỳ vọng | - | **R** | **`-` (ẨN RLS)** | **R** | **Bảo mật NFR-SEC-04: Che thông tin nhạy cảm với Manager** |
| 16 | Luân chuyển vị trí ứng viên (Repooling) | - | **C, U** | - | **C, U** | Tạo đợt ứng tuyển mới ở Job đích, bảo lưu lịch sử cũ |
| 17 | Chốt chặn Stage-Gate (Chuyển sang HIRED) | - | **U** *(Bắt buộc Scorecard)* | - | **U** *(Bắt buộc Scorecard)* | **BRL-06: Hệ thống chặn chuyển HIRED nếu có 0 Scorecard** |
| **V** | **Lịch phỏng vấn & Đánh giá Scorecard** | | | | | |
| 18 | Lên lịch, đổi lịch (Reschedule), hủy lịch (Cancel) | - | **C, R, U, D** | **`-` (CẤM)** | **C, R, U, D** | **RBAC: Manager chỉ xem lịch, chỉ HR/Admin được xếp/sửa/hủy** |
| 19 | Tạo link Google Meet/Zoom & tự động gửi thư mời | - | **C** | - | **C** | Tự động tạo thư mời chuyên nghiệp kèm lịch phỏng vấn |
| 20 | Ghi chú trước và sau phỏng vấn | - | **C, R, U** | **C, R, U** | **C, R, U** | Lưu vết lưu ý nghiệp vụ trong quá trình phỏng vấn |
| 21 | Chấm điểm Scorecard 3 tiêu chí có trọng số (BRL-08) | - | **C, R, U** | **C, R, U** | **R, C** | Chuyên môn 40%, Giao tiếp 30%, Văn hóa 30% |
| 22 | Chỉnh sửa phiếu đánh giá của giám khảo khác | - | **`-` (CẤM)** | **`-` (CẤM)** | **`-` (CẤM)** | **Nguyên tắc độc lập: Chỉ người chấm được sửa phiếu của mình** |
| 23 | Xem điểm tổng hợp & lịch sử đánh giá đa vòng | - | **R** | **R** | **R** | Hiển thị minh bạch lịch sử và căn cứ tuyển dụng |
| **VI**| **Tự động hóa & Email** | | | | | |
| 24 | Tự động hoãn gửi Email từ chối 12–24h (BRL-05) | - | - | - | - | Hệ thống tự động kích hoạt khi thẻ vào cột `REJECTED` |
| 25 | Hủy lịch gửi email từ chối khi phục hồi thẻ | - | **U** | - | **U** | Kéo thẻ rời khỏi cột `REJECTED` tự động hủy lịch gửi |
| 26 | Gửi Thư mời nhận việc (Offer Letter) | - | **C** | - | **C** | Kích hoạt khi ứng viên trúng tuyển tại cột `HIRED` |
| **VII**| **Kho nhân tài & Quản trị Hệ thống** | | | | | |
| 27 | Tra cứu Kho nhân tài (Talent Pool) | - | **R** | - | **R** | Tìm kiếm ứng viên dự phòng và kích hoạt Re-pooling |
| 28 | Truy cập Trang Quản trị người dùng (`/admin/users`) | - | **`-` (CẤM)** | **`-` (CẤM)** | **C, R, U, D** | **Server Middleware chặn 307 Redirect về Pipeline nếu không phải Admin** |
| 29 | Phân quyền tài khoản nội bộ (`HR`, `HIRING_MANAGER`) | - | - | - | **U** | Quản lý vòng đời tài khoản nhân viên |
| 30 | Xóa vĩnh viễn hồ sơ quá hạn 6 tháng (BRL-10 Purge) | - | **`-` (CẤM)** | **`-` (CẤM)** | **D (Hard Delete)**| **BRL-10: Chỉ Admin có quyền xóa vĩnh viễn DB và file tệp CV** |
| 31 | Xuất dữ liệu danh sách ứng viên (CSV Export) | - | **R** | - | **R** | Xuất file CSV mã hóa chuẩn UTF-8 BOM cho Excel |
| 32 | Xem nhật ký kiểm toán hệ thống (Audit Log) | - | **R** | - | **R** | Theo dõi lịch sử thao tác theo thời gian thực |

---

# MỤC 14: YÊU CẦU PHI CHỨC NĂNG (NON-FUNCTIONAL REQUIREMENTS - NFR)

Tài liệu được phân loại theo tiêu chuẩn quốc tế **ISO/IEC 25010** với các chỉ số đo lường định lượng cụ thể:

### 1. Hiệu năng & Khả năng chịu tải (Performance & Scalability)

| Mã NFR | Tiêu chí | Mô tả yêu cầu kỹ thuật | Chỉ số đo lường (Metric / SLA) |
| :---: | :--- | :--- | :--- |
| **NFR-PER-01** | **Tốc độ phản hồi giao diện** | Thời gian phản hồi cho các tác vụ tra cứu, tìm kiếm từ khóa nâng cao và kéo-thả thẻ Kanban. | **≤ 3.0 giây** trong điều kiện mạng tiêu chuẩn. |
| **NFR-PER-02** | **Tốc độ bóc tách AI (AI Parsing)** | Thời gian đọc tệp CV (.pdf, .doc, .docx) và trích xuất dữ liệu hoàn chỉnh. | **≤ 5.0 giây/CV**. |
| **NFR-PER-03** | **Xử lý tải lên hàng loạt (Bulk Upload)** | Khả năng tiếp nhận và đưa vào hàng đợi xử lý ngầm (Task Queue) khi HR upload cùng lúc. | Tiếp nhận mượt mà **50 – 100 CV cùng lúc** mà không gây treo (freeze) trình duyệt. |
| **NFR-PER-04** | **Số lượng người dùng đồng thời** | Hỗ trợ đội ngũ tuyển dụng và ứng viên truy cập cùng một thời điểm. | Tối thiểu **100 người dùng nội bộ** và **500 ứng viên vãng lai** truy cập đồng thời. |

---

### 2. Độ sẵn sàng & Khả năng phục hồi (Availability & Reliability)

| Mã NFR | Tiêu chí | Mô tả yêu cầu kỹ thuật | Chỉ số đo lường (Metric / SLA) |
| :---: | :--- | :--- | :--- |
| **NFR-REL-01** | **Thời gian hoạt động (Uptime)** | Tỷ lệ hệ thống hoạt động liên tục, sẵn sàng phục vụ người dùng. | Đạt **≥ 99.5%** thời gian trong năm (ngoại trừ lịch bảo trì định kỳ có thông báo trước). |
| **NFR-REL-02** | **Sao lưu dữ liệu (Backup)** | Tự động sao lưu toàn bộ cơ sở dữ liệu PostgreSQL và cấu hình hệ thống. | Tự động sao lưu **hàng ngày (Daily at 01:00 AM)**, lưu trữ bản snapshot trong 30 ngày. |
| **NFR-REL-03** | **Chỉ số RPO & RTO** | RPO (Mất mát dữ liệu tối đa) và RTO (Thời gian khôi phục tối đa khi có sự cố thảm họa). | **RPO ≤ 24 giờ**, **RTO ≤ 02 giờ**. |

---

### 3. An toàn thông tin & Bảo mật (Security & Compliance)

| Mã NFR | Tiêu chí | Mô tả yêu cầu kỹ thuật | Phương pháp triển khai |
| :---: | :--- | :--- | :--- |
| **NFR-SEC-01** | **Mã hóa đường truyền** | Toàn bộ lưu lượng giao tiếp giữa Client và Server bắt buộc phải được mã hóa. | Sử dụng giao thức **HTTPS (TLS 1.3)** với chứng chỉ SSL hợp lệ. |
| **NFR-SEC-02** | **Mã hóa dữ liệu nghỉ (At-Rest)** | Tệp CV gốc và mật khẩu người dùng phải được bảo vệ nghiêm ngặt. | • Mật khẩu băm bằng **BCrypt (Work factor ≥ 12)**.<br>• Tệp CV trên S3 mã hóa bằng **AES-256 (SSE-S3)**. |
| **NFR-SEC-03** | **Bảo vệ chống Spam/DDoS** | Ngăn chặn bot tự động gửi hàng loạt file rác lên Cổng tuyển dụng công khai. | • Tích hợp **Google reCAPTCHA v3**.<br>• Giới hạn tần suất (**Rate Limiting: 5 requests/10 phút/IP**). |
| **NFR-SEC-04** | **Bảo mật phân quyền cấp hàng (RLS)** | Giấu các thông tin bảo mật theo phân quyền người dùng. | **Ẩn mức lương kỳ vọng** đối với tài khoản vai trò `HIRING_MANAGER`. |
| **NFR-SEC-05** | **Ghi vết kiểm toán (Audit Trail)** | Lưu vết toàn bộ hành vi thay đổi dữ liệu nhạy cảm hoặc luân chuyển trạng thái thẻ. | Tự động ghi vào bảng `audit_logs` gồm: `User ID`, `Action`, `Timestamp`, `IP Address`. Dữ liệu không được sửa/xóa. |

---

### 4. Tính khả dụng & Khả năng bảo trì (Usability & Maintainability)

| Mã NFR | Tiêu chí | Mô tả yêu cầu kỹ thuật | Tiêu chuẩn đánh giá |
| :---: | :--- | :--- | :--- |
| **NFR-USA-01** | **Tính tương thích đa thiết bị** | Cổng ứng tuyển dành cho ứng viên phải hiển thị tối ưu trên cả máy tính và điện thoại. | **Responsive 100%** trên các trình duyệt phổ biến (Chrome, Safari, Edge, Firefox) và Mobile screen (iOS, Android). |
| **NFR-USA-02** | **Độ dễ sử dụng** | Thao tác kéo-thả Kanban trực quan, thông báo phản hồi rõ ràng khi thành công hoặc có lỗi. | Nhân viên HR mới có thể sử dụng thành thạo sau **dưới 01 giờ đào tạo**. |
| **NFR-MNT-01** | **Kiến trúc mô hình hóa AI (Agnostic)** | Tách biệt tầng logic gọi AI qua Interface để dễ dàng thay đổi nhà cung cấp LLM. | Có thể chuyển đổi giữa **Google Gemini, OpenAI GPT, Claude** mà không phải viết lại code ứng dụng. |
| **NFR-MNT-02** | **Tài liệu API chuẩn hóa** | Toàn bộ API Backend được tài liệu hóa rõ ràng để phục vụ tích hợp và kiểm thử. | Sử dụng chuẩn **OpenAPI 3.0 / Swagger UI**. |

---

🎉 **Tuyệt vời!** Đến đây, bạn đã hoàn tất **12/16 mục** trong checklist của mình.

👉 **BƯỚC TIẾP THEO CẦN LÀM:**  
Chúng ta sẽ chuyển sang nhóm Giao diện:  
**Mục 11: Danh sách màn hình (SCR-xx)** + map Use Case và Vai trò sử dụng.

Bạn có muốn mình lên luôn **Danh sách các màn hình (SCR-01 đến SCR-xx)** cho hệ thống không?

