# Skilllab / Training Zone — ngữ cảnh dự án

@AGENTS.md

> Tệp này là "bộ nhớ" của dự án. Đọc trước khi làm việc; cập nhật khi có quyết định mới. Lộ trình chi tiết nằm ở `ROADMAP.md`.

## Dự án là gì
Web học và luyện ngoại ngữ **có chấm điểm, nhận xét, gợi ý và phân tích tiến độ** (Speaking, Writing, Listening, Reading, Shadowing, Ngữ pháp, SRS). Chủ dự án là người làm sở thích, không phải dân lập trình chuyên nghiệp; giao diện là điểm yếu tự nhận. Làm **từng bước nhỏ**, không mở "hộp mới" khi bước hiện tại chưa vững.

## Đối tượng
Học sinh cuối cấp 1 đến hết cấp 2 (lớp 4–9, khoảng 9–15 tuổi), trình độ từ A2 trở lên. Vui nhưng không quá trẻ con; cấp 2 thích combo/huy hiệu/xếp hạng, cấp 1 cuối thích sao/xu/sưu tầm. Chi tiết: xem phần ngữ cảnh game trẻ em (mục 7.1 của tài liệu gốc do chủ dự án cung cấp).

## Quyết định đã chốt
1. **Ưu tiên số 1 là chất lượng nội dung học tập và chuẩn đánh giá**; game song song nhưng không được làm loãng phần học.
2. **Xây lại hoàn toàn theo hướng A: Next.js + React + Tailwind + shadcn/ui, Supabase (Postgres + Auth), triển khai Vercel**, giống repo `daotao` (thay bản JS thuần + Google Apps Script). Chưa có người dùng thật nên **dữ liệu hiện có xóa được, bắt đầu từ dự án trống**. Riêng `grammar_theory_bank.js` là nội dung đã biên soạn: giữ làm dữ liệu nguồn, không xóa.
3. Repo `ThinhNT291/daotao` (Next.js 16, React 19, Tailwind 4, shadcn `base-nova`, Supabase, Vercel; hệ thống quản trị tuyển sinh, cá nhân của chủ dự án) dùng để tham khảo/tái dùng design token, bộ shadcn, `canvas-confetti`, `@dnd-kit`, thói quen code. Không dùng phần nghiệp vụ quản trị. Repo đó có `AGENTS.md` nhắc Next.js bản này khác bản quen thuộc: **đọc tài liệu trong `node_modules/next/dist/docs/` trước khi viết code Next.js**.
3a. **Tài khoản (tạm thời):** dùng chung tài khoản Vercel và Supabase hiện có, tạo project riêng, khóa riêng, không dùng lại khóa của `daotao`. Gói miễn phí Supabase giới hạn số project hoạt động và tự tạm dừng khi không dùng (cần kiểm tra số project trước khi tạo). Vercel Hobby chỉ cho dùng phi thương mại. Tách tài khoản khi: hết chỗ project, bắt đầu thu phí/thương mại, hoặc cần tách rủi ro khỏi `daotao`.
3b. **Thiết kế để dễ chuyển nền tảng dữ liệu** (có thể sang Amazon Postgres/Cloudflare khi mở rộng): schema bằng migration SQL trong repo; truy cập dữ liệu qua một lớp mỏng, không rải `supabase.from()` trong component; dùng Postgres thuần, tránh Realtime/Edge Functions ở giai đoạn đầu; bảng `profiles` riêng tham chiếu mã người dùng, tách khỏi hệ đăng nhập; Gemini và chấm điểm ở API route Next.js; lưu file qua hàm bao. Chỗ khó nhất khi chuyển là Supabase Auth và các chính sách RLS gọi hàm riêng của Supabase.
3c. **Đăng nhập:** giai đoạn đầu dùng **đăng nhập ẩn danh** của Supabase (học sinh dùng ngay, không đăng ký). Sau này thêm **hai đường**: tài khoản do quản trị tạo và Google; hồ sơ (`profiles`) giữ nguyên cách tạo, chỉ thêm cách gắn tài khoản. Dữ liệu học tập tham chiếu `profiles.id`, không tham chiếu thẳng hệ đăng nhập; chỗ duy nhất gắn với Supabase Auth là `profiles.auth_user_id` và hàm SQL `current_profile_id()`.
4. Game mini dạng "học xong vài vòng thì chơi": mỗi game là component độc lập, nhận danh sách mục học và trả về điểm; dùng chung ngân hàng nội dung.
5. Không sao chép nội dung, mã hay hình ảnh của game/website khác (IOE, "Đảo Kho Báu Từ Vựng"…); chỉ học ý tưởng.
6. Luôn có tùy chọn tắt âm thanh và giảm chuyển động (`prefers-reduced-motion`). Hạn chế thu thập dữ liệu cá nhân của trẻ vị thành niên; xếp hạng dùng biệt danh và có thể tắt; không quảng cáo.

## Hiện trạng kỹ thuật
Đã dựng khung Next.js 16.4 (Cache Components bật) + React 19 + Tailwind 4, Nunito qua `next/font`. Đã có Supabase (client, đăng nhập ẩn danh, bảng `profiles`/`answers` trong `supabase/migrations/0001_init.sql`, lớp `src/lib/db`); chưa cài shadcn/ui, `@dnd-kit` (thêm khi cần). Có: 3 skin giao diện bằng biến CSS (`[data-skin]` trên `<html>`: explore, adventure, space), `ExerciseRunner` (một câu mỗi lần, combo, sao, pháo giấy, tắt âm, tôn trọng giảm chuyển động), mô hình nội dung `src/lib/content/types.ts`, trang `/luyen-tap` dùng 3 câu mẫu. Chi tiết cấu trúc: `README.md`. Mã cũ nằm ở `legacy/` (không build, không lint).

## Hiện trạng kỹ thuật bản cũ (trong `legacy/`)
JS/HTML/CSS thuần, không build. `app.js` ~4.000 dòng, `index.html` ~960 dòng, `style.css` ~560 dòng, `grammar_theory_bank.js` (lý thuyết ngữ pháp) ~3.200 dòng. Backend: Google Apps Script (`callBackendAPI`) + Gemini API (chấm, nhận xét, TTS). Triển khai: GitHub Pages.
Bài tập ngữ pháp hiện chỉ có trắc nghiệm 4 đáp án, chấm tại client, có giải thích theo từng đáp án, ghi log SRS/streak ở backend, chế độ "Nhức đầu" (câu khó).

## Điều chưa chắc (đừng coi là sự thật)
- Cấu trúc/dạng bài chính thức của IOE: mới chỉ có thông tin từ bài viết bên thứ ba, chưa đối chiếu ioe.vn.
- Mọi bảng quy đổi giữa các thang (CEFR ↔ 6 bậc VN ↔ JLPT/HSK/TOPIK…) trong `ROADMAP.md` là bản nháp cần kiểm chứng với nguồn chính thức trước khi đưa lên giao diện.
