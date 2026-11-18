---
id: "IDX-ATS-00"
title: "Hồ sơ Tổng thể BA, Ma trận Truy vết Hai chiều (RTM) & Báo cáo Doc-Drift"
type: "overview"
version: "2.1.0"
status: "approved"
owner: "ReCoverX BA & Product Team"
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
last_updated: "2026-11-18"
---

# HỒ SƠ TỔNG THỂ BA, MA TRẬN TRUY VẾT HAI CHIỀU (RTM) & BÁO CÁO DOC-DRIFT

> **Dự án:** ReCoverX Career — Applicant Tracking System (ATS)  
> **Tiêu chuẩn áp dụng:** Universal BA Toolkit (19 BA Rules: IEEE 830, Alistair Cockburn, ISO/IEC 25010, Gherkin BDD, SemVer, Bi-directional RTM)

## Lịch Sử Phiên Bản (Revision History)

| Phiên Bản | Ngày Phát Hành | Tác Giả | Phân Loại | Tóm Tắt Thay Đổi | Người Phê Duyệt |
| :---: | :---: | :--- | :---: | :--- | :--- |
| `v1.0.0` | 2026-11-10 | BA Team | **Initial** | Khởi tạo danh mục tài liệu dự án ReCoverX Career ATS. | Product Owner |
| `v2.0.0` | 2026-11-15 | BA & Dev Team | **Added** | Đồng bộ Scope Expansion (Interview Lifecycle, Public Tracker, Deep Scorecard, BRL-10 Purge). | Tech Lead |
| `v2.1.0` | 2026-11-18 | BA & Dev Team | **Changed** | Áp dụng trọn bộ chuẩn `Universal_BA_Toolkit` (19 Rules): xóa bản nháp BRD cũ, bổ sung RTM hai chiều, Business Rules 3 vế, Error Matrix 7 cột, Gherkin BDD AC, phân tách quyền HR vs Hiring Manager và 5 trường cốt lõi CV. | Product Owner & Tech Lead |

---

## 1. MỤC LỤC HỒ SƠ PHÂN TÍCH NGHIỆP VỤ (KNOWLEDGE GRAPH INDEX)

| Mã Tài Liệu (`id`) | Tệp Tài Liệu | Phân Loại (`type`) | Phiên Bản | Trạng Thái | Vai Trò Trong Vòng Đời SDD |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `[[IDX-ATS-00]]` | `docs/00_BA_Documentation_Index_and_RTM.md` | `overview` | `v2.1.0` | Approved | Điểm khởi đầu tra cứu, RTM hai chiều & Doc-Drift Report. |
| `[[BRD-ATS-01]]` | `docs/02_BRD_Updated_Full.md` | `brd` | `v2.1.0` | Approved | Bài toán kinh doanh, Mục tiêu SMART, ROI, AS-IS/TO-BE, Compliance. |
| `[[BPMN-ATS-03]]` | `docs/03_BPMN_As_Is_and_To_Be.md` | `diagram` | `v2.1.0` | Approved | Quy trình BPMN 2.0 phân làn chuẩn Human-in-the-loop. |
| `[[FDD-ATS-04]]` | `docs/04_FDD_and_Use_Case_List.md` | `srs` | `v2.1.0` | Approved | Cây phân rã chức năng FDD, Bảng FR chuẩn `RULE-01` & Use Case Diagram. |
| `[[UC-ATS-05]]` | `docs/05_Use_Case_Specifications.md` | `srs` | `v2.1.0` | Approved | Đặc tả chi tiết 7 Use Case chuẩn 12 thành phần Alistair Cockburn (`RULE-06`). |
| `[[FSM-ATS-06]]` | `docs/06_Dynamic_Models_Activity_Sequence_State.md` | `diagram` | `v2.1.0` | Approved | Máy trạng thái hữu hạn (`RULE-12`), Ma trận Guard Rules & 4 Sequence Diagrams. |
| `[[ERD-ATS-07]]` | `docs/07_Database_Design_ERD.md` | `diagram` | `v2.1.0` | Approved | Sơ đồ ERD & Từ điển dữ liệu 10 cột chuẩn PII/Masking (`RULE-09`). |
| `[[RBAC-NFR-08]]` | `docs/08_NonFunctional_and_Permissions.md` | `srs` | `v2.1.0` | Approved | Phân loại 4 nhóm Actor (`RULE-17`), Ma trận RBAC & NFR ISO 25010 (`RULE-04`). |
| `[[GUIDE-TECH-09]]` | `docs/09_Technical_Setup_and_Antigravity_Guide.md` | `guide` | `v2.0.0` | Approved | Danh sách màn hình `SCR-xx` & hướng dẫn thiết lập môi trường kỹ thuật. |
| `[[SCOPE-ATS-10]]` | `docs/10_Scope_and_System_Comparison.md` | `brd` | `v2.0.0` | Approved | Ranh giới In-Scope / Out-of-Scope & đối chiếu Base E-Hiring / Greenhouse. |
| `[[UIUX-ATS-11]]` | `docs/11_UI_UX_Design_and_Form_Validation_Guidelines.md` | `spec` | `v2.0.0` | Approved | Quy chuẩn giao diện nội bộ, validation form & loại bỏ khẩu hiệu AI phô trương. |
| `[[AI-ARCH-12]]` | `docs/12_Hybrid_AI_Architecture_and_Scoring_Engine.md` | `spec` | `v2.1.0` | Approved | Kiến trúc Hybrid AI 2 lớp, Rule trích xuất 5 trường cốt lõi & HR Manual Edit. |
| `[[SYS-ARCH-13]]` | `docs/13_System_Architecture_and_Technology_Stack.md` | `spec` | `v2.0.0` | Approved | Kiến trúc hệ thống Next.js 14 Fullstack, Prisma ORM & Edge Middleware. |
| `[[EXP-ATS-14]]` | `docs/14_Scope_Expansion_and_Advanced_Features.md` | `cr` | `v2.1.0` | Approved | Nhật ký mở rộng phạm vi (Interview Lifecycle, Public Tracker, Deep Scorecard). |
| `[[API-ATS-15]]` | `docs/15_API_Specifications_and_Error_Codes.md` | `api-spec` | `v2.1.0` | Approved | Đặc tả 15 RESTful API Contracts & Hệ thống mã lỗi chuẩn (`RULE-03`, `RULE-10`). |
| `[[SDD-PLAY-16]]` | `docs/16_SDD_Prompt_Playbook.md` | `guide` | `v1.0.0` | Approved | Bộ 7 mẫu Prompt chuẩn Spec-Driven Development & Câu khóa an toàn. |
| `[[BR-ERR-17]]` | `docs/17_Business_Rules_and_Error_Matrix.md` | `srs` | `v2.1.0` | Approved | Business Rules 3 vế (`RULE-02`), Ma trận Lỗi 7 cột (`RULE-11`) & Gherkin BDD AC (`RULE-08`). |
| `[[UAT-ATS-18]]` | `docs/TEST_SCENARIOS_AND_UAT_GUIDE.md` | `test-suite` | `v2.1.0` | Approved | Kịch bản kiểm thử UAT thủ công & đối chiếu 97 bài kiểm thử tự động. |

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
| `BRD-GOAL-03` (Quản trị Kanban 5 cột, SLA & RBAC phân vòng) | `FR-PIPE-MOV-001` | `FR-09..13` | `UC-04` | `BRL-07`, `BRL-11`, `BRL-STAGE-ORDER`, `BRL-STAGE-TERMINAL`, `RBAC-STAGE-LIMIT` | `GET /api/pipeline`, `POST /api/pipeline/move`, `POST .../star` | Suite 7, 8, 14 (22 tests) | **Pass (100%)** |
| `BRD-GOAL-03` (Vòng đời lịch phỏng vấn) | `FR-INTV-SCH-001` | `FR-15A` | `UC-05A` | `RBAC-STAGE-LIMIT`, `BRL-STAGE-ORDER` | `POST/DELETE /api/interviews/schedule` | Suite 12.1 (6 tests) | **Pass (100%)** |
| `BRD-GOAL-03` (Scorecard chuyên sâu & Stage-Gate Hired) | `FR-EVAL-SCR-001` | `FR-14..15B` | `UC-05` | `BRL-06`, `BRL-08` | `GET/POST /api/scorecards`, `POST /api/pipeline/move` | Suite 3, 4, 8, 10 (10 tests) | **Pass (100%)** |
| `BRD-GOAL-04` (Kho nhân tài, Repooling & Purge 6 tháng) | `FR-POOL-RET-001` | `FR-16..17` | `UC-06` | `BRL-10`, `NFR-SEC-05` | `GET/POST /api/talent-pool`, `POST /api/talent-pool/cleanup` | Suite 10, 12.3 (8 tests) | **Pass (100%)** |
| `BRD-GOAL-04` (Xuất báo cáo tuyển dụng chuẩn Excel) | `FR-RPT-EXP-001` | `FR-18` | `UC-07` | `BR-RPT-001` | `GET /api/export` | Suite 10 (1 test) | **Pass (100%)** |

### Chỉ Số Bao Phủ Kiểm Thử (Coverage Gate — `RULE-14`)
* **Quy tắc nghiệp vụ cốt lõi (`BRL-01`..`BRL-11`, `BRL-Auth`, State Rules):** **100%** được phủ bởi test tự động.
* **Tổng số kịch bản kiểm thử tự động (`node tests/run-tests.js`):** **97 / 97 Passed (0 Failed)**.
* **Kiểm tra kiểu tĩnh & Production Build (`npm run build`):** **17/17 Routes compiled, 0 TypeScript / Lint Errors**.

---

## 3. BÁO CÁO KIỂM TOÁN LỆCH PHA TÀI LIỆU VS MÃ NGUỒN (DOC-DRIFT AUDIT REPORT)

Thực thi theo quy trình `skills/doc-drift/SKILL.md` vào ngày **2026-11-18**:

| Hạng Mục Kiểm Toán | Trạng Thái Đặc Tả (`docs/`) | Trạng Thái Mã Nguồn (`src/`, `prisma/`) | Độ Lệch (Drift) | Kết Luận |
| :--- | :--- | :--- | :---: | :---: |
| **5 Trường Cốt Lõi CV & Nút Xem Chi Tiết** | Đã đặc tả chi tiết tại `[[AI-ARCH-12]]` (Mục VII) & `[[BR-ERR-17]]`. | Hiện thực hóa trong `CandidateDrawer.tsx` & `CandidateCard.tsx`. | **0% (Matched)** | ✅ Đạt |
| **HR Chỉnh Sửa Thủ Công Dữ Liệu CV** | Đã đặc tả `PATCH /api/applications/[id]/profile` tại `[[API-ATS-15]]`. | Hiện thực hóa tại `src/app/api/applications/[id]/profile/route.ts` + UI inline-edit. | **0% (Matched)** | ✅ Đạt |
| **Phân Quyền Chuyển Vòng (HR max SCREENING, HM phụ trách INTERVIEW/HIRED)** | Đồng bộ toàn diện tại `[[FSM-ATS-06]]`, `[[RBAC-NFR-08]]`, `[[BR-ERR-17]]`. | Hiện thực hóa tập trung tại `src/lib/stage-rules.ts`, `move/route.ts`, `schedule/route.ts`, `KanbanBoard.tsx`. | **0% (Matched)** | ✅ Đạt |
| **Bắt Buộc Lý Do Khi Từ Chối (`BRL-11`)** | Đặc tả tại `[[FSM-ATS-06]]`, `[[ERD-ATS-07]]`, `[[BR-ERR-17]]`. | Cột `Application.rejectionReason` + `AuditLog.reason`, `RejectReasonModal.tsx`, validate API ≥ 5 ký tự. | **0% (Matched)** | ✅ Đạt |
| **Cấm Nhảy Cóc State Machine & Khóa `HIRED`** | Đặc tả tại `[[FSM-ATS-06]]` (`BRL-STAGE-ORDER`, `BRL-STAGE-TERMINAL`). | Kiểm soát đồng bộ cả Frontend (`KanbanBoard`/`CandidateDrawer`) và Backend (`stage-rules.ts`). | **0% (Matched)** | ✅ Đạt |
| **Loại bỏ tài liệu thừa / văn phong chat rác** | Đã xóa `01_BRD_Original.md`, bổ sung YAML Frontmatter + Revision History chuẩn `RULE-18/19`. | Mã nguồn sạch, 97/97 tests Pass, 0 build errors. | **0% (Clean)** | ✅ Đạt |
