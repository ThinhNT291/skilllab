# Lộ trình Training Zone

Trạng thái: bản nháp thảo luận, chưa có phần nào được xây. Mục đánh dấu **(cần kiểm chứng)** là nhận định chưa đối chiếu nguồn chính thức.

## Nguyên tắc
- Nội dung và chuẩn đánh giá đi trước, hình thức game đi sau nhưng song song.
- Mỗi bước nhỏ phải chạy được và dùng được trước khi sang bước kế.
- Mọi gợi ý học thuật phải truy được về nguồn (khung chuẩn, danh mục từ vựng/ngữ pháp, nghiên cứu); không bịa quy đổi.

## Giai đoạn 0 — Chuẩn bị
- [x] Cấp quyền cho phiên Claude vào repo `daotao`.
- [x] Chốt hướng A: Next.js + Supabase + Vercel; bỏ Google Apps Script.
- [ ] Rà kỹ component/design token của `daotao`, chọn cái dùng lại (bảng màu mới tươi hơn cho học sinh).
- [ ] Kiểm tra số project Supabase đang hoạt động, tạo project riêng; tạo project Vercel; chủ dự án cấp biến môi trường.
- [x] Dựng khung Next.js, 3 skin, `ExerciseRunner` với câu mẫu (chưa nối dữ liệu).
- [x] Client Supabase (browser/server) và route `/api/health` kiểm tra kết nối khi chạy dev.
- [x] Chốt: đăng nhập ẩn danh trước. Có `supabase/migrations/0001_init.sql` (`profiles`, `answers`, RLS) và lớp `src/lib/db` ghi từng câu trả lời.
- [ ] Thêm đường đăng nhập: tài khoản do quản trị tạo (cần màn quản lý) và Google; gắn tài khoản cho người đang dùng ẩn danh. Bật CAPTCHA trước khi mở rộng.
- [ ] Phân tích từ `answers`: tiến độ theo chủ điểm/thẻ lỗi, mức thuộc, SRS.
- [ ] Chuyển `legacy/grammar_theory_bank.js` thành dữ liệu nguồn; xóa phần còn lại của `legacy/` sau khi chủ dự án xác nhận.
- [ ] Đưa phần Gemini (chấm, nhận xét, TTS) vào API route phía server.

## Giai đoạn 1 — Lõi học và luyện (ưu tiên cao nhất)
- [x] Lý thuyết 23 chuyên đề tiếng Anh đã chuyển sang JSON (`src/content/grammar/en`), có trang `/hoc` và `/hoc/[topic]`; validator `npm run check:content`.
- [x] Nhập ngân hàng bài tập cũ: 23 chuyên đề × 30 = 690 câu (`src/content/exercises/en/`).
- [x] **Đã vá lỗ hổng nội dung**: thêm 4 mục lý thuyết (`cond-connectors`, `ps-vs-pc`, `pp-vs-simple-past`, `past-simple-vs-continuous`) và gắn lại `usageId` (validator chặn thẻ chưa có mục dạy). 4 câu present-simple kiểm tra hiện tại tiếp diễn đã chuyển sang present-continuous (id `en-present-continuous-031..034`, `usageId` `ps-vs-pc`); present-simple được soạn lại 4 câu thuần hiện tại đơn (026–029). Cần chủ dự án đọc duyệt 4 mục mới và 4 câu mới.
- [x] `choiceExplanations` (giải thích riêng từng đáp án) đã có đủ cho **cả 23 chuyên đề, 694 câu**. Đáp án sai nhưng vẫn chấp nhận được trong tiếng Anh tự nhiên đã được ghi rõ trong lời giải thích; danh sách câu cần viết lại cho chỉ còn một đáp án đúng nằm ở mục dưới.
- [ ] **Viết lại để mỗi câu chỉ còn một đáp án đúng** (hiện học sinh chọn đáp án "sai" nhưng vẫn nói được sẽ bị tính sai). Ít nhất 26 câu đã được lời giải thích ghi nhận điều này: conditional-sentences 003; future-simple 011, 014, 023, 024, 030; modal-verbs 025; passive-voice 003, 004; past-continuous 013, 016, 017, 018, 020, 023, 025, 028; present-continuous 014, 028; present-perfect 013, 017, 019, 023, 025, 029; reported-speech 010. Cách sửa: thêm dấu hiệu rõ hơn vào đề (at that exact moment, while, schedule...). Lưu ý thêm: future-simple 021 dùng 'will still prepare' (tự nhiên hơn là 'will still be preparing').
- [x] Cân lại độ khó 10/10/10 cho 6 chuyên đề lệch (subjunctive, pronouns-determiners, adverbial-clauses, tag-questions, present-perfect-continuous, adjective-adverb-order) bằng cách xếp lại mức theo độ phức tạp thực của từng câu, không đổi nội dung. present-continuous nay có 34 câu (10/10/14) do nhận 4 câu tương phản; cân nhắc rút còn 30. [ ] Kiểm định độc lập chuyên đề 18–23 (chưa thấy ghi nhận đã audit).
- [x] Nhãn cấp độ của chuyên đề không hiển thị cho người học (quyết định cũ). [ ] Gắn cấp CEFR ở mức từng câu và mô tả năng lực (giai đoạn 3).
- [x] Mỗi lượt bốc 10 câu theo từng mức độ khó, xếp dễ → khó. [x] Chế độ "Nhức đầu" (`/hoc/[topic]/nhuc-dau`, 10 câu khó nhất; chưa tách riêng điểm số so với lượt thường).
- [x] `commonMistakes` đã tách thành {mô tả, cặp ví dụ sai/đúng, ghi chú} (105/106 mục có ví dụ). [ ] Gắn thẻ lỗi (`tags`) cho từng mục để nối với bài tập và phân tích.
- [ ] Mô hình dữ liệu nội dung dùng chung: mục học (từ, cụm, chủ điểm ngữ pháp, bài đọc, bài nghe), gắn **ngôn ngữ, thang, cấp độ, kỹ năng, chủ đề, thẻ lỗi (tag)**.
- [ ] Khu Học → Bài tập: một câu mỗi lần, tiến độ, phản hồi tức thì, kết quả cuối bài, làm lại câu sai.
- [ ] Nhiều kiểu câu: trắc nghiệm, xếp từ thành câu, điền từ (gõ), nghe-chọn/gõ, ghép cặp, sửa lỗi sai.
- [ ] Nhận xét và gợi ý có cấu trúc: vì sao sai, quy tắc liên quan, link về lý thuyết, mục nên ôn tiếp.
- [x] Màn **Tiến độ** `/tien-do`: tổng quan (số câu, % đúng, số chuyên đề), danh sách **mục cần ôn lại** (thẻ sai nhiều nhất lên đầu) kèm nút "Xem lại lý thuyết" và "Luyện lại mục này", và tỷ lệ đúng theo chuyên đề. Dùng bảng `answers`; tổng hợp lúc đọc (`src/lib/analytics`).
- [ ] Phân tích nâng cao: mức thuộc từng mục theo thời gian, tiến độ theo thang trình độ, chuỗi ngày học và bản đồ nhiệt (cần ghi ngày hoạt động), gợi ý chuyên đề nên học tiếp.
- [ ] Thẻ ôn tập ngắt quãng (SRS) tự tạo từ câu sai, không tạo trùng (cần bảng mới và màn ôn tập).
- [ ] Bước dạy trước khi thi; ví dụ che từ đích; độ khó đổi theo màn (không chỉ đổi kiểu bài).

## Giai đoạn 2 — Lớp game
- [ ] Nhân vật 4 trạng thái, 5 âm thanh (đúng, sai, bấm, lên cấp, xu), hiệu ứng pop/lắc/nảy/pháo giấy, combo, sao, xu có chỗ tiêu, huy hiệu.
- [ ] Bản đồ tiến trình mở khóa theo chủ điểm (khuyến khích đạt ngưỡng, không khóa cứng).
- [ ] Game mini sau mỗi N vòng, mỗi game một component độc lập, dùng chung ngân hàng nội dung. Ưu tiên ý: ghép cặp bấm giờ, xếp từ chạy đua, nghe-gõ, "trùm cuối" gom mục hay sai.
- [ ] Hai bộ giao diện theo lứa tuổi (cuối cấp 1 / cấp 2), cho chọn nhân vật/chủ đề.

## Giai đoạn 3 — Chuẩn đánh giá và đa ngôn ngữ
Mục tiêu: mỗi mục học và mỗi bài kiểm tra neo vào một thang chuẩn, có công thức xếp trình độ minh bạch.

| Ngôn ngữ | Thang tham chiếu cần nghiên cứu |
|---|---|
| Chung | CEFR A1–C2 (Khung tham chiếu chung châu Âu, kèm bản bổ sung) |
| Việt Nam | Khung năng lực ngoại ngữ 6 bậc dùng cho Việt Nam (Bậc 1–6, đối chiếu A1–C2) **(cần kiểm chứng văn bản hiện hành)** |
| Anh | Danh mục từ vựng/ngữ pháp theo cấp CEFR (English Vocabulary Profile / English Grammar Profile, Oxford 3000/5000) **(cần kiểm chứng giấy phép dùng lại)** |
| Nhật | JLPT N5–N1; tham khảo thang theo CEFR-J **(cần kiểm chứng)** |
| Trung | HSK (bản cũ 6 cấp và chuẩn mới nhiều cấp hơn; xác định bản đang áp dụng) **(cần kiểm chứng)**; TOCFL nếu cần |
| Hàn | TOPIK I–II (cấp 1–6) **(cần kiểm chứng)** |

- [ ] Nghiên cứu: tiêu chí từng cấp theo kỹ năng, mô tả "can-do", và cách chấm Speaking/Writing theo thang (rubric: nội dung, mạch lạc, từ vựng, ngữ pháp, phát âm).
- [ ] Bảng quy đổi giữa các thang có ghi nguồn và mức độ chắc chắn; không đưa ra giao diện nếu chưa kiểm chứng.
- [ ] Bài kiểm tra xếp trình độ (placement) và bài kiểm tra cuối chủ điểm; giải thích cách ra kết quả.
- [ ] Thiết kế để thêm ngôn ngữ mới chỉ là thêm dữ liệu và thang, không sửa lõi (chú ý chữ viết, phiên âm, TTS, nhập liệu khác nhau).

## Giai đoạn 4 — Đề xuất học thuật + trải nghiệm (làm theo từng đợt khảo sát)
Mỗi đợt: chọn một hệ thống để khảo sát, ghi lại họ làm gì, vì sao hiệu quả (có bằng chứng hay chỉ là thói quen thiết kế), rồi đề xuất mục áp dụng cho dự án này.

Hệ thống ứng viên để tham khảo **(danh sách gợi ý, chưa khảo sát)**:
- Duolingo (đường học, độ khó thích ứng, chế độ khó), Busuu, Memrise, Babbel, LingQ, Lingvist.
- Anki / FSRS (thuật toán ôn lặp lại), Quizlet.
- Kahoot, Gimkit, Blooket (game mini dùng trong lớp).
- IOE (nhịp chơi của học sinh Việt Nam; đối chiếu ioe.vn).
- ELSA Speak (chấm phát âm), các hệ thống chấm Writing/Speaking tự động.

Chủ đề cần đề xuất (mỗi chủ đề: vấn đề, bằng chứng, đề xuất, chi phí):
- [ ] Thuật toán ôn lặp lại: SM-2 hiện tại so với FSRS.
- [ ] Độ khó thích ứng và xếp trình độ liên tục.
- [ ] Phản hồi lỗi: sửa ngay hay gợi ý trước, phản hồi theo tag lỗi.
- [ ] Luyện cách quãng xen kẽ (interleaving) và ôn theo ngữ cảnh.
- [ ] Động lực: streak, mục tiêu hằng ngày, và cách tránh gây áp lực/lo âu cho học sinh 9–15 tuổi.
- [ ] Trình bày kết quả cho học sinh, phụ huynh và giáo viên (ba góc nhìn khác nhau).
- [ ] Khả năng truy cập: cỡ chữ, tương phản, bàn phím, thiết bị di động.

## Câu hỏi mở
- Kế hoạch chuyển nền tảng dữ liệu khi mở rộng (Amazon Postgres hay Cloudflare): chọn hệ đăng nhập thay thế Supabase Auth khi đến lúc; xem nguyên tắc ở CLAUDE.md mục 3b.
- Nhân vật: emoji, SVG tự vẽ, hay bộ hình miễn phí bản quyền?
- Theo dõi tiến độ của học sinh: chỉ trên máy, hay đăng nhập? Có khu cho phụ huynh/giáo viên xem từ xa không?
- Giai đoạn 3 bắt đầu với ngôn ngữ nào sau tiếng Anh (Nhật, Trung hay Hàn)?
