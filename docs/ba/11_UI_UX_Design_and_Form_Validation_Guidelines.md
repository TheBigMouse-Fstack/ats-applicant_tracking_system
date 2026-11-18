---
id: "UIUX-ATS-11"
title: "Quy chuẩn Trải nghiệm Người dùng (UI/UX) & Quy tắc Kiểm tra Dữ liệu Biểu mẫu"
type: "spec"
version: "2.2.0"
status: "approved"
owner: "ATS BA & Product Team"
domain: "recruitment-ats"
tags:
  - "ui-ux"
  - "validation"
  - "enterprise-design"
  - "non-tech-friendly"
upstream_deps:
  - "FDD-ATS-04"
downstream_deps:
  - "GUIDE-TECH-09"
last_updated: "2026-11-18"
---

# QUY CHUẨN TRẢI NGHIỆM NGƯỜI DÙNG (UI/UX) & QUY TẮC KIỂM TRA DỮ LIỆU BIỂU MẪU

> **Hệ thống nội bộ:** ATS — Applicant Tracking System *(Cổng ứng tuyển công khai giả lập: RecoverX)*  
> **Đối tượng đọc:** Ban Giám đốc, Trưởng phòng Tuyển dụng, BA, Designer & Đội phát triển.  
> **Mục tiêu:** Đảm bảo giao diện quản trị gọn mắt, dễ sử dụng ngay lần đầu, không trùng lặp nút thao tác, và mọi thông báo lỗi đều viết bằng tiếng Việt tự nhiên, dễ hiểu cho người dùng cuối.

---

## Lịch Sử Phiên Bản (Revision History)

| Phiên Bản | Ngày Phát Hành | Tác Giả | Phân Loại | Tóm Tắt Thay Đổi | Phê Duyệt |
| :---: | :---: | :--- | :---: | :--- | :--- |
| `v2.0.0` | 2026-11-18 | BA Team | **Changed** | Chuẩn hóa theo bộ tiêu chuẩn Universal BA Toolkit. | Product Owner |
| `v2.2.0` | 2026-11-18 | BA Team | **Changed** | Viết lại bằng ngôn ngữ nghiệp vụ thân thiện cho người đọc phi kỹ thuật; bổ sung quy tắc kiểm tra dữ liệu đầu vào (tìm kiếm, email, SĐT, tải tệp), nguyên tắc dịu mắt (60-30-10), tách bạch Tổng quan vs Chi tiết và loại bỏ hoàn toàn mã kỹ thuật khỏi thông báo người dùng. | Product Owner & Trưởng phòng Tuyển dụng |

---

## I. NGUYÊN TẮC THIẾT KẾ GIAO DIỆN DOANH NGHIỆP (ENTERPRISE UX PRINCIPLES)

1. **Dịu mắt & Tối giản (Visual Calm — Quy tắc màu 60-30-10):**
   * Sử dụng nền trắng và xám nhạt làm chủ đạo cho toàn bộ không gian làm việc nội bộ.
   * **Không sử dụng hiệu ứng chớp nháy** gây mỏi mắt trên danh sách ứng viên (chỉ dùng một chấm tròn xanh tĩnh để nhận diện hồ sơ mới chưa xem).
   * Màu sắc chỉ dùng cho các tín hiệu nghiệp vụ có ý nghĩa: **Đánh giá AI 3 mức màu** (Xanh lá ≥75% Phù hợp cao / Vàng 50–74% Cân nhắc / Đỏ <50% Phù hợp thấp) và **Cảnh báo đỏ** khi hồ sơ chờ quá hạn xử lý.
2. **Tách bạch Tổng quan & Chi tiết (Overview vs. Detail):**
   * **Màn hình Tổng quan** (*Dashboard, Thẻ Kanban, Bảng Ứng viên*): Chỉ hiển thị đúng các thông tin cốt lõi cần quét nhanh trong 3 giây (Họ tên, Vị trí, Kinh nghiệm, Đánh giá AI %, Trạng thái).
   * **Ngăn Chi tiết Hồ sơ (5 Tab độc lập):** Gộp toàn bộ thông tin chuyên sâu vào 5 ngăn riêng biệt để người dùng cần xem mục nào mới mở mục đó:
     1. *Hồ sơ & AI* (5 trường cốt lõi + nút mở rộng chi tiết + Đánh giá AI % + Lịch phỏng vấn)
     2. *Tiêu chuẩn vị trí (JD)* (Mở khi cần đối chiếu mô tả công việc)
     3. *CV Gốc* (Chỉ gồm khung xem trực tiếp CV và nút Tải về)
     4. *Phiếu đánh giá* (Chấm điểm trực tiếp ngay trong tab, không bật cửa sổ đè màn hình)
     5. *Nhật ký* (Tách riêng hoàn toàn lịch sử luân chuyển và lịch sử ứng tuyển tại công ty)
3. **Một nhiệm vụ — Một vị trí nút duy nhất (Single Action Place):**
   * Không lặp lại các nút có cùng chức năng ở nhiều màn hình khác nhau (ví dụ: *Xuất báo cáo Excel* đặt tập trung tại Danh sách Ứng viên; *Tạo tin mới* đặt tại Tin Tuyển Dụng; *Thử đánh giá lại AI* chỉ xuất hiện khi AI thực sự gặp sự cố kết nối chưa chấm được điểm).

---

## II. QUY TẮC KIỂM TRA DỮ LIỆU ĐẦU VÀO (BUSINESS VALIDATION RULES)

Thay vì mô tả bằng cú pháp lập trình, các quy tắc kiểm tra dữ liệu đầu vào được quy định rõ theo hành vi người dùng:

| Nhóm dữ liệu / Ô nhập | Quy tắc chấp nhận hợp lệ | Hành vi khi nhập sai hoặc thiếu |
| :--- | :--- | :--- |
| **Ô tìm kiếm ứng viên** | Cho phép nhập **tên ứng viên, email hoặc kỹ năng**; **không phân biệt chữ hoa / chữ thường**, hỗ trợ tìm theo một phần từ khóa (VD: gõ `"react"` hoặc `"Nguyễn"` đều trả về kết quả trong ≤ 3 giây). | Nếu không có hồ sơ khớp, hiển thị thông báo lịch sự *"Không tìm thấy ứng viên phù hợp với bộ lọc hiện tại"*. |
| **Họ và tên ứng viên** | Bắt buộc nhập; chấp nhận chữ cái tiếng Việt có dấu hoặc không dấu và khoảng trắng; tự động loại bỏ khoảng trắng thừa ở hai đầu. | Báo viền đỏ và chú thích: *"Vui lòng nhập họ và tên ứng viên."* |
| **Địa chỉ Email** | Bắt buộc nhập; đúng định dạng email chuẩn gồm tên người dùng, ký tự `@` và tên miền hợp lệ (VD: `nguyenvana@gmail.com`); không phân biệt chữ hoa/thường khi đối chiếu trùng lặp. | Báo viền đỏ: *"Email không đúng định dạng (Ví dụ: name@company.com)."* |
| **Số điện thoại** | Bắt buộc nhập khi ứng tuyển; chấp nhận số điện thoại di động Việt Nam **10 chữ số** bắt đầu bằng `0` (VD: `0912345678`) hoặc kèm mã quốc gia `+84` (VD: `+84912345678`); cho phép người dùng gõ kèm dấu cách/gạch ngang để dễ đọc. | Báo viền đỏ: *"Số điện thoại không hợp lệ. Vui lòng nhập số di động 10 chữ số (VD: 0912345678)."* |
| **Tệp CV tải lên** | Bắt buộc khi nộp hồ sơ; chỉ chấp nhận định dạng **PDF** hoặc **DOCX** thật (không chấp nhận tệp đổi đuôi giả mạo), dung lượng **không vượt quá 10MB**. | Báo viền đỏ nêu rõ lý do sai định dạng hoặc vượt dung lượng 10MB. |
| **Mật khẩu tài khoản nội bộ** | Tối thiểu **8 ký tự**; không chấp nhận mật khẩu để trống hoặc quá ngắn. | Báo viền đỏ: *"Mật khẩu hiện có {n} ký tự. Vui lòng nhập tối thiểu 8 ký tự."* |
| **Lý do từ chối ứng viên** | Bắt buộc chọn 1 lý do có sẵn hoặc tự nhập lý do cụ thể tối thiểu **5 ký tự** trước khi xác nhận chuyển hồ sơ sang Từ chối. | Không cho phép xác nhận và nhắc nhở nhập rõ lý do để lưu lịch sử. |

---

## III. QUY CHUẨN THÔNG BÁO LỖI THÂN THIỆN (END-USER ERROR MESSAGING)

* **Nguyên tắc vàng:** Thông báo hiển thị trên màn hình **tuyệt đối không chứa mã kỹ thuật hoặc mã tài liệu nội bộ** (không ghi các cụm như `BRL-10`, `NFR-03`, `RBAC`, `Magic Bytes`, `HTTP 403`).
* Mọi thông báo lỗi phải chỉ rõ **nguyên nhân** và **hướng xử lý** bằng tiếng Việt tự nhiên:

| Tình huống phát sinh | ❌ Câu thông báo CẤM dùng | ✅ Thông báo CHUẨN hiển thị cho người dùng |
| :--- | :--- | :--- |
| **Sai mật khẩu** | *"Sai thông tin"* | *"Mật khẩu không chính xác. Vui lòng kiểm tra lại."* |
| **Tài khoản bị khóa** | *"Lỗi 403 Forbidden"* | *"Tài khoản của bạn đã bị Quản trị viên tạm khóa. Vui lòng liên hệ Quản trị viên."* |
| **Nộp trùng vị trí (trong 30 ngày)** | *"Vi phạm BRL-02"* | *"Bạn đã nộp hồ sơ cho vị trí này trong vòng 30 ngày qua. Vui lòng không nộp lặp lại."* |
| **Nộp quá 3 vị trí (trong 90 ngày)** | *"Vượt hạn mức BRL-09"* | *"Bạn đã nộp tối đa 3 vị trí công việc trong vòng 90 ngày qua. Vui lòng chờ kết quả phản hồi trước khi ứng tuyển thêm."* |
| **Tệp CV giả mạo định dạng** | *"Magic Bytes không khớp"* | *"Tệp tin tải lên không đúng định dạng PDF/DOCX hợp lệ. Vui lòng kiểm tra lại tệp CV của bạn."* |
| **Chuyển sang Tuyển chọn thiếu phiếu đánh giá** | *"Vi phạm chốt chặn BRL-06"* | *"Chưa thể tuyển chọn: Cần có ít nhất 01 phiếu đánh giá phỏng vấn đạt chuẩn trước khi xác nhận Tuyển chọn."* |
| **Vượt quá quyền vai trò** | *"Vi phạm ma trận RBAC"* | *"Chuyên viên HR chỉ có quyền chuyển hồ sơ tối đa đến vòng Sàng lọc tiêu chuẩn. Vòng Phỏng vấn và Tuyển chọn do Quản lý chuyên môn phụ trách."* |
| **CV khác thông tin đăng ký (nghi nộp nhầm tệp)** | *"Conflict 409 BRL-12"* | *"Thông tin trên tệp CV không trùng khớp với thông tin bạn đăng ký. Vui lòng kiểm tra lại đúng tệp CV của mình trước khi tiếp tục nộp."* |
| **Chạm trần phỏng vấn cùng lúc** | *"Vượt WIP Cap BRL-13"* | *"Vị trí này hiện đã đủ hạn mức phỏng vấn cùng lúc cho số chỉ tiêu còn trống. Nên đánh giá xong đợt hiện tại trước khi mời thêm để tránh phỏng vấn dư."* |
| **Vị trí đã tuyển đủ chỉ tiêu** | *"Job headcount full"* | *"Vị trí này đã tuyển đủ chỉ tiêu nhân sự. Vui lòng tăng số lượng cần tuyển ở trang Tin tuyển dụng nếu có nhu cầu bổ sung."* |

---

## IV. TRẠNG THÁI TƯƠNG TÁC, TỰ ĐIỀN CV & PHẢN HỒI NGƯỜI DÙNG

1. **Luồng nộp hồ sơ "Tải CV trước — Kiểm tra sau":** Trên trang ứng tuyển công khai, khu vực tải tệp CV được đặt lên đầu biểu mẫu; ngay khi ứng viên chọn tệp, hệ thống tự điền sẵn 3 ô *Họ tên, Email, Số điện thoại* để ứng viên rà lại nhanh (giảm sai lệch thông tin và giúp phát hiện ngay nếu chọn nhầm tệp CV của người khác).
2. **Khi đang xử lý (Loading):** Nút bấm tự động khóa tránh bấm đúp và hiển thị dòng chữ rõ ràng (*"Đang xác thực..."*, *"Đang đọc thông tin liên hệ từ CV..."*, *"Đang gửi hồ sơ ứng tuyển..."*, *"Đang lưu..."*).
3. **Khi danh sách trống (Empty State):** Không để màn hình trắng trơn; luôn hiển thị thông điệp rõ ràng giải thích tình trạng hiện tại (*"Bạn đã xem toàn bộ CV mới tiếp nhận"*, *"Chưa có phiếu đánh giá nào"*).
4. **Tách biệt hoàn toàn khu vực Công khai & Nội bộ:** Trang đăng nhập và Cổng tuyển dụng công khai tuyệt đối không hiển thị thanh menu hay thông tin quản trị nội bộ khi người dùng chưa đăng nhập.
