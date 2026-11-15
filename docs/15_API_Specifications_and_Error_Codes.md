# ĐẶC TẢ API CHÍNH & DANH MỤC MÃ LỖI (API SPECIFICATIONS & ERROR CODES)

> **Dự án:** ReCoverX Career — Applicant Tracking System (ATS)  
> **Phiên bản tài liệu:** v1.0  
> **Kiến trúc:** Next.js 14 App Router Route Handlers (`src/app/api/`) + TypeScript + Prisma ORM  

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
| **`BRL-06`** | `400 Bad Request` | "Chưa thể tuyển chọn: Cần có ít nhất 01 phiếu đánh giá Scorecard hoàn tất từ người phỏng vấn chuyên môn trước khi xác nhận tuyển." | Chốt chặn Stage-Gate: Chặn kéo sang `HIRED` khi chưa có Scorecard hợp lệ. |
| **`RBAC-MGR-BLOCK`** | `403 Forbidden` | "Quản lý chuyên môn (Hiring Manager) chỉ có quyền xem hồ sơ và đánh giá Scorecard; quyền luân chuyển trạng thái do bộ phận Tuyển dụng (HR) phụ trách." | Phân quyền RBAC Mục 13: Chặn Hiring Manager kéo-thả chuyển cột Kanban tại `POST /api/pipeline/move`. |
| **`RBAC-SCHED-BLOCK`**| `403 Forbidden` | "Quản lý chuyên môn (Hiring Manager) chỉ có quyền xem lịch và đánh giá, không được xếp/sửa lịch phỏng vấn theo quy chuẩn RBAC." | Chặn Hiring Manager lên lịch/đổi lịch/hủy lịch tại `POST /api/interviews/schedule`. |
| **`RBAC-PURGE-BLOCK`**| `403 Forbidden` | "Truy cập bị từ chối: Chỉ Quản trị viên (Admin) mới có quyền thực thi tác vụ dọn dẹp vòng đời hồ sơ BRL-10." | Chặn HR và Manager gọi lệnh xóa vĩnh viễn tại `POST /api/talent-pool/cleanup`. |
| **`AUTH_INVALID_CRED`**| `401 Unauthorized` | "Mật khẩu không chính xác. Vui lòng kiểm tra lại." | Xác thực đăng nhập thất bại qua PBKDF2 tại `POST /api/auth/login`. |
| **`AUTH_USER_LOCKED`** | `403 Forbidden` | "Tài khoản của bạn đã bị Quản trị viên tạm khóa. Vui lòng liên hệ Admin." | Tài khoản có `isActive = false` không được phép đăng nhập. |
| **`NOT_FOUND`** | `404 Not Found` | "Không tìm thấy hồ sơ ứng tuyển này" / "Vị trí tuyển dụng không tồn tại" | Truy vấn ID không tồn tại trong cơ sở dữ liệu. |
| **`INTERNAL_ERROR`** | `500 Server Error` | "Lỗi hệ thống khi xử lý yêu cầu. Vui lòng thử lại sau." | Lỗi bắt ngoại lệ (Catch Exception) ở tầng máy chủ. |

---

## 3. ĐẶC TẢ CHI TIẾT CÁC ĐIỂM CUỐI API CHÍNH (CORE API ENDPOINTS)

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

### Phân hệ 3: Quản trị Quy trình Tuyển dụng (Kanban Pipeline)

#### 8. `GET /api/pipeline` — Lấy toàn bộ dữ liệu Pipeline
* **Mục đích:** Nạp dữ liệu đồng thời cho 5 cột Kanban Pipeline (`/admin/pipeline`).
* **Query Parameters:** `jobId`, `search`, `starred`, `unviewed`, `sortBy`.
* **Success Response (HTTP 200):**
  ```json
  {
    "success": true,
    "jobs": [ { "id": 1, "title": "Fullstack Developer", "status": "ACTIVE" } ],
    "pipeline": {
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
* **Mục đích:** Kéo - thả thẻ giữa các cột hoặc cập nhật trạng thái tuyển dụng.
* **Yêu cầu phân quyền:** HR và Admin. **Cấm Hiring Manager (RBAC-MGR-BLOCK).**
* **Request Body:**
  ```json
  {
    "applicationId": 42,
    "toStage": "INTERVIEW"
  }
  ```
* **Ràng buộc nghiệp vụ tích hợp:**
  1. **Chốt chặn Stage-Gate BRL-06:** Nếu `toStage === "HIRED"` và `app.evaluations.length === 0` ➔ Báo lỗi HTTP 400.
  2. **Bộ đệm độ trễ BRL-05:**
     * Khi `toStage === "REJECTED"`: Tự động gán `emailScheduledAt = Date.now() + 12h`.
     * Khi kéo thẻ rời khỏi `REJECTED`: Tự động hủy lịch `emailScheduledAt = null`.
  3. **Kiểm toán (Audit Trail):** Tự động tạo bản ghi `AuditLog` với `action: "STAGE_CHANGE"`.
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

#### 10. `POST /api/interviews/schedule` — Thiết lập, sửa, hủy lịch phỏng vấn
* **Mục đích:** Lên lịch phỏng vấn mới, đổi lịch (Reschedule), hủy lịch hoặc lưu ghi chú trước/sau phỏng vấn.
* **Yêu cầu phân quyền:** HR và Admin. **Chặn Hiring Manager (HTTP 403).**
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
    "message": "Đã xác nhận và tạo thư mời phỏng vấn thành công",
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
