# HỆ THỐNG TÀI LIỆU DỰ ÁN — ATS (APPLICANT TRACKING SYSTEM)

> **Dự án:** ATS — Applicant Tracking System *(Cổng công khai giả lập: RecoverX)*  
> **Phiên bản hoàn thiện:** v2.2.0 (Bản Chốt Nghiệm Thu Sản Phẩm & Báo Cáo Doanh Nghiệp)  
> **Kiến trúc:** Next.js 14+ Fullstack (App Router), TypeScript, Tailwind CSS, Prisma ORM (SQLite / PostgreSQL Neon), Hybrid AI (Lớp 1 NLP + Lớp 2 Gemini 2.5 Flash), n8n Automation Engine.

---

Toàn bộ hệ thống tài liệu và thiết kế kiến trúc của dự án được cấu trúc bài bản thành các thư mục chuyên biệt theo đúng đối tượng độc giả và mục đích sử dụng:

```
docs/
├── ba/             # 1. Hồ sơ Nghiệp vụ BA (Dành cho Doanh nghiệp, Khách hàng & Hội đồng)
├── dev-context/    # 2. Ngữ cảnh Kỹ thuật & Lập trình (Dành cho AI Agent, Dev & QA)
├── diagrams/       # 3. Trọn bộ 8 Sơ đồ Kiến trúc & Luồng nghiệp vụ (BPMN 2.0 & Mermaid)
├── specs/          # 4. Đặc tả Kỹ thuật Chuyên sâu (Hợp đồng API, Rules, Schema, n8n)
├── master/         # 5. Bộ Tài liệu Gốc Master (BRD & SRS Toàn diện Chuẩn Quốc tế)
└── exports/        # 6. Bản Xuất Word (.docx) Chuẩn Khổ A4 Phục vụ Nghiệm thu
```

---

## 1. `docs/ba/` — Hồ sơ Nghiệp vụ BA (Business-Facing Documents)
Toàn bộ tài liệu được viết bằng **ngôn ngữ nghiệp vụ rõ ràng, chuẩn mực, thân thiện với người đọc phi kỹ thuật (Non-Tech)**, tuân thủ nguyên tắc không phô trương thuật ngữ kỹ thuật khó hiểu:

* [`00_BA_Documentation_Index_and_RTM.md`](file:///d:/ATS%20project/docs/ba/00_BA_Documentation_Index_and_RTM.md) — Mục lục tổng, Ma trận truy vết hai chiều (Requirements Traceability Matrix - RTM) & Báo cáo Doc-Drift.
* [`02_BRD_Updated_Full.md`](file:///d:/ATS%20project/docs/ba/02_BRD_Updated_Full.md) — Tài liệu Yêu cầu Nghiệp vụ Doanh nghiệp (BRD) với mục tiêu SMART, phân tích ROI và quy trình AS-IS vs TO-BE.
* [`03_BPMN_As_Is_and_To_Be.md`](file:///d:/ATS%20project/docs/ba/03_BPMN_As_Is_and_To_Be.md) — Quy trình Nghiệp vụ Chi tiết AS-IS & TO-BE chuẩn hóa theo BPMN 2.0.
* [`04_FDD_and_Use_Case_List.md`](file:///d:/ATS%20project/docs/ba/04_FDD_and_Use_Case_List.md) — Cây Phân rã Chức năng (Functional Decomposition) & Danh mục 8 Ca sử dụng cốt lõi.
* [`05_Use_Case_Specifications.md`](file:///d:/ATS%20project/docs/ba/05_Use_Case_Specifications.md) — Đặc tả chi tiết 8 Ca sử dụng theo cấu trúc 12 phần chuẩn Alistair Cockburn.
* [`06_Dynamic_Models_Activity_Sequence_State.md`](file:///d:/ATS%20project/docs/ba/06_Dynamic_Models_Activity_Sequence_State.md) — Sơ đồ Hoạt động, Tuần tự tương tác & Vòng đời trạng thái ứng tuyển.
* [`08_NonFunctional_and_Permissions.md`](file:///d:/ATS%20project/docs/ba/08_NonFunctional_and_Permissions.md) — Phân quyền theo Vai trò (RBAC) & Bộ Yêu cầu Phi chức năng theo chuẩn ISO 25010.
* [`10_Scope_and_System_Comparison.md`](file:///d:/ATS%20project/docs/ba/10_Scope_and_System_Comparison.md) — Ranh giới Phạm vi Dự án (In/Out-of-Scope) & So sánh với hệ thống tiêu chuẩn thị trường.
* [`11_UI_UX_Design_and_Form_Validation_Guidelines.md`](file:///d:/ATS%20project/docs/ba/11_UI_UX_Design_and_Form_Validation_Guidelines.md) — Quy chuẩn Thiết kế Giao diện Phẳng 60-30-10 & Quy tắc Xác thực Biểu mẫu Thân thiện.
* [`14_Scope_Expansion_and_Advanced_Features.md`](file:///d:/ATS%20project/docs/ba/14_Scope_Expansion_and_Advanced_Features.md) — Nhật ký Mở rộng Phạm vi, Tính năng Giá trị Gia tăng & Bộ đệm Từ chối 12h BRL-05.
* [`18_Brief_Compliance_and_Value_Added_Analysis.md`](file:///d:/ATS%20project/docs/ba/18_Brief_Compliance_and_Value_Added_Analysis.md) — Báo cáo Đối chiếu Đề bài Gốc, Phân tích Tính năng Vượt trội & Giải trình Kiến trúc Hybrid AI.
* [`TEST_SCENARIOS_AND_UAT_GUIDE.md`](file:///d:/ATS%20project/docs/ba/TEST_SCENARIOS_AND_UAT_GUIDE.md) — Hướng dẫn Kiểm thử Nghiệm thu Người dùng (UAT Guide) dành cho Hội đồng Doanh nghiệp.

---

## 2. `docs/dev-context/` — Tài liệu Kỹ thuật & Lập trình SDD (Developer & QA Context)
Chứa đặc tả kỹ thuật chi tiết, thiết kế CSDL, hợp đồng API, công thức AI và Prompt Playbook để lập trình theo chuẩn **Spec-Driven Development (SDD)**:

* [`07_Database_Design_ERD.md`](file:///d:/ATS%20project/docs/dev-context/07_Database_Design_ERD.md) — Thiết kế Cơ sở Dữ liệu, ERD quan hệ & Từ điển Dữ liệu 10 cột có gắn nhãn bảo vệ PII/Masking.
* [`09_Technical_Setup_and_Antigravity_Guide.md`](file:///d:/ATS%20project/docs/dev-context/09_Technical_Setup_and_Antigravity_Guide.md) — Hướng dẫn Thiết lập Môi trường, Biến Môi trường & Danh mục Màn hình Ứng dụng.
* [`12_Hybrid_AI_Architecture_and_Scoring_Engine.md`](file:///d:/ATS%20project/docs/dev-context/12_Hybrid_AI_Architecture_and_Scoring_Engine.md) — Kiến trúc Hybrid AI 2 Lớp, Quy chuẩn 5 Trường Cốt lõi & Công thức Chấm điểm Phù hợp JD 3 Mức Màu.
* [`13_System_Architecture_and_Technology_Stack.md`](file:///d:/ATS%20project/docs/dev-context/13_System_Architecture_and_Technology_Stack.md) — Kiến trúc Hệ thống Next.js App Router, Prisma ORM, Neon Postgres & Bảo mật Phiên HMAC-SHA256.
* [`15_API_Specifications_and_Error_Codes.md`](file:///d:/ATS%20project/docs/dev-context/15_API_Specifications_and_Error_Codes.md) — Đặc tả Chi tiết 16 Hợp đồng REST API chuẩn mực & Bảng Mã lỗi Hệ thống.
* [`16_SDD_Prompt_Playbook.md`](file:///d:/ATS%20project/docs/dev-context/16_SDD_Prompt_Playbook.md) — Bộ Mẫu Lệnh Prompt Chuẩn Spec-Driven Development cho AI Agents.
* [`17_Business_Rules_and_Error_Matrix.md`](file:///d:/ATS%20project/docs/dev-context/17_Business_Rules_and_Error_Matrix.md) — Quy tắc Nghiệp vụ 3 Vế (`BRL-01` đến `BRL-14`), Ma trận Lỗi 7 Cột & Tiêu chí Chấp nhận BDD Gherkin.
* [`STAGING_DEPLOYMENT_GUIDE.md`](file:///d:/ATS%20project/docs/dev-context/STAGING_DEPLOYMENT_GUIDE.md) — Quy trình Đóng gói & Triển khai Sản phẩm lên Vercel Edge và Neon Cloud Database.

---

## 3. `docs/diagrams/` — Trọn bộ 8 Sơ đồ Kiến trúc & Luồng Nghiệp vụ Chuẩn Quốc tế
Thư mục lưu trữ toàn bộ mã nguồn biểu đồ dạng Text-based (`.bpmn` và `.mmd`), hỗ trợ mở, vẽ, chỉnh sửa và xuất ảnh Vector SVG cực nét hoặc PNG 300 DPI:

* [`README.md` (Cẩm nang Phần mềm & Hướng dẫn Nhúng Code)](file:///d:/ATS%20project/docs/diagrams/README.md) — **Đặc tả chi tiết công cụ khuyên dùng (Camunda, Mermaid Live, Draw.io, VS Code) và hướng dẫn nhúng mã vào Notion, Confluence, Word, GitHub.**
* [`01_as_is_recruitment_process_bpmn.bpmn`](file:///d:/ATS%20project/docs/diagrams/01_as_is_recruitment_process_bpmn.bpmn) & [`.md`](file:///d:/ATS%20project/docs/diagrams/01_as_is_recruitment_process_bpmn.md) — Quy trình Tuyển dụng Hiện trạng AS-IS (BPMN 2.0 XML).
* [`02_to_be_recruitment_process_bpmn.bpmn`](file:///d:/ATS%20project/docs/diagrams/02_to_be_recruitment_process_bpmn.bpmn) & [`.md`](file:///d:/ATS%20project/docs/diagrams/02_to_be_recruitment_process_bpmn.md) — Quy trình Tuyển dụng Mục tiêu TO-BE (BPMN 2.0 XML).
* [`03_usecase_diagram.mmd`](file:///d:/ATS%20project/docs/diagrams/03_usecase_diagram.mmd) & [`.md`](file:///d:/ATS%20project/docs/diagrams/03_usecase_diagram.md) — Sơ đồ Ca Sử Dụng Use Case Diagram (Mermaid UML).
* [`04_database_erd.mmd`](file:///d:/ATS%20project/docs/diagrams/04_database_erd.mmd) & [`.md`](file:///d:/ATS%20project/docs/diagrams/04_database_erd.md) — Sơ đồ Quan Hệ Thực Thể CSDL Entity Relationship Diagram (Mermaid ERD).
* [`05_finite_state_machine.mmd`](file:///d:/ATS%20project/docs/diagrams/05_finite_state_machine.mmd) & [`.md`](file:///d:/ATS%20project/docs/diagrams/05_finite_state_machine.md) — Máy Trạng Thái Vòng Đời Ứng Tuyển FSM (Mermaid State Machine).
* [`06_system_sequence_diagrams.mmd`](file:///d:/ATS%20project/docs/diagrams/06_system_sequence_diagrams.mmd) & [`.md`](file:///d:/ATS%20project/docs/diagrams/06_system_sequence_diagrams.md) — Sơ đồ Tuần Tự Hệ Thống 4 Kịch Bản Then Chốt (Mermaid Sequence).
* [`07_cloud_architecture.mmd`](file:///d:/ATS%20project/docs/diagrams/07_cloud_architecture.mmd) & [`.md`](file:///d:/ATS%20project/docs/diagrams/07_cloud_architecture.md) — Sơ đồ Phân Tầng Kiến Trúc Đám Mây & Hệ Thống Fullstack (Mermaid Flowchart).
* [`08_automation_workflow_n8n.mmd`](file:///d:/ATS%20project/docs/diagrams/08_automation_workflow_n8n.mmd) & [`.md`](file:///d:/ATS%20project/docs/diagrams/08_automation_workflow_n8n.md) — Sơ đồ Kiến Trúc Tự Động Hóa & Webhook n8n Event-Driven Topology (Mermaid Flowchart).

---

## 4. `docs/specs/` — Đặc tả Kỹ thuật Chuyên sâu (Technical Specifications)
* [`01_business_rules_and_error_matrix.md`](file:///d:/ATS%20project/docs/specs/01_business_rules_and_error_matrix.md) — Quy tắc nghiệp vụ và ma trận xử lý ngoại lệ.
* [`02_api_specifications_and_contracts.md`](file:///d:/ATS%20project/docs/specs/02_api_specifications_and_contracts.md) — Chi tiết tham số Request/Response và Error Schema của toàn bộ API.
* [`03_data_dictionary_and_schema.md`](file:///d:/ATS%20project/docs/specs/03_data_dictionary_and_schema.md) — Từ điển trường dữ liệu, kiểu dữ liệu, ràng buộc và mô tả chi tiết.
* [`04_use_case_specifications.md`](file:///d:/ATS%20project/docs/specs/04_use_case_specifications.md) — Đặc tả kỹ thuật các bước tương tác Actor - System.
* [`05_hybrid_ai_and_matching_engine.md`](file:///d:/ATS%20project/docs/specs/05_hybrid_ai_and_matching_engine.md) — Chi tiết thuật toán bóc tách CV, Prompt AI Studio và cơ chế chấm điểm đối chiếu JD.
* [`06_n8n_automation_architecture.md`](file:///d:/ATS%20project/docs/specs/06_n8n_automation_architecture.md) — Kiến trúc điều phối sự kiện Webhook và tích hợp Google Calendar/Gmail/Telegram.

---

## 5. `docs/master/` & `docs/exports/` — Bộ Tài Liệu Master & File Word Báo Cáo
* [`docs/master/01_BRD_Business_Requirements_Document.md`](file:///d:/ATS%20project/docs/master/01_BRD_Business_Requirements_Document.md) — Bản Master Tài liệu Yêu cầu Nghiệp vụ BRD đầy đủ nhất.
* [`docs/master/02_SRS_Software_Requirements_Specification.md`](file:///d:/ATS%20project/docs/master/02_SRS_Software_Requirements_Specification.md) — Bản Master Đặc tả Yêu cầu Phần mềm SRS chuẩn IEEE 830 / ISO 29148.
* [`docs/exports/BRD_ATS_Applicant_Tracking_System_v2.2.docx`](file:///d:/ATS%20project/docs/exports/BRD_ATS_Applicant_Tracking_System_v2.2.docx) — File Word (.docx) được định dạng chuẩn theo Master Template A4 phục vụ in ấn và trình bày hội đồng.

---

## 6. LỆNH KIỂM TRA HỆ THỐNG VÀ XÁC MINH TOÀN DIỆN
```powershell
# Chạy bộ kiểm thử tự động 162/162 ca kiểm thử nghiệp vụ
node tests/run-tests.js

# Kiểm tra an toàn kiểu dữ liệu TypeScript (0 lỗi)
npx tsc --noEmit

# Khởi chạy ứng dụng ATS tại máy cục bộ (cổng 3000)
npm run dev
```
