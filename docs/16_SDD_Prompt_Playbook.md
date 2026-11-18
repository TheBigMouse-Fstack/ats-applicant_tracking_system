# SỔ TAY MẪU PROMPT CHUẨN SPEC-DRIVEN DEVELOPMENT (SDD PROMPT PLAYBOOK)

> **Dự án:** ReCoverX Career — Applicant Tracking System (ATS)  
> **Mục tiêu:** Cung cấp bộ mẫu Prompt chuẩn mực theo phương pháp **Spec-Driven Development (SDD)** để mỗi lần thêm tính năng, thay đổi nghiệp vụ, chỉnh sửa phân quyền hay sửa lỗi, AI luôn hiểu đúng 100%, không tự suy diễn sai lệch và giữ đồng bộ tuyệt đối giữa **Tài liệu (`docs/`) ➔ Mã nguồn (`src/`) ➔ Kiểm thử (`tests/`)**.

---

## I. NGUYÊN TẮC VÀNG: VÒNG LẶP 4 BƯỚC SDD (THE SDD LOOP)

Mọi thay đổi nghiệp vụ lớn (đổi quyền RBAC, đổi luồng State Machine, đổi Schema CSDL, thêm module) đều nên đi theo đúng 4 bước:

```text
[Bước 1: Đề xuất Spec] ──► [Bước 2: Bạn Duyệt Spec] ──► [Bước 3: Code & Test] ──► [Bước 4: Nghiệm thu & Sync Docs]
 (Chưa đụng vào code)       (Khóa sạch Edge Cases)       (Bám sát Spec 100%)        (Chạy test + Build + Commit)
```

> **Quy tắc số 1:** Với thay đổi lớn, **LUÔN tách thành 2 lượt chat**:
> * **Lượt 1:** Khóa Spec + Edge Cases + Kế hoạch sửa file *(kèm câu: **"Chưa sửa code vội, chờ tôi duyệt"**)*.
> * **Lượt 2:** Sau khi bạn gõ **"OK, chốt Spec — triển khai đi"**, AI mới sửa CSDL, API, UI, Test và Docs.

---

## II. BỘ 7 MẪU PROMPT CHUẨN SDD (COPY & DÁN DÙNG NGAY)

### Mẫu 1: Thay đổi Quy tắc Nghiệp vụ, Chuyển Trạng Thái hoặc Phân Quyền (Rule / RBAC Change)
*Dùng khi đổi quyền giữa HR / Hiring Manager / Admin, thêm điều kiện chặn, đổi luồng Kanban, thêm BRL mới.*

```text
[SDD - THAY ĐỔI RULE & PHÂN QUYỀN | CHƯA SỬA CODE VỘI]

1. Vấn đề hiện tại:
   - [Mô tả ngắn gọn điểm đang bất hợp lý trong hệ thống]

2. Quy tắc mới mong muốn (Business Rules):
   - Điều kiện ĐƯỢC PHÉP: [Ghi rõ khi nào cho qua]
   - Điều kiện BỊ CHẶN: [Ghi rõ khi nào chặn và cần thông báo lỗi gì]

3. Phân quyền theo vai trò (RBAC):
   - HR: [Được làm gì / Bị cấm gì]
   - Hiring Manager: [Được làm gì / Bị cấm gì]
   - Admin: [Được làm gì]

4. Phạm vi ảnh hưởng dự kiến:
   - Tài liệu cần đối chiếu: docs/06 (State Machine), docs/08 (RBAC), docs/15 (API)
   - Code nguồn chân lý: src/lib/stage-rules.ts

5. Yêu cầu Bước 1:
   - Lập bảng Spec mới (From -> To, Role, Guard Rule, Error Code).
   - Chỉ ra các Edge Cases còn mơ hồ hoặc mâu thuẫn với rule cũ để tôi chốt trước.
   - CHƯA sửa code cho đến khi tôi xác nhận.
```

---

### Mẫu 2: Thêm Tính Năng Mới (New Feature — Spec First)
*Dùng khi thêm màn hình mới, nút bấm nghiệp vụ mới, hoặc mở rộng Scope.*

```text
[SDD - TÍNH NĂNG MỚI | BƯỚC 1: THIẾT KẾ SPEC]

1. Tên tính năng & Mục tiêu nghiệp vụ:
   - [VD: Cho phép HR xuất báo cáo theo từng phòng ban]

2. Tác nhân sử dụng (Actors):
   - [HR / Hiring Manager / Admin / Ứng viên]

3. Luồng sử dụng chính (Happy Path):
   - Bước 1: Người dùng vào màn hình [...]
   - Bước 2: Thao tác [...]
   - Bước 3: Hệ thống xử lý [...] và hiển thị kết quả [...]

4. Yêu cầu hiển thị & Ngoại lệ (Constraints & Edge Cases):
   - Dữ liệu hiển thị mặc định: [Chỉ hiện các trường nào? Có cần nút "Xem chi tiết" không?]
   - Ngoại lệ cần xử lý: [Nếu dữ liệu trống / sai định dạng / mất quyền thì báo gì?]

5. Yêu cầu Bước 1:
   - Đề xuất: (a) Thay đổi Prisma Schema (nếu có), (b) API Contract & Mã lỗi, (c) Thay đổi UI, (d) Test cases cần thêm vào tests/run-tests.js.
   - Dừng lại chờ tôi duyệt trước khi triển khai code.
```

---

### Mẫu 3: Chỉnh Sửa Giao Diện / UX (Kèm Ảnh Chụp Màn Hình)
*Dùng khi thấy màn hình rườm rà, câu chữ chưa chuyên nghiệp, muốn ẩn/hiện trường dữ liệu.*

```text
[SDD - TINH CHỈNH UI/UX]
(Đính kèm ảnh chụp màn hình)

1. Màn hình / Component cần sửa:
   - [VD: Modal Scorecard / Drawer chi tiết ứng viên / Thẻ Kanban]

2. Những điểm cần bỏ / ẩn:
   - [VD: Bỏ các chữ trong ngoặc đơn, bỏ công thức tính toán, ẩn học vấn mặc định]

3. Những điểm cần giữ / thêm:
   - [VD: Chỉ hiện 5 trường cốt lõi; thêm nút "Xem chi tiết"; thêm nút "Chỉnh sửa" cho HR]

4. Tiêu chuẩn giao diện (UI Guardrails):
   - Văn phong nội bộ doanh nghiệp chuyên nghiệp, ngắn gọn, không phô trương icon AI.
   - Không làm thay đổi logic nghiệp vụ backend (trừ khi có yêu cầu riêng).
   - Kiểm tra TypeScript & giữ nguyên toàn bộ test hiện có đạt 100%.
```

---

### Mẫu 4: Sửa Lỗi / Bug Fix (Root Cause + Regression Test)
*Dùng khi phát hiện lỗi chạy thật hoặc hành vi sai với Spec.*

```text
[SDD - SỬA LỖI (BUG FIX)]

1. Hiện tượng lỗi:
   - Tôi đang đăng nhập bằng vai trò: [ADMIN / HR / HIRING_MANAGER / Public]
   - Thao tác tại màn hình: [VD: /admin/pipeline]
   - Hành vi thực tế bị lỗi: [Mô tả hoặc dán ảnh/log lỗi]

2. Hành vi đúng theo Spec (Expected Behavior):
   - [Đáng lẽ hệ thống phải làm gì theo BRL/RBAC]

3. Yêu cầu xử lý:
   - Tìm đúng nguyên nhân gốc (Root Cause) trước khi sửa, không sửa chắp vá.
   - Sửa code xong phải bổ sung ít nhất 1 test case vào tests/run-tests.js để lỗi này không bao giờ tái phát.
   - Chạy lại toàn bộ test và xác nhận 0 lỗi TypeScript.
```

---

### Mẫu 5: Thay Đổi Dữ Liệu / API Contract (Schema & API Update)
*Dùng khi thêm cột vào Database (`prisma/schema.prisma`) hoặc thêm/sửa API.*

```text
[SDD - CẬP NHẬT SCHEMA & API]

1. Thay đổi dữ liệu cần thêm/sửa:
   - Bảng (Model): [VD: Application / Candidate / Evaluation]
   - Trường mới: [Tên trường, kiểu dữ liệu, bắt buộc hay tùy chọn]

2. Ràng buộc Validation & Bảo mật:
   - Điều kiện hợp lệ: [VD: tối thiểu 5 ký tự, định dạng email...]
   - Ai được gọi API này (RBAC): [...]
   - Có cần ghi vào AuditLog không: [Có / Không]

3. Yêu cầu đồng bộ SDD:
   - Cập nhật prisma/schema.prisma và chạy prisma db push.
   - Cập nhật API + UI tương ứng.
   - Đồng bộ tài liệu docs/07_Database_Design_ERD.md và docs/15_API_Specifications_and_Error_Codes.md.
   - Bổ sung test vào tests/run-tests.js và chạy npm run build kiểm chứng.
```

---

### Mẫu 6: Kiểm Toán Chéo Spec vs Code (Traceability Audit)
*Dùng định kỳ trước khi nộp báo cáo, demo khách hàng hoặc sau nhiều lần chỉnh sửa.*

```text
[SDD - KIỂM TOÁN ĐỒNG BỘ DOCS VS CODE]

Hãy rà soát đối chiếu 1:1 giữa mã nguồn hiện tại (src/, prisma/, tests/) và tài liệu [Tên file: BRD / BPMN / FR / RBAC / ERD / API]:
1. Liệt kê rõ những điểm đang LỆCH giữa tài liệu và code thực tế (dạng bảng: Mục | Tài liệu ghi | Code thực tế).
2. Chỉ ra những điểm bất hợp lý về mặt nghiệp vụ thực tế (nếu có).
3. Đề xuất phương án đồng bộ (sửa Tài liệu hay sửa Code) và chờ tôi chốt trước khi chỉnh sửa.
```

---

### Mẫu 7: Lệnh Chốt Triển Khai (Dùng Ở Lượt 2 Sau Khi Duyệt Spec)
*Sau khi bạn đã đọc và hài lòng với bản Spec ở Bước 1, chỉ cần dán đúng 4 dòng này:*

```text
[SDD - ĐÃ DUYỆT SPEC -> TRIỂN KHAI]
Tôi đồng ý với Spec trên (ghi chú điều chỉnh nếu có: ...).
Hãy triển khai đầy đủ theo thứ tự:
1. Database Schema (nếu có) -> Backend API & Rule Engine -> Frontend UI.
2. Cập nhật đồng bộ các file docs/ và .agents/rules/ liên quan.
3. Viết thêm test case vào tests/run-tests.js, chạy node tests/run-tests.js và npm run build xác nhận 0 lỗi trước khi báo cáo.
```

---

## III. BỘ "CÂU KHÓA AN TOÀN" (GUARDRAIL CLAUSES)

Khi bạn đang vội không muốn điền hết mẫu dài, chỉ cần gõ yêu cầu ngắn rồi **dán thêm 1–2 câu khóa** dưới đây ở cuối prompt là chất lượng đầu ra của AI tăng lên rõ rệt:

| Tình huống | Câu khóa dán vào cuối Prompt |
| :--- | :--- |
| **Muốn AI không tự đoán bừa** | *"Nếu có bất kỳ edge case hoặc điểm nào chưa rõ về phân quyền/luồng, hãy hỏi lại tôi trước, không tự suy diễn."* |
| **Muốn chốt Spec trước khi code** | *"Chưa sửa code vội — hãy viết bảng Spec và kế hoạch thay đổi cho tôi duyệt trước."* |
| **Muốn không bị lệch tài liệu** | *"Sửa xong bắt buộc đồng bộ lại các file `docs/` liên quan và `.agents/rules/business-ats.md`."* |
| **Muốn không làm hỏng tính năng cũ** | *"Chỉ sửa đúng phạm vi yêu cầu, chạy lại `node tests/run-tests.js` và `npm run build` để đảm bảo không vỡ tính năng cũ."* |
| **Muốn giao diện gọn, chuẩn doanh nghiệp** | *"Giữ giao diện gọn gàng chuẩn hệ thống nội bộ: không dùng mở ngoặc giải thích thừa, không hiển thị công thức toán, hạn chế icon AI."* |

---

## IV. VÍ DỤ THỰC TẾ: SO SÁNH PROMPT VỘI VS PROMPT CHUẨN SDD

### ❌ Cách prompt gộp vội (Dễ khiến AI phải tự đoán biên giới)
> *"thông tin ban đầu hiện quá chi tiết chỉ hiện 5 trường thôi cho HR sửa đc, sửa quyền HR chỉ sang sàng lọc thôi còn lại HM làm, reject phải có lý do, chuyển state có rule rõ"*

### ✅ Cách prompt chuẩn SDD (Sắc nét, không một khe hở)
> **[SDD - THAY ĐỔI SPEC | CHƯA SỬA CODE VỘI]**
> 1. **Hiển thị & Chỉnh sửa CV (BRL-03):**
>    - Mặc định chỉ hiển thị 5 trường: Họ tên, Email, Vị trí ứng tuyển, Kỹ năng, Số năm kinh nghiệm (đối chiếu JD).
>    - Thêm nút "Xem chi tiết" để mở phần học vấn, lịch sử công tác, chứng chỉ khi cần.
>    - Cho phép `HR` & `ADMIN` sửa trực tiếp 5 trường trên (thêm/xóa kỹ năng) và tự tính lại độ khớp JD. `HIRING_MANAGER` chỉ xem.
> 2. **Phân quyền chuyển vòng (RBAC):**
>    - `HR`: Chỉ chuyển tối đa đến `SCREENING` (`NEW -> SCREENING`, `NEW/SCREENING -> REJECTED`). Cấm chuyển sang `INTERVIEW`/`HIRED`.
>    - `HIRING_MANAGER`: Phụ trách từ `SCREENING` trở đi (`SCREENING -> INTERVIEW`, `INTERVIEW -> HIRED`, `SCREENING/INTERVIEW -> REJECTED`).
> 3. **Quy tắc State Machine & Từ chối:**
>    - Cấm nhảy cóc giai đoạn (`NEW -> INTERVIEW`, `SCREENING -> HIRED`).
>    - Chuyển sang `REJECTED` bắt buộc nhập lý do (≥ 5 ký tự) qua Modal và lưu vào `AuditLog`.
> 4. **Bước 1:** Trình bày bảng State Transition Matrix + Edge cases để tôi duyệt trước khi code.

---

## V. CHECKLIST 15 GIÂY TRƯỚC KHI GỬI PROMPT

Trước khi nhấn Enter cho bất kỳ thay đổi nào, lướt nhanh 4 câu hỏi:
1. **What:** Đã tách từng yêu cầu thành gạch đầu dòng đánh số `(1, 2, 3)` chưa?
2. **Who (RBAC):** Đã ghi rõ `HR`, `Hiring Manager`, `Admin` ai được làm / ai bị cấm chưa?
3. **Rule / Guard:** Đã ghi rõ điều kiện chặn (VD: thiếu lý do, thiếu Scorecard, nhảy cóc vòng) chưa?
4. **Gate:** Nếu là thay đổi lớn, đã thêm câu **"Chốt Spec trước — chưa sửa code vội"** chưa?

> **Mẹo dùng Slash Command trong IDE:**
> * Gõ `/grill-me` khi bạn mới có ý tưởng sơ bộ và muốn AI phỏng vấn ngược để vét sạch mọi Edge Case thành bản Spec kín kẽ.
> * Gõ `/plan` khi tính năng phức tạp cần lập kế hoạch từng bước rõ ràng trước khi sửa code.
