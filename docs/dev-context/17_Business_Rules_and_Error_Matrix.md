---
id: "BR-ERR-17"
title: "Danh mục Business Rules 3 Vế, Ma trận Lỗi 7 Cột & Acceptance Criteria (Gherkin BDD)"
type: "srs"
version: "2.3.0"
status: "approved"
owner: "ATS BA & QA Team"
domain: "recruitment-ats"
tags:
  - "business-rules"
  - "error-matrix"
  - "better-auth"
  - "server-only-dal"
  - "gherkin-bdd"
  - "acceptance-criteria"
upstream_deps:
  - "BRD-ATS-01"
  - "FDD-ATS-04"
downstream_deps:
  - "API-ATS-15"
  - "UAT-ATS-18"
last_updated: "2026-11-26"
---

# DANH MỤC BUSINESS RULES, MA TRẬN LỖI 7 CỘT & ACCEPTANCE CRITERIA (GHERKIN BDD)

> **Tiêu chuẩn áp dụng:** `RULE-02` (Business Rules 3 vế), `RULE-03` & `RULE-11` (Mã lỗi chuẩn & Ma trận lỗi 7 cột), `RULE-08` (Gherkin BDD Acceptance Criteria), `RULE-16` (Chống mơ hồ).

## Lịch Sử Phiên Bản (Revision History)

| Phiên Bản | Ngày Phát Hành | Tác Giả | Phân Loại | Tóm Tắt Thay Đổi | Người Phê Duyệt |
| :---: | :---: | :--- | :---: | :--- | :--- |
| `v2.1.0` | 2026-11-18 | BA & QA Team | **Initial** | Chuẩn hóa trọn bộ Business Rules (3 vế `WHEN/THEN/UNLESS`), Ma trận Lỗi 7 cột chuẩn `ERR-[MOD]-[HTTP]-[SEQ]` và Acceptance Criteria Gherkin BDD bám sát 100% mã nguồn ATS — Applicant Tracking System. | Product Owner & Tech Lead |
| `v2.2.0` | 2026-11-19 | BA & QA Team | **Added** | Bổ sung quy tắc nghiệp vụ BRL-14 Phân trang Lũy tiến từng Cột trên Bảng Kanban (Column Progressive Loading) & kịch bản BDD Acceptance Criteria. | Product Owner & Tech Lead |
| `v2.3.0` | 2026-11-26 | Principal Engineering & QA | **Changed** | Nâng cấp `ATS-002`: Thực thi tập trung toàn bộ `BRL-Auth`, `BRL-06`, `BRL-11`, `BRL-15`, `BRL-17` bên trong tầng `src/server/dal/` (`import "server-only"`) kết hợp **Better Auth** trên Neon PostgreSQL (`auth_sessions`, `auth_accounts`), thu hồi phiên tức thì khi khóa tài khoản và nâng tổng kiểm thử tự động lên **197/197 Passed**. | Product Owner & QA Lead |

---

## PHẦN 1: DANH MỤC BUSINESS RULES CHUẨN 3 VẾ (RULE-02)

Mọi quy tắc nghiệp vụ của hệ thống đều tuân thủ cấu trúc logic bắt buộc: **WHEN (Khi điều kiện kích hoạt) ➔ THEN (Hành vi bắt buộc) ➔ UNLESS (Ngoại lệ miễn trừ)**.

| Mã Quy Tắc (Dự án / Chuẩn `RULE-02`) | Tên Quy Tắc | Phạm Vi | Logic Phát Biểu Chuẩn (`WHEN ... THEN ... UNLESS ...`) | Mã Lỗi Đối Ứng |
| :--- | :--- | :--- | :--- | :---: |
| **`BRL-01`**<br>`BR-FILE-001` | Ràng buộc định dạng, dung lượng & Magic Bytes CV | `POST /api/applications` | **WHEN** Ứng viên hoặc HR tải tệp CV lên hệ thống **THEN** tệp bắt buộc có phần mở rộng `.pdf` hoặc `.docx`, dung lượng ≤ 10.0 MB và chữ ký nhị phân Magic Bytes hợp lệ (`%PDF-` cho PDF, `PK` cho DOCX) **UNLESS** Không có ngoại lệ. | `ERR-APP-400-01`<br>`ERR-APP-400-02` |
| **`BRL-02`**<br>`BR-DEDUP-001` | Khử trùng lặp hồ sơ trong 30 ngày | `POST /api/applications` | **WHEN** ứng viên (định danh bằng Email hoặc SĐT) nộp đơn vào cùng một vị trí tuyển dụng (`jobId`) trong vòng 30 ngày kể từ lần nộp gần nhất **THEN** hệ thống từ chối tạo đơn trùng lặp và báo lỗi cho người nộp **UNLESS** ứng viên nộp vào một vị trí khác (`jobId` khác) hoặc đã quá 30 ngày (hệ thống tự động gộp thông tin mới vào bản ghi `Candidate` hiện có). | `ERR-APP-409-01` |
| **`BRL-03`**<br>`BR-PARSE-001` | Trích xuất 5 trường cốt lõi & Cho phép HR chỉnh sửa thủ công | `CandidateDrawer`, `PATCH .../profile` | **WHEN** hồ sơ CV được tải lên và mở xem ban đầu **THEN** hệ thống hiển thị gọn đúng 5 trường cốt lõi theo JD (Họ tên, Email, Vị trí ứng tuyển, Kỹ năng, Số năm kinh nghiệm), ẩn phần chi tiết dưới nút "Xem chi tiết hồ sơ", đồng thời cho phép `HR`/`ADMIN` sửa thủ công và tự tính lại độ khớp JD **UNLESS** người dùng thuộc vai trò `HIRING_MANAGER` (chỉ có quyền xem, không được sửa dữ liệu bóc tách). | `ERR-PROF-403-01` |
| **`BRL-04`**<br>`BR-AI-001` | Đối chiếu JD bằng Hybrid AI (Human-in-the-loop) | `src/lib/ai-parser.ts` | **WHEN** máy chủ trích xuất xong văn bản thô bằng `pdf-parse` **THEN** hệ thống gửi text sang Gemini API (`gemini-2.5-flash`, `temperature: 0`) để tính % Match Score, liệt kê kỹ năng khớp/thiếu và tạo thẻ tại cột `NEW` để con người duyệt (tuyệt đối không tự loại sang `REJECTED`) **UNLESS** `GEMINI_API_KEY` trống hoặc API lỗi mạng/quota thì tự động chuyển sang Lớp 1 Heuristic NLP cục bộ (60% Kỹ năng + 40% Kinh nghiệm). | `ERR-AI-503-01` *(Fallback tự động)* |
| **`BRL-05`**<br>`BR-MAIL-001` | Bộ đệm trễ 12 giờ cho Email từ chối | `POST /api/pipeline/move` | **WHEN** một hồ sơ được chuyển sang cột `REJECTED` **THEN** hệ thống không gửi email từ chối ngay mà đặt lịch trễ `emailScheduledAt = now() + 12 giờ` **UNLESS** trong khoảng 12 giờ chờ, `HR`/`HIRING_MANAGER`/`ADMIN` kéo thẻ phục hồi rời khỏi `REJECTED` thì hệ thống tự động hủy lịch gửi (`emailScheduledAt = null`) và xóa `rejectionReason`. | - |
| **`BRL-06`**<br>`BR-HIRE-001` | Chốt chặn Stage-Gate trước khi Tuyển chọn (`HIRED`) | `POST /api/pipeline/move` | **WHEN** `HIRING_MANAGER` hoặc `ADMIN` chuyển hồ sơ từ `INTERVIEW` sang `HIRED` **THEN** hồ sơ bắt buộc đã có tối thiểu 01 phiếu đánh giá `Evaluation` (Scorecard) hoàn tất với khuyến nghị đạt (`HIRE` hoặc `STRONG_HIRE`) **UNLESS** Không có ngoại lệ. | `ERR-PIPE-422-02` |
| **`BRL-07`**<br>`BR-SLA-001` | Cảnh báo quá hạn SLA trên Kanban | `GET /api/pipeline` | **WHEN** hồ sơ lưu tại cột `NEW` quá 48 giờ hoặc tại cột `SCREENING` quá 72 giờ tính từ `stageUpdatedAt` **THEN** hệ thống tự động gắn cờ `isSlaBreached = true` và đổi viền thẻ sang màu đỏ cảnh báo **UNLESS** hồ sơ đã chuyển sang `INTERVIEW`, `HIRED` hoặc `REJECTED`. | - |
| **`BRL-08`**<br>`BR-EVAL-001` | Tính điểm Scorecard có trọng số & Căn cứ trúng tuyển | `POST /api/scorecards` | **WHEN** giám khảo lưu phiếu Scorecard **THEN** hệ thống tính điểm tổng hợp theo công thức $\text{Score} = (\text{Tech} \times 0.4) + (\text{Comm} \times 0.3) + (\text{Culture} \times 0.3)$ trên thang 5.0★ và bắt buộc nhập Điểm mạnh nổi bật (`strengths`) nếu khuyến nghị `HIRE`/`STRONG_HIRE` **UNLESS** khuyến nghị là `NO_HIRE` hoặc `STRONG_NO_HIRE`. | `ERR-EVAL-422-01` |
| **`BRL-09`**<br>`BR-QUOTA-001` | Hạn ngạch nộp tối đa 3 vị trí trong 90 ngày | `POST /api/applications` | **WHEN** một ứng viên (nhận diện qua Email hoặc SĐT) nộp đơn vào vị trí thứ 4 trong vòng 90 ngày gần nhất **THEN** hệ thống chặn tiếp nhận đơn mới và thông báo vượt hạn ngạch **UNLESS** đã qua 90 ngày kể từ các đơn trước đó. | `ERR-APP-422-01` |
| **`BRL-10`**<br>`BR-RET-001` | Dọn dẹp vòng đời dữ liệu 180 ngày (Hard Delete) | `POST /api/talent-pool/cleanup` | **WHEN** Quản trị viên (`ADMIN`) kích hoạt tác vụ dọn dẹp dữ liệu **THEN** hệ thống xóa vĩnh viễn (Hard Delete) tất cả hồ sơ ở trạng thái `REJECTED` có thời gian lưu trữ `stageUpdatedAt` quá 180 ngày (6 tháng) **UNLESS** hồ sơ chưa quá 180 ngày hoặc đang ở trạng thái `HIRED` / `INTERVIEW` / `SCREENING` / `NEW`. | `ERR-POOL-403-01` |
| **`BRL-11`**<br>`BR-REJ-001` | Bắt buộc Lý do khi Từ chối hồ sơ | `POST /api/pipeline/move` | **WHEN** bất kỳ người dùng có thẩm quyền nào chuyển hồ sơ sang trạng thái `REJECTED` **THEN** bắt buộc cung cấp `rejectionReason` có độ dài tối thiểu 5 ký tự (lưu vào `Application.rejectionReason` và `AuditLog.reason`) **UNLESS** Không có ngoại lệ. | `ERR-PIPE-422-03` |
| **`BRL-12`**<br>`BR-SOT-001` | Nguồn chân lý (Source of Truth) & Chống trùng lặp 2 lớp | `dedup-and-contact.ts`, `applications/route.ts`, `preview-cv/route.ts` | **WHEN** ứng viên nộp hồ sơ có cả thông tin Form và tệp CV **THEN** hệ thống chuẩn hóa Email/SĐT (`+84` ➔ `0`), ưu tiên Form làm liên hệ chính và lưu liên hệ từ CV làm bản phụ (`cvExtracted*`); nếu lệch hoàn toàn cả Tên lẫn liên hệ (`CRITICAL`) thì yêu cầu xác nhận 1 bước (`409`); đồng thời áp dụng Chống trùng Lớp 1 (chặn cứng Email/SĐT Form trùng 30 ngày) và Lớp 2 (gắn cờ mềm nghi ngờ trùng nếu trùng Email/SĐT trong CV hoặc trùng SHA-256 `cvFileHash`) **UNLESS** nộp từ nội bộ HR (bỏ qua hộp xác nhận 1 bước nhưng vẫn lưu cảnh báo sai khác và cờ trùng Lớp 2). | `ERR-APP-409-01`<br>`ERR-APP-409-02` |
| **`BRL-13`**<br>`BR-HEAD-001` | Chỉ tiêu tuyển dụng, Trần phỏng vấn cùng lúc & Tự đóng tin | `headcount-rules.ts`, `jobs/route.ts`, `pipeline/move/route.ts`, `interviews/schedule/route.ts` | **WHEN** HR đăng tin tuyển dụng có `targetHeadcount` (`≥ 1`) và `maxActiveInterviews` (mặc định `3 × targetHeadcount`, tự co tỷ lệ theo số suất còn trống) **THEN** (1) khi `activeInterviewCount >= effectiveInterviewCap`, hệ thống cảnh báo mềm (`409 requiresOverride`) chống phỏng vấn dư; (2) khi tuyển đủ suất cuối (`hiredCount + 1 >= targetHeadcount`), hệ thống tự đóng tin (`Job.status = "CLOSED"`); (3) khi đã đủ chỉ tiêu (`remainingSlots == 0`), chặn chuyển thêm sang `INTERVIEW`/`HIRED` và khóa form nộp công khai **UNLESS** `HIRING_MANAGER`/`ADMIN` xác nhận vượt trần phỏng vấn (`forceInterviewCapOverride = true`, ghi vết `AuditLog`) hoặc `HR`/`ADMIN` tăng `targetHeadcount` qua `PATCH /api/jobs/[id]`. | `ERR-PIPE-409-02`<br>`ERR-PIPE-400-04` |
| **`BRL-14`**<br>`BR-PIPE-002` | Phân trang Lũy tiến Từng Cột trên Bảng Kanban (Column Progressive Loading) | `GET /api/pipeline`, `KanbanBoard` | **WHEN** một cột trên bảng Kanban có số lượng hồ sơ thực tế vượt quá kích thước hiển thị mặc định (`DEFAULT_STAGE_PAGE_SIZE = 15` hồ sơ) **THEN** hệ thống chỉ kết xuất (render) 15 thẻ hồ sơ đầu tiên theo tiêu chí sắp xếp hiện tại, đồng thời hiển thị widget chân cột thông báo số lượng `Đang xem X / Tổng Y` và nút bấm "+ Tải thêm 15 hồ sơ" nhằm chống quá tải DOM và duy trì tốc độ khung hình kéo thả (≥ 55 FPS) **UNLESS** người dùng bấm "Xem tất cả" hoặc số lượng hồ sơ trong cột nhỏ hơn hoặc bằng 15. | - |
| **`BRL-STAGE-ORDER`**<br>`BR-FSM-001` | Tuân thủ trình tự tuyến tính State Machine | `src/lib/stage-rules.ts` | **WHEN** người dùng thao tác chuyển trạng thái hồ sơ **THEN** chỉ chấp nhận các đường chuyển hợp lệ kế tiếp (`NEW ➔ SCREENING ➔ INTERVIEW ➔ HIRED`) và nghiêm cấm nhảy cóc (`NEW ➔ INTERVIEW`, `NEW ➔ HIRED`, `SCREENING ➔ HIRED`, `REJECTED ➔ HIRED`) **UNLESS** Không có ngoại lệ (áp dụng cho cả `ADMIN`). | `ERR-PIPE-422-01` |
| **`BRL-STAGE-TERMINAL`**<br>`BR-FSM-002` | Khóa trạng thái kết thúc (`HIRED`) | `src/lib/stage-rules.ts` | **WHEN** hồ sơ đã đạt trạng thái `HIRED` **THEN** hệ thống khóa hoàn toàn thao tác chuyển sang bất kỳ trạng thái nào khác nhằm bảo vệ toàn vẹn dữ liệu tuyển chọn **UNLESS** Không có ngoại lệ trên luồng Kanban tiêu chuẩn. | `ERR-PIPE-409-01` |
| **`RBAC-STAGE-LIMIT`**<br>`BR-RBAC-001` | Phân tách thẩm quyền vòng tuyển HR vs Hiring Manager | `src/lib/stage-rules.ts`, `schedule/route.ts` | **WHEN** người dùng luân chuyển cột Kanban hoặc xếp/hủy lịch phỏng vấn **THEN** `HR` chỉ được chuyển tối đa đến `SCREENING` (`NEW ➔ SCREENING`, `NEW/SCREENING ➔ REJECTED`, phục hồi về `NEW/SCREENING`); `HIRING_MANAGER` phụ trách từ `SCREENING` trở đi (`SCREENING ➔ INTERVIEW`, xếp/sửa/hủy lịch PV, `INTERVIEW ➔ HIRED`, `SCREENING/INTERVIEW ➔ REJECTED`) và không tác động vòng `NEW` **UNLESS** người dùng có vai trò `ADMIN`. | `ERR-PIPE-403-01`<br>`ERR-INTV-403-01` |
| **`BRL-Auth`**<br>`BR-SEC-001` | Bảo mật mật khẩu, phiên Better Auth, DAL RBAC & chống Spam | `better-auth.ts`, `src/server/dal/*`, `middleware.ts` | **WHEN** người dùng nội bộ đăng nhập hoặc thao tác trên hệ thống **THEN** mật khẩu tối thiểu 8 ký tự băm bằng NIST `PBKDF2-SHA512` (100,000 vòng lặp, đồng bộ `auth_accounts`), phiên lưu trong bảng `auth_sessions` trên Neon PostgreSQL qua cookie ký số `better-auth.session_token`, cấm tự đăng ký công khai (`disableSignUp: true`), mọi API nội bộ và `ProtectedAdminLayout` xác thực phiên + 24 quyền RBAC ngay tại `src/server/dal/` (không phụ thuộc Middleware), thu hồi phiên tức thì khi `isActive = false`, và giới hạn nộp đơn công khai theo IP **UNLESS** Không có ngoại lệ. | `AUTH_UNAUTHORIZED`<br>`AUTH_INVALID_CREDENTIALS`<br>`AUTH_ACCOUNT_DISABLED`<br>`AUTH_FORBIDDEN` |

---

## PHẦN 2: MA TRẬN NGOẠI LỆ & LỖI NGHIỆP VỤ 7 CỘT (RULE-03 & RULE-11)

| Mã Lỗi Chuẩn (`RULE-03`) | Tình Huống Kích Hoạt (Trigger Condition) | HTTP & Mã Rule Code Trong API | Hành Vi Hệ Thống (Backend Behavior) | Phản Hồi Giao Diện (UI/UX Response) | Hành Động Phục Hồi (Recovery Action) | Mức Độ (Severity) |
| :--- | :--- | :---: | :--- | :--- | :--- | :---: |
| **`ERR-AUTH-401-01`** | Nhập sai email/mật khẩu hoặc phiên `auth_sessions` hết hạn / bị thu hồi / giả mạo chữ ký | `401 Unauthorized`<br>`AUTH_INVALID_CREDENTIALS` / `AUTH_UNAUTHORIZED` | DAL `requireSession()` đối soát trực tiếp Better Auth + Neon PostgreSQL; từ chối truy cập với thông điệp song ngữ sạch. | Hiển thị lỗi song ngữ VI/EN tại trang đăng nhập hoặc chuyển hướng về `/admin/login`. | Nhập lại thông tin xác thực hợp lệ hoặc đăng nhập lại. | **High** |
| **`ERR-AUTH-403-01`** | Tài khoản bị khóa (`isActive=false`), cố gọi `/api/auth/sign-up/*`, hoặc sai quyền RBAC trong DAL | `403 Forbidden`<br>`AUTH_ACCOUNT_DISABLED` / `AUTH_FORBIDDEN` | DAL chặn tại cả `POST /api/auth/login`, Better Auth `databaseHooks`, `requirePermission()`, và xóa toàn bộ `auth_sessions` của user bị khóa. | Hiển thị thông báo song ngữ VI/EN thân thiện (không chứa mã kỹ thuật nội bộ). | Liên hệ `ADMIN` kích hoạt tài khoản hoặc sử dụng đúng vai trò thẩm quyền. | **High** |
| **`ERR-SYS-429-01`** | Một IP nộp vượt quá 05 hồ sơ ứng tuyển trong 10 phút | `429 Too Many Requests`<br>`NFR-SEC-03` | Chặn ngay đầu hàm `POST /api/applications` bằng sliding-window rate limiter. | Banner cảnh báo đỏ yêu cầu chờ 10 phút trước khi nộp lại. | Chờ hết chu kỳ 10 phút rồi thử lại. | **Medium** |
| **`ERR-APP-400-01`** | Tệp CV tải lên sai định dạng (khác `.pdf`, `.docx`) hoặc > 10MB | `400 Bad Request`<br>`BRL-01` | Chặn lưu file trước khi ghi vào `public/uploads/`. | Viền đỏ ô upload CV hiển thị lỗi inline chi tiết. | Chọn lại tệp `.pdf` hoặc `.docx` dung lượng ≤ 10MB. | **Low** |
| **`ERR-APP-400-02`** | Tệp đổi đuôi giả mạo (VD: file HTML/EXE đổi tên thành `.pdf`) | `400 Bad Request`<br>`MAGIC_BYTES_INVALID` | Kiểm tra 4 bytes đầu (`%PDF-`) / 2 bytes đầu (`PK`); từ chối ngay không gọi `pdf-parse`. | Báo lỗi bảo mật: *"Nội dung tệp không phải PDF/DOCX chuẩn"*. | Xuất lại CV từ Word/Canva đúng chuẩn định dạng. | **Critical** |
| **`ERR-APP-409-01`** | Cặp `(Email, SĐT)` nộp trùng cùng 1 Job trong 30 ngày | `400 Bad Request`<br>`BRL-02` | Truy vấn bảng `applications` 30 ngày gần nhất; từ chối tạo bản ghi mới. | Viền đỏ tại ô Email & SĐT kèm thông báo đã ứng tuyển trong 30 ngày qua. | Tra cứu tiến độ hồ sơ cũ tại `/jobs/tracker` hoặc chọn vị trí khác. | **Medium** |
| **`ERR-APP-422-01`** | Ứng viên đã nộp đủ 03 vị trí khác nhau trong 90 ngày | `400 Bad Request`<br>`BRL-09` | Đếm đơn nộp trong 90 ngày (`>= 3`); chặn tiếp nhận đơn thứ 4. | Thông báo lỗi hạn mức `BRL-09`. | Chờ kết quả các đơn hiện tại hoặc thử lại sau 90 ngày. | **Medium** |
| **`ERR-PROF-403-01`** | `HIRING_MANAGER` cố gọi `PATCH /api/applications/[id]/profile` | `403 Forbidden`<br>`RBAC-PROFILE-EDIT` | Kiểm tra `sessionUser.role === "HIRING_MANAGER"`; từ chối cập nhật DB. | Ẩn nút "Chỉnh sửa" trên UI; nếu gọi trực tiếp API trả thông báo lỗi quyền. | Nhờ Chuyên viên HR hiệu chỉnh thông tin trích xuất. | **Medium** |
| **`ERR-PIPE-403-01`** | `HR` kéo thẻ sang `INTERVIEW`/`HIRED`, hoặc `HIRING_MANAGER` kéo từ `NEW` | `403 Forbidden`<br>`RBAC-STAGE-LIMIT` | `validateStageTransition` chặn tại Backend; không cập nhật trạng thái hay ghi AuditLog. | Rollback thẻ về cột cũ, hiển thị banner đỏ giải thích rõ phạm vi vai trò. | Bàn giao cho đúng vai trò phụ trách (HR ➔ SCREENING; HM ➔ INTERVIEW/HIRED). | **High** |
| **`ERR-PIPE-422-01`** | Kéo nhảy cóc giai đoạn (`NEW ➔ INTERVIEW`, `SCREENING ➔ HIRED`, `REJECTED ➔ HIRED`) | `400 Bad Request`<br>`BRL-STAGE-ORDER` | `validateStageTransition` kiểm tra bảng `ALLOWED_STAGE_FLOW`; từ chối chuyển cột. | Rollback thẻ, hiển thị thông báo bước kế tiếp hợp lệ theo quy trình. | Kéo lần lượt đúng tuần tự `NEW ➔ SCREENING ➔ INTERVIEW ➔ HIRED`. | **High** |
| **`ERR-PIPE-409-01`** | Cố kéo hồ sơ đã `HIRED` sang trạng thái khác | `400 Bad Request`<br>`BRL-STAGE-TERMINAL` | Chặn mọi chuyển đổi đi ra khỏi trạng thái kết thúc `HIRED`. | Khóa thao tác kéo thẻ trên Kanban & hiện biểu tượng khóa 🔒 trong Drawer. | Hồ sơ trúng tuyển đã hoàn tất chu trình tuyển dụng. | **High** |
| **`ERR-PIPE-422-02`** | `HIRING_MANAGER`/`ADMIN` kéo `INTERVIEW ➔ HIRED` khi chưa có Scorecard đạt | `400 Bad Request`<br>`BRL-06` | Kiểm tra `app.evaluations` có ≥ 1 phiếu `HIRE`/`STRONG_HIRE`; từ chối nếu thiếu. | Rollback thẻ, hiển thị thông báo yêu cầu hoàn tất phiếu Scorecard trước. | Mở Drawer ➔ bấm **"+ Đánh Giá Phỏng Vấn"** hoàn tất Scorecard rồi kéo lại. | **Critical** |
| **`ERR-PIPE-422-03`** | Chuyển sang `REJECTED` nhưng bỏ trống hoặc nhập lý do < 5 ký tự | `400 Bad Request`<br>`BRL-11` | Kiểm tra `rejectionReason.trim().length >= 5`; chặn lưu DB. | Tự động mở `RejectReasonModal` yêu cầu chọn/nhập lý do từ chối cụ thể. | Chọn lý do chuẩn hoặc nhập mô tả chi tiết ≥ 5 ký tự rồi xác nhận. | **High** |
| **`ERR-INTV-403-01`** | `HR` cố xếp lịch, sửa lịch hoặc hủy lịch phỏng vấn | `403 Forbidden`<br>`RBAC-STAGE-LIMIT` | Chặn tại `POST/DELETE /api/interviews/schedule` khi `role === "HR"`. | Ẩn nút Lên lịch/Sửa/Hủy đối với HR, hiện nhãn *"Do Hiring Manager phụ trách"*. | Chuyển hồ sơ sang `SCREENING` để Hiring Manager trực tiếp duyệt và xếp lịch. | **Medium** |
| **`ERR-POOL-403-01`** | `HR` hoặc `HIRING_MANAGER` cố gọi tác vụ xóa vĩnh viễn `BRL-10` | `403 Forbidden`<br>`RBAC-PURGE-BLOCK` | Chặn tuyệt đối tại `POST /api/talent-pool/cleanup` nếu `role !== "ADMIN"`. | Ẩn nút dọn dẹp 6 tháng với HR/HM; API trả lỗi 403. | Yêu cầu tài khoản `ADMIN` thực thi tác vụ định kỳ. | **Critical** |
| **`ERR-APP-409-02`** | Tên và Email/SĐT trên CV khác hoàn toàn thông tin ứng viên nhập ở Form công khai (`CRITICAL`) | `409 Conflict`<br>`BRL-12-CONFIRM` | Tạm dừng lưu hồ sơ, trả về `requiresMismatchConfirm: true` kèm thông tin đọc được từ CV. | Hiện hộp xác nhận 1 bước cho ứng viên chọn lại tệp CV hoặc bấm *"Tôi xác nhận đúng, tiếp tục nộp"*. | Đổi đúng tệp CV của mình hoặc xác nhận nộp kèm `confirmMismatch=true`. | **Medium** |
| **`ERR-PIPE-409-02`** | Đưa thêm ứng viên sang `INTERVIEW` khi vị trí đã chạm trần phỏng vấn cùng lúc | `409 Conflict`<br>`BRL-13-CAP` | Tạm dừng chuyển vòng / xếp lịch, trả về `requiresOverride: true` và `headcountMetrics`. | Mở hộp xác nhận khuyên đánh giá xong đợt hiện tại, cho phép chọn *"Giữ lại ở Sàng lọc"* hoặc *"Vẫn mời phỏng vấn"*. | Hoàn tất đánh giá ứng viên đang PV hoặc xác nhận vượt hạn mức có ghi vết AuditLog. | **Medium** |
| **`ERR-PIPE-400-04`** | Chuyển thêm sang `INTERVIEW`/`HIRED` hoặc nộp đơn công khai khi vị trí đã đủ chỉ tiêu | `400 Bad Request`<br>`BRL-13-FULL` | Chặn chuyển vòng và khóa form nộp công khai vì `hiredCount >= targetHeadcount`. | Báo vị trí đã tuyển đủ chỉ tiêu và hướng dẫn tăng chỉ tiêu tại trang Tin tuyển dụng nếu cần tuyển bổ sung. | HR/Admin cập nhật tăng `targetHeadcount` qua `PATCH /api/jobs/[id]`. | **High** |

---

## PHẦN 3: ACCEPTANCE CRITERIA CHUẨN GHERKIN BDD (RULE-08)

### Feature 1: Hiển thị 5 Trường Cốt Lõi & HR Chỉnh Sửa Thủ Công (`BRL-03`)

```gherkin
Feature: Quản lý thông tin trích xuất 5 trường cốt lõi theo JD

  Scenario: Happy Path — Mở hồ sơ chỉ hiển thị gọn 5 trường cốt lõi ban đầu
    Given HR đã đăng nhập và mở ngăn chi tiết ứng viên "Nguyễn Văn Minh" ứng tuyển vị trí "Fullstack Developer"
    When CandidateDrawer tải xong dữ liệu hồ sơ
    Then hệ thống chỉ hiển thị 5 trường cốt lõi gồm Họ tên, Email, Vị trí ứng tuyển, Kỹ năng và Số năm kinh nghiệm đối chiếu với JD
    And các khối Học vấn, Lịch sử công tác chi tiết và Chứng chỉ đính kèm đang ở trạng thái thu gọn
    When HR nhấn nút "Xem chi tiết hồ sơ"
    Then hệ thống mở rộng hiển thị Số điện thoại, Học vấn, Lịch sử công tác chi tiết và Thư viện Chứng chỉ

  Scenario: Happy Path — HR chỉnh sửa thủ công kỹ năng bị bóc sót và tự động cập nhật khớp JD
    Given HR đang xem hồ sơ ứng viên còn thiếu kỹ năng "Docker" do AI bóc sót
    When HR nhấn "Chỉnh sửa", thêm kỹ năng "Docker", cập nhật số năm kinh nghiệm thành 4 và nhấn "Lưu thay đổi"
    Then hệ thống gửi PATCH /api/applications/{id}/profile trả về HTTP 200
    And danh sách aiMatchedSkills tự động bổ sung "Docker" và cập nhật lại aiMatchScore
    And bảng AuditLog ghi nhận 01 bản ghi mới với action "PROFILE_EDITED"

  Scenario: Security / Negative Path — Chặn Hiring Manager chỉnh sửa dữ liệu trích xuất CV
    Given người dùng đăng nhập bằng vai trò "HIRING_MANAGER"
    When người dùng gọi trực tiếp PATCH /api/applications/{id}/profile
    Then hệ thống từ chối với mã HTTP 403 và mã rule "RBAC-PROFILE-EDIT"
```

---

### Feature 2: Phân Tách Thẩm Quyền Chuyển Vòng & State Machine (`RBAC-STAGE-LIMIT`, `BRL-STAGE-ORDER`)

```gherkin
Feature: Kiểm soát luân chuyển trạng thái theo Vai trò và State Machine

  Scenario: Happy Path — HR chuyển hồ sơ NEW sang SCREENING thành công
    Given HR đang ở bảng Kanban Pipeline với hồ sơ ứng viên ở cột "NEW"
    When HR kéo thẻ ứng viên thả vào cột "SCREENING"
    Then hệ thống cập nhật trạng thái thành "SCREENING", đánh dấu isViewed = true và ghi AuditLog

  Scenario: Business Negative Path — Chặn HR chuyển hồ sơ sang INTERVIEW hoặc HIRED
    Given HR đang xem hồ sơ ứng viên ở cột "SCREENING"
    When HR cố kéo thẻ thả vào cột "INTERVIEW" hoặc gửi POST /api/pipeline/move với toStage "INTERVIEW"
    Then hệ thống từ chối với HTTP 403 và mã rule "RBAC-STAGE-LIMIT"
    And thẻ ứng viên giữ nguyên tại cột "SCREENING" kèm thông báo HR chỉ chuyển tối đa đến Sàng lọc tiêu chuẩn

  Scenario: Happy Path — Hiring Manager duyệt SCREENING -> INTERVIEW và INTERVIEW -> HIRED
    Given Hiring Manager đăng nhập vào bảng Kanban Pipeline
    And hồ sơ ứng viên đang ở cột "SCREENING"
    When Hiring Manager kéo thẻ sang "INTERVIEW"
    Then hệ thống cập nhật trạng thái thành "INTERVIEW" thành công
    When Hiring Manager hoàn tất 01 phiếu Scorecard khuyến nghị "HIRE" và kéo thẻ sang "HIRED"
    Then hệ thống cập nhật trạng thái thành "HIRED" thành công

  Scenario: Boundary Path — Chặn nhảy cóc giai đoạn NEW -> INTERVIEW kể cả với Admin
    Given Admin đang ở bảng Kanban với hồ sơ ở cột "NEW"
    When Admin cố chuyển trực tiếp từ "NEW" sang "INTERVIEW"
    Then hệ thống từ chối với HTTP 400 và mã rule "BRL-STAGE-ORDER"
```

---

### Feature 3: Bắt Buộc Lý Do Từ Chối & Delay Buffer 12 Giờ (`BRL-11`, `BRL-05`)

```gherkin
Feature: Bắt buộc ghi nhận Lý do Từ chối và cơ chế hoãn Email 12 giờ

  Scenario: Business Negative Path — Chặn từ chối khi không có lý do
    Given HR gửi yêu cầu POST /api/pipeline/move chuyển hồ sơ từ "NEW" sang "REJECTED" với rejectionReason rỗng
    Then hệ thống từ chối với HTTP 400 và mã rule "BRL-11"
    And trạng thái hồ sơ giữ nguyên tại "NEW"

  Scenario: Happy Path — Từ chối hồ sơ kèm lý do hợp lệ và phục hồi hủy lịch Email
    Given HR kéo thẻ từ "SCREENING" sang "REJECTED"
    When RejectReasonModal hiển thị và HR chọn lý do "Chưa đáp ứng kỹ năng chuyên môn cốt lõi theo JD" rồi xác nhận
    Then hệ thống lưu trạng thái "REJECTED", lưu rejectionReason, hẹn emailScheduledAt = now() + 12 giờ và ghi AuditLog.reason
    When HR kéo thẻ đó phục hồi từ "REJECTED" về "SCREENING" trong vòng 12 giờ
    Then hệ thống đặt emailScheduledAt = null và xóa rejectionReason để hủy gửi thư từ chối
```

---

### Feature 4: Nguồn Chân Lý (Source of Truth) & Chống Trùng Lặp 2 Lớp (`BRL-12`, `BRL-02`)

```gherkin
Feature: Xử lý xung đột thông tin Form vs CV và Chống trùng lặp 2 lớp

  Scenario: Happy Path — Tự động điền sẵn (Auto-fill) khi tải CV lên ở Bước 1
    Given ứng viên mở trang chi tiết tin tuyển dụng đang còn chỉ tiêu
    When ứng viên tải lên tệp CV PDF hợp lệ có chứa Họ tên, Email và SĐT
    Then hệ thống gọi POST /api/applications/preview-cv và tự điền sẵn vào 3 ô Họ tên, Email, SĐT
    And ứng viên có thể sửa lại SĐT mới trước khi nộp mà không bị dữ liệu trong CV ghi đè

  Scenario: Business Negative Path — Chuẩn hóa +84 về 0 và chặn trùng Lớp 1 trong 30 ngày
    Given ứng viên đã nộp đơn cho vị trí #1 bằng SĐT "0912345678" cách đây 5 ngày
    When ứng viên nộp lại cho cùng vị trí #1 với SĐT "+84 912-345-678"
    Then hệ thống chuẩn hóa thành "0912345678" và từ chối nộp trùng với mã HTTP 400 (BRL-02) kèm ngày đã nộp

  Scenario: Boundary Path — Hộp xác nhận 1 bước khi CV khác hoàn toàn người đăng ký và Cờ trùng Lớp 2
    Given ứng viên nhập tên "Nguyễn Văn A" và email mới nhưng tải lên tệp CV của "Trần Thị B"
    When ứng viên bấm Nộp lần đầu
    Then hệ thống trả về HTTP 409 với requiresMismatchConfirm = true để tránh tải nhầm tệp CV
    When ứng viên xác nhận tiếp tục nộp (confirmMismatch = true)
    Then hệ thống vẫn lưu Form làm liên hệ chính, lưu thông tin CV làm bản phụ và gắn cảnh báo cho HR
    And nếu tệp CV hoặc email/SĐT trong CV trùng với hồ sơ #12 đã nộp trong 30 ngày thì gắn cờ duplicateWarningAppId = 12
```

---

### Feature 5: Chỉ Tiêu Tuyển Dụng, Trần Phỏng Vấn Cùng Lúc & Tự Đóng Tin (`BRL-13`)

```gherkin
Feature: Quản trị chỉ tiêu tuyển dụng và chống phỏng vấn dư

  Scenario: Business Negative Path — Cảnh báo mềm khi chạm trần phỏng vấn cùng lúc
    Given vị trí "Backend Engineer" có targetHeadcount = 1, maxActiveInterviews = 3 và đang có 3 ứng viên ở cột "INTERVIEW"
    When Hiring Manager kéo ứng viên thứ 4 từ "SCREENING" sang "INTERVIEW"
    Then hệ thống trả về HTTP 409 với requiresOverride = true khuyến nghị đánh giá xong đợt hiện tại
    When Hiring Manager xác nhận vượt hạn mức (forceInterviewCapOverride = true)
    Then hệ thống cho phép chuyển sang "INTERVIEW" và ghi vết lý do vượt hạn mức vào AuditLog

  Scenario: Happy Path — Tự động đóng tin tuyển dụng khi tuyển đủ chỉ tiêu cuối cùng
    Given vị trí "Backend Engineer" có targetHeadcount = 1 và hiredCount = 0
    When Hiring Manager chuyển ứng viên đạt Scorecard từ "INTERVIEW" sang "HIRED"
    Then hệ thống chuyển hồ sơ sang "HIRED", tự động cập nhật Job.status = "CLOSED" và trả về jobAutoClosed = true
    And trang nộp hồ sơ công khai tự động khóa nhận đơn mới cho vị trí này
```

---

### Feature 6: Phân Trang Lũy Tiến Từng Cột Trên Bảng Kanban (`BRL-14`)

```gherkin
Feature: Tối ưu hóa hiệu năng hiển thị và kéo thả Kanban với tập dữ liệu lớn

  Scenario: Happy Path — Tự động giới hạn hiển thị 15 thẻ đầu tiên và hiển thị nút tải thêm
    Given cột "NEW" của vị trí tuyển dụng có tổng cộng 45 ứng viên
    When chuyên viên HR mở bảng Pipeline Kanban
    Then hệ thống chỉ kết xuất đúng 15 thẻ hồ sơ đầu tiên trong cột "NEW"
    And badge đếm trên đầu cột vẫn hiển thị đầy đủ tổng số "45"
    And chân cột hiển thị nút "+ Tải thêm 15 hồ sơ" kèm thông tin "Đang xem 15 / 45"

  Scenario: Happy Path — Tải thêm hồ sơ lũy tiến khi người dùng yêu cầu
    Given cột "NEW" đang hiển thị 15 / 45 hồ sơ
    When HR bấm vào nút "+ Tải thêm 15 hồ sơ"
    Then số lượng thẻ hiển thị trong cột tăng lên 30 hồ sơ
    And thông tin chân cột cập nhật thành "Đang xem 30 / 45"
    And các cột khác (SCREENING, INTERVIEW, HIRED, REJECTED) giữ nguyên trạng thái hiển thị độc lập

  Scenario: Boundary Path — Cột có số lượng hồ sơ nhỏ hơn hoặc bằng 15
    Given cột "INTERVIEW" có tổng cộng 4 ứng viên
    When Quản lý chuyên môn mở bảng Pipeline Kanban
    Then toàn bộ 4 thẻ hồ sơ được hiển thị đầy đủ
    And chân cột không hiển thị nút tải thêm
```


---

## Phụ lục Cập nhật Phiên bản v2.1 (24/11/2026) — Đồng bộ Thực tế Hệ thống

| Hạng mục nâng cấp | Mã quy tắc | Mô tả triển khai thực tế trong hệ thống |
|---|---|---|
| Đọc tệp Word `.docx` chuẩn | `BRL-01` / `AI-L1` | Tích hợp thư viện `mammoth` (`extractRawText`) bóc tách văn bản sạch từ XML `.docx` thay cho giải mã UTF-8 thô. |
| Đồng nhất công thức chấm điểm 60/40 | `BRL-04` | Thống nhất tuyệt đối trọng số **60% Kỹ năng + 40% Kinh nghiệm** giữa Layer 2 (Gemini `gemini-2.5-flash`, `temperature: 0`) và Layer 1 (Heuristic dự phòng); loại bỏ hoàn toàn dữ liệu mẫu hardcode cũ. |
| Blind Scorecard chống thiên kiến mỏ neo | `BRL-15` | Khóa ẩn điểm số và nhận xét của các giám khảo khác ở tầng API (`GET /api/applications/[id]`, `GET /api/scorecards`) cho đến khi người chấm (`HR` / `HIRING_MANAGER`) tự nộp phiếu đánh giá của mình (`ADMIN` giữ quyền giám sát). |
| Tách riêng vòng Đề nghị (`OFFER`) | `BRL-06` / FSM | Mở rộng Pipeline từ 5 lên **6 giai đoạn**: `NEW ➔ SCREENING ➔ INTERVIEW ➔ OFFER ➔ HIRED / REJECTED`. Chốt chặn `BRL-06` (≥ 1 Scorecard `HIRE` / `STRONG_HIRE`) áp dụng trước khi chuyển sang `OFFER` và `HIRED`. |
| Câu hỏi sàng lọc cứng (Knock-out Questions) | `BRL-16` | HR/Admin cấu hình tối đa 5 câu hỏi Có/Không kèm cờ tiêu chí cứng (`Job.screeningQuestions`). Ứng viên trả lời trên cổng ứng tuyển (`/jobs/[id]`), hệ thống lưu `Application.screeningAnswers` và gắn cờ mềm `knockoutFailed` (Human-in-the-Loop, không tự xóa hồ sơ). |
| Phê duyệt tin tuyển dụng (Requisition Approval) | `BRL-17` | Mở rộng vòng đời tin tuyển dụng thành 4 trạng thái: `DRAFT ➔ PENDING_APPROVAL ➔ ACTIVE ➔ CLOSED`. Tin do `HR` tạo chuyển sang `PENDING_APPROVAL` chờ `HIRING_MANAGER` hoặc `ADMIN` duyệt (`POST /api/jobs/[id]/approve`) trước khi công khai lên `/jobs`. |
| Quản trị Tài khoản & Tự đổi mật khẩu | `FR-ADM` | `ADMIN` có thể chỉnh sửa Họ tên, Email, SĐT (`User.phone`), Vai trò và đặt lại mật khẩu (`PATCH /api/users`). Mọi người dùng nội bộ tự đổi mật khẩu an toàn tại `/admin/settings` (`POST /api/auth/change-password`). |
| Kiểm chứng Tự động & Giao diện Song ngữ | `NFR-USA` | Giao diện chuẩn tối giản (ELCA Swiss Minimalist), bỏ toàn bộ mã kỹ thuật/enum thô ở Nhật ký hoạt động, kiểm thử tự động **169/169 Passed** và rà soát toàn bộ màn hình VI/EN bằng Playwright. |

---

## Phụ lục Cập nhật Phiên bản v2.3 (26/11/2026) — Kiến trúc Better Auth & Server-Only DAL (`ATS-002`)

| Hạng mục nâng cấp (`ATS-002`) | Module Thực Thi | Mô tả triển khai & Nghiệm thu QA (GO — 0 P0/P1) |
|---|---|---|
| Chuyển đổi sang **Better Auth** trên Neon PostgreSQL | `src/lib/better-auth.ts`, `prisma/schema.prisma`, `prisma/backfill-better-auth.ts` | Cấu hình `prismaAdapter` với `generateId: "serial"` giữ nguyên khóa ngoại `Int` (`users.id`); bổ sung `auth_sessions`, `auth_accounts`, `auth_verifications`; khóa `disableSignUp: true`; chặn `isActive = false` ngay tại `databaseHooks`; đồng bộ 6/6 tài khoản demo băm `PBKDF2-SHA512`. |
| Tầng **Server-Only Data Access Layer (DAL)** | `src/server/dal/*` (14 modules) | 100% module khai báo `import "server-only"`; toàn bộ 22/22 API routes nội bộ và `src/app/admin/(protected)/` đi qua DAL (0 route nội bộ import `prisma` trực tiếp hay gọi `getSessionUser()` cũ). |
| Ma trận 24 Quyền Hạt Mịn & Chống Tự Khóa Admin | `src/server/dal/permissions.ts`, `users.ts`, `errors.ts` | Kiểm tra `requirePermission()` tập trung; thu hồi tức thì toàn bộ `auth_sessions` trong cùng `$transaction` khi khóa user hoặc đổi mật khẩu; chặn Admin tự khóa/hạ quyền (`SELF_LOCKOUT_PREVENTED`); thông điệp lỗi song ngữ VI/EN sạch 100%. |
| Chốt chặn Nghiệp vụ Tập trung & Vá Bảo mật | `src/server/dal/gates.ts`, `jobs.ts`, `scorecards.ts`, `interviews.ts`, `middleware.ts` | Phủ đồng bộ `BRL-15` (Blind Scorecard) trên toàn bộ 8 luồng đọc/xuất; khóa `BRL-17` chặn HR tự đóng/mở tin chưa duyệt (`approvedById = null`); xóa `customWebhookUrl` chống SSRF; xóa bypass `Referer` trên Storage Proxy; gỡ `x-user-*` header injection ở `middleware.ts` (CVE-2025-29927); nâng tổng kiểm thử tự động lên **26 Suites — 197/197 Passed (100%)**. |
