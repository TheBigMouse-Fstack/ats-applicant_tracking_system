# Rule: Quy Trình Tự Động Biên Dịch Tài Liệu BA Sang Word (Pandoc .docx Export)

> **Phạm vi:** Kích hoạt tự động bất cứ khi nào Người dùng yêu cầu viết tài liệu SRS, BRD, PRD, FDD, Use Case hoặc xuất bản file Word (.docx) cho khách hàng.

---

## 1. Nguyên Tắc Thực Thi Tự Động 2 Bước

Khi người dùng yêu cầu:
- *"Viết cho tôi tài liệu SRS/BRD/FDD..."*
- *"Xuất file Word (.docx) cho tài liệu..."*
- Hoặc câu lệnh ngắn: *"Dựa trên yêu cầu tính năng X, viết SRS và xuất Word."*

**AI Agent (Antigravity) TUYỆT ĐỐI KHÔNG BẮT NGƯỜI DÙNG TỰ CHẠY LỆNH PANDOC.** Agent sẽ tự động thực hiện trọn gói cả 2 bước:

### Bước 1: Soạn Thảo Nội Dung Markdown Thuần
1. Soạn thảo cấu trúc tài liệu hoàn chỉnh bằng **Markdown thuần** (Header, Bullet points, Bảng biểu chuẩn, Callout alert block).
2. Lưu file vào đúng thư mục phân định của dự án:
   - Hồ sơ BA dành cho Doanh nghiệp / Khách hàng: `docs/ba/`
   - Hồ sơ Kỹ thuật dành cho Dev / QA: `docs/dev-context/`
3. Tuân thủ 100% chuẩn mực BA (`.agents/rules/ba-documentation-standards.md`): Có YAML Frontmatter, Bảng Revision History, Functional Requirements phân cấp, Business Rules 3 vế, Error Matrix 7 cột, Use Case 12 phần Cockburn.

### Bước 2: Tự Động Thực Thi Lệnh Biên Dịch Ra Word (.docx)
1. Thư mục đích luôn là: `docs/exports/`
2. Agent tự động gọi lệnh terminal với định dạng GitHub Flavored Markdown (`--from=gfm`) và file mẫu `reference.docx`:
   ```bash
   pandoc --from=gfm docs/ba/[ten-file].md -o docs/exports/[ten-file].docx --reference-doc=docs/exports/reference.docx
   ```
   *(Nếu đường dẫn PATH hệ thống chưa nạp lại session, gọi trực tiếp: `C:\Users\ACER\AppData\Local\Pandoc\pandoc.exe`)*
3. **Cơ chế Dự phòng Thông minh (Fallback Strategy):**
   - Nếu `reference.docx` chưa có trong `docs/exports/`, tự động sinh template chuẩn:
     ```bash
     pandoc -o docs/exports/reference.docx --print-default-data-file reference.docx
     ```
   - Nếu tài liệu có bảng biểu gộp ô phức tạp (như Use Case Cockburn) hoặc khi môi trường chưa có Pandoc CLI, Agent tự động chạy script Node.js với thư viện `docx` để tạo file Word hoàn hảo không lỗi layout.
4. **Phản hồi kết quả:**
   - Trả về đường dẫn nhấp chuột trực tiếp dạng liên kết file:
     `[Tên_Tài_Liệu.docx](file:///d:/ATS%20project/docs/exports/Tên_Tài_Liệu.docx)`
   - Hướng dẫn nhanh người dùng: Có thể mở trực tiếp bằng Microsoft Word trên máy hoặc tải lên Google Drive chọn *"Mở bằng Google Tài liệu (Google Docs)"*.
