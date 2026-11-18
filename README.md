# 🎯 ATS — Applicant Tracking System (Hệ thống Quản lý Tuyển dụng)
## Tài liệu Tổng quan Dự án & Cấu trúc Kho tài liệu

> **Tên hệ thống nội bộ:** `ATS — Applicant Tracking System`  
> **Thương hiệu giả lập Cổng Tuyển dụng Công khai (Public Careers Portal):** `RecoverX`  
> **Thư mục lưu trữ dự án:** `D:\ATS project`

---

## 📁 Cấu trúc Thư mục Tài liệu (Tách biệt 2 nhóm)

```text
D:\ATS project/
├── README.md                                       # Tài liệu tổng quan dự án & chỉ mục tập tin
├── AGENTS.md / GEMINI.md                           # Quy tắc vận hành cho AI Agent & Dev
│
├── docs/
│   ├── README.md                                   # Hướng dẫn phân loại 2 thư mục tài liệu
│   │
│   ├── ba/                                         # 📘 TÀI LIỆU BA (Dành cho Doanh nghiệp / Khách hàng / Non-Tech)
│   │   ├── 00_BA_Documentation_Index_and_RTM.md    # Chỉ mục tổng thể & Ma trận Truy vết (RTM)
│   │   ├── 02_BRD_Updated_Full.md                  # Tài liệu Yêu cầu Nghiệp vụ (BRD)
│   │   ├── 03_BPMN_As_Is_and_To_Be.md              # Quy trình Tuyển dụng Hiện tại (As-Is) & Đề xuất (To-Be)
│   │   ├── 04_FDD_and_Use_Case_List.md             # Cây phân rã chức năng & Danh mục 7 Use Case cốt lõi
│   │   ├── 05_Use_Case_Specifications.md           # Đặc tả chi tiết từng nghiệp vụ sử dụng
│   │   ├── 06_Dynamic_Models_Activity_Sequence_State.md # Vòng đời hồ sơ & Luồng phối hợp giữa các vai trò
│   │   ├── 08_NonFunctional_and_Permissions.md     # Ma trận Phân quyền & Yêu cầu chất lượng hệ thống
│   │   ├── 10_Scope_and_System_Comparison.md       # Phạm vi dự án (In/Out-of-Scope) & Đối sánh chuẩn thị trường
│   │   ├── 11_UI_UX_Design_and_Form_Validation_Guidelines.md # Quy chuẩn giao diện & Thông báo hướng dẫn người dùng
│   │   ├── 14_Scope_Expansion_and_Advanced_Features.md # Khai phóng tính năng nâng cao & Bảo mật dữ liệu
│   │   ├── 18_Brief_Compliance_and_Value_Added_Analysis.md # Báo cáo kiểm chứng bám sát đề bài & Giá trị gia tăng
│   │   └── TEST_SCENARIOS_AND_UAT_GUIDE.md         # Kịch bản nghiệm thu thực tế (UAT) cho doanh nghiệp
│   │
│   └── dev-context/                                # ⚙️ TÀI LIỆU KỸ THUẬT (Dành cho Dev / QA / AI Agent lập trình)
│       ├── 07_Database_Design_ERD.md               # Thiết kế CSDL, Từ điển dữ liệu & Sơ đồ ERD
│       ├── 09_Technical_Setup_and_Antigravity_Guide.md # Hướng dẫn cài đặt môi trường & Quy trình phát triển
│       ├── 12_Hybrid_AI_Architecture_and_Scoring_Engine.md # Kiến trúc bộ lọc Lai & Thuật toán chấm điểm độ phù hợp
│       ├── 13_System_Architecture_and_Technology_Stack.md # Kiến trúc hệ thống & Công nghệ sử dụng
│       ├── 15_API_Specifications_and_Error_Codes.md # Hợp đồng REST API & Mã lỗi hệ thống
│       ├── 16_SDD_Prompt_Playbook.md               # Bộ Prompt chuẩn Spec-Driven Development cho AI Agent
│       └── 17_Business_Rules_and_Error_Matrix.md   # Quy tắc nghiệp vụ 3 vế, Ma trận lỗi & Tiêu chí chấp nhận Gherkin
│
├── src/                                            # Mã nguồn Next.js Fullstack (App Router + TypeScript)
├── prisma/                                         # Schema CSDL & Seed data
└── tests/                                          # Bộ kiểm thử nghiệp vụ tự động (112 test cases)
```

---

## 📌 Tóm tắt Các Quyết định Trọng yếu của Hệ thống ATS

### 1. Phạm vi & Điểm mới trong BRD
- **Cổng Ứng viên (Candidate Portal):** Ứng viên trực tiếp nộp CV qua giao diện Web, hệ thống tự động khử trùng lặp (Deduplication) dựa trên Email và Số điện thoại.
- **Bóc tách hồ sơ tự động (AI Parsing):** Trích xuất thông tin học vấn, kỹ năng, kinh nghiệm từ file PDF/Docx.
- **Sàng lọc tự động bằng AI (AI Automated Screening):** Chấm điểm độ phù hợp (Match Score % và Rationale) đối chiếu với mô tả công việc (JD).
- **Gửi Email từ chối tự động có cơ chế Delay:** Tự động gửi thư từ chối sau khoảng thời gian hoãn (Delay Buffer 12 - 24 giờ) để tạo trải nghiệm ứng tuyển nhân văn.

### 2. Danh mục 7 Use Case Cốt lõi (In-Scope)
| Mã UC | Tên Use Case | Tác nhân chính (Actors) |
| :--- | :--- | :--- |
| **UC-01** | Tạo & Quản lý Tin tuyển dụng (Job Posting) | HR, Hiring Manager |
| **UC-02** | Nộp hồ sơ Trực tuyến & Thu thập CV Đa nguồn | Ứng viên, HR |
| **UC-03** | Bóc tách & Sàng lọc CV Tự động bằng AI | Hệ thống AI, HR |
| **UC-04** | Đặt lịch Phỏng vấn & Đánh giá bằng Scorecard | HR, Hiring Manager, Ứng viên |
| **UC-05** | Phê duyệt Tuyển chọn, Phát hành Offer & Onboarding | Hiring Manager, HR, Giám đốc, Ứng viên |
| **UC-06** | Quản lý Kho Dữ liệu Tài năng (Talent Pool & CRM) | HR |
| **UC-07** | Báo cáo Phân tích Tuyển dụng (Recruitment Analytics) | HR Manager, Ban Giám đốc |

### 3. Kiến trúc Dữ liệu Đề xuất (PostgreSQL)
- `users`: Tài khoản nội bộ và phân quyền RBAC.
- `jobs`: Tin tuyển dụng và tiêu chí chấm điểm của JD.
- `candidates`: Hồ sơ ứng viên cơ bản (Email, Phone, Deduplication key).
- `applications`: Đơn ứng tuyển theo từng Job, lưu trạng thái Kanban.
- `ai_parse_results`: Dữ liệu JSON bóc tách từ CV.
- `ai_match_scores`: Điểm % match và giải trình AI.
- `interviews`: Lịch phỏng vấn đa vòng.
- `evaluation_scorecards`: Phiếu đánh giá có trọng số của người phỏng vấn.

### 4. Môi trường Máy chủ & Công nghệ Sẵn sàng
- **Node.js:** `v24.16.0`
- **NPM:** `11.5.1`
- **Git:** `2.50.1`
- **Chiến lược Frontend:** Tận dụng Dashboard UI mã nguồn mở hiện đại (Next.js / Tailwind CSS / shadcn/ui / Lucide Icons).
- **Quy trình Antigravity:** Sử dụng AI Assistant để sinh mã, kiểm thử và thiết lập quy tắc dự án tự động.
