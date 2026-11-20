# UI Taste & Anti-Slop Guidelines (taste-skill + hallmark + unslop)

> Quy chuẩn thiết kế giao diện chống AI-slop, giàu gu thẩm mỹ và tính kỷ luật công nghiệp cho hệ thống ATS và Cổng RecoverX.

---

## 1. Triết lý Cốt lõi & Bố cục Thị giác (60-30-10)

1. **60% Canvas Trung tính (Quiet Canvas):** 
   - Nền trang sử dụng `bg-slate-50` hoặc `white`.
   - Tuyệt đối loại bỏ các dải nền màu mè, gradient tím-hồng (`from-purple via-brand to-pink`), đốm sáng radial mờ nhạt (radial glow blobs).
2. **30% Cấu trúc Bề mặt (Structural Surfaces):**
   - Thẻ (Card), Bảng (Table), Khung điều hướng (Panel) sử dụng `bg-white` với đường viền hairline thanh mảnh (`border-slate-200` hoặc `border-slate-100`).
   - Đổ bóng nhẹ nhàng, tự nhiên (`shadow-xs` hoặc `shadow-sm`), không dùng đổ bóng màu mè (`shadow-brand-500/30`).
3. **10% Màu Nhấn Có Chủ Đích (Purposeful Accents):**
   - Màu thương hiệu chính: Indigo / Slate (`bg-indigo-600 hover:bg-indigo-700 text-white`).
   - Màu ngữ nghĩa (Semantic colors) CHỈ dùng khi biểu đạt trạng thái tuyển dụng thật theo nguyên tắc Traffic-Light:
     - **Emerald (Xanh lục):** Hired / Tuyển chọn, Điểm khớp cao (≥75%), Đạt chuẩn.
     - **Amber (Vàng hổ phách):** Phỏng vấn, Điểm khớp trung bình (50-74%), Cần lưu ý.
     - **Rose (Đỏ hoa hồng):** Từ chối, Điểm khớp thấp (<50%), Quá hạn SLA.
     - **Blue (Xanh dương):** Mới tiếp nhận, Đang xử lý.

---

## 2. Tiêu chuẩn Typography & Xóa bỏ Dấu vết AI (Anti-AI Tells)

1. **Không Dùng Chữ In Hoa Giãn Cách (No Tracked Uppercase):**
   - Cấm dùng `uppercase tracking-wider` hay `uppercase tracking-widest` trên tiêu đề, nhãn (label), hoặc đầu bảng (table header).
   - Sử dụng font chữ mặc định với Sentence Case hoặc Clean Title Case: `text-xs font-semibold text-slate-700`.
2. **Không Dùng Chữ Gradient (No Gradient Text):**
   - Cấm `text-transparent bg-clip-text bg-gradient-to-r`. Tiêu đề phải dùng màu tương phản cao, rõ ràng (`text-slate-900 font-bold`).
3. **Không Dùng Emoji Thay Thế Icon (No Emojis as Icons):**
   - Cấm dùng emoji như `🎯`, `💡`, `✨`, `🌟`, `⛔`, `✉️`, `📞` làm icon trong giao diện hay nút bấm.
   - Luôn sử dụng icon SVG đơn sắc chuẩn mực từ bộ thư viện **Lucide React** (`Sparkles`, `Mail`, `Phone`, `Info`, `CheckCircle2`...).
4. **Phân cấp Vai trò Văn bản (Strict 3-Tier Text Roles):**
   - **Primary:** `text-slate-900 font-semibold / font-bold` (Tiêu đề, tên ứng viên, con số KPI chính).
   - **Secondary:** `text-slate-600 font-medium` (Mô tả, nhãn trường, nội dung chi tiết).
   - **Muted:** `text-slate-400 font-normal` (Thời gian, định dạng tệp, phụ đề phụ).

---

## 3. Hệ lưới Không gian 4px (Spacing & 4px Rhythm)

1. Mọi khoảng cách (padding, margin, gap) tuân thủ bội số của 4px: `p-2` (8px), `p-3` (12px), `p-4` (16px), `p-5` (20px), `p-6` (24px).
2. Tránh các số lẻ tùy tiện như `py-2.5`, `py-3.5`, `mt-[13px]`.
3. Bố cục nhất quán: Các dòng trong danh sách có cùng độ cao và căn thẳng hàng các icon, nhãn, dữ liệu.

---

## 4. Vi tương tác Xúc giác (Tactile Micro-Interactions)

1. **Nút bấm & Thẻ tương tác:**
   - Thêm hiệu ứng nhấn nhẹ nhàng: `active:scale-[0.98]` (cho nút bấm) và `active:scale-[0.99]` (cho thẻ Kanban).
   - Vòng viền khi trỏ bàn phím (Focus-visible ring) cho khả năng tiếp cận: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/20`.
   - Hiệu ứng chuyển trạng thái mượt: `transition-all duration-150`.
2. **Tránh Chớp nháy & Biến mất Đột ngột:**
   - Giữ nguyên trạng thái cũ hoặc dùng dữ liệu đệm (Client Cache) khi đang lọc tìm kiếm.
   - Hủy bỏ các yêu cầu API cũ đang chạy dở (`AbortController`) khi người dùng đổi bộ lọc nhanh.

---

## 5. Chuẩn Hóa Song Ngữ Toàn Diện (Full Bilingual Coverage)

1. Toàn bộ chuỗi văn bản trên giao diện bắt buộc được định nghĩa qua `t(key, fallback)` từ `@/lib/i18n`.
2. Không bỏ sót chuỗi cứng tiếng Việt trên thanh lọc, trạng thái đếm, thông báo tooltip hay nút bấm khi chuyển sang giao diện tiếng Anh (`en`).
