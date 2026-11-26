---
id: "STAGING-GUIDE-19"
title: "Hướng Dẫn Triển Khai Môi Trường Staging & Kiểm Thử Toàn Diện (Staging Deployment Guide)"
type: "guide"
version: "1.1.0"
status: "approved"
owner: "ATS DevOps & Engineering Team"
domain: "recruitment-ats"
tags:
  - "staging"
  - "deployment"
  - "neon-cloud"
  - "better-auth"
  - "server-only-dal"
  - "security-hardening"
  - "testing"
last_updated: "2026-11-26"
---

# HƯỚNG DẪN TRIỂN KHAI MÔI TRƯỜNG STAGING & KIỂM THỬ TOÀN DIỆN (STAGING DEPLOYMENT GUIDE)
## Dự án: ATS — Applicant Tracking System (Cổng Ứng Tuyển: RecoverX)

> **Mục tiêu tài liệu:**  
> Bản hướng dẫn toàn diện dành cho DevOps, Kỹ sư phần mềm và BA để đưa hệ thống ATS lên môi trường **Staging / Production** an toàn tuyệt đối, chống rò rỉ khóa bí mật, chống quá tải khi truy cập đồng thời, và xác thực 100% kịch bản kiểm thử trước khi lên Live chính thức.

---

## 1. TỔNG QUAN SẴN SÀNG TRIỂN KHAI (STAGING READINESS SUMMARY)

| Tiêu Chí Sẵn Sàng | Chỉ Số Đạt Được | Đánh Giá |
| :--- | :--- | :---: |
| **Độ phủ bộ kiểm thử tự động** | **197 / 197 Kịch bản PASS (100% — 26 Suites)** | ✅ Đạt Tuyệt Đối |
| **Kiểm tra kiểu tĩnh (Type Safety)** | `npx tsc --noEmit` — 0 lỗi | ✅ Đạt |
| **Kiến trúc Tầng Kiểm Soát Truy Cập** | `src/server/dal/` (`import "server-only"`, 14 modules, 22/22 internal APIs) | ✅ Chuẩn Zero-Trust |
| **Kiến trúc Cơ sở dữ liệu Cloud** | Neon Serverless PostgreSQL (`users`, `auth_sessions`, `auth_accounts`...) qua PgBouncer Pooler | ✅ Sẵn Sàng |
| **Lưu trữ Tệp tin Đám mây (Object Storage)** | Neon Object Storage S3 Bucket `uploads` (Private Mode + DAL Auth Proxy) | ✅ Sẵn Sàng |
| **Cơ chế Xác thực & Bảo mật Phiên** | **Better Auth** DB Sessions, PBKDF2-SHA512 (100k iter), `disableSignUp: true`, Strip `x-user-*` | ✅ An Toàn |
| **Chống Vượt Rào Mệnh Lệnh (AI Guardrail)** | Thẻ XML `<candidate_cv_raw_text>` cô lập văn bản CV thô khỏi hệ thống lệnh | ✅ An Toàn |
| **Kiểm soát Tải & Chống Spam** | Rate Limiter chống spam theo IP (HTTP 429) & Anti-SSRF Webhook | ✅ Sẵn Sàng |
| **Bảo mật Kho Mã Nguồn (Repo Integrity)** | `.env`, `.env*.local`, `backups/` đã được loại bỏ hoàn toàn khỏi Git index | ✅ An Toàn |

---

## 2. KIẾN TRÚC HẠ TẦNG MÔI TRƯỜNG STAGING (STAGING INFRASTRUCTURE)

```mermaid
flowchart TB
    subgraph USERS ["NGƯỜI DÙNG"]
        CANDIDATES["Ứng viên Công khai<br>(Web Browser)"]
        INTERNAL["HR, Hiring Manager & Admin<br>(ATS Console)"]
    end

    subgraph HOSTING ["APP HOSTING (Vercel Serverless)"]
        direction TB
        MIDDLEWARE["Edge Middleware (src/middleware.ts)<br>(UX Cookie Redirect Hint & Strip x-user-* Headers)"]
        NEXT_APP["Next.js 14 App Router<br>(Protected Route Group & Thin API Handlers)"]
        DAL["Server-Only DAL (src/server/dal/)<br>(Better Auth Session + 24 RBAC Permissions + Stage Gates)"]
        PROXY_ROUTE["Storage Proxy Route<br>(/api/applications/storage/[...key])"]
        AI_MODULE["Hybrid AI Module<br>(pdf-parse + mammoth + Gemini @ temp:0)"]
    end

    subgraph NEON_CLOUD ["NEON SERVERLESS CLOUD (ap-southeast-1)"]
        direction TB
        POSTGRES_POOLER[("Neon PostgreSQL Pooler<br>(users, auth_sessions, auth_accounts, jobs, applications...)")]
        POSTGRES_DIRECT[("Direct Database<br>(Prisma Schema Migration)")]
        NEON_S3[("Neon Object Storage<br>Bucket: 'uploads' (Private)")]
    end

    subgraph EXTERNAL_SERVICES ["DỊCH VỤ NGOÀI"]
        GEMINI_API["Google Gemini AI API<br>(gemini-2.5-flash)"]
        N8N_ENGINE["n8n Automation Engine<br>(Gmail 12h, Telegram Alert, GCalendar)"]
    end

    CANDIDATES -->|HTTPS nộp đơn / tra cứu| NEXT_APP
    INTERNAL -->|HTTPS đăng nhập / điều phối| MIDDLEWARE
    MIDDLEWARE --> NEXT_APP
    NEXT_APP --> DAL
    DAL -->|Query qua PgBouncer| POSTGRES_POOLER
    DAL -->|Tải & đọc tệp CV đã xác thực| PROXY_ROUTE
    PROXY_ROUTE -->|S3 Protocol| NEON_S3
    AI_MODULE -->|Phân tích ngữ nghĩa| GEMINI_API
    DAL -->|Signed Webhooks| N8N_ENGINE
```

---

## 3. DANH MỤC BIẾN MÔI TRƯỜNG BẮT BUỘC (STAGING ENV CONFIGURATION)

Khi thiết lập trên Vercel hoặc máy chủ Docker, cấu hình đầy đủ các biến môi trường sau trong bảng điều khiển **Environment Variables** (không commit tệp `.env` vào Git):

```bash
# 1. Cơ sở dữ liệu Neon PostgreSQL (Có Connection Pool qua PgBouncer)
DATABASE_URL="postgresql://username:your_password@ep-sample-pooler.c-5.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

# 2. Cơ sở dữ liệu trực tiếp (dùng cho Prisma db push / migrate deploy)
DATABASE_URL_UNPOOLED="postgresql://username:your_password@ep-sample.c-5.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

# 3. Khóa Google Gemini API (Lớp 2 AI Matching & Semantic Analysis)
GEMINI_API_KEY="AIzaSyYourGeminiApiKeyHere"

# 4. Chuỗi bí mật ký phiên Better Auth (BẮT BUỘC trên Production, khuyến nghị 64 hex chars)
# Sinh tự động bằng lệnh: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
BETTER_AUTH_SECRET="your_random_32_bytes_hex_secret_here"
SESSION_SECRET="your_random_32_bytes_hex_secret_here"

# 5. Tên miền ứng dụng trên Staging/Production (Public URL)
NEXT_PUBLIC_APP_URL="https://your-ats-domain.vercel.app"
BETTER_AUTH_URL="https://your-ats-domain.vercel.app"

# 6. Neon Object Storage (S3-Compatible Bucket `uploads`)
AWS_ACCESS_KEY_ID="your_neon_s3_key_id"
AWS_SECRET_ACCESS_KEY="your_neon_s3_secret_key"
AWS_ENDPOINT_URL_S3="https://your-branch-id.storage.c-5.ap-southeast-1.aws.neon.tech"
AWS_REGION="ap-southeast-1"

# 7. Khóa ký Webhook n8n
N8N_WEBHOOK_SECRET="your_random_webhook_secret_here"
```

---

## 4. QUY TRÌNH TRIỂN KHAI TỪNG BƯỚC (STEP-BY-STEP DEPLOYMENT)

### Bước 1: Đồng bộ Cấu trúc Bảng Cơ Sở Dữ Liệu
Trên máy phát triển hoặc thông qua CI/CD Pipeline, chạy lệnh đẩy lược đồ Prisma sang Neon PostgreSQL:
```bash
npx prisma db push
```
*Lưu ý:* Toàn bộ các bảng Better Auth (`auth_sessions`, `auth_accounts`, `auth_verifications`) dùng khóa chính `Int` tự tăng (`serial`) cùng các cột nghiệp vụ (`screeningQuestions`, `knockoutFailed`, `approvedById`, `targetHeadcount`, `maxActiveInterviews`) sẽ được đồng bộ an toàn mà không làm đứt khóa ngoại `users.id`.

### Bước 2: Khởi tạo Dữ liệu Mẫu hoặc Backfill Tài khoản Better Auth
```bash
npm run db:seed
# Nếu nâng cấp trên CSDL đã có sẵn bảng users cũ:
npx ts-node --compiler-options "{\"module\":\"CommonJS\"}" prisma/backfill-better-auth.ts
```
*Tài khoản mặc định được khởi tạo:*
1. **Admin:** `admin@ats.vn` / `Admin@123456` (Quyền cao nhất: cấu hình hệ thống, tạo user).
2. **HR Lead:** `hr@ats.vn` / `Hr@123456` (Quyền tiếp nhận, sàng lọc, chỉnh sửa 5 trường CV).
3. **Hiring Manager:** `manager@ats.vn` / `Manager@123456` (Quyền phỏng vấn, tạo phiếu đánh giá, duyệt tuyển).

### Bước 3: Build & Kiểm tra Khởi động Ứng dụng
```bash
npm run build
npm run start
```
*Xác nhận:*
* Cổng mạng mặc định `3000` mở và phản hồi mã HTTP 200 tại đường dẫn `/`.
* Không có cảnh báo `SECURITY WARNING: SESSION_SECRET is not set`.

---

## 5. BẢNG KIỂM TRA AN NINH & BẢO VỆ CHỐNG TẤN CÔNG (SECURITY AUDIT CHECKLIST)

| Nguy Cơ Tấn Công | Giải Pháp Đã Hiện Thực Hóa Trong Mã Nguồn | Kiểm Thử Xác Thực |
| :--- | :--- | :---: |
| **Chôm Khóa API / Token AI** | Toàn bộ cuộc gọi Google Gemini và Neon Storage đều thực thi ở Server-Side. Không bao giờ lộ `GEMINI_API_KEY` hay `AWS_SECRET_ACCESS_KEY` trên client bundle. | Test Suite 21 PASS |
| **Vượt rào Mệnh lệnh (Prompt Injection)** | Toàn bộ nội dung CV người dùng nộp được đóng gói trong thẻ XML `<candidate_cv_raw_text>`. Hệ thống prompt có chỉ thị cấm thực thi bất kỳ mệnh lệnh nào trong CV. | Test Suite 21 PASS |
| **Giả mạo Quyền hạn & Bypass Middleware** | Xác thực phiên qua **Better Auth** đối soát bảng `auth_sessions` & `users.isActive` bên trong `src/server/dal/` (`import "server-only"`), gỡ bỏ `x-user-*` header injection tại Edge Middleware (CVE-2025-29927). | Test Suite 25 & 26 PASS |
| **Thu thập Dữ liệu Trái phép (PII CV Scraping)** | Bucket `uploads` của Neon ở chế độ Private. Chỉ người dùng nội bộ có phiên Better Auth hợp lệ (`applications:cv:read`) mới xem được CV qua `/api/applications/storage/[...key]` (đã gỡ bypass `Referer`). | Test Suite 20 & 26 PASS |
| **Tấn công Vượt cấp Thư mục (Path Traversal)** | Endpoint Storage kiểm tra và từ chối các chuỗi chứa `..` hoặc `\\` bằng HTTP 400. | Test Suite 20 PASS |
| **Tấn công Từ chối Dịch vụ (Spam / DDoS nộp đơn)** | Rate Limiter giới hạn tối đa 10 lượt nộp / 10 phút trên mỗi IP. Vượt ngưỡng lập tức trả về HTTP 429 Too Many Requests. | Test Suite 19 PASS |
| **Tải lên Mã độc (Malware Upload)** | Kiểm tra kép: Đuôi tệp mở rộng (`.pdf`, `.docx`) + Phân tích Magic Bytes phần đầu tệp nhị phân (`%PDF`, `PK\x03\x04`). Chặn đứng các tệp thực thi `.exe`, `.sh`, `.php`. | Test Suite 19 PASS |

---

## 6. KỊCH BẢN KIỂM THỬ KHÓI SAU KHI LÊN STAGING (POST-DEPLOY SMOKE TEST)

Sau khi deploy lên domain Staging, thực hiện kịch bản kiểm thử khói 7 bước:

1. **Bước 1 (Nộp đơn công khai):** Truy cập `/jobs`, chọn 1 vị trí tuyển dụng, tải lên 1 tệp CV PDF hợp lệ. Xác nhận nhận được Mã Tra Cứu (Application Code, ví dụ `APP-2026-XXXX`).
2. **Bước 2 (Tra cứu tiến độ):** Truy cập `/jobs/tracker`, nhập mã tra cứu. Xác nhận hiển thị tiến độ vòng nộp hồ sơ, không để lộ điểm AI hay nhận xét nội bộ.
3. **Bước 3 (Đăng nhập nội bộ):** Truy cập `/admin/login`, đăng nhập với tài khoản `hr@ats.vn`. Xác nhận vào thẳng `/admin/dashboard` và thấy hiển thị thương hiệu `ATS — Applicant Tracking System`.
4. **Bước 4 (Sàng lọc Kanban):** Mở `/admin/pipeline`, mở Drawer ứng viên vừa nộp. Xác nhận CV gốc hiển thị trong tab CV, điểm AI phân tầng 3 màu chính xác. Kéo thẻ sang cột `SCREENING`.
5. **Bước 5 (Xếp lịch phỏng vấn):** Chuyển sang tab Lịch Phỏng Vấn trong Drawer. Thiết lập hình thức Online (Google Meet) hoặc Offline tại Văn phòng. Xác nhận tạo thư mời thành công.
6. **Bước 6 (Chấm điểm Scorecard):** Đăng nhập bằng tài khoản `manager@ats.vn`, vào tab Đánh giá Scorecard, chấm điểm 3 tiêu chí (Chuyên môn 40%, Giao tiếp 30%, Văn hóa 30%). Xác nhận điểm trung bình tính đúng công thức và có huy hiệu "Đủ điều kiện Tuyển chọn".
7. **Bước 7 (Chốt tuyển / Lưu trữ):** Kéo hồ sơ sang `HIRED` (thành công) hoặc `REJECTED` (nhập lý do từ chối `BRL-11` thành công).
