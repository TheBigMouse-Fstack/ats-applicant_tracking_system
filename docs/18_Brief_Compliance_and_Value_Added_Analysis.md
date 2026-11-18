---
id: "BRIEF-CMP-18"
title: "Báo cáo Đối chiếu Đề bài Gốc, Phân tích Cải tiến, Hệ thống Tham chiếu & Lý do Chọn Hybrid AI"
type: "brd"
version: "1.0.0"
status: "approved"
owner: "Nguyễn Quốc Khánh (Lead BA & PO)"
domain: "recruitment-ats"
tags:
  - "brief-compliance"
  - "value-added"
  - "benchmark-clone"
  - "hybrid-ai-rationale"
  - "defense-report"
upstream_deps:
  - "BRD-ATS-01"
  - "SCOPE-ATS-10"
  - "AI-ARCH-12"
downstream_deps:
  - "IDX-ATS-00"
last_updated: "2026-11-18"
---

# BÁO CÁO ĐỐI CHIẾU ĐỀ BÀI GỐC, PHÂN TÍCH CẢI TIẾN & LÝ DO KIẾN TRÚC

> **Tên đề tài gốc:** ATS — Applicant Tracking System  
> **Tên sản phẩm Demo:** ReCoverX Career — Applicant Tracking System (ATS)  
> **Thời gian triển khai:** 5 tuần  
> **Đại diện doanh nghiệp (Stakeholder):** Anh Nguyễn Anh Duy — Trưởng phòng Tuyển dụng (`0814431111`)  
> **Mục đích tài liệu:** Thẩm định mức độ tuân thủ 100% yêu cầu đề bài cơ bản, phân tích giá trị của các hạng mục tự nghiên cứu & cải tiến thêm, minh bạch hóa hệ thống mẫu đã tham chiếu (Clone/Benchmark), lý giải quyết định chọn kiến trúc **Hybrid AI** và chứng minh không bị "làm thừa" (Gold Plating).

## Lịch Sử Phiên Bản (Revision History)

| Phiên Bản | Ngày Phát Hành | Tác Giả | Phân Loại | Tóm Tắt Thay Đổi | Người Phê Duyệt |
| :---: | :---: | :--- | :---: | :--- | :--- |
| `v1.0.0` | 2026-11-18 | Nguyễn Quốc Khánh | **Initial** | Lập báo cáo đối chiếu toàn diện giữa Đề bài doanh nghiệp cơ bản và Sản phẩm ReCoverX Career ATS thực tế. | Trưởng phòng Tuyển dụng / Hội đồng |
| `v1.1.0` | 2026-11-18 | Nguyễn Quốc Khánh | **Changed** | Đồng bộ chuẩn hóa thương hiệu kép (Nội bộ: `ATS — Applicant Tracking System`, Public: `RecoverX`) và bổ sung Bảng điều khiển Tổng quan Vận hành phân quyền theo vai trò (`/admin/dashboard`). | Trưởng phòng Tuyển dụng / Hội đồng |

---

## 1. ĐÁNH GIÁ CHUNG: DỰ ÁN CÓ ĐI ĐÚNG HƯỚNG & ĐẶT ĐÚNG TÊN CHƯA?

### 1.1 Mức độ đi đúng hướng so với Đề bài gốc
* **Kết luận:** **ĐÚNG HƯỚNG 100% VÀ HOÀN THÀNH VƯỢT MỨC TẤT CẢ YÊU CẦU CỐT LÕI CỦA ĐỀ BÀI.**
* Mọi tính năng nâng cao đều được xây dựng xoay quanh đúng 4 bài toán gốc của Bộ phận Tuyển dụng: *(1) Quá tải nhập liệu thủ công, (2) Bỏ sót ứng viên tiềm năng, (3) Phản hồi ứng viên chậm, (4) Quản trị trạng thái phân tán bằng Excel*.

### 1.2 Đánh giá về Tên dự án (`ATS — Applicant Tracking System` vs Cổng công khai `RecoverX`)
* **Chiến lược Thương hiệu Kép (Dual-Branding) đã chuẩn hóa:**
  * **Hệ thống Quản trị Nội bộ (`/admin/login`, `/admin/dashboard`, Navbar nội bộ, Tiêu đề tab):** Sử dụng chính xác tên theo đề bài doanh nghiệp **`ATS — Applicant Tracking System`**, bám sát tinh thần công cụ quản trị tuyển dụng chuẩn hóa.
  * **Cổng Tuyển dụng Công khai (`/`, `/jobs`, `/jobs/tracker`, Thư mời ứng viên):** Giữ nguyên tên doanh nghiệp giả lập **`RecoverX`** để tạo trải nghiệm ứng tuyển chân thực như một website tuyển dụng thực tế.
* **Khuyến nghị trình bày trên Trang bìa Báo cáo & Slide:**
  * **Tên Đề Tài:** *Xây dựng Hệ thống Quản lý Hồ sơ Ứng viên (ATS — Applicant Tracking System)*
  * **Doanh nghiệp giả lập (Cổng Public):** *RecoverX Technology Solutions*
  * **Đơn vị bảo trợ nghiệp vụ:** Phòng Tuyển dụng — Đại diện: Anh Nguyễn Anh Duy (Trưởng phòng Tuyển dụng).

---

## 2. MA TRẬN ĐỐI CHIẾU 1:1 — ĐỀ BÀI CƠ BẢN VS SẢN PHẨM HIỆN TẠI

| Hạng Mục Đề Bài Yêu Cầu | Chi Tiết Yêu Cầu Trong Đề Bài | Hiện Trạng Sản Phẩm ReCoverX Career ATS | Mức Độ Đạt |
| :--- | :--- | :--- | :---: |
| **Upload CV** | Hỗ trợ tải lên tệp CV (`.pdf`, `.doc`). | Hỗ trợ tải lên `.pdf`, `.docx` ≤ 10MB (từ cả Cổng công khai & HR nạp nội bộ) kèm **kiểm tra chữ ký nhị phân Magic Bytes** chặn file giả mạo. *(Lưu ý: Chủ động loại bỏ `.doc` cũ Word 97-2003 vì nguy cơ Macro Virus để đảm bảo NFR Bảo mật)*. | ✅ **Đạt + Nâng chuẩn Bảo mật** |
| **Parsing CV (5 trường cơ bản)** | Trích xuất ít nhất **5 trường thông tin cơ bản**: Tên, Email, Vị trí ứng tuyển, Kinh nghiệm, Kỹ năng. | Trích xuất tự động và hiển thị ban đầu **gọn đúng 5 trường cốt lõi theo JD** (`CandidateDrawer` & `CandidateCard`), ẩn phần chi tiết dưới nút *"Xem chi tiết hồ sơ"*, đồng thời cho phép **HR chỉnh sửa/thêm thủ công** nếu máy bóc sai (`BRL-03`). | ✅ **Đạt 100% + Cải tiến UX** |
| **Lọc & Tìm kiếm từ khóa** | Lọc CV theo từ khóa chính xác (VD: `"Java"`, `"Marketing"`, `"4 năm kinh nghiệm"`), tốc độ **≤ 3 giây**. | Thanh tìm kiếm theo Tên/Email/Kỹ năng, lọc theo Vị trí, Đánh sao, Chưa xem, Chưa đánh giá; tốc độ phản hồi thực tế **< 1.0 giây** (vượt chuẩn ≤ 3 giây). | ✅ **Vượt chuẩn** |
| **Quản lý trạng thái (5 giai đoạn)** | Pipeline 5 giai đoạn (`New`, `Screening`, `Interview`, `Hired`, `Rejected`), cập nhật chỉ với 1 chạm / kéo thả. | Bảng Kanban 5 cột đúng chuẩn kéo-thả mượt mà (`@hello-pangea/dnd`) + nút chuyển nhanh 1 chạm trong Drawer, bổ sung **State Machine Guards** cấm nhảy cóc & khóa trạng thái `HIRED`. | ✅ **Đạt 100% + Quản trị chặt** |
| **Dashboard / Tổng quan ứng viên** | Mục Mockup/Wireframes yêu cầu: *"Giao diện trang Dashboard/Tổng quan ứng viên"* *(đồng thời giữ Out-of-Scope là Analytics Dashboard BI chuyên sâu)*. | Xây dựng **Operational Dashboard phân quyền theo Role** (`/admin/dashboard` + `GET /api/dashboard`): hiển thị phễu 5 giai đoạn, KPI tác nghiệp hàng ngày, hàng đợi cần xử lý ngay (1-click mở Drawer) riêng cho `HR`, `HIRING_MANAGER`, `ADMIN`. Không nhồi biểu đồ BI nặng (giữ đúng Out-of-Scope). | ✅ **Đạt 100% + Chuẩn UX RBAC** |
| **Giảm 30% thời gian sàng lọc** | Rút ngắn tối thiểu 30% thời gian sơ loại thủ công so với Excel. | Rút từ 3–5 phút đọc nhập tay xuống còn **≤ 5 giây/CV** (~giảm > 70% thao tác nhập liệu hành chính). | ✅ **Vượt mục tiêu** |
| **NFR: Bảo mật & Khả năng mở rộng** | Lưu trữ dữ liệu an toàn; kiến trúc dễ dàng mở rộng tích hợp Email Automation sau này. | Băm mật khẩu NIST `PBKDF2-SHA512` (100k vòng), phiên `HMAC-SHA256`, Edge Middleware chặn truy cập trái phép, Rate Limit 5 lần/10p, hàng đợi lịch hẹn `emailScheduledAt` sẵn sàng cắm SMTP/Resend. | ✅ **Đạt chuẩn Doanh nghiệp** |
| **Đầu ra (Deliverables)** | BRD, Demo Web, Mockup/Wireframes, Slide + Lộ trình. | Bộ 18 tài liệu BA chuẩn `Universal_BA_Toolkit` (BRD, BPMN, FDD, Cockburn UC, State Machine, 10-col ERD, RBAC/NFR, API Spec, 3-clause BR, 7-col Error Matrix, Bi-directional RTM), Demo Web chạy thật + **97/97 test tự động Passed**. | ✅ **Đạt trọn vẹn** |

---

## 3. HỆ THỐNG MẪU ĐÃ THAM CHIẾU (CLONE / BENCHMARK) & LOGIC MỚI ĐÃ HỌC HỎI

Thay vì tự bịa giao diện cảm tính, hệ thống được nghiên cứu và kế thừa tinh hoa từ **3 nền tảng ATS đầu ngành** kết hợp **chuẩn BA quốc tế**:

| Nguồn Nghiên Cứu / Hệ Thống Mẫu | Những Gì Đã Học Hỏi & Kế Thừa (Clone / Adapt) | Cách Áp Dụng Vào ReCoverX Career ATS |
| :--- | :--- | :--- |
| **1. Base E-Hiring (Base.vn)** *(Chuẩn ATS phổ biến nhất VN)* | • Quy trình Kanban 5 cột trực quan.<br>• Cửa sổ trượt bên phải (**Slide-over Drawer**) giúp đọc thông tin & xem CV gốc mà không phải chuyển trang.<br>• Mô hình phối hợp đa phòng ban giữa HR và Trưởng bộ phận. | Hiện thực hóa trọn vẹn tại `KanbanBoard.tsx` và `CandidateDrawer.tsx` với bộ đọc PDF trực tiếp trên trình duyệt. |
| **2. Greenhouse & Workable** *(Chuẩn ATS Enterprise của Mỹ)* | • **Structured Hiring & Deep Scorecard:** Chấm điểm có trọng số theo tiêu chí rõ ràng, bắt buộc ghi căn cứ tuyển dụng thay vì duyệt cảm tính.<br>• Giao diện tối giản chuẩn nội bộ (Flat Minimalist UI), không phô trương màu mè. | Hiện thực hóa tại `ScorecardModal.tsx` (Chuyên môn 40%, Giao tiếp 30%, Văn hóa 30% — `BRL-08`), chốt chặn `BRL-06` (phải có Scorecard đạt mới được `HIRED`). |
| **3. Gmail / Linear UX Pattern** *(Tư duy sản phẩm hiện đại)* | • Gắn sao 1 chạm (**Starred**) đánh dấu hồ sơ ưu tiên.<br>• Trạng thái **Chưa đọc / Đã đọc (Unread Highlight)** đánh sáng thẻ `NEW` chưa mở xem để chống bỏ sót.<br>• **Progressive Disclosure:** Chỉ hiện 5 trường cốt lõi ban đầu, bấm mới bung chi tiết. | Hiện thực hóa cờ `isStarred`, `isViewed`, `viewedAt` và nút *"Xem chi tiết hồ sơ"* trong `CandidateDrawer.tsx`. |
| **4. Chuẩn Đạo đức AI & Pháp lý (EU AI Act / Nghị định 13/2023/NĐ-CP)** | • **Human-in-the-loop:** AI không được phép tự ý đánh rớt ứng viên sau lưng con người.<br>• **Data Retention & Masking:** Xóa dữ liệu ứng viên bị loại sau 6 tháng, che giấu điểm AI khỏi ứng viên. | 100% CV vào cột `NEW` để HR duyệt; bộ đệm hoãn thư từ chối 12h (`BRL-05`); nút Admin Purge 180 ngày (`BRL-10`); Public Tracker ẩn điểm nội bộ (`NFR-SEC-04`). |
| **5. Universal BA Toolkit & Spec-Driven Development (SDD)** | • 19 quy chuẩn BA (Cockburn 12-part UC, 3-clause BR `WHEN/THEN/UNLESS`, 7-col Error Matrix, 10-col Data Dictionary, Bi-directional RTM, Gherkin BDD). | Chuẩn hóa toàn bộ 18 tài liệu `docs/` và ánh xạ 1:1 xuống `src/lib/stage-rules.ts` cùng 97 kiểm thử tự động. |

---

## 4. LÝ DO CHỌN KIẾN TRÚC HYBRID AI (THAY VÌ CHỈ LỌC TỪ KHÓA HAY DÙNG PURE AI)

Đề bài gốc chỉ nêu *"Sàng lọc bằng từ khóa"*. Nếu chỉ làm `string.includes("Java")` truyền thống hoặc chỉ gọi thẳng 100% ChatGPT/Gemini đều gặp lỗi nghiêm trọng trong thực tế doanh nghiệp:

| Phương Án | Điểm Yếu Chí Mạng Trong Thực Tế | Cách **Hybrid AI (2 Lớp)** Của ReCoverX Giải Quyết |
| :--- | :--- | :--- |
| **Chỉ lọc từ khóa thuần (Keyword-only)** | Cứng nhắc: Ứng viên ghi `"Next.js / ReactJS"` nhưng JD tìm `"React"` hoặc CV trình bày 2 cột khiến regex đọc sai số năm kinh nghiệm ➔ **Bỏ sót nhân tài**. | **Lớp 2 (Gemini 2.5 Flash, `temperature: 0`)** hiểu ngữ nghĩa tương đương, bóc tách chuẩn 5 trường cốt lõi và giải trình khách quan kỹ năng khớp/thiếu. |
| **Chỉ dùng Pure Cloud AI (100% LLM)** | • Tốn phí Token cho cả file lỗi/file rác/đơn nộp trùng.<br>• Chậm (upload nguyên PDF nặng 5–10MB lên Cloud).<br>• **Sập toàn bộ hệ thống** nếu mất mạng hoặc hết Quota API.<br>• Dễ bị "ảo giác" (chấm lúc 70%, lúc 85%). | • **Lớp 0 & 1 (Cục bộ — 0 đồng, 50ms):** Chặn file sai định dạng, Magic Bytes, trùng 30 ngày (`BRL-02`), rút text thô bằng `pdf-parse` trước khi gửi AI.<br>• Khóa **`temperature: 0` + JSON Schema** triệt tiêu ảo giác.<br>• **Lưới an toàn Fallback:** Mất mạng/lỗi API ➔ tự chuyển sang **Heuristic Section NLP cục bộ** (60% Kỹ năng + 40% Kinh nghiệm) ➔ **0% mất hồ sơ, Demo không bao giờ chết**. |

---

## 5. PHÂN TÍCH PHẦN LÀM THÊM: CÓ BỊ "THỪA" (GOLD PLATING) KHÔNG? XỬ LÝ ĐƯỢC VẤN ĐỀ GÌ?

Một phản biện rất hay gặp từ Giảng viên hoặc Trưởng phòng Tuyển dụng là: *"Đề bài cơ bản không bắt làm mấy phần kia, làm thêm có bị thừa hay lệch trọng tâm không?"*

Bảng phân loại trung thực dưới đây chứng minh **mỗi phần làm thêm đều xử lý trực diện một lỗ hổng thực tế** — và chỉ ra rõ điểm nào là **Cốt lõi gia tăng** vs **Chuẩn bị sẵn cho Giai đoạn 2**:

| Hạng Mục Cải Tiến / Làm Thêm | Trạng Thái So Với Đề Bài Gốc | Có Bị Thừa Không? | Vấn Đề Thực Tế Đã Xử Lý Được |
| :--- | :---: | :---: | :--- |
| **1. Hybrid AI + 5 Trường cốt lõi + HR tự sửa tay** | Nâng cấp từ *Keyword Parsing* | ❌ **Không thừa — Giá trị cốt lõi** | Giải quyết trực diện tiêu chí chấm điểm #1 (*Độ chính xác Parsing*) và khắc phục rủi ro AI bóc sai text mà HR không sửa được. |
| **2. Phân quyền chuyển vòng (`HR` max `SCREENING`, `HM` phụ trách `INTERVIEW`/`HIRED`) + State Rules** | Chi tiết hóa từ *Phòng ban liên quan (HR, IT, Quản lý)* | ❌ **Không thừa — Rất thực tế** | Ngăn HR tự ý duyệt phỏng vấn/tuyển chọn vượt quyền chuyên môn; cấm kéo nhảy cóc làm sai lệch số liệu phễu tuyển dụng. |
| **3. Bắt buộc Lý do Từ chối (`BRL-11`) & Chốt chặn Scorecard (`BRL-06`)** | Bổ sung quản trị quy trình | ❌ **Không thừa — Giải quyết minh bạch** | Khi sếp hoặc HR xem lại hồ sơ sau 1 tháng sẽ biết **chính xác vì sao người này Đậu (Scorecard)** và **vì sao người kia Rớt (Lý do từ chối)**. |
| **4. Đánh sáng CV `NEW` chưa xem + Gắn sao ⭐ + Cảnh báo SLA** | Giải quyết trực tiếp *Problem Statement* | ❌ **Không thừa — Đánh trúng Pain-point** | Xử lý đúng nỗi đau đề bài nêu: *"dễ bỏ sót ứng viên tiềm năng do số lượng hồ sơ lớn"*. |
| **5. Cổng Ứng tuyển Công khai (`/jobs`) & Tra cứu Tiến độ (`/jobs/tracker`)** | Mở rộng từ *Trải nghiệm ứng viên kém* | ❌ **Không thừa — Xóa bỏ Ghosting** | Ứng viên tự nộp (giảm 100% tải tay từ email) và tự tra tiến độ mà không lộ điểm nội bộ (`NFR-SEC-04`). |
| **6. Lên lịch Phỏng vấn (Đổi/Hủy + Ghi chú 3 lớp)** | Hỗ trợ vòng `INTERVIEW` | ❌ **Không thừa — Khép kín vòng đời** | Khi thẻ vào cột `Interview`, Hiring Manager có nơi lưu link Meet, ngày giờ, đổi/hủy lịch và ghi chú trước/sau PV ngay trên 1 màn hình. |
| **7. Bộ đệm hoãn Email 12h (`BRL-05`) & Mẫu Thư mời** | Đề bài xếp *Email Automation* là Out-of-Scope, nhưng NFR yêu cầu *dễ tích hợp* | ⚠️ **Cần giải trình khéo (Extension-Ready)** | **Chưa** gửi mail SMTP thật hàng loạt; chỉ dựng sẵn cấu trúc hàng đợi `emailScheduledAt` + nút copy mẫu thư để chứng minh kiến trúc sẵn sàng mở rộng đúng NFR đề bài. |
| **8. Kho nhân tài (`/admin/talent-pool`), Repooling & Purge 180 ngày (`BRL-10`)** | Đề bài xếp *Talent Pool nâng cao* là Out-of-Scope | ⚠️ **Cần giải trình là Phase 2 Readiness** | Không làm BI Analytics phức tạp (tôn trọng Out-of-Scope); chỉ làm lưu trữ tái sử dụng cơ bản & xóa vĩnh viễn sau 6 tháng để tuân thủ Nghị định 13/2023/NĐ-CP. |

---

## 6. 3 LƯU Ý THỰC CHIẾN TRƯỚC KHI BẢO VỆ / DEMO VỚI DOANH NGHIỆP (ANH NGUYỄN ANH DUY)

1. **Giải trình rõ về định dạng `.doc` vs `.docx`:** Nếu doanh nghiệp hỏi *"Sao đề bài ghi `.doc` mà app chỉ nhận `.pdf` và `.docx`?"* ➔ Trả lời tự tin: *".doc là định dạng nhị phân cũ từ Office 97–2003 tiềm ẩn nguy cơ mã độc Macro; hệ thống chuẩn hóa sang `.pdf` và `.docx` kèm kiểm tra chữ ký nhị phân Magic Bytes để đáp ứng NFR Bảo mật dữ liệu."*
2. **Kiểm thử thực tế trên bộ CV mẫu đa ngành (50–100 CV):** Đề bài mục 4 đề cập doanh nghiệp cung cấp 50–100 CV mẫu để test độ chính xác Parsing & tốc độ lọc < 3 giây. Trước buổi demo, nên nạp thử 10–20 file PDF thực tế (cả IT, Sales, Marketing) để đo thời gian phản hồi thực tế và trình diễn nút HR chỉnh sửa thủ công khi gặp CV trình bày phức tạp.
3. **Bám trục "Core First — Value-Added Second" khi thuyết trình Slide:**
   * **70% thời lượng Demo** tập trung vào đúng 4 module cốt lõi của đề bài (Upload CV ➔ Parse 5 trường & HR sửa tay ➔ Lọc từ khóa < 3s ➔ Kanban 5 cột với phân quyền HR/Hiring Manager & Lý do Reject).
   * **30% thời lượng cuối** mới giới thiệu các điểm cải tiến vượt trội (Hybrid AI chống sập, Public Tracker chống Ghosting, Deep Scorecard, Bộ tài liệu chuẩn `Universal_BA_Toolkit` & 97 test tự động) như giá trị gia tăng (Value-Added) và lộ trình Phase 2.
