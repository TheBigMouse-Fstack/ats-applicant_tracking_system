---
id: "BRD-ATS-01"
title: "Tài liệu Yêu cầu Nghiệp vụ Doanh nghiệp (BRD) — ReCoverX Career ATS"
type: "brd"
version: "2.1.0"
status: "approved"
owner: "Nguyễn Quốc Khánh (Lead BA & PO)"
domain: "recruitment-ats"
tags:
  - "brd"
  - "business-requirements"
  - "ats"
  - "human-in-the-loop"
upstream_deps: []
downstream_deps:
  - "BPMN-ATS-03"
  - "FDD-ATS-04"
  - "UC-ATS-05"
  - "FSM-ATS-06"
  - "RBAC-NFR-08"
  - "BR-ERR-17"
last_updated: "2026-11-18"
---

# BUSINESS REQUIREMENTS DOCUMENT (BRD)
## Hệ Thống Quản Lý Tuyển Dụng Thông Minh — ReCoverX Career ATS

> **Địa điểm:** TP. Hồ Chí Minh  
> **Tiêu chuẩn biên soạn:** Universal BA Toolkit (`/brd`, `RULE-02`, `RULE-16`, `RULE-18`, `RULE-19`)

---

## I. LỊCH SỬ PHIÊN BẢN (REVISION HISTORY)

| Phiên Bản | Ngày Phát Hành | Tác Giả | Phân Loại | Tóm Tắt Chi Tiết Thay Đổi | Người Phê Duyệt |
| :---: | :---: | :--- | :---: | :--- | :--- |
| `v1.0.0` | 2026-11-11 | Nguyễn Quốc Khánh | **Initial** | Khởi tạo bản thảo BRD ban đầu (từng lưu tại `01_BRD_Original.md`, nay đã hợp nhất). | Project Sponsor |
| `v1.1.0` | 2026-11-12 | Nguyễn Quốc Khánh | **Added** | Chuẩn hóa quy trình AS-IS theo SOP; bổ sung Cổng nộp hồ sơ công khai (Candidate Portal) và Hybrid AI Parsing. | Product Owner |
| `v2.0.0` | 2026-11-15 | Nguyễn Quốc Khánh | **Changed** | Mở rộng phạm vi: Module Lên lịch Phỏng vấn, Cổng Tra cứu Ứng viên (`/jobs/tracker`), Scorecard chuyên sâu, Dọn dẹp 6 tháng (`BRL-10`), loại bỏ AI tự động từ chối (chuyển sang *Human-in-the-loop*). | Tech Lead & PO |
| `v2.1.0` | 2026-11-18 | Nguyễn Quốc Khánh | **Changed** | Chuẩn hóa 5 trường trích xuất cốt lõi theo JD + quyền HR chỉnh sửa thủ công; phân tách quyền chuyển vòng (`HR` tối đa `SCREENING`, `Hiring Manager` phụ trách `INTERVIEW`/`HIRED`); bắt buộc Lý do từ chối (`BRL-11`) và State Machine guards. | Hội đồng Nghiệm thu |

---

## II. BỐI CẢNH & ĐỘNG LỰC KINH DOANH (BUSINESS DRIVERS)

### 1. Bài Toán & Điểm Nghẽn Hiện Tại (Problem Statement)
Doanh nghiệp đang tiếp nhận trung bình **500 – 1.000 CV/tháng** qua nhiều kênh rời rạc (Email, TopCV, LinkedIn, giới thiệu nội bộ). Toàn bộ quy trình quản lý hiện phụ thuộc vào bảng tính Excel và thư mục cục bộ trên máy tính cá nhân của chuyên viên HR, gây ra 4 điểm nghẽn định lượng rõ ràng:

1. **Quá tải nhập liệu thủ công:** Mỗi hồ sơ tốn trung bình **3 – 5 phút** để mở file PDF, đọc và gõ lại thông tin vào Excel, tiêu tốn **30 – 40%** tổng quỹ thời gian làm việc của đội ngũ tuyển dụng.
2. **Tỷ lệ phản hồi chậm (Ghosting):** Tỷ lệ ứng viên không nhận được phản hồi sau khi nộp đơn lên tới **80%**, gây tổn hại trực tiếp đến thương hiệu tuyển dụng (Employer Branding).
3. **Thiếu minh bạch đánh giá & phân quyền:** Nhận xét phỏng vấn rời rạc qua tin nhắn nội bộ; không phân định rạch ròi giữa vòng sơ loại của HR và vòng duyệt chuyên môn của Hiring Manager; không lưu rõ căn cứ tuyển dụng hay lý do từ chối.
4. **Rủi ro trùng lặp & pháp lý dữ liệu:** Không có cơ chế phát hiện đơn nộp trùng trong 30 ngày và không có cơ chế dọn dẹp hồ sơ cá nhân quá hạn theo Nghị định 13/2023/NĐ-CP.

### 2. Mục Tiêu Kinh Doanh Định Lượng (SMART Business Objectives)

| Mã Mục Tiêu | Mục Tiêu Nghiệp Vụ | Chỉ Số Đo Lường (KPI / Target) | Thời Hạn Đạt Được |
| :--- | :--- | :--- | :---: |
| **`BRD-GOAL-01`** | Số hóa 100% tiếp nhận hồ sơ & xóa bỏ tình trạng Ghosting | **100%** ứng viên nộp qua cổng trực tuyến hoặc HR nạp nội bộ được cấp mã tra cứu tiến độ (`/jobs/tracker`) và nhận phản hồi (kèm đệm trễ 12 giờ khi từ chối). | Sau 01 tháng Go-live |
| **`BRD-GOAL-02`** | Tối ưu thời gian bóc tách và sơ loại CV bằng Hybrid AI | Giảm thời gian đọc/nhập liệu từ 5 phút xuống **≤ 5.0 giây/CV**; hiển thị gọn đúng **5 trường cốt lõi theo JD** (độ chính xác bóc tách ≥ 85%) và cho phép HR hiệu chỉnh thủ công. | Ngay khi Go-live |
| **`BRD-GOAL-03`** | Chuẩn hóa quy trình Kanban, phân quyền HR vs Hiring Manager & Scorecard | Giảm Time-to-Hire thêm **3 – 5 ngày làm việc**; **100%** quyết định tuyển (`HIRED`) có tối thiểu 01 Scorecard đạt chuẩn (`BRL-06`) và **100%** hồ sơ bị loại có lý do rõ ràng (`BRL-11`). | Sau 02 tháng Go-live |
| **`BRD-GOAL-04`** | Quản trị Kho nhân tài & tuân thủ bảo vệ dữ liệu cá nhân | **100%** hồ sơ `REJECTED` được đồng bộ vào Talent Pool phục vụ luân chuyển vị trí (Repooling) và được Admin xóa vĩnh viễn sau 180 ngày (`BRL-10`) tuân thủ Nghị định 13/2023/NĐ-CP. | Duy trì liên tục |

### 3. Phân Tích Chi Phí & Lợi Ích (Cost-Benefit & ROI Analysis)
* **Chi phí triển khai & vận hành (CAPEX / OPEX):** Xây dựng mã nguồn tự chủ trên Next.js 14 Fullstack + Prisma ORM + Hybrid AI (Lớp 1 `pdf-parse` miễn phí 100%, Lớp 2 Google Gemini 2.5 Flash chi phí ước tính < 500.000 VNĐ/tháng cho 1.000 CV), không tốn phí thuê bao SaaS theo đầu người (tiết kiệm 15 – 30 triệu VNĐ/tháng so với thuê bản quyền ATS thương mại cho quy mô 20–50 user nội bộ).
* **Lợi ích vận hành dự kiến:** Tiết kiệm tối thiểu **80 – 120 giờ công HR/tháng**, giảm thiểu 100% rủi ro mất hồ sơ do nghỉ việc nhân sự HR và nâng cao tỷ lệ chuyển đổi ứng viên chất lượng.

---

## III. PHẠM VI DỰ ÁN (SCOPE OF WORK)

### 1. Trong Phạm Vi (In-Scope)
1. **Xác thực & Quản trị Người dùng Nội bộ (`UC-00`):** Đăng nhập mật khẩu băm NIST PBKDF2-SHA512, phiên HMAC-SHA256, Edge Middleware chống truy cập trái phép, quản trị tài khoản phân quyền 3 vai trò (`ADMIN`, `HR`, `HIRING_MANAGER`).
2. **Cổng Tuyển Dụng Công Khai & Tra Cứu Tiến Độ (`UC-01`, `UC-01A`):** Xem JD, nộp CV (`.pdf`, `.docx` ≤ 10MB, kiểm tra Magic Bytes, Rate Limit 5 lần/10 phút/IP), đính kèm bằng cấp/chứng chỉ và tra cứu tiến độ bảo mật (`/jobs/tracker`, ẩn điểm AI và nhận xét nội bộ).
3. **Tiếp Nhận Nội Bộ, Trích Xuất 5 Trường Cốt Lõi & Chỉnh Sửa Thủ Công (`UC-02`):** HR nạp CV theo nguồn (`LINKEDIN`, `REFERRAL`, `HEADHUNTER`), khử trùng lặp 30 ngày (`BRL-02`), bóc tách 5 trường cốt lõi theo JD (Họ tên, Email, Vị trí, Kỹ năng, Số năm kinh nghiệm), Progressive Disclosure ("Xem chi tiết") và quyền HR sửa/thêm thủ công + tự động tính lại độ khớp JD.
4. **Đối Chiếu Hybrid AI & Human-in-the-loop (`UC-03`):** Đối chiếu kỹ năng & kinh nghiệm với JD (`temperature: 0`), tạo thẻ tại cột `NEW` để con người kiểm duyệt (không tự ý loại ứng viên); tự động hoãn gửi email từ chối 12 giờ (`BRL-05`) khi có quyết định từ chối hợp lệ.
5. **Quản Trị Kanban 5 Cột, State Machine & Phân Quyền Chuyển Vòng (`UC-04`):** Bảng Kanban 5 cột (`NEW`, `SCREENING`, `INTERVIEW`, `HIRED`, `REJECTED`), cảnh báo SLA (`NEW > 48h`, `SCREENING > 72h`), đánh sáng hồ sơ `NEW` chưa xem, gắn sao ưu tiên, cấm nhảy cóc giai đoạn (`BRL-STAGE-ORDER`), khóa trạng thái `HIRED` (`BRL-STAGE-TERMINAL`), bắt buộc lý do từ chối (`BRL-11`). Phân tách quyền rõ ràng: **`HR` chuyển tối đa đến `SCREENING`**, **`HIRING_MANAGER` phụ trách `INTERVIEW` & `HIRED`**.
6. **Quản Lý Vòng Đời Lịch Phỏng Vấn & Scorecard Chuyên Sâu (`UC-05`, `UC-05A`):** Xếp lịch, đổi lịch, hủy lịch phỏng vấn, ghi chú 3 lớp (ứng viên / trước PV / sau PV); chấm điểm Scorecard có trọng số (40% Chuyên môn, 30% Giao tiếp, 30% Văn hóa — `BRL-08`), ghi rõ căn cứ trúng tuyển & kế hoạch đào tạo; chốt chặn bắt buộc Scorecard trước khi `HIRED` (`BRL-06`).
7. **Kho Nhân Tài, Repooling, Dọn Dẹp 6 Tháng & Xuất CSV (`UC-06`, `UC-07`):** Lưu trữ tập trung, luân chuyển vị trí, Admin xóa vĩnh viễn hồ sơ `REJECTED` quá 180 ngày (`BRL-10`), xuất file CSV mã hóa UTF-8 BOM.

### 2. Ngoài Phạm Vi (Out-of-Scope)
* Kết nối API đồng bộ tin tuyển dụng/CV hai chiều trực tiếp với sàn tuyển dụng thứ ba (TopCV, VietnamWorks, LinkedIn Enterprise API).
* OCR chuyên sâu cho ảnh chụp CV mờ/nghiêng; bài thi trắc nghiệm/coding trực tuyến; gọi Video Call WebRTC nhúng nội bộ; ký hợp đồng điện tử pháp lý (CA/DocuSign); gửi SMS Brandname/Zalo ZNS; module HRM/Payroll/Chấm công sau khi `HIRED`. *(Chi tiết đối chiếu xem tại `[[SCOPE-ATS-10]]`)*.

---

## IV. QUY TRÌNH CHUYỂN ĐỔI (AS-IS vs TO-BE)

* **AS-IS (Thủ công):** Tải CV về máy ➔ Mở từng PDF gõ tay vào Excel ➔ Dùng `Ctrl+F` dò lọc ➔ Gửi mail/gọi điện thủ công không lưu lịch sử ➔ Đánh giá rời rạc qua chat ➔ Không gửi thư từ chối cho 80% ứng viên.
* **TO-BE (ReCoverX Career ATS):**
  1. Ứng viên tự nộp online (`1A`) hoặc HR nạp CV nội bộ (`1B`) ➔ Khử trùng lặp 30 ngày (`BRL-02`) & kiểm tra hạn mức 3 Job/90 ngày (`BRL-09`).
  2. Máy chủ tách văn bản bằng `pdf-parse` ➔ Hybrid AI bóc 5 trường cốt lõi & đối chiếu JD ➔ Tạo thẻ ở cột **`NEW`** (*Human-in-the-loop*).
  3. **Chuyên viên HR** kiểm tra 5 trường (có thể sửa tay nếu AI bóc sai), duyệt sơ bộ và chuyển tối đa đến **`SCREENING`** (hoặc `REJECTED` kèm lý do `BRL-11`).
  4. **Quản lý Chuyên môn (Hiring Manager)** thẩm định hồ sơ tại `SCREENING`, chuyển sang **`INTERVIEW`**, thiết lập lịch phỏng vấn & đánh giá bằng **Scorecard chuyên sâu** (`BRL-08`).
  5. **Hiring Manager** ra quyết định cuối cùng: chuyển **`HIRED`** (khi đã có Scorecard đạt chuẩn `BRL-06`) hoặc **`REJECTED`** (kèm lý do `BRL-11`).
  6. Hồ sơ `REJECTED` tự động kích hoạt đệm hoãn gửi email 12 giờ (`BRL-05`), đồng bộ **Talent Pool** và tự động thuộc diện Admin xóa vĩnh viễn sau 180 ngày (`BRL-10`).

*(Chi tiết sơ đồ phân làn BPMN 2.0 xem tại `[[BPMN-ATS-03]]`, Máy trạng thái xem tại `[[FSM-ATS-06]]`)*.

---

## V. DANH MỤC YÊU CẦU NGHIỆP VỤ CẤP CAO (BUSINESS REQUIREMENTS)

| Mã BR | Tên Yêu Cầu Nghiệp Vụ | Tác Nhân | Tiêu Chí Nghiệm Thu Định Lượng (Acceptance Criteria) | Ưu Tiên |
| :---: | :--- | :---: | :--- | :---: |
| **BR-01** | Cổng nộp hồ sơ & Tra cứu công khai | Ứng viên | Nộp CV `.pdf`/`.docx` ≤ 10MB không cần đăng nhập; tra cứu tiến độ tại `/jobs/tracker` ẩn 100% điểm AI và nhận xét nội bộ. | **P0 (Must)** |
| **BR-02** | Nạp CV nội bộ & Chứng chỉ đính kèm | HR, Admin | Hỗ trợ nạp CV phân nguồn (`LINKEDIN`, `REFERRAL`, `HEADHUNTER`), đính kèm bằng cấp/chứng chỉ và xem trước trực tiếp trên web. | **P0 (Must)** |
| **BR-03** | Khử trùng lặp & Hạn ngạch nộp | Hệ thống | Chặn nộp trùng `(Email, SĐT)` cùng Job trong 30 ngày (`BRL-02`) và chặn nộp quá 3 Job trong 90 ngày (`BRL-09`). | **P0 (Must)** |
| **BR-04** | Bóc tách 5 trường cốt lõi & HR sửa tay | Hệ thống, HR | Hiển thị ban đầu đúng 5 trường (Họ tên, Email, Vị trí, Kỹ năng, Kinh nghiệm), ẩn chi tiết dưới nút "Xem chi tiết"; HR/Admin được sửa thủ công và tự tính lại độ khớp JD. | **P0 (Must)** |
| **BR-05** | Đối chiếu Hybrid AI (Human-in-the-loop) | Hệ thống | Xử lý ≤ 5.0 giây/CV với `temperature: 0`, fallback NLP cục bộ khi lỗi mạng; 100% hồ sơ vào cột `NEW` để con người duyệt. | **P0 (Must)** |
| **BR-06** | Tự động hoãn Email từ chối & Lý do bắt buộc | Hệ thống, HR, HM | Mọi thao tác sang `REJECTED` bắt buộc lý do ≥ 5 ký tự (`BRL-11`); hoãn gửi email 12 giờ (`BRL-05`) và hủy tự động nếu phục hồi thẻ. | **P0 (Must)** |
| **BR-07** | Tìm kiếm, Lọc, Gắn sao & Đánh sáng CV | HR, HM | Phản hồi ≤ 1.5–3.0s; hỗ trợ lọc Chưa xem (đánh sáng viền xanh), Đánh sao ưu tiên và Chưa đánh giá. | **P0 (Must)** |
| **BR-08** | Kanban 5 cột, SLA & Phân tách quyền vòng | HR, HM, Admin | Áp dụng nghiêm State Machine (`BRL-STAGE-ORDER`), khóa `HIRED`; HR tối đa `SCREENING`, HM phụ trách `INTERVIEW`/`HIRED` & lịch phỏng vấn; cảnh báo SLA (`NEW > 48h`, `SCREENING > 72h`). | **P0 (Must)** |
| **BR-09** | Scorecard Chuyên sâu & Stage-Gate Hired | HR, HM | Chấm 3 tiêu chí trọng số (40/30/30 — `BRL-08`), ghi rõ căn cứ đậu; bắt buộc ≥ 01 Scorecard đạt trước khi chuyển `HIRED` (`BRL-06`). | **P0 (Must)** |
| **BR-10** | Kho nhân tài, Repooling & Dọn dẹp 180 ngày | HR, Admin | Lưu trữ tập trung hồ sơ `REJECTED`, cho phép Repooling sang Job mới; chỉ `ADMIN` được Hard Delete hồ sơ quá 180 ngày (`BRL-10`). | **P0 (Must)** |
| **BR-11** | Nhật ký Kiểm toán bất biến (Audit Trail) | Hệ thống | Ghi nhận 100% hành động chuyển cột, lý do từ chối, sửa hồ sơ, chấm Scorecard vào `AuditLog` (append-only). | **P0 (Must)** |
| **BR-12** | Xuất dữ liệu báo cáo chuẩn Excel | HR, Admin | Trích xuất danh sách ứng viên ra tệp `.csv` có UTF-8 BOM (`\uFEFF`) hiển thị đúng tiếng Việt trên Excel. | **P1 (Should)** |

---

## VI. YÊU CẦU TUÂN THỦ, RÀNG BUỘC & QUẢN TRỊ RỦI RO (COMPLIANCE & RISKS)

* **Tuân thủ pháp lý dữ liệu cá nhân (Nghị định 13/2023/NĐ-CP & GDPR):** Phân loại dữ liệu nhạy cảm (`PII` / `Restricted`) trong Từ điển dữ liệu 10 cột (`[[ERD-ATS-07]]`), che giấu điểm AI/nhận xét khỏi ứng viên (`NFR-SEC-04`) và xóa vĩnh viễn hồ sơ `REJECTED` quá 180 ngày (`BRL-10`).
* **Quản trị rủi ro kỹ thuật:**
  1. *Rủi ro dịch vụ AI bên thứ ba gián đoạn:* Giảm thiểu bằng Kiến trúc Lai 2 lớp (Fallback sang Heuristic NLP cục bộ máy chủ — 0% mất hồ sơ).
  2. *Rủi ro tệp mã độc giả mạo CV:* Giảm thiểu bằng kiểm tra chữ ký nhị phân Magic Bytes (`%PDF-` và `PK`), giới hạn ≤ 10MB và Rate Limit 5 lượt/10 phút/IP.
  3. *Rủi ro lộ quyền quản trị:* Giảm thiểu bằng Zero-Trust Edge Middleware (`src/middleware.ts`), băm mật khẩu PBKDF2-SHA512 (100,000 vòng lặp) và chữ ký phiên HMAC-SHA256.
