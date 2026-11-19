---
id: "DIAG-03-ERD"
title: "Mô Hình Thực Thể Dữ Liệu Cơ Sở Dữ Liệu (Database ERD)"
type: "database-erd-diagram"
version: "2.1.0"
status: "approved"
owner: "ATS Lead System Architect & Database Lead"
format: "Mermaid erDiagram (.mmd)"
tools:
  - "Mermaid Live Editor (https://mermaid.live)"
  - "DBeaver / DataGrip (Database IDE)"
last_updated: "2026-11-19"
---

# SƠ ĐỒ 03: MÔ HÌNH THỰC THỂ DỮ LIỆU CƠ SỞ DỮ LIỆU (DATABASE ERD)

> **Hệ thống:** ATS — Applicant Tracking System  
> **Tệp mã nguồn Mermaid:** [`docs/diagrams/03_database_erd.mmd`](file:///d:/ATS%20project/docs/diagrams/03_database_erd.mmd)  
> **Cơ sở dữ liệu hỗ trợ:** Neon Serverless PostgreSQL (Production) / SQLite (Local Dev).  
> **Tiêu chuẩn chuẩn hóa:** Chuẩn 3NF, Phân rã quan hệ qua Khóa ngoại (`FK`), Phân loại bảo mật PII.

---

## 1. Hướng Dẫn Mở & Xuất Ảnh Đẹp / Sắc Nét

Tệp mã nguồn Mermaid chuẩn hóa tại [`03_database_erd.mmd`](file:///d:/ATS%20project/docs/diagrams/03_database_erd.mmd) tuân thủ hoàn toàn cú pháp Crow's Foot ERD của Mermaid:

### Các bước xuất file ảnh:
1. Mở trang web: **[https://mermaid.live](https://mermaid.live)**.
2. Sao chép toàn bộ nội dung tệp [`03_database_erd.mmd`](file:///d:/ATS%20project/docs/diagrams/03_database_erd.mmd) và dán vào ô **Code** bên trái.
3. Khung bên phải sẽ kết xuất biểu đồ thực thể với đầy đủ liên kết, kiểu dữ liệu và chú thích nghiệp vụ.
4. Nhấn **Actions ➔ Download SVG** để tải ảnh vector độ phân giải cao hoặc **Download PNG** để chèn vào tài liệu kỹ thuật.

---

## 2. Bản Vẽ Trực Quan (Mermaid Database ERD)

```mermaid
erDiagram
    USERS ||--o{ JOBS : "creates / manages"
    USERS ||--o{ EVALUATIONS : "scores (Scorecard)"
    USERS ||--o{ AUDIT_LOGS : "performs action"

    JOBS ||--o{ APPLICATIONS : "receives"
    CANDIDATES ||--o{ APPLICATIONS : "submits"

    APPLICATIONS ||--o{ EVALUATIONS : "evaluated by"
    APPLICATIONS ||--o{ AUDIT_LOGS : "tracked in"

    USERS {
        int id PK
        string full_name
        string email UK
        string password_hash
        string role
        boolean is_active
        timestamp created_at
    }

    JOBS {
        int id PK
        int creator_id FK
        string title
        string department
        string location
        string employment_type
        text requirements_jd
        int min_experience_years
        string required_skills
        int target_headcount
        int max_active_interviews
        string status
        timestamp created_at
    }

    CANDIDATES {
        int id PK
        string full_name
        string email UK
        string phone UK
        string cv_extracted_name
        string cv_extracted_email
        string cv_extracted_phone
        string cv_file_hash
        int experience_years
        string parsed_skills
        string parsed_education
        string parsed_experience
        string certificates
        string cv_file_url
        text cv_text
        timestamp created_at
    }

    APPLICATIONS {
        int id PK
        int candidate_id FK
        int job_id FK
        string source
        string current_stage
        float ai_match_score
        text ai_match_rationale
        string ai_matched_skills
        string ai_missing_skills
        timestamp stage_updated_at
        timestamp email_scheduled_at
        boolean is_email_sent
        boolean is_interview_invite_sent
        boolean is_telegram_notified
        int repooled_from_id
        boolean is_starred
        boolean is_viewed
        timestamp viewed_at
        timestamp interview_date
        string interview_format
        string interview_location
        text interview_notes
        text interview_interviewer_notes
        text interview_post_notes
        string interview_email_option
        string custom_email_subject
        text custom_email_body
        string rejection_reason
        string contact_mismatch_level
        string contact_mismatch_note
        int duplicate_warning_app_id
        string duplicate_warning_note
        timestamp created_at
    }

    EVALUATIONS {
        int id PK
        int application_id FK
        int evaluator_id FK
        string round
        int technical_score
        int communication_score
        int cultural_fit_score
        float overall_score
        string recommendation
        string level_recommendation
        text strengths
        text weaknesses
        text technical_notes
        text communication_notes
        text culture_notes
        timestamp created_at
    }

    AUDIT_LOGS {
        int id PK
        int application_id FK
        int user_id FK
        string from_stage
        string to_stage
        string action
        text reason
        timestamp created_at
    }
```

---

## 3. Ma Trận Quan Hệ & Bản Số Thực Thể (Cardinality Matrix)

| Thực Thể Gốc | Ký Hiệu Lực Lượng | Thực Thể Đích | Khóa Ngoại (Foreign Key) | Ý Nghĩa Nghiệp Vụ |
| :--- | :---: | :--- | :--- | :--- |
| **USERS** | `1` ➔ `0..N` | **JOBS** | `jobs.creator_id` ➔ `users.id` | Một nhân sự nội bộ (HR/Admin) có thể tạo và quản lý nhiều tin tuyển dụng. |
| **USERS** | `1` ➔ `0..N` | **EVALUATIONS** | `evaluations.evaluator_id` ➔ `users.id` | Một giám khảo (Hiring Manager) có thể thực hiện nhiều phiếu chấm Scorecard. |
| **USERS** | `1` ➔ `0..N` | **AUDIT_LOGS** | `audit_logs.user_id` ➔ `users.id` | Ghi vết hành động của người dùng (kéo thả, cập nhật, chấm điểm). |
| **JOBS** | `1` ➔ `0..N` | **APPLICATIONS** | `applications.job_id` ➔ `jobs.id` | Một tin tuyển dụng có thể nhận được nhiều hồ sơ ứng tuyển từ các ứng viên khác nhau. |
| **CANDIDATES** | `1` ➔ `0..N` | **APPLICATIONS** | `applications.candidate_id` ➔ `candidates.id` | Một ứng viên duy nhất (Email + SĐT) có thể có nhiều phiên ứng tuyển ở các Job khác nhau. |
| **APPLICATIONS**| `1` ➔ `0..N` | **EVALUATIONS** | `evaluations.application_id` ➔ `applications.id` | Một hồ sơ ứng tuyển có thể nhận được nhiều phiếu đánh giá qua các vòng phỏng vấn. |
| **APPLICATIONS**| `1` ➔ `0..N` | **AUDIT_LOGS** | `audit_logs.application_id` ➔ `applications.id` | Toàn bộ lịch sử vòng đời của một hồ sơ được ghi vết tuần tự trong Audit Trail. |

---

## 4. Từ Điển Dữ Liệu & Phân Loại Bảo Mật Thông Tin Cá Nhân (PII)

Hệ thống tuân thủ chặt chẽ nguyên tắc bảo vệ thông tin cá nhân (PII - Personally Identifiable Information):

| Bảng Thực Thể | Tên Trường (Field) | Kiểu Dữ Liệu | Ràng Buộc | Phân Loại PII | Quy Tắc Nghiệp Vụ & Cơ Chế Bảo Vệ |
| :--- | :--- | :--- | :---: | :---: | :--- |
| `candidates` | `full_name` | `VARCHAR(255)` | `NOT NULL` | **High PII** | Nguồn chân lý định danh (Source of Truth). |
| `candidates` | `email` | `VARCHAR(255)` | `UNIQUE` | **High PII** | Khử trùng lặp cùng với SĐT trong vòng 30 ngày (`BRL-02`). |
| `candidates` | `phone` | `VARCHAR(50)` | `UNIQUE` | **High PII** | Chuẩn hóa định dạng số điện thoại Việt Nam (`+84` / `0x`). |
| `candidates` | `cv_file_hash` | `VARCHAR(64)` | `NULLABLE` | Tech Hash | Băm SHA-256 nội dung tệp CV để phát hiện ứng tuyển trùng tệp (`BRL-12`). |
| `candidates` | `cv_file_url` | `VARCHAR(500)` | `NOT NULL` | Private File | Lưu trữ an toàn trên Neon Object Storage, truy cập qua Signed Proxy. |
| `applications`| `current_stage` | `VARCHAR(50)` | `DEFAULT 'NEW'` | Business State| Quản lý 5 trạng thái Kanban: `NEW`, `SCREENING`, `INTERVIEW`, `HIRED`, `REJECTED`. |
| `applications`| `ai_match_score`| `FLOAT` | `NULLABLE` | System Metric | Điểm đối chiếu JD theo mô hình 3 mức đèn giao thông. |
| `applications`| `is_interview_invite_sent` | `BOOLEAN` | `DEFAULT FALSE` | Auto Flag | **Workflow 1:** Cờ xác nhận đã gửi thư mời và đồng bộ lịch tự động. |
| `applications`| `is_telegram_notified` | `BOOLEAN` | `DEFAULT FALSE` | Auto Flag | **Workflow 2:** Cờ xác nhận đã bắn tin thông báo cho HR qua Telegram. |
| `applications`| `is_email_sent` | `BOOLEAN` | `DEFAULT FALSE` | Auto Flag | **Workflow 3:** Cờ xác nhận đã gửi thư từ chối sau đệm hoãn 12 giờ. |
| `applications`| `email_scheduled_at` | `TIMESTAMP` | `NULLABLE` | Timer Buffer | Thời điểm kích hoạt gửi thư từ chối sau đệm hoãn 12 giờ (`BRL-05`). |
| `evaluations` | `overall_score` | `FLOAT` | `NULLABLE` | Decision Gate | Điểm trung bình trọng số: Kỹ thuật (40%), Giao tiếp (30%), Văn hóa (30%) (`BRL-08`). |
| `evaluations` | `recommendation`| `VARCHAR(50)` | `NOT NULL` | Decision Gate | Bắt buộc có kết quả đánh giá hợp lệ trước khi được chuyển sang `HIRED` (`BRL-06`). |
