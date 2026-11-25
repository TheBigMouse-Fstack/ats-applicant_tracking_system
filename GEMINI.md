# GEMINI.md — Quy tắc Dự án ATS (Single Source of Truth)

> Đồng bộ 100% với `AGENTS.md`. Giữ gọn <70 dòng để tránh trôi ngữ cảnh.

## 1. Kiến trúc & Phạm vi
- **Hệ thống:** ATS — Applicant Tracking System *(Cổng tuyển dụng công khai: RecoverX)*.
- **Stack:** Next.js 14.2.x (App Router, React 18) + TypeScript + Tailwind CSS + Prisma (Neon PostgreSQL).
- **Pipeline 6 giai đoạn:** `NEW ➔ SCREENING ➔ INTERVIEW ➔ OFFER ➔ HIRED / REJECTED`.
- **AI Engine:** Hybrid 2 lớp (`pdf-parse` + `mammoth` + Heuristic dự phòng; Gemini `temperature: 0` đồng nhất **60% Kỹ năng + 40% Kinh nghiệm**).

## 2. Quy tắc Nghiệp vụ & Bảo mật Bắt buộc
- **Bảo mật:** Mọi API nội bộ bắt buộc gọi `getSessionUser()` + kiểm tra RBAC. Cấm tuyệt đối cookie không chữ ký, mật khẩu plaintext, lưu CV thật trong `public/` hoặc commit secrets/logs lên Git.
- **Chốt chặn lõi:** `BRL-06` (≥1 Scorecard đạt chuẩn trước `OFFER` & `HIRED`), `BRL-11` (bắt buộc lý do từ chối), `BRL-15` (Blind Scorecard ở tầng API), `BRL-16` (Knock-out Questions gắn cờ mềm), `BRL-17` (Requisition Approval: `DRAFT ➔ PENDING_APPROVAL ➔ ACTIVE ➔ CLOSED`).
- **UI/UX:** Phẳng tối giản (ELCA Swiss `#D92027`), đánh màu chữ thay vì viền pill, không icon trang trí thừa, không hiển thị mã kỹ thuật (`BRL-*`, enum thô) lên giao diện, 100% song ngữ VI/EN.

## 3. Tách biệt Ngữ cảnh & Kiểm chứng
- **Spec đang làm:** `specs/constitution.md` và `specs/active/<feature-id>/`.
- **Tài liệu sống:** Chỉ cập nhật `docs/ba/` & `docs/dev-context/` sau khi QA pass.
- **Cổng kiểm chứng bắt buộc:** `npx tsc --noEmit` (0 lỗi) và `node tests/run-tests.js` (100% Pass).
