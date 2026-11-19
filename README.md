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
│   │   ├── 00_BA_Documentation_Index_and_RTM.md    # Chỉ mục tổng thể & Ma trận Truy vết (RTM v2.3.0)
│   │   ├── 02_BRD_Updated_Full.md                  # Tài liệu Yêu cầu Nghiệp vụ (BRD)
│   │   ├── 03_BPMN_As_Is_and_To_Be.md              # Quy trình Tuyển dụng Hiện tại (As-Is) & Đề xuất (To-Be)
│   │   ├── 04_FDD_and_Use_Case_List.md             # Cây phân rã chức năng & Danh mục Use Case cốt lõi
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
├── src/                                            # Mã nguồn Next.js Fullstack (App Router + TypeScript + i18n)
├── prisma/                                         # Schema CSDL (SQLite dev / PostgreSQL prod) & Seed data
└── tests/                                          # Bộ kiểm thử nghiệp vụ tự động (136/136 test cases PASS 100%)
```

---

## 📌 Tóm tắt Các Tính năng & Quyết định Trọng yếu của Hệ thống ATS

### 1. Phạm vi & Điểm mới trong BRD
- **Cổng Ứng viên (Candidate Portal):** Ứng viên trực tiếp nộp CV qua giao diện Web, hệ thống tự động khử trùng lặp (Deduplication) 2 lớp dựa trên Email, Số điện thoại và mã băm SHA-256 (`BRL-02`, `BRL-12`).
- **Bóc tách hồ sơ tự động (AI Parsing):** Trích xuất thông tin học vấn, kỹ năng, kinh nghiệm từ file PDF/Docx với bộ đệm fallback regex NLP cục bộ.
- **Sàng lọc tự động bằng AI (AI Automated Screening):** Chấm điểm độ phù hợp (Match Score % và Rationale) đối chiếu với mô tả công việc (JD) theo phân tầng 3 mức màu: Xanh (≥75%), Vàng (50-74%), Đỏ (<50%).
- **Gửi Email từ chối tự động có cơ chế Delay:** Tự động gửi thư từ chối sau khoảng thời gian hoãn (Delay Buffer 12 - 24 giờ) qua n8n webhook kết nối Neon PostgreSQL (`BRL-05`).
- **Thông báo Ứng viên mới qua Telegram Bot:** Tự động bắn thông báo đẩy về kênh Telegram cho HR (`@Rec_Hr_rBot`) ngay khi có hồ sơ mới.
- **Tự động hóa Lịch phỏng vấn & Đồng bộ Google Calendar:** Phân tách thẻ Online (Meet/Zoom/Teams) vs Offline (Văn phòng), hỗ trợ 3 tùy chọn gửi thư mời (`AUTO_N8N`, `MANUAL_CUSTOM`, `NONE`) và tự động tạo sự kiện Google Calendar.
- **Phân trang Lũy tiến Từng Cột Kanban:** Quản lý hiển thị mặc định 15 hồ sơ / cột kèm nút tải thêm lũy tiến độc lập (`BRL-14`).
- **Khống chế Chỉ tiêu Tuyển dụng & Giới hạn Phỏng vấn cùng lúc:** Tự động chốt đóng tin khi tuyển đủ chỉ tiêu (`BRL-13`).
- **Chuẩn hóa Văn bản & Chuyển đổi Song ngữ VI/EN:** Loại bỏ hoàn toàn các câu giải thích logic kỹ thuật rườm rà, hỗ trợ nút gạt song ngữ `[ 🇻🇳 VI | 🇬🇧 EN ]` trên toàn bộ hệ thống.

### 2. Danh mục Use Case Cốt lõi
| Mã UC | Tên Use Case | Tác nhân chính (Actors) |
| :--- | :--- | :--- |
| **UC-01** | Tạo & Quản lý Tin tuyển dụng (Job Posting, Quota & WIP Cap) | HR, Hiring Manager |
| **UC-02** | Nộp hồ sơ Trực tuyến & Khử trùng lặp 2 lớp (Deduplication) | Ứng viên, HR |
| **UC-03** | Bóc tách & Sàng lọc CV Tự động bằng AI (3-Tier Match) | Hệ thống AI, HR |
| **UC-04** | Vận hành Kanban 5 cột, Cảnh báo SLA & Phân trang lũy tiến | HR, Hiring Manager |
| **UC-05A**| Lên lịch Phỏng vấn Online/Offline & Đồng bộ Calendar | Hiring Manager, Admin, Ứng viên |
| **UC-05** | Đánh giá Scorecard 3 tiêu chí trọng số & Stage Gate Hired | Hiring Manager, HR, Giám đốc |
| **UC-06** | Quản lý Kho Dữ liệu Tài năng (Talent Pool & CRM 180 ngày) | HR |
| **UC-07** | Báo cáo Phân tích Tuyển dụng (Recruitment Analytics) | HR Manager, Ban Giám đốc |

### 3. Công nghệ & Tự Động Hóa Vận Hành
- **Fullstack:** Next.js 14+ (App Router) + TypeScript + Tailwind CSS.
- **Database & ORM:** Prisma ORM (SQLite `dev.db` cho môi trường cục bộ; Neon Serverless PostgreSQL cho môi trường đám mây).
- **Tự động hóa Workflow:** n8n Workflow Automation (Gmail API + Telegram Bot API + Google Calendar API).
- **Đa ngôn ngữ (i18n):** Ngữ cảnh React `LanguageProvider` với bộ từ điển tuyển dụng chuẩn hóa `vi` & `en`.
- **Kiểm thử Nghiệp vụ Tự động:** **136/136 test cases PASS (100%)** (`node tests/run-tests.js`).
