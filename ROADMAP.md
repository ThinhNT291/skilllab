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
- [ ] Đưa phần Gemini (chấm, nhận xét, TTS) vào API route phía server (đã chốt: Flash-Lite bản mới nhất; TTS dùng Flash-Lite TTS bản mới nhất).

## Giai đoạn 1 — Lõi học và luyện (ưu tiên cao nhất)
- [x] Lý thuyết 23 chuyên đề tiếng Anh đã chuyển sang JSON (`src/content/grammar/en`), có trang `/hoc` và `/hoc/[topic]`; validator `npm run check:content`.
- [x] Nhập ngân hàng bài tập cũ: 23 chuyên đề × 30 = 690 câu (`src/content/exercises/en/`).
- [x] **Đã vá lỗ hổng nội dung**: thêm 4 mục lý thuyết (`cond-connectors`, `ps-vs-pc`, `pp-vs-simple-past`, `past-simple-vs-continuous`) và gắn lại `usageId` (validator chặn thẻ chưa có mục dạy). 4 câu present-simple kiểm tra hiện tại tiếp diễn đã chuyển sang present-continuous (id `en-present-continuous-031..034`, `usageId` `ps-vs-pc`); present-simple được soạn lại 4 câu thuần hiện tại đơn (026–029). Cần chủ dự án đọc duyệt 4 mục mới và 4 câu mới.
- [x] `choiceExplanations` (giải thích riêng từng đáp án) đã có đủ cho **cả 23 chuyên đề, 694 câu**. Đáp án sai nhưng vẫn chấp nhận được trong tiếng Anh tự nhiên đã được ghi rõ trong lời giải thích; danh sách câu cần viết lại cho chỉ còn một đáp án đúng nằm ở mục dưới.
- [x] Đã sửa 40 câu có nhiều đáp án chấp nhận được: thay lựa chọn "sai nhưng vẫn nói được" bằng lựa chọn sai rõ ràng (sai thì, sai hòa hợp, sai chia). Việc này làm giảm phần đối chiếu "đơn vs tiếp diễn" trong một số câu; khi mở rộng ngân hàng lên 50–70 câu nên bổ sung câu có dấu hiệu rõ (at that exact moment, while...) để giữ phần đối chiếu.
- [x] Cân lại độ khó 10/10/10 cho 6 chuyên đề lệch (subjunctive, pronouns-determiners, adverbial-clauses, tag-questions, present-perfect-continuous, adjective-adverb-order) bằng cách xếp lại mức theo độ phức tạp thực của từng câu, không đổi nội dung. present-continuous nay có 34 câu (10/10/14) do nhận 4 câu tương phản; cân nhắc rút còn 30. [ ] Kiểm định độc lập chuyên đề 18–23 (chưa thấy ghi nhận đã audit).
- [x] Nhãn cấp độ của chuyên đề không hiển thị cho người học (quyết định cũ). [ ] Gắn cấp CEFR ở mức từng câu và mô tả năng lực (giai đoạn 3).
- [x] Mỗi lượt bốc 10 câu theo từng mức độ khó, xếp dễ → khó. [x] Chế độ "Nhức đầu" (`/hoc/[topic]/nhuc-dau`, 10 câu khó nhất; chưa tách riêng điểm số so với lượt thường).
- [x] `commonMistakes` đã tách thành {mô tả, cặp ví dụ sai/đúng, ghi chú} (105/106 mục có ví dụ). [ ] Gắn thẻ lỗi (`tags`) cho từng mục để nối với bài tập và phân tích.
- [ ] Mô hình dữ liệu nội dung dùng chung: mục học (từ, cụm, chủ điểm ngữ pháp, bài đọc, bài nghe), gắn **ngôn ngữ, thang, cấp độ, kỹ năng, chủ đề, thẻ lỗi (tag)**.
- [x] Khu Học → Bài tập: một câu mỗi lần, tiến độ, phản hồi tức thì, kết quả cuối bài, làm lại.
- [x] Kiểu câu: trắc nghiệm, xếp từ, gõ đáp án, nghe chép, tìm lỗi sai (chạm vào chỗ sai). [x] Ghép cặp là game mini bấm giờ. [ ] Chưa có: sửa lỗi bằng cách gõ lại câu đúng.
- [ ] Nhận xét và gợi ý có cấu trúc: vì sao sai, quy tắc liên quan, link về lý thuyết, mục nên ôn tiếp.
- [x] Màn **Tiến độ** `/tien-do`: tổng quan (số câu, % đúng, số chuyên đề), danh sách **mục cần ôn lại** (thẻ sai nhiều nhất lên đầu) kèm nút "Xem lại lý thuyết" và "Luyện lại mục này", và tỷ lệ đúng theo chuyên đề. Dùng bảng `answers`; tổng hợp lúc đọc (`src/lib/analytics`).
- [x] Chuỗi ngày học (hiện tại và dài nhất), mục tiêu hằng ngày (10 câu, có vòng tiến độ) và bản đồ nhiệt 12 tuần trên `/tien-do`; tính từ bảng `answers`, mọi lượt trả lời (đúng lẫn sai) đều tính. Ngày theo giờ trình duyệt.
- [ ] Phân tích nâng cao: mức thuộc từng mục theo thời gian, tiến độ theo thang trình độ, gợi ý chuyên đề nên học tiếp; mục tiêu hằng ngày tùy chỉnh; ôn tập (thẻ) cũng tính vào chuỗi ngày.
- [x] Kiểm thử tự động cho hàm thuần (`npm test`, 14 ca).
- [x] **Thẻ ôn tập (SRS)** `/on-tap`: thẻ tự tạo từ câu sai (không trùng; sai lại thẻ đã thuộc thì mở lại), lật 3D có họa tiết, chấm Lại/Khó/Tốt/Dễ (phím 1–4, lật bằng Space), "Lại" xếp thẻ về cuối hàng. Lịch ôn là SM-2 rút gọn viết mới (`src/lib/srs/scheduler.ts`); chưa đối chiếu với thuật toán SRS cũ vì tệp `Controller_Srs.gs` chưa có trong repo. [ ] Cân nhắc FSRS; thêm đọc to (TTS) trên thẻ; thẻ từ vựng/Nghe/Đọc.
- [x] Thẻ ôn tập: màn quản lý `/on-tap/quan-ly` (xem/xóa), giới hạn 10 thẻ mới mỗi ngày (đếm theo trình duyệt). [ ] Còn: chỉnh giới hạn, thử FSRS.
- [ ] Bước dạy trước khi thi; ví dụ che từ đích; độ khó đổi theo màn (không chỉ đổi kiểu bài).

## Giai đoạn 2 — Lớp game
- [ ] Nhân vật 4 trạng thái, 5 âm thanh (đúng, sai, bấm, lên cấp, xu), hiệu ứng pop/lắc/nảy/pháo giấy, combo, sao, xu có chỗ tiêu, huy hiệu.
- [ ] Bản đồ tiến trình mở khóa theo chủ điểm (khuyến khích đạt ngưỡng, không khóa cứng).
- [ ] Game mini sau mỗi N vòng (đã có ghép cặp bấm giờ; chưa tự mở sau N vòng), mỗi game một component độc lập, dùng chung ngân hàng nội dung. Ưu tiên ý: ghép cặp bấm giờ, xếp từ chạy đua, nghe-gõ, "trùm cuối" gom mục hay sai.
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
- [x] Bài xếp trình độ `/xep-trinh-do` (gợi ý chuyên đề, chưa quy đổi thang). [ ] Bài kiểm tra cuối chủ điểm.
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
