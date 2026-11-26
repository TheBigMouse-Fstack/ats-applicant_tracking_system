# Feature Spec: ATS-002 Data Access Layer (DAL) & Better Auth Migration

- **Status:** Verified
- **Owner:** Principal Full-Stack Architect / Product Owner
- **Target Layer:** `src/server/dal/` | `src/lib/auth.ts` | `src/app/api/` | `src/app/admin/layout.tsx` | `src/middleware.ts` | `prisma/schema.prisma`

## 1. Objective & Out-of-Scope
- **Goal:** Thay thế cơ chế cookie HMAC tự viết bằng **Better Auth** (self-managed qua Prisma Adapter trên Neon PostgreSQL, giữ nguyên khóa chính `User.id` kiểu `Int` và tương thích mật khẩu băm `PBKDF2` hiện có), đồng thời cô lập toàn bộ 17 API routes nội bộ và `AdminLayout` sau tầng **Data Access Layer (`src/server/dal/`)** gắn `import "server-only"` để kiểm soát tập trung Session, RBAC (`ADMIN` / `HR` / `HIRING_MANAGER`) và các chốt chặn nghiệp vụ (`BRL-06`, `BRL-11`, `BRL-15`, `BRL-17`).
- **Out-of-Scope:**
  - Xác thực cho ứng viên bên ngoài (cổng tuyển dụng công khai `/`, `/jobs`, `/jobs/tracker` giữ nguyên cơ chế không tài khoản).
  - OAuth mạng xã hội (Google/GitHub/Microsoft), Magic Link, Email OTP, Passkey hoặc MFA/2FA.
  - Thay đổi công thức chấm điểm AI (`60% Kỹ năng + 40% Kinh nghiệm`) hoặc cấu trúc prompt Gemini.
  - Thiết kế lại giao diện Admin, bảng kéo thả Kanban hoặc gỡ bỏ `DemoRoleBar` / nút đăng nhập nhanh 3 vai trò.
  - Đổi kiểu khóa chính `User.id` từ `Int` sang `String`/`UUID` làm đứt gãy khóa ngoại hiện hữu (`jobs`, `evaluations`, `audit_logs`).

## 2. Data Contract (Prisma + Zod)

### 2.1. Prisma Schema Changes (`prisma/schema.prisma`)
Giữ nguyên toàn bộ cột và khóa ngoại `Int` trên `Job`, `Candidate`, `Application`, `Evaluation`, `AuditLog`. Mở rộng `User` và bổ sung 3 bảng chuẩn của Better Auth sử dụng khóa chính tự tăng (`Int @id @default(autoincrement())` tương ứng cấu hình `advanced.database.generateId: "serial"`):

- **`User` (`@@map("users")`):**
  - Giữ nguyên: `id Int @id @default(autoincrement())`, `fullName String` (ánh xạ với `user.fields.name = "fullName"` của Better Auth), `email String @unique`, `phone String?`, `role String @default("HR")` (`ADMIN` | `HR` | `HIRING_MANAGER`), `isActive Boolean @default(true)`, `createdAt DateTime @default(now())`, cùng các quan hệ `jobs`, `evaluations`, `auditLogs`.
  - Cập nhật: `passwordHash String?` (chuyển sang nullable để tương thích khi tạo credential qua bảng `Account`, giữ dữ liệu cũ để backfill không gián đoạn).
  - Thêm mới:
    - `emailVerified Boolean @default(false)`
    - `image String?`
    - `updatedAt DateTime @default(now()) @updatedAt`
    - Quan hệ: `sessions Session[]`, `accounts Account[]`
- **`Session` (`@@map("sessions")`):**
  - `id Int @id @default(autoincrement())`
  - `expiresAt DateTime`
  - `token String @unique`
  - `createdAt DateTime @default(now())`
  - `updatedAt DateTime @updatedAt`
  - `ipAddress String?`
  - `userAgent String?`
  - `userId Int` — FK `User @relation(fields: [userId], references: [id], onDelete: Cascade)`
  - Index: `@@index([userId])`
- **`Account` (`@@map("accounts")`):**
  - `id Int @id @default(autoincrement())`
  - `accountId String`
  - `providerId String` (giá trị `"credential"` cho đăng nhập Email/Password)
  - `userId Int` — FK `User @relation(fields: [userId], references: [id], onDelete: Cascade)`
  - `accessToken String?`, `refreshToken String?`, `idToken String?`
  - `accessTokenExpiresAt DateTime?`, `refreshTokenExpiresAt DateTime?`, `scope String?`
  - `password String?` (lưu chuỗi băm có salt `pbkdf2$100000$<salt>$<hash>`)
  - `createdAt DateTime @default(now())`, `updatedAt DateTime @updatedAt`
  - Constraints & Indexes: `@@unique([providerId, accountId])`, `@@index([userId])`
- **`Verification` (`@@map("verifications")`):**
  - `id Int @id @default(autoincrement())`
  - `identifier String`
  - `value String`
  - `expiresAt DateTime`
  - `createdAt DateTime @default(now())`, `updatedAt DateTime @updatedAt`
  - Index: `@@index([identifier])`

### 2.2. Better Auth Configuration & Safe User Migration (`src/lib/auth.ts`)
- **Packages bổ sung:** `better-auth`, `server-only`, `zod`.
- **Cấu hình `betterAuth`:**
  - `database`: `prismaAdapter(prisma, { provider: "postgresql" })`
  - `advanced.database.generateId`: `"serial"` (đồng bộ khóa chính `Int` với PostgreSQL sequence)
  - `secret`: đọc từ `process.env.BETTER_AUTH_SECRET || process.env.SESSION_SECRET` (bắt buộc ném lỗi khởi tạo nếu thiếu khi `NODE_ENV === "production"`; dev/test chỉ dùng hằng số nội bộ trong `src/lib/auth.ts`).
  - `baseURL`: `process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"`
  - `emailAndPassword`:
    - `enabled: true`
    - `disableSignUp: true` (chặn tuyệt đối `POST /api/auth/sign-up/email` công khai; chỉ `ADMIN` được cấp tài khoản qua DAL)
    - `minPasswordLength: 8`
    - `password: { hash, verify }`: sử dụng `PBKDF2-SHA512` (100,000 vòng lặp, salt ngẫu nhiên 16 bytes, so sánh bằng `crypto.timingSafeEqual`). Tuyệt đối không so sánh mật khẩu plaintext.
  - `user`:
    - `fields: { name: "fullName" }`
    - `additionalFields`: `role` (`string`, default `"HR"`, `input: false`), `isActive` (`boolean`, default `true`, `input: false`), `phone` (`string`, `required: false`, `input: false`).
- **Chiến lược Migration / Backfill không gián đoạn:**
  1. Hàm idempotent `ensureCredentialAccountForUser(userId)` tự động đồng bộ `users.passwordHash` (nếu bắt đầu bằng `pbkdf2$`) sang bản ghi `Account(providerId: "credential", accountId: String(user.id))` khi tài khoản cũ đăng nhập lần đầu hoặc chạy script đồng bộ.
  2. Script `scripts/migrate-better-auth-accounts.ts` và `prisma/seed.ts` tạo/cập nhật đầy đủ bản ghi `User` + `Account` băm `PBKDF2` thật cho 3 tài khoản vai trò chuẩn (`admin@ats.vn`, `hr@ats.vn`, `manager@ats.vn`) và các tài khoản seed mẫu (xóa bỏ hoàn toàn chuỗi giả `"hashed_password_123"`).

### 2.3. Zod Input/Output Schemas (`src/server/dal/schemas.ts`)
- `LoginSchema`: `{ email: z.string().trim().email(), password: z.string().min(1) }`
- `ChangePasswordSchema`: `{ currentPassword: z.string().min(1), newPassword: z.string().min(8), confirmPassword: z.string().min(1) }` (refine `newPassword === confirmPassword` và `newPassword !== currentPassword`)
- `CreateUserSchema`: `{ fullName: z.string().trim().min(1), email: z.string().trim().email(), phone: z.string().optional().nullable(), password: z.string().min(8), role: z.enum(["ADMIN", "HR", "HIRING_MANAGER"]).default("HR") }`
- `UpdateUserSchema`: `{ userId: z.coerce.number().int().positive(), fullName: z.string().trim().min(1).optional(), email: z.string().trim().email().optional(), phone: z.string().optional().nullable(), role: z.enum(["ADMIN", "HR", "HIRING_MANAGER"]).optional(), isActive: z.boolean().optional(), newPassword: z.string().min(8).optional() }`
- `MoveStageSchema`: `{ applicationId: z.coerce.number().int().positive(), toStage: z.enum(["NEW", "SCREENING", "INTERVIEW", "OFFER", "HIRED", "REJECTED"]), rejectionReason: z.string().optional().nullable(), note: z.string().optional().nullable(), forceInterviewCapOverride: z.boolean().optional() }`
- `CreateScorecardSchema`: `{ applicationId: z.coerce.number().int().positive(), round: z.string().optional(), technicalScore: z.coerce.number().int().min(1).max(5), communicationScore: z.coerce.number().int().min(1).max(5), culturalFitScore: z.coerce.number().int().min(1).max(5), recommendation: z.enum(["STRONG_HIRE", "HIRE", "NO_HIRE", "STRONG_NO_HIRE"]), levelRecommendation: z.string().optional(), strengths: z.string().optional().nullable(), weaknesses: z.string().optional().nullable(), technicalNotes: z.string().optional().nullable(), communicationNotes: z.string().optional().nullable(), cultureNotes: z.string().optional().nullable(), hireReason: z.string().optional().nullable(), comments: z.string().optional().nullable() }`
- `ApproveJobSchema`: `{ action: z.enum(["APPROVE", "REJECT"]).default("APPROVE"), approvalNote: z.string().optional().default("") }`

## 3. Business Rules & RBAC

### 3.1. Kiến trúc Module `src/server/dal/` (`import "server-only"`)
Mọi file trong `src/server/dal/` bắt buộc khai báo `import "server-only";` ở dòng đầu tiên. Các Route Handlers nội bộ (`src/app/api/**`, trừ 3 public endpoints) và `src/app/admin/layout.tsx` **không được import `prisma` trực tiếp** mà bắt buộc gọi qua các module DAL:

1. `src/server/dal/errors.ts` — Lớp `DalError` chuẩn hóa `{ statusCode, code, error, errorEn, field?, fieldErrors?, extras? }` và helper chuyển đổi HTTP response.
2. `src/server/dal/schemas.ts` — Bộ Zod schemas xác thực đầu vào trước khi truy vấn DB.
3. `src/server/dal/auth.ts` — `getOptionalSessionUser()`, `requireSession()`, `requireRole(roles)`, `signInInternalUser()`, `signOutInternalUser()`, `changeInternalPassword()`. Luôn đối chiếu `user.isActive === true` từ phiên Better Auth; nếu `isActive === false`, thu hồi phiên và ném `DalError(403)`.
4. `src/server/dal/users.ts` — `listUsers()`, `createUser()`, `updateUser()`. Khi Admin đặt `isActive: false`, tự động xóa toàn bộ `Session` của user đó trong cùng `$transaction`. Vá triệt để lỗi lọt tạo user không đăng nhập ở `POST /api/users`.
5. `src/server/dal/jobs.ts` — `listJobs()`, `createJob()`, `updateJob()`, `approveOrRejectJob()`. Thực thi cứng **BRL-17** (HR tạo tin luôn vào `DRAFT` hoặc `PENDING_APPROVAL`; HR không thể tự chuyển tin `DRAFT`/`PENDING_APPROVAL` sang `ACTIVE` qua `PATCH /api/jobs/[id]` nếu tin chưa từng được duyệt `approvedById`; chỉ `HIRING_MANAGER` hoặc `ADMIN` mới duyệt lên `ACTIVE` hoặc trả về `DRAFT` kèm lý do ≥ 5 ký tự).
6. `src/server/dal/pipeline.ts` — `getPipelineBoard()`, `moveApplicationStage()`. Thực thi đầy đủ State Machine 6 bước, giới hạn cột theo Role, **BRL-06** (bắt buộc ≥ 1 Scorecard `HIRE` / `STRONG_HIRE` trước `OFFER` và `HIRED`), **BRL-11** (bắt buộc `rejectionReason` ≥ 5 ký tự trước `REJECTED`), **BRL-13** (trần phỏng vấn & tự đóng tin khi đủ headcount) và **BRL-05** (hoãn 12h thư từ chối / hủy khi khôi phục).
7. `src/server/dal/scorecards.ts` — `listScorecards()`, `createScorecard()`. Thực thi cứng **BRL-15 (Blind Scorecard)** ngay tại DAL cho cả truy vấn có và không có `applicationId`: nếu người gọi là `HR` hoặc `HIRING_MANAGER` chưa nộp phiếu đánh giá cho hồ sơ `X`, ẩn toàn bộ phiếu đánh giá của đồng nghiệp trên hồ sơ `X` (`blindScorecardLocked: true`, `hiddenEvaluationsCount`). Xóa bỏ hoàn toàn logic `fallbackUser` khi lưu Scorecard.
8. `src/server/dal/applications.ts` — `listApplications()`, `getApplicationDetail()` (kèm chốt chặn **BRL-15**), `updateApplicationFlags()`, `toggleApplicationStar()`, `updateCandidateProfile()`, `reparseApplicationCv()` (vá lỗ hổng thiếu auth ở `POST /api/applications/[id]/re-parse`), `getProtectedCandidateCvStream()` (vá lỗ hổng giả mạo `Referer: /jobs/tracker` ở `GET /api/applications/storage/[...key]`, bắt buộc phiên nội bộ hợp lệ + chặn Path Traversal). *(Lưu ý: `POST /api/applications` vẫn mở công khai cho ứng viên nộp đơn kèm rate-limit; nếu có phiên nội bộ thì ghi nhận nguồn/người thao tác an toàn).*
9. `src/server/dal/interviews.ts` — `scheduleOrUpdateInterview()`, `triggerInterviewAutomation()`.
10. `src/server/dal/talent-pool.ts` — `listTalentPool()`, `repoolCandidate()`, `cleanupExpiredRejectedApplications()`.
11. `src/server/dal/analytics.ts` — `getOperationalDashboard()`, `exportApplicationsCsv()`, `getRealtimeNotifications()`.

### 3.2. RBAC Matrix
| Endpoint / DAL Action | Unauthenticated | Locked (`isActive=false`) | `HR` | `HIRING_MANAGER` | `ADMIN` |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `POST /api/auth/[...all]` (`sign-up/email`) | `400/403` (Disabled) | `400/403` | `400/403` | `400/403` | `400/403` |
| `POST /api/auth/login` & `sign-in/email` | Allow (Valid creds) | `403` | Allow | Allow | Allow |
| `GET /api/auth/me`, `POST /api/auth/logout` | `200 (user: null)` / `200` | `200 (user: null)` | Allow | Allow | Allow |
| `PATCH /api/auth/change-password` | `401` | `403` | Allow (Own) | Allow (Own) | Allow (Own) |
| `GET / POST / PATCH /api/users` | `401` | `403` | `403` | `403` | Allow |
| `GET /api/jobs` | `401` | `403` | Allow | Allow | Allow |
| `POST /api/jobs` (`BRL-17`) | `401` | `403` | Allow (`DRAFT` / `PENDING_APPROVAL` only) | `403` | Allow (`ACTIVE` / `DRAFT` / `PENDING_APPROVAL`) |
| `PATCH /api/jobs/[id]` | `401` | `403` | Allow (No self-approve unapproved job) | `403` | Allow |
| `POST /api/jobs/[id]/approve` (`BRL-17`) | `401` | `403` | `403` | Allow | Allow |
| `GET /api/pipeline`, `GET /api/dashboard`, `GET /api/realtime/notifications` | `401` | `403` | Allow | Allow | Allow |
| `POST /api/pipeline/move` (`BRL-06`, `BRL-11`) | `401` | `403` | `NEW ↔ SCREENING`, `NEW/SCREENING -> REJECTED`, `OFFER -> HIRED/REJECTED` | `SCREENING -> INTERVIEW -> OFFER -> HIRED`, `-> REJECTED` (No `NEW`) | Allow all valid Stage Flow |
| `GET / POST /api/scorecards` (`BRL-15`) | `401` | `403` | Allow (Blind until own submitted) | Allow (Blind until own submitted) | Allow (Full visibility) |
| `GET / PATCH /api/applications/[id]`, `POST /star`, `GET /applications`, `GET /storage/[...key]` | `401` | `403` | Allow (Detail obeys `BRL-15`) | Allow (Detail obeys `BRL-15`) | Allow |
| `PATCH /api/applications/[id]/profile`, `POST /re-parse` | `401` | `403` | Allow | `403` | Allow |
| `POST /api/interviews/schedule` | `401` | `403` | Quick notes only (`403` on schedule/move) | Allow | Allow |
| `POST /api/interviews/trigger-n8n` | `401` | `403` | Allow | Allow | Allow |
| `GET / POST /api/talent-pool`, `GET /api/export` | `401` | `403` | Allow | `403` | Allow |
| `POST /api/talent-pool/cleanup` (`BRL-10`) | `401` | `403` | `403` | `403` | Allow |
| Public: `POST /api/applications`, `POST /api/applications/preview-cv`, `GET/POST /api/tracker` | Allow (Rate-limited) | Allow | Allow | Allow | Allow |

## 4. State Machine & Edge Cases
- **Session Lifecycle (Better Auth + Neon DB):**
  1. `Unauthenticated` ➔ `POST /api/auth/login` (hoặc `/api/auth/sign-in/email` / `DemoRoleBar`) ➔ Kiểm tra `User` tồn tại & `isActive === true` ➔ Backfill `Account` nếu là user cũ chỉ mới có `passwordHash` ➔ Xác thực mật khẩu `PBKDF2` qua Better Auth ➔ Ghi bản ghi vào bảng `sessions` + gắn cookie `HttpOnly`, `SameSite=Lax`, đã ký chữ ký số của Better Auth (đồng thời xóa cookie cũ `ats_user_session` nếu còn tồn đọng trên trình duyệt).
  2. `Active Session` ➔ Mỗi request vào DAL gọi `auth.api.getSession({ headers })` đối chiếu bảng `sessions` & `users.isActive`. Nếu token hết hạn, chữ ký bị sửa đổi, phiên đã bị xóa khỏi DB, hoặc `users.isActive === false` ➔ từ chối ngay (`401` hoặc `403`).
  3. `Logout / Password Change / Admin Lock` ➔ `POST /api/auth/logout` xóa phiên hiện tại khỏi `sessions`; `PATCH /api/auth/change-password` thu hồi các phiên khác (`revokeOtherSessions: true`); Admin khóa tài khoản (`isActive: false`) xóa toàn bộ `sessions` của user đó ngay trong transaction.
- **Next.js Middleware (`src/middleware.ts`):**
  - Chỉ đóng vai trò cổng UX mỏng trên `/admin/:path*`: kiểm tra sự hiện diện của cookie phiên Better Auth (`better-auth.session_token` hoặc tiền tố `__Secure-better-auth.session_token`) để chuyển hướng nhanh người dùng chưa đăng nhập về `/admin/login?from=...` (tránh FOUC), đồng thời gắn header `x-pathname`.
  - Xóa bỏ hoàn toàn khóa bí mật hardcode và hàm giải mã HMAC cũ trong `src/middleware.ts`. Mọi quyết định bảo mật (xác thực phiên thật trong DB, kiểm tra `isActive`, phân quyền trang `/admin/users`, `/admin/talent-pool` và API) đều thực thi tại Server (`AdminLayout` + `src/server/dal/`).
- **Chống tự khóa tài khoản Quản trị viên:** Trong `dal/users.ts`, chặn Admin tự khóa (`isActive: false`) hoặc tự hạ quyền (`role !== "ADMIN"`) chính phiên đăng nhập của mình (`400`) để tránh mất quyền quản trị hệ thống.

## 5. Error Matrix (VI & EN)
> Không hiển thị mã kỹ thuật (`BRL-*`, `RBAC-*`, tên enum thô) thành nhãn trên giao diện người dùng cuối.

| HTTP | Internal Code | End-User Message (VI) | End-User Message (EN) |
| :---: | :--- | :--- | :--- |
| `400` | `VALIDATION_ERROR` | Dữ liệu gửi lên chưa hợp lệ. Vui lòng kiểm tra lại các trường thông tin. | Invalid request data. Please review the highlighted fields. |
| `400` | `REJECTION_REASON_REQUIRED` | Vui lòng nhập lý do từ chối (tối thiểu 5 ký tự) trước khi chuyển sang Từ chối. | Please provide a rejection reason (at least 5 characters) before rejecting. |
| `400` | `SCORECARD_GATE_BLOCKED` | Chưa thể chuyển giai đoạn: Hồ sơ cần có ít nhất 01 phiếu đánh giá phỏng vấn đạt chuẩn. | Cannot advance stage: At least one passing interview scorecard is required. |
| `400` | `APPROVAL_NOTE_REQUIRED` | Vui lòng nhập ghi chú lý do yêu cầu chỉnh sửa (tối thiểu 5 ký tự). | Please enter a revision note (at least 5 characters). |
| `400` | `SELF_LOCKOUT_PREVENTED` | Không thể tự khóa hoặc tự hạ quyền tài khoản Quản trị viên đang đăng nhập. | You cannot deactivate or demote your own active Administrator account. |
| `401` | `UNAUTHENTICATED` | Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại. | Your session is invalid or has expired. Please sign in again. |
| `401` | `INVALID_CREDENTIALS` | Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại. | Incorrect email or password. Please try again. |
| `403` | `ACCOUNT_DEACTIVATED` | Tài khoản của bạn đã bị Quản trị viên tạm khóa. Vui lòng liên hệ bộ phận Quản trị. | Your account has been deactivated by an Administrator. |
| `403` | `FORBIDDEN_ROLE` | Tài khoản của bạn không có quyền thực hiện thao tác này. | Your account does not have permission to perform this action. |
| `403` | `SIGNUP_DISABLED` | Hệ thống nội bộ không hỗ trợ tự đăng ký tài khoản. Vui lòng liên hệ Quản trị viên. | Self-registration is disabled for internal accounts. Please contact an Administrator. |
| `404` | `NOT_FOUND` | Không tìm thấy dữ liệu yêu cầu trên hệ thống. | The requested record could not be found. |
| `409` | `EMAIL_CONFLICT` | Địa chỉ email này đã được đăng ký cho một nhân sự khác trong hệ thống. | This email address is already assigned to another team member. |

## 6. AI & Security Guardrails
- **Ranh giới `server-only`:** Tất cả module trong `src/server/dal/` đều có `import "server-only"`; bất kỳ nỗ lực import DAL từ Client Component sẽ bị chặn ngay lúc build/typecheck.
- **Mật khẩu & Cookie:** 100% mật khẩu lưu trong `accounts.password` (và `users.passwordHash` đồng bộ) ở dạng băm có salt `PBKDF2-SHA512` (100,000 vòng lặp); so sánh chống timing attack (`crypto.timingSafeEqual`). Cookie phiên do Better Auth ký và đối chiếu trực tiếp bảng `sessions` trên Neon PostgreSQL.
- **Không dùng Secret giả trên Production:** Thiếu cả `BETTER_AUTH_SECRET` lẫn `SESSION_SECRET` khi `NODE_ENV === "production"` phải dừng khởi tạo ngay lập tức. Cập nhật `.env.example` bổ sung `BETTER_AUTH_SECRET` và `BETTER_AUTH_URL` với giá trị mẫu an toàn.
- **Bảo vệ CV & PII ứng viên:** Route `GET /api/applications/storage/[...key]` bắt buộc qua `dal/applications.ts` kiểm tra phiên nội bộ thật (xóa bỏ bypass qua header `Referer`), chặn ký tự vượt cấp `..` và `\`.
- **Toàn vẹn Audit Log:** Mọi bản ghi `AuditLog` (`STAGE_CHANGE`, `SCORECARD_EVALUATE`, `PROFILE_EDITED`, `TALENT_REPOOL`, `INTERVIEW_INVITE_SENT_AUTO`) lấy `userId` trực tiếp từ phiên đã xác thực trong DAL, loại bỏ hoàn toàn cơ chế gán `fallbackUser`.

## 7. Acceptance Criteria (Gherkin)
```gherkin
Scenario: Đăng nhập, duy trì phiên trong Neon PostgreSQL và đăng xuất qua Better Auth
  Given tài khoản nội bộ "hr@ats.vn" đang hoạt động (isActive = true) trên Neon PostgreSQL
  When người dùng gửi POST "/api/auth/login" với email và mật khẩu hợp lệ
  Then hệ thống tạo bản ghi mới trong bảng "sessions", gắn cookie phiên Better Auth HttpOnly đã ký và trả về HTTP 200 kèm thông tin user (role = "HR")
  And gọi GET "/api/auth/me" trả về đúng thông tin phiên của "hr@ats.vn"
  When người dùng gửi POST "/api/auth/logout"
  Then bản ghi phiên trong bảng "sessions" bị xóa và GET "/api/auth/me" trả về user = null

Scenario: Tương thích tài khoản cũ và chặn tự đăng ký công khai (Sign-up Disabled)
  Given một bản ghi User cũ chỉ có "passwordHash" chuẩn PBKDF2 nhưng chưa có dòng tương ứng trong bảng "accounts"
  When người dùng đăng nhập bằng mật khẩu đúng tại POST "/api/auth/login"
  Then hệ thống tự động backfill bản ghi credential vào bảng "accounts" và đăng nhập thành công không cần đặt lại mật khẩu
  When một client bên ngoài gọi POST "/api/auth/sign-up/email" để tự tạo tài khoản
  Then hệ thống từ chối yêu cầu (HTTP 400/403) và không tạo thêm bản ghi nào trong bảng "users"

Scenario: Thu hồi phiên tức thì khi Admin khóa tài khoản (isActive = false)
  Given nhân sự "hr@ats.vn" đang có phiên đăng nhập hợp lệ trong bảng "sessions"
  When Admin gửi PATCH "/api/users" cập nhật isActive = false cho tài khoản đó
  Then toàn bộ bản ghi của nhân sự đó trong bảng "sessions" bị xóa ngay lập tức
  And mọi lời gọi API nội bộ tiếp theo từ cookie cũ đều bị DAL từ chối với HTTP 401/403

Scenario: Chốt chặn xác thực (401) và phân quyền RBAC (403) tập trung tại DAL
  Given một request không có cookie phiên hợp lệ hoặc cookie bị chỉnh sửa chữ ký
  When gọi bất kỳ API nội bộ nào (bao gồm POST "/api/users", POST "/api/applications/1/re-parse", GET "/api/applications/storage/cv.pdf" kèm Referer giả mạo)
  Then DAL trả về HTTP 401
  When tài khoản role "HR" gọi POST "/api/users", POST "/api/jobs/1/approve" hoặc POST "/api/pipeline/move" sang "INTERVIEW"
  Then DAL trả về HTTP 403
  When tài khoản role "HIRING_MANAGER" gọi POST "/api/jobs", PATCH "/api/applications/1/profile" hoặc GET "/api/talent-pool"
  Then DAL trả về HTTP 403

Scenario: Thực thi các Stage Gates cốt lõi (BRL-06, BRL-11, BRL-15, BRL-17) bên trong DAL
  Given một hồ sơ ứng tuyển ở vòng "INTERVIEW" chưa có phiếu đánh giá đạt chuẩn ("HIRE" hoặc "STRONG_HIRE")
  When Hiring Manager gọi DAL chuyển sang "OFFER" hoặc "HIRED"
  Then DAL chặn thao tác với HTTP 400 (BRL-06)
  When người dùng có quyền chuyển hồ sơ sang "REJECTED" với lý do dưới 5 ký tự
  Then DAL chặn thao tác với HTTP 400 (BRL-11)
  When giám khảo "HR" hoặc "HIRING_MANAGER" chưa nộp phiếu đánh giá gọi GET "/api/applications/[id]" hoặc GET "/api/scorecards" (có hoặc không truyền applicationId)
  Then DAL ẩn chi tiết phiếu của giám khảo khác và bật cờ blindScorecardLocked = true (BRL-15)
  When tài khoản "HR" gọi POST "/api/jobs" với initialStatus = "ACTIVE"
  Then DAL tự động ép trạng thái tin về "PENDING_APPROVAL" và chỉ cho phép lên "ACTIVE" sau khi "HIRING_MANAGER" hoặc "ADMIN" duyệt qua POST "/api/jobs/[id]/approve" (BRL-17)
```
