# Kho nội dung trong cơ sở dữ liệu

Quyết định với chủ dự án: đưa nội dung vào cơ sở dữ liệu để sao lưu dễ, ít sai lệch, dễ gắn thêm module. Làm theo hai giai đoạn để không đổi nguồn nội dung khi chưa chạy thử trên Supabase thật.

## Giai đoạn 1 (đã làm): bản sao có kiểm soát
- Migration `0008_content.sql`: bảng `content_items` (mọi loại nội dung, dữ liệu gốc nằm trong cột `data` jsonb, kèm `content_hash`) và `content_revisions` (mỗi lần sửa/xóa lưu bản cũ; hàm lưu là `security definer`).
- `collection`: `exercise`, `theory`, `theory_index`, `reading`, `listening`, `vocab`, `vocab_topics`, `collocation` (3.656 mục hiện nay).
- Đọc: mọi người đã đăng nhập (kể cả học thử). Ghi: chỉ quản trị và `service_role`.
- Script `scripts/content-sync.mjs` (chạy trên máy bạn, cần `SUPABASE_SERVICE_ROLE_KEY` trong `.env.local`):
  - `npm run content:status` so tệp với cơ sở dữ liệu (thoát mã 2 nếu lệch).
  - `npm run content:push` đưa mục mới/đã đổi lên; thêm `-- --prune` để ẩn mục không còn trong tệp.
  - `node scripts/content-sync.mjs export [tệp]` xuất toàn bộ để sao lưu (tệp `content-backup-*.json` đã được bỏ qua trong git).
- Tệp JSON trong `src/content` VẪN là nguồn khi build; cơ sở dữ liệu là bản sao. Quy trình sửa nội dung: sửa tệp, `npm run check:content`, commit, `npm run content:push`.
- Kiểm tra: `scripts/test-rls.mjs` nhập đủ 3.656 mục vào Postgres giả lập và kiểm quyền đọc/ghi, lưu bản cũ (30 tình huống đạt).

## Giai đoạn 2 (chưa làm): cơ sở dữ liệu thành nguồn chính
Chỉ làm sau khi giai đoạn 1 chạy ổn trên Supabase thật:
1. Các hàm nạp (`getVocab`, `getReadingPassages`, `getGrammarTopic`…) đọc từ `content_items` (có bộ nhớ đệm ở máy chủ, làm mới khi có thay đổi), JSON chỉ còn là dự phòng.
2. Trang `/quan-ly/noi-dung` để quản trị sửa câu hỏi/bài đọc, kèm kiểm tra như `check:content` trước khi lưu và xem lịch sử.
3. Bỏ bước build đọc JSON; JSON trở thành bản xuất (`export`) để lưu trong git.
Rủi ro cần xử lý ở giai đoạn 2: tốc độ tải trang (đang tĩnh nhờ JSON), tính nhất quán giữa số câu và chỉ mục (`usageCount`), và việc không để học sinh thấy nội dung đang soạn dở (cột `active`).
