# CẤU TRÚC THƯ MỤC TÀI LIỆU DỰ ÁN — ATS (APPLICANT TRACKING SYSTEM)

Hệ thống tài liệu được tách thành **2 thư mục độc lập** theo đúng đối tượng đọc và mục đích sử dụng:

## 1. `docs/ba/` — Hồ sơ Nghiệp vụ BA (Dành cho Doanh nghiệp, Khách hàng & Hội đồng)
Toàn bộ tài liệu viết bằng **ngôn ngữ nghiệp vụ rõ ràng, thân thiện với người đọc phi kỹ thuật (Non-Tech)**:
- `00_BA_Documentation_Index_and_RTM.md` — Mục lục tổng, Ma trận truy vết hai chiều (RTM) & Báo cáo Doc-Drift
- `02_BRD_Updated_Full.md` — Tài liệu Yêu cầu Nghiệp vụ (BRD)
- `03_BPMN_As_Is_and_To_Be.md` — Quy trình Nghiệp vụ AS-IS & TO-BE (BPMN 2.0)
- `04_FDD_and_Use_Case_List.md` — Cây Phân rã Chức năng & Danh mục 8 Ca sử dụng
- `05_Use_Case_Specifications.md` — Đặc tả chi tiết 8 Ca sử dụng (Chuẩn Alistair Cockburn)
- `06_Dynamic_Models_Activity_Sequence_State.md` — Sơ đồ Luồng hoạt động, Tuần tự & Vòng đời trạng thái
- `08_NonFunctional_and_Permissions.md` — Phân quyền theo Vai trò & Yêu cầu Chất lượng (ISO 25010)
- `10_Scope_and_System_Comparison.md` — Phạm vi Dự án & So sánh Hệ thống Mẫu
- `11_UI_UX_Design_and_Form_Validation_Guidelines.md` — Quy chuẩn Giao diện & Kiểm tra Dữ liệu Biểu mẫu
- `14_Scope_Expansion_and_Advanced_Features.md` — Nhật ký Mở rộng Phạm vi & Tính năng Nâng cao
- `18_Brief_Compliance_and_Value_Added_Analysis.md` — Báo cáo Đối chiếu Đề bài & Phân tích Giá trị Cải tiến
- `TEST_SCENARIOS_AND_UAT_GUIDE.md` — Kịch bản Kiểm thử Nghiệm thu (UAT) cho Doanh nghiệp

## 2. `docs/dev-context/` — Tài liệu Kỹ thuật & Ngữ cảnh Lập trình (Dành cho AI Agent, Dev & QA)
Chứa đặc tả kỹ thuật chi tiết, thiết kế CSDL, hợp đồng API, công thức AI và Prompt Playbook để lập trình theo chuẩn **Spec-Driven Development (SDD)**:
- `07_Database_Design_ERD.md` — Thiết kế CSDL, ERD & Từ điển dữ liệu 10 cột (PII/Masking)
- `09_Technical_Setup_and_Antigravity_Guide.md` — Thiết lập môi trường & Danh mục màn hình
- `12_Hybrid_AI_Architecture_and_Scoring_Engine.md` — Kiến trúc Hybrid AI 2 Lớp & Công thức Chấm điểm
- `13_System_Architecture_and_Technology_Stack.md` — Kiến trúc Hệ thống Next.js / Prisma / Security
- `15_API_Specifications_and_Error_Codes.md` — Đặc tả 16 REST API Contracts & Hệ thống Mã lỗi
- `16_SDD_Prompt_Playbook.md` — Bộ Mẫu Prompt Chuẩn Spec-Driven Development
- `17_Business_Rules_and_Error_Matrix.md` — Business Rules 3 Vế, Ma trận Lỗi 7 Cột & Gherkin BDD AC
