# Skilllab / Training Zone — ngữ cảnh dự án

> Tệp này là "bộ nhớ" của dự án. Đọc trước khi làm việc; cập nhật khi có quyết định mới. Lộ trình chi tiết nằm ở `ROADMAP.md`.

## Dự án là gì
Web học và luyện ngoại ngữ **có chấm điểm, nhận xét, gợi ý và phân tích tiến độ** (Speaking, Writing, Listening, Reading, Shadowing, Ngữ pháp, SRS). Chủ dự án là người làm sở thích, không phải dân lập trình chuyên nghiệp; giao diện là điểm yếu tự nhận. Làm **từng bước nhỏ**, không mở "hộp mới" khi bước hiện tại chưa vững.

## Đối tượng
Học sinh cuối cấp 1 đến hết cấp 2 (lớp 4–9, khoảng 9–15 tuổi), trình độ từ A2 trở lên. Vui nhưng không quá trẻ con; cấp 2 thích combo/huy hiệu/xếp hạng, cấp 1 cuối thích sao/xu/sưu tầm. Chi tiết: xem phần ngữ cảnh game trẻ em (mục 7.1 của tài liệu gốc do chủ dự án cung cấp).

## Quyết định đã chốt
1. **Ưu tiên số 1 là chất lượng nội dung học tập và chuẩn đánh giá**; game song song nhưng không được làm loãng phần học.
2. **Xây lại frontend hoàn toàn** bằng Vite + React + Tailwind (thay bản JS thuần hiện tại). Chưa có người dùng thật nên **dữ liệu hiện có xóa được, bắt đầu từ dự án trống**.
3. Dự án React + Tailwind của chủ dự án nằm ở repo `daotao` (khác đối tượng người dùng; chỉ tham khảo/tái dùng giao diện, component, design token). Phiên Claude hiện tại chưa có quyền vào repo đó.
4. Game mini dạng "học xong vài vòng thì chơi": mỗi game là component độc lập, nhận danh sách mục học và trả về điểm; dùng chung ngân hàng nội dung.
5. Không sao chép nội dung, mã hay hình ảnh của game/website khác (IOE, "Đảo Kho Báu Từ Vựng"…); chỉ học ý tưởng.
6. Luôn có tùy chọn tắt âm thanh và giảm chuyển động (`prefers-reduced-motion`). Hạn chế thu thập dữ liệu cá nhân của trẻ vị thành niên; xếp hạng dùng biệt danh và có thể tắt; không quảng cáo.

## Hiện trạng kỹ thuật (trước khi xây lại)
JS/HTML/CSS thuần, không build. `app.js` ~4.000 dòng, `index.html` ~960 dòng, `style.css` ~560 dòng, `grammar_theory_bank.js` (lý thuyết ngữ pháp) ~3.200 dòng. Backend: Google Apps Script (`callBackendAPI`) + Gemini API (chấm, nhận xét, TTS). Triển khai: GitHub Pages.
Bài tập ngữ pháp hiện chỉ có trắc nghiệm 4 đáp án, chấm tại client, có giải thích theo từng đáp án, ghi log SRS/streak ở backend, chế độ "Nhức đầu" (câu khó).

## Điều chưa chắc (đừng coi là sự thật)
- Cấu trúc/dạng bài chính thức của IOE: mới chỉ có thông tin từ bài viết bên thứ ba, chưa đối chiếu ioe.vn.
- Mọi bảng quy đổi giữa các thang (CEFR ↔ 6 bậc VN ↔ JLPT/HSK/TOPIK…) trong `ROADMAP.md` là bản nháp cần kiểm chứng với nguồn chính thức trước khi đưa lên giao diện.
