# Quy tắc Dự án: ATS — Applicant Tracking System

## 1. Thông tin Dự án & Kiến trúc
- **Tên hệ thống nội bộ:** ATS — Applicant Tracking System *(Cổng ứng tuyển công khai giả lập: RecoverX)*
- **Kiến trúc:** Next.js Fullstack (App Router) + TypeScript + Tailwind CSS
- **ORM & Database:** Prisma ORM. Môi trường phát triển: SQLite (`file:./dev.db`); Sản xuất: PostgreSQL.
- **AI Engine:** Mô hình Lai (Hybrid): Lớp 1 (trích xuất text cục bộ + NLP dự phòng) + Lớp 2 (Google Gemini API `@google/genai` nhiệt độ 0 cho phân tích ngữ nghĩa & đối chiếu JD 3 mức màu).
- **Kéo thả Pipeline:** `@hello-pangea/dnd` (Kanban 5 cột: New, Screening, Interview, Hired, Rejected).

## 2. Nguồn Chân lý Tài liệu (2 Thư mục Tách biệt)
- **`docs/ba/` (Hồ sơ BA cho Doanh nghiệp / Non-Tech):** `00_BA_Documentation_Index_and_RTM.md`, `02_BRD_Updated_Full.md`, `03_BPMN_As_Is_and_To_Be.md`, `04_FDD_and_Use_Case_List.md`, `05_Use_Case_Specifications.md`, `06_Dynamic_Models_Activity_Sequence_State.md`, `08_NonFunctional_and_Permissions.md`, `10_Scope_and_System_Comparison.md`, `11_UI_UX_Design_and_Form_Validation_Guidelines.md`, `14_Scope_Expansion_and_Advanced_Features.md`, `18_Brief_Compliance_and_Value_Added_Analysis.md`, `TEST_SCENARIOS_AND_UAT_GUIDE.md`.
- **`docs/dev-context/` (Ngữ cảnh Kỹ thuật cho AI Agent & Dev):** `07_Database_Design_ERD.md`, `09_Technical_Setup_and_Antigravity_Guide.md`, `12_Hybrid_AI_Architecture_and_Scoring_Engine.md`, `13_System_Architecture_and_Technology_Stack.md`, `15_API_Specifications_and_Error_Codes.md`, `16_SDD_Prompt_Playbook.md`, `17_Business_Rules_and_Error_Matrix.md`.

## 3. Quy tắc Nghiệp vụ & UI/UX Bắt buộc
- **Không hiển thị mã kỹ thuật (`BRL-*`, `NFR-*`, `RBAC`, `Magic Bytes`) hay chữ `AI` phô trương trên giao diện người dùng cuối.**
- **Phân tách quyền vòng tuyển:** `HR` chuyển tối đa đến `SCREENING` + chỉnh sửa 5 trường CV; `HIRING_MANAGER` phụ trách `SCREENING ➔ INTERVIEW ➔ HIRED` & lịch phỏng vấn; bắt buộc lý do khi `REJECTED` (`BRL-11`) và bắt buộc có Phiếu đánh giá đạt chuẩn trước khi `HIRED` (`BRL-06`).
- **Kho Nhân Tài:** Chỉ gồm hồ sơ đã qua sàng lọc theo 3 nhóm thực tế (*Tiềm năng / Dự bị*, *Đang chờ đợt khác*, *Lưu trữ dự phòng 180 ngày*), loại trừ `NEW` và `HIRED`.

## 4. Hướng dẫn Lập trình & Tài liệu
- Khi người dùng yêu cầu soạn thảo tài liệu (SRS/BRD) và xuất Word, tự động viết file Markdown thuần tại `docs/` và tự động thực thi Pandoc/script biên dịch ra file `.docx` tại `docs/exports/` (tuân thủ `.agents/rules/ba-export-workflow.md`).
- Luôn kiểm tra TypeScript (`npx tsc --noEmit`) và chạy bộ kiểm thử (`node tests/run-tests.js`) sau mỗi thay đổi.
- Giữ giao diện phẳng, dịu mắt (60-30-10), tách bạch Tổng quan và Chi tiết 5 tab, không trùng lặp nút thao tác.
