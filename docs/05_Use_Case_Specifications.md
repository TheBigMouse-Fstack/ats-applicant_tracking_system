---
id: "UC-ATS-05"
title: "Đặc tả Chi tiết Ca sử dụng (Chuẩn 12 Thành phần Alistair Cockburn)"
type: "srs"
version: "2.2.0"
status: "approved"
owner: "ReCoverX BA Team"
domain: "recruitment-ats"
tags:
  - "use-case"
  - "alistair-cockburn"
  - "non-tech-friendly"
upstream_deps:
  - "BRD-ATS-01"
  - "FDD-ATS-04"
downstream_deps:
  - "FSM-ATS-06"
  - "API-ATS-15"
  - "UAT-ATS-18"
last_updated: "2026-11-18"
---

# ĐẶC TẢ CHI TIẾT CÁC CA SỬ DỤNG (USE CASE SPECIFICATIONS)

> **Hệ thống nội bộ:** ATS — Applicant Tracking System *(Cổng ứng tuyển công khai giả lập: RecoverX)*  
> **Tiêu chuẩn áp dụng:** Cấu trúc 12 thành phần chuẩn nghiệp vụ Alistair Cockburn — viết bằng ngôn ngữ nghiệp vụ rõ ràng để Doanh nghiệp, BA và Đội phát triển cùng đọc hiểu. *(Chi tiết kỹ thuật API xem tại `[[API-ATS-15]]`)*.

## Lịch Sử Phiên Bản (Revision History)

| Phiên Bản | Ngày Phát Hành | Tác Giả | Phân Loại | Tóm Tắt Thay Đổi | Người Phê Duyệt |
| :---: | :---: | :--- | :---: | :--- | :--- |
| `v1.0.0` | 2026-11-10 | BA Team | **Initial** | Khởi tạo đặc tả 7 Use Case cơ bản. | Product Owner |
| `v2.1.0` | 2026-11-18 | BA Team | **Changed** | Nâng cấp đầy đủ 12 thành phần chuẩn Alistair Cockburn; đồng bộ phân tách quyền HR vs Hiring Manager và lý do từ chối bắt buộc. | Product Owner |
| `v2.2.0` | 2026-11-18 | BA Team | **Changed** | Biên tập sang ngôn ngữ nghiệp vụ thân thiện người đọc phi kỹ thuật; đồng bộ Operational Dashboard, Ngăn chi tiết 5 tab (chấm Phiếu đánh giá trực tiếp không bật cửa sổ), Kho Nhân Tài 3 nhóm trạng thái. | Product Owner & Trưởng phòng Tuyển dụng |

---

## UC-00: ĐĂNG NHẬP & QUẢN TRỊ NGƯỜI DÙNG NỘI BỘ

| Thành Phần | Nội Dung Đặc Tả |
| :--- | :--- |
| **1. Mã & Tên Use Case** | `UC-AUTH-00`: Đăng nhập hệ thống nội bộ & Quản trị tài khoản nhân viên |
| **2. Cấp độ** | Mục tiêu người dùng |
| **3. Tác nhân chính** | Quản trị viên (Admin), Chuyên viên HR, Quản lý chuyên môn (Hiring Manager) |
| **4. Các bên liên quan & Quyền lợi** | • Nhân viên nội bộ: Đăng nhập an toàn, truy cập đúng chức năng theo vai trò.<br>• Quản trị viên: Tạo, phân quyền và tạm khóa tài khoản nhân viên khi nghỉ việc, ngăn truy cập trái phép. |
| **5. Tiền điều kiện** | Tài khoản nội bộ đã được tạo và đang ở trạng thái hoạt động. |
| **6. Hậu điều kiện tối thiểu** | Không cho phép vào khu vực quản trị nếu xác thực thất bại; mọi đường dẫn nội bộ chưa đăng nhập đều tự động chuyển về trang đăng nhập. |
| **7. Hậu điều kiện thành công** | Mở phiên làm việc an toàn (duy trì tối đa 7 ngày) và chuyển người dùng vào **Bảng điều khiển Tổng quan** đúng theo vai trò. |
| **8. Sự kiện kích hoạt** | Người dùng nhập Email/Mật khẩu tại màn hình Đăng nhập nội bộ hoặc Quản trị viên mở mục **Người dùng**. |
| **9. Kịch bản chính** | 1. Người dùng nhập Email & Mật khẩu tại trang đăng nhập nội bộ và nhấn **Đăng nhập**.<br>2. Hệ thống kiểm tra thông tin tài khoản, trạng thái hoạt động và đối chiếu mật khẩu đã được mã hóa an toàn.<br>3. Khi hợp lệ, hệ thống mở phiên làm việc và chuyển thẳng vào **Bảng điều khiển Tổng quan** hiển thị đúng các chỉ số theo vai trò.<br>4. Nếu là Quản trị viên, có thể vào mục **Người dùng** để tạo tài khoản nhân viên mới (mật khẩu tối thiểu 8 ký tự), phân vai trò hoặc tạm khóa tài khoản. |
| **10. Luồng ngoại lệ** | • `2a.` Sai mật khẩu hoặc Email chưa đăng ký ➔ Hiển thị thông báo đỏ ngay dưới ô nhập sai.<br>• `2b.` Tài khoản đang bị tạm khóa ➔ Từ chối đăng nhập và hướng dẫn liên hệ Quản trị viên.<br>• `4a.` Tài khoản HR hoặc Quản lý chuyên môn cố truy cập mục Quản trị Người dùng ➔ Hệ thống chặn và chuyển về Tổng quan kèm thông báo không đủ quyền. |
| **11. Yêu cầu đặc biệt** | Trang đăng nhập tuyệt đối không để lộ bất kỳ menu hay dữ liệu nội bộ nào trước khi xác thực thành công. |
| **12. Quy tắc liên quan** | Quy tắc bảo mật tài khoản & Ma trận phân quyền (`[[RBAC-NFR-08]]`). |

---

## UC-01: NỘP HỒ SƠ ỨNG TUYỂN TRỰC TUYẾN & TRA CỨU TIẾN ĐỘ

| Thành Phần | Nội Dung Đặc Tả |
| :--- | :--- |
| **1. Mã & Tên Use Case** | `UC-PORT-01`: Nộp hồ sơ ứng tuyển trực tuyến & Tra cứu tiến độ hồ sơ |
| **2. Cấp độ** | Mục tiêu người dùng |
| **3. Tác nhân chính** | Ứng viên (Công khai — không cần tạo tài khoản) |
| **4. Các bên liên quan & Quyền lợi** | • Ứng viên: Nộp CV nhanh chóng và chủ động theo dõi tiến độ xử lý hồ sơ mọi lúc.<br>• HR: Tiếp nhận hồ sơ sạch, đúng định dạng, không bị làm phiền bởi đơn spam hoặc nộp trùng lặp. |
| **5. Tiền điều kiện** | Vị trí tuyển dụng đang ở trạng thái **Đang mở tuyển** trên Cổng tuyển dụng công khai. |
| **6. Hậu điều kiện tối thiểu** | Không lưu tệp sai định dạng hoặc tệp giả mạo; giữ nguyên các thông tin ứng viên đã gõ nếu có trường nhập lỗi. |
| **7. Hậu điều kiện thành công** | Lưu tệp CV và chứng chỉ; ghi nhận hồ sơ vào cột **Mới nộp** kèm phân tích độ phù hợp; cấp mã hồ sơ để ứng viên tự tra cứu tiến độ. |
| **8. Sự kiện kích hoạt** | Ứng viên mở tin tuyển dụng, điền biểu mẫu và nhấn **Gửi Hồ Sơ Ứng Tuyển**. |
| **9. Kịch bản chính** | 1. Ứng viên xem chi tiết tin tuyển dụng, điền Họ tên, Email, Số điện thoại, tải tệp CV (`.pdf` hoặc `.docx`, tối đa 10MB) và tùy chọn đính kèm bằng cấp/chứng chỉ.<br>2. Ứng viên nhấn **Gửi Hồ Sơ Ứng Tuyển**.<br>3. Hệ thống kiểm tra tần suất nộp chống spam (tối đa 5 lượt trong 10 phút), kiểm tra dung lượng và tính xác thực của tệp CV gốc.<br>4. Hệ thống kiểm tra chống nộp trùng cho cùng 1 vị trí trong vòng 30 ngày và giới hạn nộp tối đa 3 vị trí khác nhau trong 90 ngày.<br>5. Hệ thống tự động đọc nội dung CV, bóc tách 5 trường cốt lõi, chấm độ phù hợp AI và tạo hồ sơ tại cột **Mới nộp**.<br>6. Màn hình trả về **Mã hồ sơ**; ứng viên có thể nhập mã này tại trang **Tra cứu hồ sơ** để xem mình đang ở bước nào (tuyệt đối không lộ điểm AI hay nhận xét nội bộ). |
| **10. Luồng ngoại lệ** | • `3a.` Nộp liên tiếp quá 5 lần trong 10 phút ➔ Nhắc chờ 10 phút trước khi nộp lại.<br>• `3b.` Tệp lớn hơn 10MB, sai định dạng hoặc tệp giả mạo đổi đuôi ➔ Báo lỗi rõ ràng ngay dưới ô tải CV.<br>• `4a.` Đã nộp cùng vị trí trong 30 ngày qua ➔ Báo trùng lặp và gợi ý dùng trang Tra cứu hồ sơ.<br>• `4b.` Đã nộp đủ 3 vị trí trong 90 ngày ➔ Thông báo chờ kết quả phản hồi trước khi nộp thêm.<br>• `5a.` Khi dịch vụ AI gián đoạn ➔ Hệ thống tự dùng bộ phân tích dự phòng nội bộ để vẫn tiếp nhận đủ 100% hồ sơ. |
| **11. Yêu cầu đặc biệt** | Thời gian xử lý CV ≤ 5 giây; giao diện hiển thị mượt trên cả điện thoại và máy tính. |
| **12. Quy tắc liên quan** | Quy tắc tệp tin, chống trùng 30 ngày, hạn ngạch 90 ngày và bảo mật tra cứu (`[[UIUX-ATS-11]]`). |

---

## UC-02: NẠP CV NỘI BỘ, HIỂN THỊ 5 TRƯỜNG CỐT LÕI & CHỈNH SỬA THỦ CÔNG

| Thành Phần | Nội Dung Đặc Tả |
| :--- | :--- |
| **1. Mã & Tên Use Case** | `UC-INTK-02`: Tải lên CV nội bộ, trích xuất 5 trường cốt lõi & HR hiệu chỉnh dữ liệu |
| **2. Cấp độ** | Mục tiêu người dùng |
| **3. Tác nhân chính** | Chuyên viên HR, Quản trị viên |
| **4. Các bên liên quan & Quyền lợi** | • HR: Chủ động nhập CV từ kênh ngoài (LinkedIn, Giới thiệu nội bộ, Săn đầu người) và sửa nhanh ngay khi máy đọc thiếu kỹ năng hoặc sai kinh nghiệm.<br>• Quản lý chuyên môn: Đọc hồ sơ gọn gàng, chính xác đúng 5 trường trọng tâm mà không bị nhiễu chữ. |
| **5. Tiền điều kiện** | Người dùng đăng nhập bằng tài khoản **HR** hoặc **Quản trị viên**. |
| **6. Hậu điều kiện tối thiểu** | Không lưu dữ liệu nếu thông tin sửa bị sai định dạng hoặc trùng thông tin liên hệ với ứng viên khác. |
| **7. Hậu điều kiện thành công** | Lưu hồ sơ vào cột **Mới nộp**; mở ngăn chi tiết chỉ hiển thị gọn đúng 5 trường cốt lõi; khi HR chỉnh sửa, hệ thống tự động cập nhật lại mức độ khớp JD và ghi vào **Nhật ký**. |
| **8. Sự kiện kích hoạt** | HR nhấn **Tiếp nhận CV** tại trang Pipeline/Ứng viên, hoặc nhấn **Chỉnh sửa** trong ngăn chi tiết hồ sơ. |
| **9. Kịch bản chính** | 1. HR nhấn **Tiếp nhận CV**, chọn vị trí, chọn nguồn tiếp nhận, điền thông tin cơ bản và tải tệp CV (kèm chứng chỉ nếu có).<br>2. Hệ thống tự động kiểm tra trùng lặp, bóc tách nội dung CV và đưa hồ sơ vào cột **Mới nộp**.<br>3. Khi mở chi tiết hồ sơ (tab **Hồ sơ & AI**), hệ thống hiển thị nổi bật đúng **5 trường cốt lõi**: Họ tên, Email, Vị trí ứng tuyển, Số năm kinh nghiệm và Kỹ năng.<br>4. Khi cần xem thêm Số điện thoại, Học vấn, Kinh nghiệm chi tiết hoặc Chứng chỉ đính kèm, người dùng nhấn **Xem chi tiết hồ sơ**.<br>5. Nếu máy đọc thiếu kỹ năng hoặc sai số năm kinh nghiệm, HR nhấn **Chỉnh sửa**, thêm/sửa trực tiếp và nhấn **Lưu thay đổi**.<br>6. Hệ thống cập nhật thông tin, tự động tính lại độ khớp với yêu cầu vị trí và ghi nhận lịch sử chỉnh sửa vào tab **Nhật ký**. |
| **10. Luồng ngoại lệ** | • `5a.` Quản lý chuyên môn không thấy nút Chỉnh sửa (quyền chuẩn hóa dữ liệu CV thuộc bộ phận HR).<br>• `5b.` Email mới nhập sai định dạng hoặc trùng với ứng viên khác ➔ Báo lỗi và giữ nguyên form để chỉnh lại. |
| **11. Yêu cầu đặc biệt** | Kết quả khớp JD cập nhật tức thì trong ≤ 1 giây sau khi HR lưu chỉnh sửa. |
| **12. Quy tắc liên quan** | Quy tắc 5 trường cốt lõi & Phân quyền chỉnh sửa hồ sơ (`[[RBAC-NFR-08]]`). |

---

## UC-03: ĐỐI CHIẾU AI 3 MỨC MÀU & HOÃN GỬI THƯ TỪ CHỐI 12 GIỜ

| Thành Phần | Nội Dung Đặc Tả |
| :--- | :--- |
| **1. Mã & Tên Use Case** | `UC-AI-03`: Tự động đánh giá mức độ phù hợp AI & Hoãn gửi thư từ chối 12 giờ |
| **2. Cấp độ** | Hỗ trợ tự động |
| **3. Tác nhân chính** | Hệ thống ATS, Chuyên viên HR / Quản lý chuyên môn (Kiểm duyệt), Ứng viên (Người nhận phản hồi) |
| **4. Các bên liên quan & Quyền lợi** | • Doanh nghiệp: Lọc nhanh ứng viên tiềm năng theo 3 mức màu trực quan nhưng không bao giờ lo máy tự đánh rớt nhân tài.<br>• Ứng viên: Không bị nhận thư từ chối tức thì thiếu thiện cảm; HR có 12 giờ để thu hồi nếu thao tác nhầm. |
| **5. Tiền điều kiện** | CV đã được tải lên hợp lệ và vị trí tuyển dụng đã có danh sách kỹ năng & kinh nghiệm yêu cầu. |
| **6. Hậu điều kiện tối thiểu** | AI **không bao giờ tự chuyển hồ sơ sang Từ chối**; nếu mất mạng vẫn dùng bộ phân tích dự phòng để không mất hồ sơ. |
| **7. Hậu điều kiện thành công** | Hiển thị phần trăm phù hợp kèm phân tầng 3 màu (Xanh ≥75% Phù hợp cao / Vàng 50–74% Cân nhắc / Đỏ <50% Phù hợp thấp), liệt kê kỹ năng đạt/thiếu và tóm tắt nhận định. |
| **8. Sự kiện kích hoạt** | Sau khi hoàn tất nộp CV (hoặc khi HR bấm *Thử đánh giá lại AI* trong trường hợp hiếm gặp sự cố mạng khiến AI chưa chấm được điểm). |
| **9. Kịch bản chính** | 1. Hệ thống đối chiếu kỹ năng và kinh nghiệm trong CV với tiêu chuẩn vị trí (JD).<br>2. Hệ thống gắn mức điểm phù hợp theo **3 tầng màu** (Xanh / Vàng / Đỏ) và đặt thẻ ở cột **Mới nộp** để HR xem xét.<br>3. Nút *Thử đánh giá lại AI* được ẩn gọn khi hệ thống đã đánh giá thành công, chỉ xuất hiện khi AI chưa chấm được do lỗi mạng/máy chủ.<br>4. Khi HR hoặc Quản lý quyết định chuyển hồ sơ sang **Từ chối** (kèm lý do cụ thể), hệ thống tự động đặt lịch hoãn gửi thư từ chối sau **12 giờ** và đưa hồ sơ vào **Kho Nhân Tài**. |
| **10. Luồng ngoại lệ** | • `1a.` Mất kết nối AI bên ngoài ➔ Hệ thống tự chuyển sang bộ lọc dự phòng cục bộ và hiển thị nút thử lại nếu HR muốn chạy lại sau.<br>• `4a.` Trong vòng 12 giờ chờ, nếu HR/Quản lý kéo hồ sơ khôi phục rời khỏi cột Từ chối ➔ Hệ thống tự động hủy lịch gửi thư từ chối. |
| **11. Yêu cầu đặc biệt** | Cùng 1 CV đối chiếu cùng 1 JD phải cho điểm số ổn định, không thay đổi ngẫu nhiên giữa các lần chấm. |
| **12. Quy tắc liên quan** | Quy tắc chấm điểm AI 3 mức màu & Đệm trễ thư từ chối 12 giờ. |

---

## UC-04: TỔNG QUAN VẬN HÀNH & QUẢN LÝ PIPELINE 5 GIAI ĐOẠN (PHÂN QUYỀN HR vs MANAGER)

| Thành Phần | Nội Dung Đặc Tả |
| :--- | :--- |
| **1. Mã & Tên Use Case** | `UC-PIPE-04`: Theo dõi Tổng quan theo vai trò & Luân chuyển hồ sơ trên Kanban 5 cột |
| **2. Cấp độ** | Mục tiêu người dùng |
| **3. Tác nhân chính** | Chuyên viên HR, Quản lý Chuyên môn (Hiring Manager), Quản trị viên |
| **4. Các bên liên quan & Quyền lợi** | • HR: Nắm ngay CV chưa xem/quá hạn 48h, sơ loại và chuyển ứng viên đạt lên vòng Sàng lọc tiêu chuẩn.<br>• Quản lý chuyên môn: Tập trung duyệt hồ sơ từ Sàng lọc sang Phỏng vấn, không bị nhiễu bởi CV thô vòng Mới nộp. |
| **5. Tiền điều kiện** | Người dùng đã đăng nhập nội bộ và truy cập **Tổng quan** hoặc **Pipeline**. |
| **6. Hậu điều kiện tối thiểu** | Nếu thao tác vượt quyền vai trò, nhảy cóc giai đoạn, thiếu lý do từ chối hoặc thiếu phiếu đánh giá, thẻ tự quay về cột cũ kèm thông báo rõ ràng. |
| **7. Hậu điều kiện thành công** | Cập nhật trạng thái mới, lưu lý do (nếu Từ chối) và tự động ghi vết vào tab **Nhật ký**. |
| **8. Sự kiện kích hoạt** | Người dùng kéo-thả thẻ trên bảng Pipeline hoặc nhấn chọn vòng kế tiếp ở thanh cuối ngăn Chi tiết hồ sơ. |
| **9. Kịch bản chính** | 1. Người dùng xem **Tổng quan** (chỉ số phễu 5 giai đoạn & danh sách việc cần xử lý ngay theo đúng vai trò) hoặc mở bảng **Pipeline** 5 cột (*Mới nộp → Sàng lọc → Phỏng vấn → Tuyển chọn / Từ chối*).<br>2. Người dùng tìm kiếm nhanh (tên, email, kỹ năng), lọc theo vị trí, hồ sơ gắn sao hoặc hồ sơ chưa xem (chấm xanh tĩnh); hồ sơ chờ quá 48h/72h tự động hiện cảnh báo quá hạn.<br>3. **Vòng HR:** HR mở hồ sơ tại *Mới nộp*, kéo sang **Sàng lọc tiêu chuẩn** (hoặc chuyển *Từ chối* kèm lý do cụ thể).<br>4. **Vòng Quản lý chuyên môn:** Hiring Manager xem hồ sơ tại *Sàng lọc*, duyệt chuyển sang **Phỏng vấn** (hoặc *Từ chối* kèm lý do).<br>5. Sau khi phỏng vấn và hoàn tất ít nhất 01 phiếu đánh giá đạt chuẩn, Hiring Manager chuyển hồ sơ từ *Phỏng vấn* sang **Tuyển chọn**. |
| **10. Luồng ngoại lệ** | • `3a.` HR cố kéo sang Phỏng vấn hoặc Tuyển chọn ➔ Hệ thống chặn và giải thích rõ HR chỉ chuyển tối đa đến Sàng lọc tiêu chuẩn.<br>• `4a.` Quản lý chuyên môn cố tác động hồ sơ ở cột Mới nộp ➔ Hệ thống chặn (thuộc phạm vi sơ loại của HR).<br>• `4b.` Kéo nhảy cóc giai đoạn (VD: Mới nộp ➔ Phỏng vấn, Sàng lọc ➔ Tuyển chọn) ➔ Chặn để đảm bảo đi đúng quy trình.<br>• `5a.` Kéo sang Tuyển chọn khi chưa có phiếu đánh giá đạt chuẩn ➔ Chặn và nhắc hoàn tất tab *Phiếu đánh giá*.<br>• `5b.` Kéo sang Từ chối nhưng không nhập lý do ➔ Tự mở hộp thoại bắt buộc chọn/nhập lý do từ chối (≥ 5 ký tự).<br>• `5c.` Cố di chuyển hồ sơ đã ở trạng thái **Tuyển chọn** ➔ Hệ thống khóa để bảo vệ kết quả tuyển dụng. |
| **11. Yêu cầu đặc biệt** | Phản hồi tìm kiếm, lọc và kéo-thả ≤ 3 giây. |
| **12. Quy tắc liên quan** | Quy tắc tuần tự 5 giai đoạn, phân quyền HR vs Manager & bắt buộc lý do từ chối. |

---

## UC-05: QUẢN LÝ LỊCH PHỎNG VẤN & CHẤM PHIẾU ĐÁNH GIÁ TRỰC TIẾP

| Thành Phần | Nội Dung Đặc Tả |
| :--- | :--- |
| **1. Mã & Tên Use Case** | `UC-EVAL-05`: Đặt/đổi/hủy lịch phỏng vấn & Chấm Phiếu đánh giá trực tiếp trên tab riêng |
| **2. Cấp độ** | Mục tiêu người dùng |
| **3. Tác nhân chính** | Quản lý Chuyên môn (Hiring Manager), Chuyên viên HR (tham gia chấm điểm/ghi chú), Quản trị viên |
| **4. Các bên liên quan & Quyền lợi** | • Quản lý chuyên môn: Chủ động sắp xếp lịch phỏng vấn và chấm điểm trực tiếp ngay trong ngăn hồ sơ mà không bị cửa sổ popup che khuất.<br>• Lãnh đạo / HR: Nắm rõ căn cứ tuyển dụng minh bạch từ nhiều vòng phỏng vấn. |
| **5. Tiền điều kiện** | Hồ sơ đang ở vòng **Sàng lọc** hoặc **Phỏng vấn**. |
| **6. Hậu điều kiện tối thiểu** | Không ai được sửa phiếu đánh giá của giám khảo khác; HR không được tự ý xếp/sửa/hủy lịch phỏng vấn. |
| **7. Hậu điều kiện thành công** | Lưu lịch hẹn (ngày giờ, hình thức Trực tuyến/Trực tiếp, địa điểm/link họp, ghi chú) và tạo mẫu thư mời; lưu phiếu đánh giá với điểm trung bình có trọng số và mở khóa điều kiện **Tuyển chọn**. |
| **8. Sự kiện kích hoạt** | Quản lý chọn **Lên lịch phỏng vấn** trong ngăn hồ sơ, hoặc giám khảo mở tab **Phiếu đánh giá**. |
| **9. Kịch bản chính** | 1. **Quản lý lịch hẹn:** Quản lý chuyên môn nhập ngày giờ, hình thức (Online/Offline), link họp/phòng họp và ghi chú chuẩn bị. Hệ thống lưu lịch, chuyển hồ sơ sang **Phỏng vấn** và tạo sẵn mẫu thư mời để sao chép gửi ứng viên.<br>2. **Chấm Phiếu đánh giá trực tiếp:** Giám khảo mở tab **Phiếu đánh giá**, điền trực tiếp trên biểu mẫu tích hợp: vòng phỏng vấn, cấp bậc đề xuất, chấm 1–5 sao cho 3 tiêu chí (*Chuyên môn 40%, Giao tiếp 30%, Văn hóa 30%*), chọn khuyến nghị và ghi rõ **Điểm mạnh nổi bật** cùng **Điểm cần đào tạo thêm**.<br>3. Hệ thống tự động tính điểm tổng hợp trên thang 5.0★, lưu phiếu độc lập theo tên người đánh giá và ghi nhận vào tab **Nhật ký**. |
| **10. Luồng ngoại lệ** | • `1a.` Đổi lịch hoặc hủy lịch hẹn ➔ Hệ thống cập nhật trạng thái và lưu vết vào tab Nhật ký.<br>• `1b.` HR cố xếp/hủy lịch phỏng vấn ➔ Ẩn thao tác và thông báo thuộc thẩm quyền Quản lý chuyên môn.<br>• `2a.` Chọn khuyến nghị *Đạt chuẩn / Xuất sắc* nhưng bỏ trống Điểm mạnh ➔ Báo lỗi yêu cầu nêu rõ căn cứ tuyển dụng. |
| **11. Yêu cầu đặc biệt** | Tab **Phiếu đánh giá** tách biệt hoàn toàn với tab **Nhật ký**; hiển thị rõ trạng thái đã đủ điều kiện Tuyển chọn hay chưa. |
| **12. Quy tắc liên quan** | Quy tắc tính điểm 40/30/30 & Điều kiện bắt buộc trước khi Tuyển chọn. |

---

## UC-06 & UC-07: KHO NHÂN TÀI 3 NHÓM, KHÔI PHỤC HỒ SƠ, DỌN DẸP 180 NGÀY & XUẤT EXCEL

| Thành Phần | Nội Dung Đặc Tả |
| :--- | :--- |
| **1. Mã & Tên Use Case** | `UC-POOL-06` & `UC-RPT-07`: Quản trị Kho Nhân Tài dự phòng, Khôi phục hồ sơ, Dọn dẹp 180 ngày & Xuất Excel |
| **2. Cấp độ** | Mục tiêu người dùng |
| **3. Tác nhân chính** | Chuyên viên HR (Tra cứu, Khôi phục, Xuất Excel), Quản trị viên (Toàn quyền + Dọn dẹp hồ sơ quá hạn 180 ngày) |
| **4. Các bên liên quan & Quyền lợi** | • HR: Tái khai thác nhanh nhóm ứng viên tiềm năng từ các đợt trước khi vị trí cũ đã đủ người, tiết kiệm chi phí tuyển dụng.<br>• Pháp chế / Quản trị viên: Tuân thủ Nghị định 13/2023/NĐ-CP về thời hạn lưu trữ dữ liệu cá nhân. |
| **5. Tiền điều kiện** | Đăng nhập bằng vai trò **HR** hoặc **Quản trị viên** (Quản lý chuyên môn không truy cập Kho nhân tài). |
| **6. Hậu điều kiện tối thiểu** | Không bao giờ đưa hồ sơ *Mới nộp chưa xem* hoặc nhân sự đã *Tuyển chọn* vào Kho nhân tài; không bao giờ xóa nhầm hồ sơ còn hạn dưới 180 ngày. |
| **7. Hậu điều kiện thành công** | Khôi phục tạo đợt ứng tuyển mới ở vòng **Sàng lọc tiêu chuẩn** mà ứng viên không cần nộp lại CV; tác vụ dọn dẹp xóa vĩnh viễn hồ sơ từ chối quá 180 ngày; xuất báo cáo tải về tệp bảng tính mở chuẩn tiếng Việt trên Excel. |
| **8. Sự kiện kích hoạt** | HR mở mục **Kho nhân tài** và nhấn **Khôi phục**, hoặc mở **Ứng viên** và nhấn **Xuất CSV**; Quản trị viên nhấn **Dọn dẹp hồ sơ quá hạn**. |
| **9. Kịch bản chính** | 1. **Phân loại tự động trong Kho Nhân Tài:** Hệ thống chỉ tập hợp hồ sơ đã qua sàng lọc theo **3 nhóm thực tế**: *(a) Tiềm năng / Dự bị* (ứng viên đánh giá tốt ở đợt trước nhưng bộ phận cũ đã đủ người), *(b) Đang chờ ở đợt tuyển khác*, và *(c) Lưu trữ dự phòng* (kèm số ngày lưu trữ còn lại trong hạn 180 ngày).<br>2. **Khôi phục hồ sơ:** HR lọc theo nhóm *Tiềm năng / Dự bị* hoặc sắp xếp theo *AI phù hợp cao nhất*, chọn **Khôi phục** và chọn vị trí mới đang mở. Hệ thống đưa hồ sơ thẳng vào vòng **Sàng lọc tiêu chuẩn** của vị trí mới và giữ nguyên lịch sử đợt cũ.<br>3. **Dọn dẹp hồ sơ quá hạn 180 ngày (Chỉ Admin):** Quản trị viên nhấn **Dọn dẹp hồ sơ quá hạn**, xem trước danh sách hồ sơ bị từ chối lưu quá 180 ngày rồi xác nhận xóa vĩnh viễn.<br>4. **Xuất báo cáo Excel:** Tại trang **Ứng viên**, HR/Quản trị viên nhấn **Xuất CSV** để tải bảng tổng hợp mở chuẩn tiếng Việt có dấu trên Microsoft Excel. |
| **10. Luồng ngoại lệ** | • `3a.` HR hoặc Quản lý chuyên môn cố thực hiện lệnh xóa vĩnh viễn ➔ Hệ thống chặn (chỉ Quản trị viên có quyền).<br>• `4a.` Quản lý chuyên môn không hiển thị nút Xuất báo cáo CSV. |
| **11. Yêu cầu đặc biệt** | Tệp xuất báo cáo mở trực tiếp trên Microsoft Excel không bị lỗi phông chữ tiếng Việt. |
| **12. Quy tắc liên quan** | Quy tắc lưu trữ dữ liệu 180 ngày & Phân loại Kho Nhân Tài. |
