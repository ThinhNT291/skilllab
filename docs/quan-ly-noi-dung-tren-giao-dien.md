# Sinh, duyệt, gộp nội dung ngay trên giao diện quản trị (đề xuất 26/10/2026, chưa xây)

Ý của chủ dự án: thay vì chạy script và đọc JSON, quản trị viên làm cả chuỗi **sinh → giải mù → duyệt → gộp** ở trang `/quan-ly/noi-dung`, chọn số mẫu, chuyên đề, bậc, mức khó, mô hình; duyệt xong thấy các tỷ lệ.

## Làm được, nhưng có một ràng buộc quyết định thiết kế
Ứng dụng chạy trên Vercel: **không ghi được vào `src/content`** (tệp JSON nằm trong git và được đọc lúc build). Vì vậy "gộp" trên giao diện chỉ có hai nghĩa:
- **A (làm trước):** "gộp" = đánh dấu *đã duyệt* trong cơ sở dữ liệu, rồi nút **Xuất đã duyệt** tạo tệp JSON đúng khuôn để đưa vào repo (Claude gộp, chạy `check:content`, test, đẩy). Không đổi cách ứng dụng đọc nội dung.
- **B (làm sau, = "Giai đoạn 2" ở `docs/noi-dung-trong-db.md`):** các hàm nạp nội dung đọc thẳng từ `content_items`; duyệt xong là học sinh thấy ngay. Đổi lớn: tốc độ tải trang, `usageCount`, ẩn nội dung đang soạn (`active`), và các thứ đang sinh lúc build (`items.json` meta Elo, ngân hàng xếp trình độ `reserved.json`) phải tính lại khi nội dung đổi.

## Giai đoạn A: các phần
1. **Bảng nháp** (migration mới): `content_drafts` (id, kind `grammar|reading|listening`, topic, bac, difficulty, `data` jsonb, `status` generated|review_failed|review_passed|approved|rejected, `batch_id`, `blind` jsonb kết quả giải mù, `reason` lý do loại, người duyệt, thời gian) và `content_batches` (tham số lô: mô hình, số mẫu, bậc, mức khó, phiên bản lời nhắc, chi phí ước tính). Chỉ quản trị đọc/ghi (RLS như `content_items`).
2. **API route** (chỉ quản trị, `maxDuration` đủ dài): `POST /api/admin/content/generate` (một lô nhỏ ≤ 10 mục mỗi lần gọi để khỏi quá giờ Vercel; lô lớn chia nhiều lần gọi từ trình duyệt), `POST …/review` (giải mù một mục/lô), `POST …/decide` (duyệt/loại, có lý do). Dùng lại đúng `item-gen.ts`, `passage-gen.ts`, prompts trong `src/lib/ai/prompts/` để script và giao diện không lệch nhau. Hạn mức: tối đa N lượt gọi/giờ/quản trị, ghi nhật ký (`audit`), khóa chỉ ở máy chủ.
3. **Trang `/quan-ly/noi-dung`**:
   - Form: loại (ngữ pháp/đọc/nghe), chuyên đề (danh sách có tìm kiếm từ `theory_index`), bậc 1–6, số mẫu, mức khó (tùy chọn, mặc định chia đều), mô hình (danh sách lấy từ API liệt kê mô hình của Google, có ô tự nhập mã; mặc định `GEMINI_TEXT_MODEL`), số lần giải mù (1–3).
   - Bảng kết quả: mỗi mục hiện như học sinh sẽ thấy (đề, 4 đáp án, đáp án đúng tô màu, giải thích từng đáp án), cạnh đó kết quả giải mù (mô hình chọn gì, có khớp không), cảnh báo từ mã (từ vựng vượt bậc, câu trùng đề). Nút Duyệt/Loại (+ chọn lý do có sẵn: sai ngữ pháp, hai đáp án đúng, không tự nhiên, quá dễ/khó, sai số liệu…), duyệt hàng loạt các mục đã qua giải mù, sửa nhanh chữ trước khi duyệt.
   - **Thống kê** (đúng ý "hiển thị các loại tỷ lệ"): tỷ lệ qua kiểm bằng mã, qua giải mù, người duyệt đồng ý (theo lô, theo chuyên đề, theo bậc, theo phiên bản lời nhắc, theo mô hình); phân bố vị trí đáp án A/B/C/D, độ khó, bậc; lý do loại phổ biến; chi phí ước tính. Tỷ lệ "giải mù qua nhưng người loại" cho biết giải mù tin được đến đâu; "người duyệt đồng ý" theo phiên bản lời nhắc là số liệu để hiệu chỉnh lời nhắc.
   - Nút **Xuất đã duyệt**: tải tệp JSON đúng khuôn kho (mã câu do mã gán, không trùng), kèm báo cáo kiểm như `check:content`.
4. **Kiểm tra trước khi cho duyệt:** dùng chung hàm kiểm với `check:content` (đưa phần kiểm thành hàm thuần dùng cho cả script và trang) để nháp sai cấu trúc không vào được hàng duyệt.

## Điều không đổi
- Người vẫn là bước quyết định; giải mù chỉ lọc lỗi logic. Phản biện độc lập bằng agent vẫn nên có trước khi gộp vào repo (quy trình ở CLAUDE.md).
- Không tự gắn nhãn `bac` mới: nhãn do lời nhắc đề xuất, người duyệt xem và sửa.
- Không công khai: chỉ quản trị gọi được, vì mỗi lần gọi tốn hạn mức Gemini (CAPTCHA/hạn mức chấm cho học sinh là việc khác, đang hoãn).

## Thứ tự
Sau khi xây xong Lộ trình bước đầu. Giai đoạn A xây theo từng lát: (1) bảng nháp + trang xem/duyệt/thống kê, nạp thử bằng tệp `tmp/gen/*.json` từ script (kiểm được giao diện mà chưa cần khóa Gemini); (2) nút sinh + giải mù qua API; (3) Xuất đã duyệt. Giai đoạn B chỉ làm khi A chạy ổn và có lý do (nhiều người cùng duyệt, nhiều nội dung mỗi tuần).

## Tiến độ xây
- **Lát 1 XONG (26/10/2026): bảng nháp, trang duyệt, thống kê, xuất.** Migration `0017_content_drafts.sql` (bảng `content_batches`, `content_drafts`, RLS chỉ quản trị qua `is_admin()`; đã thử trên cơ sở dữ liệu giả lập: người không phải quản trị bị chặn cả đọc lẫn ghi, trạng thái lạ và trùng (lô, mã) bị từ chối, xóa lô kéo theo nháp). Hàm thuần `src/lib/contentdraft/` (`parse.ts` đọc tệp lô + tệp giải mù, `stats.ts` các tỷ lệ, `export.ts` gom theo tệp đích; có test). Lớp DB `src/lib/db/drafts.ts`. Trang `/quan-ly/noi-dung` (tab "Nội dung" ở khu quản lý): nạp lô từ `tmp/gen` (+ tệp `.reviewed.json`), lọc theo trạng thái/lô, xem từng mục như học sinh thấy kèm kết quả giải mù, Duyệt / Loại (chọn lý do có sẵn hoặc tự ghi) / Mở lại, duyệt hàng loạt các mục đã qua giải mù, xóa lô, thống kê (qua kiểm bằng mã, qua giải mù, bạn đồng ý, giải mù so với quyết định của bạn, vị trí đáp án, độ khó, bậc, lý do loại, theo phiên bản lời nhắc/mô hình/chuyên đề/bậc), xuất mục đã duyệt thành tệp JSON theo tệp đích kèm cảnh báo (mã trùng, đáp án dồn một vị trí).
- Chưa kiểm bằng dữ liệu thật: giao diện chỉ mới được tải thử (không lỗi) và logic thuần được test; chưa nạp lô thật vì cần Supabase và tài khoản quản trị. Sửa nhanh chữ trước khi duyệt: chưa làm.
- **Lát 2 (chưa làm):** nút sinh + giải mù qua API route (chỉ quản trị, có hạn mức, mỗi lần gọi ≤ 10 mục, chọn mô hình từ danh sách của Google). **Lát 3:** Xuất đã duyệt thành bản gộp sẵn sàng (hiện là các phần để gộp).
