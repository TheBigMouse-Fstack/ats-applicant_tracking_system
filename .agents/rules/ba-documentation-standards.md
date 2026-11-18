# Rule: Universal BA Documentation Standards (Adopted from Universal_BA_Toolkit)

> **Source:** `https://github.com/MrSilent205/Universal_BA_Toolkit`  
> **Scope:** Áp dụng bắt buộc cho toàn bộ tài liệu trong `docs/ba/` (Nghiệp vụ cho doanh nghiệp) và `docs/dev-context/` (Kỹ thuật cho Dev & AI Agent) của dự án **ATS — Applicant Tracking System**.

---

## 1. Siêu dữ liệu & Quản lý Phiên bản (RULE-18 & RULE-19)
- **Mọi file tài liệu trong `docs/` bắt buộc có khối YAML Frontmatter 8+ trường** ở ngay đầu file:
  `id`, `title`, `type`, `version` (SemVer `MAJOR.MINOR.PATCH`), `status` (`draft | in-review | approved | deprecated`), `owner`, `domain`, `tags`, `upstream_deps`, `downstream_deps`, `last_updated`.
- **Mọi tài liệu bắt buộc có Bảng Lịch Sử Sửa Đổi (Revision History Table)** theo Keep a Changelog (`Initial | Added | Changed | Deprecated | Removed | Fixed | Security`).
- **Tuyệt đối KHÔNG để lại văn phong hội thoại chat** (*"Chào bạn"*, *"Bạn có muốn mình làm tiếp không?"*, *"🎉 Tuyệt vời!"*) hoặc tiêu đề lỗi font (`???`) trong tài liệu BA chính thức.
- **Không lưu song song bản nháp cũ và bản mới** gây nhiễu nguồn chân lý — mọi lịch sử phiên bản được ghi vào bảng Revision History.

---

## 2. Quy ước Định danh & Cú pháp Chuẩn (RULE-01, RULE-02, RULE-03)
- **Functional Requirements (`RULE-01`):** Chuẩn phân cấp `FR-[MODULE]-[FEATURE]-[SEQ]` (kèm ánh xạ mã ngắn `FR-01..18` nếu cần tương thích báo cáo), ưu tiên MoSCoW (`P0 Must Have`, `P1 Should Have`, `P2 Could Have`), đầy đủ Input / Validation / Processing / Output / BR / ERR.
- **Business Rules (`RULE-02`):** Mọi quy tắc nghiệp vụ (`BRL-xx` / `BR-[DOMAIN]-[SEQ]`) bắt buộc phát biểu theo **mệnh đề 3 vế**:
  `WHEN [Điều kiện/Sự kiện] THEN [Hành vi bắt buộc] UNLESS [Ngoại lệ (hoặc "Không có")]`.
- **Error Codes (`RULE-03` & `RULE-11`):** Chuẩn 4 thành phần `ERR-[MODULE]-[HTTP_STATUS]-[SEQ]` (VD: `ERR-PIPE-403-01`, `ERR-APP-400-02`), luôn đi kèm **Ma trận Lỗi 7 Cột** (Err ID, Trigger, HTTP & Code, Backend Behavior, UI Response, Recovery Action, Severity).

---

## 3. Đặc tả Use Case, Acceptance Criteria & Chống Mơ Hồ (RULE-06, RULE-08, RULE-16)
- **Cockburn Use Case (`RULE-06`):** Đủ 12 thành phần chuẩn: Mã & Tên (`Động từ + Bổ ngữ`), Goal Level (`User-Goal Level`), Primary Actor, Stakeholders & Interests, Preconditions, Minimal Guarantees, Success Guarantees, Trigger, Main Success Scenario (`Actor ➔ System`), Extensions/Alternative Flows (`3a`, `4a`), Special Requirements, Related Business Rules.
- **Acceptance Criteria (`RULE-08`):** Viết bằng cú pháp **Gherkin BDD** (`Scenario / Given / When / Then`), mỗi luồng cốt lõi có tối thiểu 3 kịch bản: Happy Path, Business Negative Path, Boundary/Security Path.
- **Chống mơ hồ (`RULE-16` — Blacklist):** Nghiêm cấm các từ cảm tính không đo lường được (*"nhanh chóng"*, *"ngay lập tức"*, *"giao diện thân thiện"*, *"bảo mật tối đa"*, *"vân vân / v.v."*, *"nếu cần thiết"*, *"dung lượng hợp lý"*). Mọi yêu cầu phải định lượng rõ ràng bằng số liệu/ngưỡng kiểm thử được.

---

## 4. Mô hình Dữ liệu, Trạng thái, Phân quyền & Truy vết (RULE-04, RULE-09, RULE-12, RULE-14, RULE-17)
- **NFR (`RULE-04`):** Phân loại theo **ISO/IEC 25010**, bắt buộc định lượng theo công thức `Khi [Điều kiện] ➔ Đạt [Chỉ số] đo bằng [Phương pháp]`.
- **Data Dictionary (`RULE-09`):** Đủ **10 cột chuẩn**, bắt buộc phân loại mức độ nhạy cảm dữ liệu (`Public`, `Internal`, `Confidential - PII`, `Restricted`) và quy tắc che giấu (**Data Masking**) tuân thủ Nghị định 13/2023/NĐ-CP.
- **State Machine (`RULE-12`):** Rõ Initial State, Terminal States (tuyệt đối không có đường đi ra khỏi `HIRED`), Event, Guard Condition, Actor và Error Code.
- **Actor & RBAC (`RULE-17`):** Phân loại 4 nhóm tác nhân (Primary, Secondary, System/Daemon, Off-stage Stakeholder); áp dụng Principle of Least Privilege và enforce bắt buộc ở tầng Backend API/Middleware.
- **Traceability (`RULE-14`):** Duy trì **Ma trận Truy vết Hai Chiều (Bi-directional RTM)** liên kết `BRD Goal ➔ FR ➔ UC ➔ BR ➔ API ➔ Test Case` và kiểm tra độ lệch **Doc-Drift** (`skills/doc-drift`).
