---
id: "API-ATS-15"
title: "Đặc tả Hợp đồng API Chính & Hệ thống Mã lỗi Chuẩn"
type: "api-spec"
version: "2.1.0"
status: "approved"
owner: "ReCoverX BA & Engineering Team"
domain: "recruitment-ats"
tags:
  - "api-contract"
  - "rest-api"
  - "error-codes"
upstream_deps:
  - "FDD-ATS-04"
  - "FSM-ATS-06"
  - "ERD-ATS-07"
  - "BR-ERR-17"
downstream_deps:
  - "UAT-ATS-18"
last_updated: "2026-11-18"
---

# ĐẶC TẢ API CHÍNH & DANH MỤC MÃ LỖI (API SPECIFICATIONS & ERROR CODES)

> **Dự án:** ReCoverX Career — Applicant Tracking System (ATS)  
> **Phiên bản tài liệu:** v1.0  
> **Kiến trúc:** Next.js 14 App Router Route Handlers (`src/app/api/`) + TypeScript + Prisma ORM  

---

## Lịch Sử Phiên Bản (Revision History)

| Phiên Bản | Ngày Phát Hành | Tác Giả | Phân Loại | Tóm Tắt Thay Đổi | Phê Duyệt |
| :---: | :---: | :--- | :---: | :--- | :--- |
| `v2.1.0` | 2026-11-18 | ReCoverX BA Team | **Changed** | Chuẩn hóa tài liệu theo bộ tiêu chuẩn Universal BA Toolkit (YAML Metadata, SemVer, đồng bộ 100% mã nguồn hiện tại). | Product Owner |
| `v2.2.0` | 2026-11-18 | ReCoverX BA Team | **Added** | Bổ sung hợp đồng API `GET /api/dashboard` cho Bảng điều khiển Tổng quan Vận hành phân quyền theo Role (`ADMIN`, `HR`, `HIRING_MANAGER`). | Product Owner |

---

## 1. QUY CHUẨN CẤU TRÚC PHẢN HỒI (STANDARD RESPONSE ENVELOPE)

Toàn bộ các điểm cuối API của hệ thống tuân thủ cấu trúc phản hồi JSON đồng nhất:

### 1.1 Cấu trúc khi Thành công (Success Response - HTTP 200/201)
```json
{
  "success": true,
  "message": "Thông điệp phản hồi (tùy chọn)",
  "data": { ... }
}
```

### 1.2 Cấu trúc khi Thất bại (Error Response - HTTP 400/401/403/404/429/500)
```json
{
  "success": false,
  "error": "Thông báo lỗi chi tiết hiển thị cho người dùng",
  "rule": "BRL-xx hoặc NFR-xx (nếu có)",
  "field": "tên_trường_lỗi (nếu có)",
  "fieldErrors": {
    "fieldName": "Lý do vi phạm cụ thể của từng trường"
  }
}
```

---

## 2. BẢNG DANH MỤC MÃ LỖI CHUẨN TOÀN HỆ THỐNG (SYSTEM ERROR CODES)

| Mã lỗi / Rule Code | Mã HTTP | Thông điệp lỗi chi tiết | Ý nghĩa nghiệp vụ & Vị trí kiểm soát |
| :--- | :---: | :--- | :--- |
| **`NFR-SEC-03`** | `429 Too Many Requests` | "Hệ thống phát hiện tần suất nộp hồ sơ vượt quá giới hạn an toàn từ IP của bạn. Vui lòng chờ 10 phút trước khi thử lại." | Chống Spam/Bot: Vượt quá 05 lượt nộp / 10 phút / IP tại `POST /api/applications`. |
| **`BRL-01`** | `400 Bad Request` | "Định dạng tệp không hợp lệ. Hệ thống chỉ chấp nhận định dạng PDF hoặc DOCX." | Vi phạm định dạng tệp hoặc dung lượng > 10MB. |
| **`MAGIC_BYTES_INVALID`** | `400 Bad Request` | "Tệp tin không đúng định dạng PDF/DOCX hợp lệ (Chữ ký nhị phân Magic Bytes không khớp)." | Chặn tấn công đổi đuôi file giả mạo (Polyglot File Upload) ở tầng Controller. |
| **`BRL-02`** | `400 Bad Request` | "Ứng viên đã nộp hồ sơ cho vị trí này trong vòng 30 ngày qua. Vui lòng không nộp lặp lại." | Khử trùng lặp: Cặp (Email, SĐT) nộp trùng cùng 1 Job trong 30 ngày. |
| **`BRL-09`** | `400 Bad Request` | "Bạn đã nộp tối đa 3 vị trí công việc trong vòng 90 ngày qua. Vui lòng chờ kết quả phản hồi." | Hạn ngạch ứng tuyển: Vượt quá 03 vị trí khác nhau trong 90 ngày. |
| **`BRL-06`** | `400 Bad Request` | "Chưa thể tuyển chọn (BRL-06): Cần có ít nhất 01 phiếu đánh giá Scorecard hoàn tất với khuyến nghị đạt chuẩn trước khi xác nhận Tuyển chọn." | Chốt chặn Stage-Gate: Chặn kéo sang `HIRED` khi chưa có Scorecard đạt chuẩn. |
| **`BRL-11`** | `400 Bad Request` | "Bắt buộc nhập Lý do từ chối (tối thiểu 5 ký tự) khi chuyển hồ sơ sang trạng thái Từ chối (BRL-11)." | Bắt buộc cung cấp `rejectionReason` khi chuyển sang `REJECTED` tại `POST /api/pipeline/move`. |
| **`BRL-STAGE-ORDER`** | `400 Bad Request` | "Vi phạm trình tự quy trình (BRL-STAGE-ORDER): Không thể nhảy cóc giai đoạn..." | Cấm nhảy cóc State Machine (`NEW -> INTERVIEW`, `SCREENING -> HIRED`, `REJECTED -> HIRED`). |
| **`BRL-STAGE-TERMINAL`** | `400 Bad Request` | "Quy tắc trạng thái (BRL-STAGE-TERMINAL): Hồ sơ đã ở trạng thái Tuyển chọn (HIRED), không thể chuyển ngược." | Khóa trạng thái kết thúc `HIRED`. |
| **`RBAC-STAGE-LIMIT`** | `403 Forbidden` | "Phân quyền HR: Chuyên viên HR chỉ được chuyển tối đa đến vòng Sàng lọc tiêu chuẩn (SCREENING)..." / "Phân quyền Hiring Manager..." | Phân tách thẩm quyền vòng tuyển: HR max `SCREENING`; Hiring Manager phụ trách `INTERVIEW` & `HIRED` và lịch phỏng vấn. |
| **`RBAC-PROFILE-EDIT`** | `403 Forbidden` | "Quản lý chuyên môn (Hiring Manager) chỉ có quyền xem hồ sơ; quyền chuẩn hóa dữ liệu trích xuất CV thuộc bộ phận HR." | Chặn Hiring Manager gọi `PATCH /api/applications/[id]/profile`. |
| **`RBAC-PURGE-BLOCK`**| `403 Forbidden` | "Truy cập bị từ chối: Chỉ Quản trị viên (Admin) mới có quyền thực thi tác vụ dọn dẹp vòng đời hồ sơ BRL-10." | Chặn HR và Manager gọi lệnh xóa vĩnh viễn tại `POST /api/talent-pool/cleanup`. |
| **`AUTH_INVALID_CRED`**| `401 Unauthorized` | "Mật khẩu không chính xác. Vui lòng kiểm tra lại." | Xác thực đăng nhập thất bại qua PBKDF2 tại `POST /api/auth/login`. |
| **`AUTH_USER_LOCKED`** | `403 Forbidden` | "Tài khoản của bạn đã bị Quản trị viên tạm khóa. Vui lòng liên hệ Admin." | Tài khoản có `isActive = false` không được phép đăng nhập. |
| **`NOT_FOUND`** | `404 Not Found` | "Không tìm thấy hồ sơ ứng tuyển này" / "Vị trí tuyển dụng không tồn tại" | Truy vấn ID không tồn tại trong cơ sở dữ liệu. |
| **`INTERNAL_ERROR`** | `500 Server Error` | "Lỗi hệ thống khi xử lý yêu cầu. Vui lòng thử lại sau." | Lỗi bắt ngoại lệ (Catch Exception) ở tầng máy chủ. |

---

## 3. ĐẶC TẢ CHI TIẾT CÁC ĐIỂM CUỐI API CHÍNH (CORE API ENDPOINTS)

### Phân hệ 0: Bảng Điều Khiển Tổng Quan Vận Hành (Role-Based Operational Dashboard)

#### 0. `GET /api/dashboard` — Dữ liệu Tổng quan Vận hành theo Vai trò
* **Mục đích:** Trả về số liệu phễu 5 giai đoạn, cảnh báo SLA (`BRL-07`), hàng đợi việc cần xử lý ngay (Action Queue), lịch phỏng vấn sắp tới và thông số quản trị **được lọc chặt chẽ theo vai trò người dùng đang đăng nhập** (Least Privilege).
* **Yêu cầu phân quyền:** Đã đăng nhập nội bộ (`ADMIN`, `HR`, `HIRING_MANAGER`). Trả về `401 Unauthorized` nếu chưa có phiên hợp lệ.
* **Quy tắc phân tách Payload theo Role:**
  * **`HR`:** Nhận `funnel`, `sla`, `hrQueue` (CV `NEW` chưa xem & hồ sơ quá hạn SLA `NEW > 48h`), `activeJobs`. **Không trả** `adminStats` và `recentAuditLogs`.
  * **`HIRING_MANAGER`:** Nhận `funnel`, `sla`, `hmScreeningQueue` (hồ sơ `SCREENING` chờ duyệt phỏng vấn, kèm cảnh báo SLA `> 72h`), `hmMissingScorecardQueue` (hồ sơ `INTERVIEW` chưa có Scorecard chặn `BRL-06`), `upcomingInterviews`. **Không trả** `hrQueue`, `adminStats`, `recentAuditLogs`.
  * **`ADMIN`:** Nhận toàn cảnh vận hành (`funnel`, `sla`, `activeJobs`, `slaBreachQueue`, `upcomingInterviews`, `adminStats` gồm số user hoạt động & số hồ sơ quá 180 ngày theo `BRL-10`, và `recentAuditLogs`).
* **Success Response (HTTP 200):**
  ```json
  {
    "success": true,
    "data": {
      "role": "HR",
      "generatedAt": "2026-11-18T14:30:00.000Z",
      "funnel": {
        "total": 24,
        "NEW": 6,
        "SCREENING": 5,
        "INTERVIEW": 4,
        "HIRED": 3,
        "REJECTED": 6
      },
      "sla": {
        "newBreachCount": 2,
        "screeningBreachCount": 1,
        "totalBreaches": 3
      },
      "summary": {
        "activeJobsCount": 4,
        "unviewedNewCount": 3,
        "starredCount": 5,
        "pendingScorecardCount": 2,
        "upcomingInterviewsCount": 3
      }
    }
  }
  ```

---

### Phân hệ 1: Xác thực & Quản trị Người dùng (Internal Auth & Users)

#### 1. `POST /api/auth/login` — Đăng nhập hệ thống nội bộ
* **Mục đích:** Xác thực tài khoản nhân viên (Admin, HR, Hiring Manager) và cấp cookie phiên đã ký số.
* **Yêu cầu phân quyền:** Công khai (Nội bộ).
* **Request Body:**
  ```json
  {
    "email": "hr.lead@recoverx.com",
    "password": "Password123"
  }
  ```
* **Success Response (HTTP 200):**
  * Đồng thời thiết lập cookie HttpOnly: `ats_user_session=[payloadBase64].[HMAC-SHA256 signature]`
  ```json
  {
    "success": true,
    "user": {
      "id": 2,
      "email": "hr.lead@recoverx.com",
      "fullName": "Nguyễn Phương Anh",
      "role": "HR"
    }
  }
  ```
* **Error Response (HTTP 401 / 403):**
  ```json
  {
    "success": false,
    "error": "Mật khẩu không chính xác. Vui lòng kiểm tra lại.",
    "field": "password"
  }
  ```

---

#### 2. `POST /api/auth/logout` — Đăng xuất hệ thống
* **Mục đích:** Hủy phiên đăng nhập và xóa cookie xác thực.
* **Success Response (HTTP 200):**
  ```json
  { "success": true, "message": "Đăng xuất thành công" }
  ```

---

#### 3. `GET /api/users` & `POST /api/users` — Quản trị tài khoản nhân viên
* **Mục đích:** Admin xem danh sách và tạo mới tài khoản nhân viên (`HR`, `HIRING_MANAGER`).
* **Yêu cầu phân quyền:** Chỉ `ADMIN` (Middleware chặn HTTP 307 và API chặn HTTP 403).
* **POST Request Body:**
  ```json
  {
    "fullName": "Trần Văn Tech Lead",
    "email": "techlead@recoverx.com",
    "password": "SecurePassword123",
    "role": "HIRING_MANAGER"
  }
  ```

---

### Phân hệ 2: Tiếp nhận Hồ sơ & Cổng Tuyển dụng (Applications & CV Intake)

#### 4. `POST /api/applications` — Nộp đơn ứng tuyển & Upload CV
* **Mục đích:** Tiếp nhận hồ sơ từ Ứng viên (Cổng Careers) hoặc HR nạp nội bộ (Add Candidate Modal).
* **Content-Type:** `multipart/form-data`
* **Form Data Fields:**
  * `jobId` *(number, bắt buộc)*: ID của vị trí tuyển dụng đang mở.
  * `fullName` *(string, bắt buộc)*: Họ và tên ứng viên (≥ 2 ký tự).
  * `email` *(string, bắt buộc)*: Email hợp lệ.
  * `phone` *(string, bắt buộc)*: Số điện thoại (≥ 10 chữ số, định dạng VN).
  * `cvFile` *(File, bắt buộc)*: Tệp CV (.pdf hoặc .docx, tối đa 10MB).
  * `certificates` *(File[], tùy chọn)*: Các tệp bằng cấp, chứng chỉ (.jpg, .png, .pdf ≤ 10MB).
  * `source` *(string, tùy chọn)*: Nguồn tuyển dụng (`CAREER_SITE`, `LINKEDIN`, `REFERRAL`, `HEADHUNTER`).
* **Tiến trình xử lý ngầm tại Backend:**
  1. Rate Limiting (5 requests/10 phút/IP).
  2. Kiểm tra phần mở rộng file và Magic Bytes nhị phân (%PDF- hoặc PK).
  3. Khử trùng lặp 30 ngày cùng Job (BRL-02) và Quota 3 Jobs/90 ngày (BRL-09).
  4. Bóc tách text thô bằng `pdf-parse`.
  5. Gọi Gemini API (`temperature: 0`) đối chiếu tiêu chí JD tính Match Score (BRL-04).
  6. Gộp thông tin vào Candidate (nếu đã tồn tại) hoặc tạo Candidate mới.
  7. Tạo Application ở trạng thái ban đầu là `NEW` trên Kanban.
* **Success Response (HTTP 200):**
  ```json
  {
    "success": true,
    "message": "Hồ sơ ứng tuyển đã được tiếp nhận thành công",
    "applicationId": 42,
    "data": {
      "candidateId": 15,
      "jobId": 1,
      "currentStage": "NEW",
      "aiMatchScore": 85,
      "aiMatchRationale": "Ứng viên có 4 năm kinh nghiệm với React và TypeScript, phù hợp xuất sắc với yêu cầu dự án.",
      "aiMatchedSkills": "[\"React\",\"TypeScript\",\"Next.js\"]",
      "aiMissingSkills": "[\"Docker\"]"
    }
  }
  ```

---

#### 5. `GET /api/applications` — Tra cứu danh sách hồ sơ
* **Mục đích:** HR và Admin lọc danh sách ứng viên phục vụ báo cáo hoặc xem bảng.
* **Query Parameters:**
  * `jobId`: ID công việc hoặc `"ALL"`.
  * `stage`: Cột trạng thái (`NEW`, `SCREENING`, `INTERVIEW`, `HIRED`, `REJECTED`).
  * `source`: Nguồn ứng viên (`LINKEDIN`, `CAREER_SITE`,...).
  * `starred`: `"true"` (chỉ lấy hồ sơ đánh sao).
  * `unviewed`: `"true"` (chỉ lấy hồ sơ chưa mở xem).
  * `unevaluated`: `"true"` (chỉ lấy hồ sơ chưa có Scorecard).
  * `search`: Từ khóa tìm kiếm (tên, email, số điện thoại, kỹ năng).
  * `sortBy`: `"NEWEST"`, `"OLDEST"`, `"STARRED_FIRST"`, `"UNVIEWED_FIRST"`.

---

#### 6. `POST /api/applications/[id]/star` — Đánh dấu sao hồ sơ tiềm năng
* **Mục đích:** HR đánh sao ghim hồ sơ quan trọng hoặc bỏ đánh sao.
* **Success Response (HTTP 200):**
  ```json
  {
    "success": true,
    "isStarred": true,
    "message": "Đã đánh dấu sao hồ sơ ứng viên"
  }
  ```

---

#### 7. `POST /api/applications/[id]/re-parse` — Chạy lại phân tích AI
* **Mục đích:** Kích hoạt lại tiến trình AI bóc tách và chấm điểm khi có cập nhật tiêu chuẩn JD.

---

#### 7A. `PATCH /api/applications/[id]/profile` — Chỉnh sửa & Bổ sung thủ công 5 trường trích xuất hồ sơ
* **Mục đích:** Cho phép HR và Admin sửa lỗi bóc tách text CV (Họ tên, Email, SĐT, Số năm kinh nghiệm, thêm/xóa Kỹ năng) và tự động tính lại đối chiếu kỹ năng so với JD.
* **Yêu cầu phân quyền:** `HR` và `ADMIN` (**Chặn `HIRING_MANAGER` với HTTP 403 — `RBAC-PROFILE-EDIT`**).
* **Request Body:**
  ```json
  {
    "fullName": "Nguyễn Văn Minh",
    "email": "minh.nguyen@gmail.com",
    "phone": "0909123456",
    "experienceYears": 4,
    "skills": ["React", "TypeScript", "Next.js", "PostgreSQL"]
  }
  ```
* **Tác động tự động:** Cập nhật bảng `Candidate`, tự động đối chiếu lại `aiMatchedSkills`, `aiMissingSkills`, `aiMatchScore` theo JD, và ghi nhật ký `AuditLog` (`action: "PROFILE_EDITED"`).

---

### Phân hệ 3: Quản trị Quy trình Tuyển dụng (Kanban Pipeline)

#### 8. `GET /api/pipeline` — Lấy toàn bộ dữ liệu Pipeline
* **Mục đích:** Nạp dữ liệu đồng thời cho 5 cột Kanban Pipeline (`/admin/pipeline`).
* **Query Parameters:** `jobId`, `search`, `starred`, `unviewed`, `sortBy`.
* **Success Response (HTTP 200):**
  ```json
  {
    "success": true,
    "jobs": [ { "id": 1, "title": "Fullstack Developer", "status": "ACTIVE" } ],
    "columns": {
      "NEW": [ ... danh sách Application ... ],
      "SCREENING": [ ... ],
      "INTERVIEW": [ ... ],
      "HIRED": [ ... ],
      "REJECTED": [ ... ]
    }
  }
  ```

---

#### 9. `POST /api/pipeline/move` — Luân chuyển trạng thái thẻ Kanban
* **Mục đích:** Kéo - thả thẻ giữa các cột hoặc cập nhật trạng thái tuyển dụng theo State Machine.
* **Yêu cầu phân quyền (`RBAC-STAGE-LIMIT`):**
  * **`HR`:** Tối đa đến `SCREENING` (`NEW ➔ SCREENING`, `NEW/SCREENING ➔ REJECTED`, `REJECTED ➔ NEW/SCREENING`). **Cấm chuyển sang `INTERVIEW` / `HIRED`.**
  * **`HIRING_MANAGER`:** Phụ trách từ `SCREENING` trở đi (`SCREENING ➔ INTERVIEW`, `INTERVIEW ➔ HIRED`, `SCREENING/INTERVIEW ➔ REJECTED`, `REJECTED ➔ INTERVIEW`). **Cấm can thiệp vòng `NEW`.**
  * **`ADMIN`:** Toàn quyền các chuyển đổi hợp lệ theo State Machine.
* **Request Body:**
  ```json
  {
    "applicationId": 42,
    "toStage": "REJECTED",
    "rejectionReason": "Thiếu kinh nghiệm thực chiến về Node.js và thiết kế CSDL theo yêu cầu JD"
  }
  ```
* **Ràng buộc nghiệp vụ tích hợp (`src/lib/stage-rules.ts`):**
  1. **Cấm nhảy cóc giai đoạn (`BRL-STAGE-ORDER`):** Bắt buộc tuân thủ tuần tự `NEW ➔ SCREENING ➔ INTERVIEW ➔ HIRED`.
  2. **Khóa trạng thái kết thúc (`BRL-STAGE-TERMINAL`):** Không cho phép kéo ngược hồ sơ đã `HIRED`.
  3. **Lý do từ chối bắt buộc (`BRL-11`):** Khi `toStage === "REJECTED"`, bắt buộc truyền `rejectionReason` ≥ 5 ký tự.
  4. **Chốt chặn Stage-Gate (`BRL-06`):** Nếu `toStage === "HIRED"`, bắt buộc có ≥ 01 Scorecard với khuyến nghị đạt (`HIRE` / `STRONG_HIRE`).
  5. **Bộ đệm độ trễ (`BRL-05`):** Tự động gán `emailScheduledAt = Date.now() + 12h` khi vào `REJECTED`; tự động hủy lịch và xóa `rejectionReason` khi phục hồi.
  6. **Kiểm toán (Audit Trail):** Tự động ghi `AuditLog` (`action: "STAGE_CHANGE"`, lưu kèm `reason`).
* **Success Response (HTTP 200):**
  ```json
  {
    "success": true,
    "message": "Đã chuyển hồ sơ sang cột INTERVIEW",
    "data": { "id": 42, "currentStage": "INTERVIEW" }
  }
  ```

---

### Phân hệ 4: Lịch phỏng vấn & Đánh giá Scorecard (Interview & Scorecard)

#### 10. `POST /api/interviews/schedule` & `DELETE /api/interviews/schedule` — Thiết lập, sửa, hủy lịch phỏng vấn
* **Mục đích:** Lên lịch phỏng vấn mới, đổi lịch (Reschedule), hủy lịch hoặc lưu ghi chú trước/sau phỏng vấn.
* **Yêu cầu phân quyền:** `HIRING_MANAGER` và `ADMIN` (chỉ áp dụng khi hồ sơ đang ở `SCREENING` hoặc `INTERVIEW`). **Chặn `HR` xếp/sửa/hủy lịch phỏng vấn (`HTTP 403 — RBAC-STAGE-LIMIT`); HR chỉ có thể cập nhật ghi chú nhanh khi `isQuickNotesUpdate: true`.**
* **Request Body:**
  ```json
  {
    "applicationId": 42,
    "interviewDate": "2026-11-20T09:00:00.000Z",
    "interviewFormat": "ONLINE",
    "interviewLocation": "https://meet.google.com/xyz-recoverx-meet",
    "interviewNotes": "Vui lòng chuẩn bị slide giới thiệu dự án tiêu biểu.",
    "interviewInterviewerNotes": "Lưu ý kiểm tra sâu phần tối ưu cơ sở dữ liệu.",
    "moveToInterviewStage": true
  }
  ```
* **Success Response (HTTP 200):**
  ```json
  {
    "success": true,
    "message": "Đã lên lịch phỏng vấn thành công",
    "data": { ... }
  }
  ```

---

#### 11. `POST /api/scorecards` — Tạo phiếu đánh giá Scorecard chuyên sâu
* **Mục đích:** Giám khảo phỏng vấn nhập điểm 3 tiêu chí trọng số và nhận xét chi tiết.
* **Yêu cầu phân quyền:** HR, Hiring Manager, Admin (đã đăng nhập).
* **Request Body:**
  ```json
  {
    "applicationId": 42,
    "round": "Vòng 1 - Kỹ thuật chuyên môn",
    "technicalScore": 4,
    "communicationScore": 5,
    "culturalFitScore": 4,
    "levelRecommendation": "Middle",
    "recommendation": "HIRE",
    "strengths": "Nắm vững kiến trúc Next.js và tối ưu hóa câu truy vấn SQL; tư duy giải quyết vấn đề mạch lạc.",
    "weaknesses": "Cần làm quen thêm với hạ tầng Docker container của công ty.",
    "technicalNotes": "Trả lời tốt các câu hỏi về React Server Components và cơ chế caching.",
    "communicationNotes": "Giao tiếp tự tin, mạch lạc.",
    "cultureNotes": "Thái độ tích cực, tinh thần học hỏi cao.",
    "hireReason": "Đạt chuẩn yêu cầu kỹ thuật và có thái độ làm việc phù hợp với văn hóa đội ngũ.",
    "comments": "Đồng thuận đề xuất tuyển dụng cho đợt nhận việc tháng tới."
  }
  ```
* **Công thức tính điểm Backend (BRL-08):**
  $$\text{score} = (\text{technicalScore} \times 0.4) + (\text{communicationScore} \times 0.3) + (\text{culturalFitScore} \times 0.3)$$
* **Success Response (HTTP 200):**
  ```json
  {
    "success": true,
    "message": "Đã lưu phiếu đánh giá phỏng vấn thành công",
    "data": {
      "id": 8,
      "score": 4.3,
      "recommendation": "HIRE",
      "evaluatorId": 3
    }
  }
  ```

---

### Phân hệ 5: Kho nhân tài & Dọn dẹp dữ liệu (Talent Pool & Maintenance)

#### 12. `POST /api/talent-pool/cleanup` — Dọn dẹp hồ sơ quá hạn 6 tháng (BRL-10)
* **Mục đích:** Xóa vĩnh viễn (Hard Delete) hồ sơ và file tệp CV ở trạng thái `REJECTED` đã lưu trữ quá 180 ngày.
* **Yêu cầu phân quyền:** Chỉ duy nhất `ADMIN` (HTTP 403 nếu vai trò khác gọi).
* **Request Body (Tùy chọn):**
  ```json
  {
    "days": 180,
    "dryRun": false
  }
  ```
* **Success Response (HTTP 200):**
  ```json
  {
    "success": true,
    "message": "Đã hoàn tất dọn dẹp vĩnh viễn 12 hồ sơ quá hạn 180 ngày theo quy tắc BRL-10",
    "purgedCount": 12
  }
  ```

---

#### 13. `GET /api/export` — Xuất danh sách ứng viên ra file CSV
* **Mục đích:** Xuất dữ liệu tuyển dụng ra tệp CSV hỗ trợ mở trên Microsoft Excel.
* **Đặc tả kỹ thuật:** Phản hồi với `Content-Type: text/csv; charset=utf-8` kèm ký tự **Byte Order Mark (`\uFEFF`)** để hiển thị đúng dấu tiếng Việt trên Excel.

---

### Phân hệ 6: Tra cứu Tiến độ Công khai (Public Tracker)

#### 14. `GET /api/tracker?code={applicationCode}` — Tra cứu tiến độ hồ sơ
* **Mục đích:** Cho phép ứng viên công khai tra cứu tình trạng hồ sơ mà không cần đăng nhập.
* **Bảo mật NFR-SEC-04:** API tự động lọc bỏ các thông tin bảo mật nội bộ:
  * Ẩn `aiMatchScore` (Điểm Match AI).
  * Ẩn `aiMatchRationale` (Giải trình AI).
  * Ẩn `evaluations` (Nhận xét của giám khảo phỏng vấn).
* **Success Response (HTTP 200):**
  ```json
  {
    "success": true,
    "data": {
      "candidateName": "Quốc Khánh Nguyễn",
      "jobTitle": "Fullstack Developer (Node.js & React)",
      "currentStage": "INTERVIEW",
      "stageInfo": {
        "title": "Vòng phỏng vấn chuyên môn",
        "stepIndex": 3,
        "statusColor": "purple",
        "description": "Bạn đã được xếp lịch phỏng vấn vào lúc 09:00 ngày 20/11/2026. Vui lòng kiểm tra email thư mời chi tiết."
      },
      "interview": {
        "date": "2026-11-20T09:00:00.000Z",
        "format": "ONLINE",
        "location": "https://meet.google.com/xyz-recoverx-meet"
      }
    }
  }
  ```
