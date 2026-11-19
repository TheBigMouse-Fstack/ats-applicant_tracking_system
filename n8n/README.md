# HƯỚNG DẪN KẾT NỐI & NHẬP 3 WORKFLOWS N8N (RECOVERX ATS)

> **Mục tiêu:** Cung cấp 3 tệp Workflow n8n định dạng JSON tiêu chuẩn, cho phép nhập vào n8n chỉ trong 3 cú nhấp chuột và tự động kích hoạt thông qua Webhook từ hệ thống ATS.

---

## 1. Danh Mục 3 Workflows n8n Đã Cấu Hình Sẵn

| STT | Tên Workflow | Tệp JSON Mẫu | Đường Dẫn Webhook Tiếp Nhận | Chức Năng Tự Động Hóa |
| :---: | :--- | :--- | :--- | :--- |
| **01** | **Gửi Thư Mời PV & Đồng Bộ Lịch** | [`n8n/workflows/01_interview_invitation_calendar.json`](file:///d:/ATS%20project/n8n/workflows/01_interview_invitation_calendar.json) | `POST /webhook/interview-schedule` | Tự động gửi email HTML thư mời phỏng vấn đến ứng viên và tạo sự kiện Google Calendar cho Hội đồng tuyển dụng. |
| **02** | **Bắn Tin Báo Cho HR Qua Telegram** | [`n8n/workflows/02_telegram_alert_hr.json`](file:///d:/ATS%20project/n8n/workflows/02_telegram_alert_hr.json) | `POST /webhook/telegram-alert` | Bắn tin nhắn tức thì cho bot Telegram `@Rec_Hr_rBot` khi có ứng viên mới nộp đơn kèm điểm AI Match Score. |
| **03** | **Đệm Hoãn 12 Giờ Thư Từ Chối** | [`n8n/workflows/03_rejection_delay_buffer.json`](file:///d:/ATS%20project/n8n/workflows/03_rejection_delay_buffer.json) | `POST /webhook/rejection-buffer` | Kích hoạt bộ đệm chờ 12 giờ (`Wait Node`). Sau 12 giờ tự động gửi email từ chối lịch sự và lưu trữ vào Kho Nhân Tài. |

---

## 2. Cách Nhập File Vào n8n (Import in 3 Clicks)

1. Mở giao diện n8n (trên máy cục bộ `http://localhost:5678` hoặc trên n8n Cloud của bạn).
2. Ở menu góc trên bên phải, chọn biểu tượng **`...`** (Workflow Menu) ➔ **Import from File...**
3. Chọn lần lượt từng tệp JSON trong thư mục [`n8n/workflows/`](file:///d:/ATS%20project/n8n/workflows).
4. Kiểm tra các nút (Gmail, Google Calendar, Telegram Bot) và kết nối tài khoản tương ứng của bạn.
5. Gạt công tắc **Active (Inactive ➔ Active)** ở góc trên bên phải để n8n bắt đầu lắng nghe Webhook.

---

## 3. Cấu Hình Biến Môi Trường Tại `.env` (Tầng Hạ Tầng)

Trong tệp `.env` của dự án, các biến môi trường kết nối n8n đã được điền sẵn:

```env
# 6. Tự Động Hóa n8n Workflows (Tầng Hạ Tầng Infrastructure)
N8N_WEBHOOK_URL="http://localhost:5678/webhook/interview-schedule"
N8N_INTERVIEW_WEBHOOK_URL="http://localhost:5678/webhook/interview-schedule"
N8N_TELEGRAM_WEBHOOK_URL="http://localhost:5678/webhook/telegram-alert"
N8N_REJECTION_WEBHOOK_URL="http://localhost:5678/webhook/rejection-buffer"
```

> **Lưu ý nếu dùng n8n Cloud:** Bạn chỉ cần đổi cụm `http://localhost:5678` thành tên miền n8n Cloud của bạn (ví dụ: `https://your-team.app.n8n.cloud/webhook/...`). Hệ thống ATS sẽ tự động bắn webhook sang đúng máy chủ của bạn!
