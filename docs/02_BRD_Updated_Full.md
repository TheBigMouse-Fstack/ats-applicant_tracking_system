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
* **Chi phí triển khai & vận hành (CAPEX / OPEX):** Hệ thống tự chủ hoàn toàn (không phải trả phí thuê bao phần mềm theo từng tài khoản nhân viên), kết hợp cơ chế AI lai 2 lớp giúp tiết kiệm tối đa chi phí xử lý hồ sơ (ước tính dưới 500.000 VNĐ/tháng cho 1.000 CV, tiết kiệm khoảng 15 – 30 triệu VNĐ/tháng so với thuê phần mềm tuyển dụng thương mại cho quy mô 20–50 nhân sự nội bộ).
* **Lợi ích vận hành dự kiến:** Tiết kiệm tối thiểu **80 – 120 giờ công HR/tháng**, loại bỏ hoàn toàn rủi ro thất lạc hồ sơ khi nhân sự HR nghỉ việc và rút ngắn đáng kể thời gian chốt ứng viên.

---

## III. PHẠM VI DỰ ÁN (SCOPE OF WORK)

### 1. Trong Phạm Vi (In-Scope)
1. **Xác thực & Quản trị Người dùng Nội bộ (`UC-00`):** Đăng nhập bảo mật bằng Email & Mật khẩu (mã hóa một chiều an toàn, tự động bảo vệ phiên làm việc chống giả mạo và chặn truy cập trái phép); quản trị tài khoản nội bộ theo 3 vai trò (`Quản trị viên`, `Chuyên viên HR`, `Quản lý chuyên môn`).
2. **Bảng Điều Khiển Tổng Quan Vận Hành theo Vai trò (`/admin/dashboard`):** Mỗi vai trò khi đăng nhập nhìn thấy đúng các chỉ số tổng quan, phễu 5 giai đoạn và danh sách hồ sơ cần xử lý ưu tiên thuộc phạm vi trách nhiệm của mình *(không phải báo cáo BI phân tích phức tạp)*.
3. **Cổng Tuyển Dụng Công Khai & Tra Cứu Tiến Độ (`UC-01`, `UC-01A`):** Ứng viên xem vị trí đang mở, nộp CV (`.pdf`, `.docx` tối đa 10MB, kiểm tra tính xác thực tệp gốc chống tệp giả mạo và giới hạn chống nộp spam 5 lượt/10 phút), đính kèm bằng cấp/chứng chỉ và tự tra cứu tiến độ trực tuyến (ẩn hoàn toàn điểm đánh giá nội bộ).
4. **Tiếp Nhận Nội Bộ, Trích Xuất 5 Trường Cốt Lõi & Chỉnh Sửa Thủ Công (`UC-02`):** HR nạp CV từ nhiều nguồn (LinkedIn, Giới thiệu nội bộ, Đối tác săn đầu người), tự động phát hiện trùng lặp trong 30 ngày, hiển thị gọn đúng **5 trường cốt lõi theo JD** (Họ tên, Email, Vị trí ứng tuyển, Kỹ năng, Số năm kinh nghiệm), ẩn phần thông tin mở rộng để tránh rối mắt, và cho phép HR tự sửa/bổ sung nếu máy đọc sót.
5. **Đối Chiếu AI 3 Mức Màu & Nguyên Tắc Con Người Quyết Định (`UC-03`):** Hệ thống tự động đối chiếu CV với JD và phân loại theo **3 mức màu trực quan** (Xanh lá `≥ 75%` Phù hợp cao / Vàng `50% – 74%` Tiềm năng cần cân nhắc / Đỏ `< 50%` Phù hợp thấp). 100% hồ sơ được đưa vào cột **Mới nộp** để HR kiểm duyệt (AI không tự ý đánh rớt ứng viên); khi có quyết định từ chối hợp lệ, hệ thống tự động hoãn gửi thư từ chối 12 giờ để có thể thu hồi nếu nhầm lẫn.
6. **Quản Trị Quy Trình 5 Giai Đoạn & Phân Quyền Chuyển Vòng (`UC-04`):** Bảng Kanban 5 cột (*Mới nộp → Sàng lọc tiêu chuẩn → Phỏng vấn → Tuyển chọn / Từ chối*), cảnh báo hồ sơ chờ xử lý quá hạn (>48h ở Mới nộp, >72h ở Sàng lọc), đánh dấu hồ sơ chưa xem, gắn sao ưu tiên, không cho phép nhảy cóc giai đoạn, khóa hồ sơ đã tuyển chọn và bắt buộc ghi rõ lý do khi từ chối. Phân tách rõ thẩm quyền: **HR chuyển tối đa đến vòng Sàng lọc tiêu chuẩn**, **Quản lý chuyên môn phụ trách vòng Phỏng vấn và Tuyển chọn**.
7. **Lịch Phỏng Vấn & Phiếu Đánh Giá Trực Tiếp (`UC-05`, `UC-05A`):** Xếp lịch, đổi lịch, hủy lịch phỏng vấn, ghi chú trước/sau phỏng vấn; chấm Phiếu đánh giá trực tiếp trên tab riêng theo 3 tiêu chí có trọng số (Chuyên môn 40%, Giao tiếp 30%, Văn hóa 30%), bắt buộc có tối thiểu 01 phiếu đạt chuẩn trước khi xác nhận Tuyển chọn.
8. **Kho Nhân Tài 3 Nhóm Dự Phòng, Dọn Dẹp 180 Ngày & Xuất Báo Cáo Excel (`UC-06`, `UC-07`):** Lưu trữ tập trung các hồ sơ đã qua sàng lọc theo 3 nhóm thực tế (*Tiềm năng dự bị*, *Đang chờ đợt khác*, *Lưu trữ dự phòng* — loại trừ hồ sơ mới chưa xem và nhân sự đã tuyển), hỗ trợ khôi phục luân chuyển sang vị trí mới, Quản trị viên dọn dẹp vĩnh viễn hồ sơ từ chối quá 180 ngày và xuất danh sách ra tệp bảng tính mở chuẩn tiếng Việt trên Excel.

### 2. Ngoài Phạm Vi (Out-of-Scope)
* Kết nối đăng tin và đồng bộ hồ sơ tự động hai chiều với các sàn tuyển dụng bên ngoài (TopCV, VietnamWorks, LinkedIn).
* Quét chữ từ ảnh chụp CV mờ/nghiêng; thi trắc nghiệm/lập trình trực tuyến; gọi video tích hợp sẵn; ký hợp đồng điện tử pháp lý; gửi SMS/Zalo tự động; phân tích BI nâng cao và quản trị nhân sự/tính lương sau khi nhận việc. *(Chi tiết đối chiếu xem tại `[[SCOPE-ATS-10]]`)*.

---

## IV. QUY TRÌNH CHUYỂN ĐỔI (AS-IS vs TO-BE)

* **AS-IS (Thủ công):** Tải CV về máy ➔ Mở từng file gõ tay vào Excel ➔ Tìm kiếm thủ công từng từ ➔ Gửi mail/gọi điện rời rạc không lưu lịch sử ➔ Đánh giá cảm tính qua tin nhắn chat ➔ Hơn 80% ứng viên không nhận được phản hồi.
* **TO-BE (Hệ thống ATS — Applicant Tracking System):**
  1. Ứng viên tự nộp trực tuyến hoặc HR nạp CV nội bộ ➔ Hệ thống kiểm tra chống nộp trùng trong 30 ngày và giới hạn tối đa 3 vị trí trong 90 ngày.
  2. Hệ thống đọc nội dung CV ➔ Bóc tách gọn 5 trường cốt lõi & chấm mức độ phù hợp với JD (3 mức màu) ➔ Đưa vào cột **Mới nộp** để con người kiểm duyệt.
  3. **Chuyên viên HR** kiểm tra 5 trường (có thể sửa tay nếu cần), duyệt sơ bộ và chuyển tối đa đến **Sàng lọc tiêu chuẩn** (hoặc **Từ chối** kèm lý do cụ thể).
  4. **Quản lý Chuyên môn (Hiring Manager)** xem hồ sơ tại vòng Sàng lọc, duyệt sang **Phỏng vấn**, xếp lịch hẹn & chấm điểm trực tiếp trên tab **Phiếu đánh giá**.
  5. **Quản lý Chuyên môn** ra quyết định cuối cùng: chuyển **Tuyển chọn** (khi đã có phiếu đánh giá đạt chuẩn) hoặc **Từ chối** (kèm lý do cụ thể).
  6. Hồ sơ bị từ chối tự động hẹn hoãn gửi thư phản hồi 12 giờ, đồng bộ vào **Kho Nhân Tài** (phân loại nhóm Tiềm năng dự bị / Lưu trữ dự phòng) và được Quản trị viên rà soát xóa vĩnh viễn sau 180 ngày.

*(Chi tiết sơ đồ quy trình xem tại `[[BPMN-ATS-03]]`, Vòng đời trạng thái xem tại `[[FSM-ATS-06]]`)*.

---

## V. DANH MỤC YÊU CẦU NGHIỆP VỤ CẤP CAO (BUSINESS REQUIREMENTS)

| Mã BR | Tên Yêu Cầu Nghiệp Vụ | Tác Nhân | Tiêu Chí Nghiệm Thu Định Lượng (Acceptance Criteria) | Ưu Tiên |
| :---: | :--- | :---: | :--- | :---: |
| **BR-01** | Cổng nộp hồ sơ & Tra cứu công khai | Ứng viên | Nộp CV `.pdf`/`.docx` ≤ 10MB không cần tạo tài khoản; tự tra cứu tiến độ trực tuyến và tuyệt đối không thấy điểm đánh giá nội bộ. | **P0 (Must)** |
| **BR-02** | Nạp CV nội bộ & Chứng chỉ đính kèm | HR, Admin | Hỗ trợ nạp CV từ nhiều nguồn tuyển dụng, đính kèm ảnh/PDF bằng cấp chứng chỉ và xem trực tiếp trên trình duyệt. | **P0 (Must)** |
| **BR-03** | Khử trùng lặp & Hạn ngạch nộp | Hệ thống | Chặn nộp trùng Email/SĐT cho cùng 1 vị trí trong 30 ngày và giới hạn tối đa 3 vị trí trong 90 ngày. | **P0 (Must)** |
| **BR-04** | Bóc tách 5 trường cốt lõi & HR sửa tay | Hệ thống, HR | Mặc định hiển thị gọn đúng 5 trường (Họ tên, Email, Vị trí, Kỹ năng, Kinh nghiệm), ẩn thông tin mở rộng dưới nút "Xem chi tiết hồ sơ"; HR/Admin được sửa tay và hệ thống tự cập nhật mức độ phù hợp JD. | **P0 (Must)** |
| **BR-05** | Đối chiếu AI 3 mức màu (Con người quyết định) | Hệ thống | Xử lý ≤ 5 giây/CV, cho kết quả nhất quán, tự động chuyển sang bộ lọc dự phòng khi mất kết nối AI; 100% hồ sơ vào cột Mới nộp để HR kiểm duyệt. | **P0 (Must)** |
| **BR-06** | Hoãn thư từ chối 12 giờ & Bắt buộc lý do | Hệ thống, HR, HM | Mọi thao tác Từ chối bắt buộc nhập lý do rõ ràng (≥ 5 ký tự); hẹn hoãn gửi thư từ chối 12 giờ và tự hủy nếu khôi phục hồ sơ trong thời gian chờ. | **P0 (Must)** |
| **BR-07** | Tìm kiếm nhanh, Lọc, Gắn sao & Chấm chưa xem | HR, HM | Tìm kiếm theo tên, email, kỹ năng không phân biệt chữ hoa/thường với tốc độ ≤ 3 giây; hỗ trợ lọc Chưa xem (chấm xanh tĩnh dịu mắt), Gắn sao ưu tiên. | **P0 (Must)** |
| **BR-08** | Kanban 5 cột, Cảnh báo quá hạn & Phân quyền vòng | HR, HM, Admin | Bắt buộc đi đúng thứ tự 5 giai đoạn, khóa hồ sơ đã Tuyển chọn; HR tối đa Sàng lọc, Quản lý chuyên môn phụ trách Phỏng vấn & Tuyển chọn; cảnh báo hồ sơ chờ quá 48h/72h. | **P0 (Must)** |
| **BR-09** | Phiếu Đánh Giá & Điều kiện Tuyển chọn | HR, HM | Chấm điểm trực tiếp trên tab riêng theo 3 tiêu chí (40/30/30), ghi rõ điểm mạnh làm căn cứ tuyển; bắt buộc ≥ 01 phiếu đạt chuẩn mới được chuyển Tuyển chọn. | **P0 (Must)** |
| **BR-10** | Kho Nhân Tài 3 nhóm & Dọn dẹp 180 ngày | HR, Admin | Chỉ đưa hồ sơ đã qua sàng lọc/từ chối vào Kho nhân tài (loại trừ hồ sơ mới & đã tuyển), phân 3 nhóm dự phòng, cho phép khôi phục sang vị trí mới; chỉ Admin được xóa vĩnh viễn hồ sơ quá 180 ngày. | **P0 (Must)** |
| **BR-11** | Nhật ký Lịch sử bất biến | Hệ thống | Tự động ghi lại toàn bộ lịch sử chuyển vòng, lý do từ chối, chỉnh sửa hồ sơ và đánh giá phỏng vấn, không cho phép sửa xóa dấu vết. | **P0 (Must)** |
| **BR-12** | Xuất dữ liệu báo cáo chuẩn Excel | HR, Admin | Trích xuất danh sách ứng viên ra tệp bảng tính CSV hiển thị chuẩn tiếng Việt có dấu khi mở trực tiếp bằng Microsoft Excel. | **P1 (Should)** |

---

## VI. YÊU CẦU TUÂN THỦ, RÀNG BUỘC & QUẢN TRỊ RỦI RO (COMPLIANCE & RISKS)

* **Tuân thủ pháp lý bảo vệ dữ liệu cá nhân (Nghị định 13/2023/NĐ-CP):** Phân loại rõ dữ liệu nhạy cảm của ứng viên, ẩn toàn bộ điểm đánh giá nội bộ trên trang tra cứu công khai và hỗ trợ Quản trị viên xóa vĩnh viễn hồ sơ bị từ chối sau 180 ngày lưu trữ.
* **Quản trị rủi ro vận hành:**
  1. *Rủi ro dịch vụ AI gián đoạn hoặc mất mạng:* Giảm thiểu bằng cơ chế dự phòng 2 lớp tự động chạy cục bộ — đảm bảo không bao giờ mất hồ sơ và vẫn tiếp tục sàng lọc bình thường.
  2. *Rủi ro tệp tin giả mạo / nộp đơn rác hàng loạt:* Giảm thiểu bằng bước kiểm tra tính hợp lệ cấu trúc tệp tin gốc (chỉ nhận PDF/DOCX thật, tối đa 10MB) và giới hạn tần suất nộp đơn.
  3. *Rủi ro truy cập trái phép dữ liệu nội bộ:* Giảm thiểu bằng cơ chế mã hóa mật khẩu một chiều, bảo vệ phiên đăng nhập chống giả mạo và tự động chặn mọi truy cập chưa đăng nhập hoặc vượt quá quyền vai trò *(chi tiết kỹ thuật bảo mật xem tại Tài liệu Kiến trúc số 13 & 15)*.
