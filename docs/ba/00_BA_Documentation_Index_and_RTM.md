---
id: "IDX-ATS-00"
title: "Hồ sơ Tổng thể BA, Ma trận Truy vết Hai chiều (RTM) & Báo cáo Doc-Drift"
type: "overview"
version: "2.3.0"
status: "approved"
owner: "ATS BA & Product Team"
domain: "recruitment-ats"
tags:
  - "master-index"
  - "rtm-traceability"
  - "doc-drift"
  - "universal-ba-toolkit"
upstream_deps: []
downstream_deps:
  - "BRD-ATS-01"
  - "BPMN-ATS-03"
  - "FDD-ATS-04"
  - "UC-ATS-05"
  - "FSM-ATS-06"
  - "ERD-ATS-07"
  - "RBAC-NFR-08"
  - "API-ATS-15"
  - "BR-ERR-17"
  - "BRIEF-CMP-18"
last_updated: "2026-11-19"
---

# HỒ SƠ TỔNG THỂ BA, MA TRẬN TRUY VẾT HAI CHIỀU (RTM) & BÁO CÁO DOC-DRIFT

> **Dự án:** ATS — Applicant Tracking System  
> **Tiêu chuẩn áp dụng:** Universal BA Toolkit (19 BA Rules: IEEE 830, Alistair Cockburn, ISO/IEC 25010, Gherkin BDD, SemVer, Bi-directional RTM)

## Lịch Sử Phiên Bản (Revision History)

| Phiên Bản | Ngày Phát Hành | Tác Giả | Phân Loại | Tóm Tắt Thay Đổi | Người Phê Duyệt |
| :---: | :---: | :--- | :---: | :--- | :--- |
| `v1.0.0` | 2026-11-10 | BA Team | **Initial** | Khởi tạo danh mục tài liệu dự án ATS — Applicant Tracking System. | Product Owner |
| `v2.0.0` | 2026-11-15 | BA & Dev Team | **Added** | Đồng bộ Scope Expansion (Interview Lifecycle, Public Tracker, Deep Scorecard, BRL-10 Purge). | Tech Lead |
| `v2.1.0` | 2026-11-18 | BA & Dev Team | **Changed** | Áp dụng trọn bộ chuẩn `Universal_BA_Toolkit` (19 Rules): xóa bản nháp BRD cũ, bổ sung RTM hai chiều, Business Rules 3 vế, Error Matrix 7 cột, Gherkin BDD AC, phân tách quyền HR vs Hiring Manager và 5 trường cốt lõi CV. | Product Owner & Tech Lead |
| `v2.3.0` | 2026-11-19 | BA & Dev Team | **Added** | Tích hợp BRL-12 (Source of Truth & SHA-256), BRL-13 (Chỉ tiêu & Trần PV), BRL-14 (Phân trang lũy tiến Kanban), n8n Automation (Gmail 12h, Telegram Alert HR, Google Calendar), Phân luồng PV Online/Offline, 3 tùy chọn thư mời và Chuyển đổi song ngữ VI/EN toàn diện. | Product Owner & Tech Lead |

---

## 1. MỤC LỤC HỒ SƠ TÀI LIỆU (CHIA 2 THƯ MỤC ĐỘC LẬP)

### 1A. Thư mục `docs/ba/` — Hồ sơ Nghiệp vụ BA (Dành cho Doanh nghiệp & Khách hàng Non-Tech)

| Mã Tài Liệu (`id`) | Tệp Tài Liệu | Phân Loại | Phiên Bản | Trạng Thái | Vai Trò |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `[[IDX-ATS-00]]` | `docs/ba/00_BA_Documentation_Index_and_RTM.md` | `overview` | `v2.2.0` | Approved | Mục lục tổng, RTM hai chiều & Báo cáo Doc-Drift. |
| `[[BRD-ATS-01]]` | `docs/ba/02_BRD_Updated_Full.md` | `brd` | `v2.2.0` | Approved | Bài toán kinh doanh, Mục tiêu SMART, ROI, AS-IS/TO-BE, Compliance. |
| `[[BPMN-ATS-03]]` | `docs/ba/03_BPMN_As_Is_and_To_Be.md` | `diagram` | `v2.1.0` | Approved | Quy trình BPMN 2.0 phân làn giữa Ứng viên, HR và Quản lý chuyên môn. |
| `[[FDD-ATS-04]]` | `docs/ba/04_FDD_and_Use_Case_List.md` | `srs` | `v2.2.0` | Approved | Cây phân rã chức năng FDD, Bảng FR & Danh mục 8 Use Case. |
| `[[UC-ATS-05]]` | `docs/ba/05_Use_Case_Specifications.md` | `srs` | `v2.2.0` | Approved | Đặc tả chi tiết 8 Use Case chuẩn 12 thành phần Alistair Cockburn. |
| `[[FSM-ATS-06]]` | `docs/ba/06_Dynamic_Models_Activity_Sequence_State.md` | `diagram` | `v2.1.0` | Approved | Vòng đời trạng thái hồ sơ, Quy tắc chuyển vòng & 4 Sơ đồ tuần tự. |
| `[[RBAC-NFR-08]]` | `docs/ba/08_NonFunctional_and_Permissions.md` | `srs` | `v2.2.0` | Approved | Phân loại Tác nhân, Ma trận Phân quyền & Yêu cầu Chất lượng ISO 25010. |
| `[[SCOPE-ATS-10]]` | `docs/ba/10_Scope_and_System_Comparison.md` | `brd` | `v2.1.0` | Approved | Ranh giới In-Scope / Out-of-Scope & Đối chiếu hệ thống mẫu. |
| `[[UIUX-ATS-11]]` | `docs/ba/11_UI_UX_Design_and_Form_Validation_Guidelines.md` | `spec` | `v2.2.0` | Approved | Quy chuẩn Giao diện dịu mắt & Kiểm tra dữ liệu đầu vào thân thiện. |
| `[[EXP-ATS-14]]` | `docs/ba/14_Scope_Expansion_and_Advanced_Features.md` | `cr` | `v2.1.0` | Approved | Nhật ký mở rộng phạm vi & các tính năng nâng cao. |
| `[[BRIEF-CMP-18]]` | `docs/ba/18_Brief_Compliance_and_Value_Added_Analysis.md` | `brd` | `v1.2.0` | Approved | Đối chiếu Đề bài gốc vs Hệ thống thực tế, Hệ thống mẫu & Lý do Hybrid AI. |
| `[[UAT-ATS-18]]` | `docs/ba/TEST_SCENARIOS_AND_UAT_GUIDE.md` | `test-suite` | `v2.2.0` | Approved | Kịch bản kiểm thử nghiệm thu UAT cho Doanh nghiệp. |

### 1B. Thư mục `docs/dev-context/` — Ngữ cảnh Kỹ thuật (Dành cho AI Agent, Dev & QA)

| Mã Tài Liệu (`id`) | Tệp Tài Liệu | Phân Loại | Phiên Bản | Trạng Thái | Vai Trò Trong Lập Trình SDD |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `[[ERD-ATS-07]]` | `docs/dev-context/07_Database_Design_ERD.md` | `diagram` | `v2.1.0` | Approved | Sơ đồ ERD & Từ điển dữ liệu 10 cột chuẩn PII/Masking (`RULE-09`). |
| `[[GUIDE-TECH-09]]` | `docs/dev-context/09_Technical_Setup_and_Antigravity_Guide.md` | `guide` | `v2.0.0` | Approved | Danh sách màn hình `SCR-xx` & hướng dẫn thiết lập môi trường kỹ thuật. |
| `[[AI-ARCH-12]]` | `docs/dev-context/12_Hybrid_AI_Architecture_and_Scoring_Engine.md` | `spec` | `v2.2.0` | Approved | Kiến trúc Hybrid AI 2 lớp, Rule 5 trường cốt lõi & Phân tầng 3 mức màu. |
| `[[SYS-ARCH-13]]` | `docs/dev-context/13_System_Architecture_and_Technology_Stack.md` | `spec` | `v2.0.0` | Approved | Kiến trúc hệ thống Next.js 14 Fullstack, Prisma ORM & Bảo mật Edge. |
| `[[API-ATS-15]]` | `docs/dev-context/15_API_Specifications_and_Error_Codes.md` | `api-spec` | `v2.2.0` | Approved | Đặc tả 16 RESTful API Contracts & Hệ thống mã lỗi chuẩn (`RULE-03`, `RULE-10`). |
| `[[SDD-PLAY-16]]` | `docs/dev-context/16_SDD_Prompt_Playbook.md` | `guide` | `v1.0.0` | Approved | Bộ 7 mẫu Prompt chuẩn Spec-Driven Development & Câu khóa an toàn. |
| `[[BR-ERR-17]]` | `docs/dev-context/17_Business_Rules_and_Error_Matrix.md` | `srs` | `v2.1.0` | Approved | Business Rules 3 vế (`RULE-02`), Ma trận Lỗi 7 cột (`RULE-11`) & Gherkin BDD AC. |

> **Lưu ý kiểm soát phiên bản (`RULE-19`):** Tài liệu bản nháp cũ `01_BRD_Original.md` đã được loại bỏ chính thức nhằm tránh xung đột nguồn chân lý; toàn bộ lịch sử tiến hóa từ `v1.0.0` được lưu tại bảng Revision History của `[[BRD-ATS-01]]`.

---

## 2. MA TRẬN TRUY VẾT HAI CHIỀU (BI-DIRECTIONAL RTM — RULE-14)

| Mục Tiêu BRD | Mã FR Chuẩn (`RULE-01`) | Mã FR Ngắn | Use Case | Business Rules | API Endpoint Thực Thi | Kiểm Thử Tự Động (`tests/run-tests.js`) | Trạng Thái |
| :--- | :--- | :---: | :---: | :--- | :--- | :--- | :---: |
| `BRD-GOAL-01` (Tự động hóa tiếp nhận & chống spam) | `FR-AUTH-LGN-001` | `FR-00a/b` | `UC-00` | `BRL-Auth` | `POST /api/auth/login`, `GET/POST /api/users` | Suite 7, Suite 11, Suite 13 (17 tests) | **Pass (100%)** |
| `BRD-GOAL-01` (Cổng ứng tuyển công khai) | `FR-PORT-APPLY-001` | `FR-01..03` | `UC-01` | `BRL-01`, `BRL-02`, `BRL-09`, `NFR-SEC-03` | `POST /api/applications` | Suite 1, 2, 9, 11 (19 tests) | **Pass (100%)** |
| `BRD-GOAL-01` (Chống Ghosting ứng viên) | `FR-PORT-TRK-002` | `FR-01A` | `UC-01A` | `NFR-SEC-04` | `GET /api/tracker` | Suite 12.2 (4 tests) | **Pass (100%)** |
| `BRD-GOAL-02` (Bóc 5 trường cốt lõi & HR sửa tay) | `FR-INTK-PRS-001` | `FR-04..06` | `UC-02` | `BRL-03`, `RBAC-PROFILE-EDIT` | `POST /api/applications`, `PATCH /api/applications/[id]/profile`, `POST .../re-parse` | Suite 7, 9, 14 (6 tests) | **Pass (100%)** |
| `BRD-GOAL-02` (Hybrid AI đối chiếu JD & Delay từ chối) | `FR-AI-SCR-001` | `FR-07..08` | `UC-03` | `BRL-04`, `BRL-05` | `POST /api/applications`, `POST /api/pipeline/move` | Suite 5, 9 (5 tests) | **Pass (100%)** |
| `BRD-GOAL-03` (Bảng điều khiển Tổng quan Vận hành theo Role) | `FR-DASH-OVW-001` | `FR-08A` | `UC-04` | `RBAC-DASH-SCOPE`, `BRL-07`, `BRL-06`, `BRL-10` | `GET /api/dashboard` | Suite 15 (Dashboard RBAC & Metrics) | **Pass (100%)** |
| `BRD-GOAL-03` (Quản trị Kanban 5 cột, SLA & RBAC phân vòng) | `FR-PIPE-MOV-001` | `FR-09..13` | `UC-04` | `BRL-07`, `BRL-11`, `BRL-14`, `BRL-STAGE-ORDER`, `BRL-STAGE-TERMINAL`, `RBAC-STAGE-LIMIT` | `GET /api/pipeline`, `POST /api/pipeline/move`, `POST .../star` | Suite 7, 8, 14, 17 (Kanban & Progressive Pagination) | **Pass (100%)** |
| `BRD-GOAL-03` (Vòng đời lịch phỏng vấn, Online/Offline & Google Calendar) | `FR-INTV-SCH-001` | `FR-15A` | `UC-05A` | `RBAC-STAGE-LIMIT`, `BRL-STAGE-ORDER` | `POST/DELETE /api/interviews/schedule` | Suite 12.1 (6 tests) | **Pass (100%)** |
| `BRD-GOAL-03` (Scorecard chuyên sâu & Stage-Gate Hired) | `FR-EVAL-SCR-001` | `FR-14..15B` | `UC-05` | `BRL-06`, `BRL-08` | `GET/POST /api/scorecards`, `POST /api/pipeline/move` | Suite 3, 4, 8, 10 (10 tests) | **Pass (100%)** |
| `BRD-GOAL-04` (Kho nhân tài, Repooling & Purge 6 tháng) | `FR-POOL-RET-001` | `FR-16..17` | `UC-06` | `BRL-10`, `NFR-SEC-05` | `GET/POST /api/talent-pool`, `POST /api/talent-pool/cleanup` | Suite 10, 12.3 (8 tests) | **Pass (100%)** |
| `BRD-GOAL-04` (Xuất báo cáo tuyển dụng chuẩn Excel) | `FR-RPT-EXP-001` | `FR-18` | `UC-07` | `BR-RPT-001` | `GET /api/export` | Suite 10 (1 test) | **Pass (100%)** |
| `BRD-GOAL-05` (Source of Truth, SHA-256 CV Hash & Chống trùng 2 lớp) | `FR-DATA-SRC-001` | `FR-19` | `UC-02` | `BRL-12` | `POST /api/applications` | Suite 16 (12 tests) | **Pass (100%)** |
| `BRD-GOAL-05` (Chỉ tiêu tuyển dụng & Khống chế trần PV cùng lúc) | `FR-QUOTA-CAP-001` | `FR-20` | `UC-01` | `BRL-13` | `POST /api/jobs`, `POST /api/pipeline/move` | Suite 16 (4 tests) | **Pass (100%)** |
| `BRD-GOAL-05` (Phân trang lũy tiến 15 thẻ độc lập từng cột Kanban) | `FR-PIPE-PAG-001` | `FR-21` | `UC-04` | `BRL-14` | `GET /api/pipeline?limitPerStage=15` | Suite 17 (7 tests) | **Pass (100%)** |
| `BRD-GOAL-06` (Hạ tầng Song ngữ VI/EN & Chuẩn hóa Text toàn hệ thống) | `FR-I18N-SYS-001` | `FR-22` | Toàn hệ thống | `NFR-UI-01`, `NFR-UI-02` | `src/lib/i18n.tsx`, `LanguageSwitcher.tsx` | All Suites (Clean UI) | **Pass (100%)** |

### Chỉ Số Bao Phủ Kiểm Thử (Coverage Gate — `RULE-14`)
* **Quy tắc nghiệp vụ cốt lõi (`BRL-01`..`BRL-14`, `BRL-Auth`, State Rules):** **100%** được phủ bởi test tự động.
* **Tổng số kịch bản kiểm thử tự động (`node tests/run-tests.js`):** **136 / 136 Passed (0 Failed)**.
* **Kiểm tra kiểu tĩnh & Production Build (`npx next build`):** **19/19 Routes compiled, 0 TypeScript / Lint Errors**.

---

## 3. BÁO CÁO KIỂM TOÁN LỆCH PHA TÀI LIỆU VS MÃ NGUỒN (DOC-DRIFT AUDIT REPORT)

Thực thi theo quy trình `skills/doc-drift/SKILL.md` cập nhật ngày **2026-11-19**:

| Hạng Mục Kiểm Toán | Trạng Thái Đặc Tả (`docs/`) | Trạng Thái Mã Nguồn (`src/`, `prisma/`) | Độ Lệch (Drift) | Kết Luận |
| :--- | :--- | :--- | :---: | :---: |
| **5 Trường Cốt Lõi CV & Nút Xem Chi Tiết** | Đã đặc tả chi tiết tại `[[AI-ARCH-12]]` (Mục VII) & `[[BR-ERR-17]]`. | Hiện thực hóa trong `CandidateDrawer.tsx` & `CandidateCard.tsx`. | **0% (Matched)** | ✅ Đạt |
| **HR Chỉnh Sửa Thủ Công Dữ Liệu CV** | Đã đặc tả `PATCH /api/applications/[id]/profile` tại `[[API-ATS-15]]`. | Hiện thực hóa tại `src/app/api/applications/[id]/profile/route.ts` + UI inline-edit. | **0% (Matched)** | ✅ Đạt |
| **Phân Quyền Chuyển Vòng (HR max SCREENING, HM phụ trách INTERVIEW/HIRED)** | Đồng bộ toàn diện tại `[[FSM-ATS-06]]`, `[[RBAC-NFR-08]]`, `[[BR-ERR-17]]`. | Hiện thực hóa tập trung tại `src/lib/stage-rules.ts`, `move/route.ts`, `schedule/route.ts`, `KanbanBoard.tsx`. | **0% (Matched)** | ✅ Đạt |
| **Bắt Buộc Lý Do Khi Từ Chối (`BRL-11`)** | Đặc tả tại `[[FSM-ATS-06]]`, `[[ERD-ATS-07]]`, `[[BR-ERR-17]]`. | Cột `Application.rejectionReason` + `AuditLog.reason`, `RejectReasonModal.tsx`, validate API ≥ 5 ký tự. | **0% (Matched)** | ✅ Đạt |
| **Cấm Nhảy Cóc State Machine & Khóa `HIRED`** | Đặc tả tại `[[FSM-ATS-06]]` (`BRL-STAGE-ORDER`, `BRL-STAGE-TERMINAL`). | Kiểm soát đồng bộ cả Frontend (`KanbanBoard`/`CandidateDrawer`) và Backend (`stage-rules.ts`). | **0% (Matched)** | ✅ Đạt |
| **Operational Dashboard theo Role & Dual-Branding** | Đặc tả tại `[[RBAC-NFR-08]]`, `[[API-ATS-15]]`, `[[BRIEF-CMP-18]]`. | `GET /api/dashboard`, `/admin/dashboard`, `OperationalDashboard.tsx`; Nội bộ: `ATS — Applicant Tracking System`, Public: `RecoverX`. | **0% (Matched)** | ✅ Đạt |
| **Source of Truth & Chống trùng 2 lớp (`BRL-12`)** | Đặc tả tại `[[ERD-ATS-07]]`, `[[BR-ERR-17]]`. | Cột `cvFileHash`, `contactMismatchLevel`, `duplicateWarningAppId`, SHA-256 CV hash. | **0% (Matched)** | ✅ Đạt |
| **Chỉ tiêu Headcount & Trần PV (`BRL-13`)** | Đặc tả tại `[[ERD-ATS-07]]`, `[[BR-ERR-17]]`. | `targetHeadcount`, `maxActiveInterviews`, tự động đóng tin khi đủ suất. | **0% (Matched)** | ✅ Đạt |
| **Phân trang lũy tiến từng cột (`BRL-14`)** | Đặc tả tại `[[API-ATS-15]]`, `[[UIUX-ATS-11]]`. | Tham số `limitPerStage=15` trên API và nút tải thêm độc lập từng cột trên Kanban. | **0% (Matched)** | ✅ Đạt |
| **Tự động hóa n8n & Thông báo Đa kênh** | Tích hợp n8n workflow, Gmail Buffer 12h, Telegram Alert HR (@Rec_Hr_rBot) & Google Calendar sync. | Các cờ DB `isInterviewInviteSent`, `isTelegramNotified`, `interviewEmailOption` + webhook n8n. | **0% (Matched)** | ✅ Đạt |
| **Chuẩn hóa Text & Chuyển đổi Song ngữ VI/EN** | Từ điển i18n chuẩn hóa, xóa toàn bộ câu giải thích logic kỹ thuật, gỡ bỏ thông báo trùng lặp. | `src/lib/i18n.tsx`, `LanguageSwitcher.tsx`, `Navbar.tsx`, `CandidateDrawer.tsx`, `ScorecardPanel.tsx`. | **0% (Clean)** | ✅ Đạt |
