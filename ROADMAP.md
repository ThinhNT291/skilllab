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
- [x] Mở rộng lên 50–70 câu/chuyên đề: `present-simple` 60 câu, 30 chuyên đề còn lại 50 câu (17/17/16), tổng 1.560 câu; phần mở rộng đã qua phản biện độc lập.
- [x] Nhập ngân hàng bài tập cũ: 23 chuyên đề × 30 = 690 câu (`src/content/exercises/en/`).
- [x] **Đã vá lỗ hổng nội dung**: thêm 4 mục lý thuyết (`cond-connectors`, `ps-vs-pc`, `pp-vs-simple-past`, `past-simple-vs-continuous`) và gắn lại `usageId` (validator chặn thẻ chưa có mục dạy). 4 câu present-simple kiểm tra hiện tại tiếp diễn đã chuyển sang present-continuous (id `en-present-continuous-031..034`, `usageId` `ps-vs-pc`); present-simple được soạn lại 4 câu thuần hiện tại đơn (026–029). Cần chủ dự án đọc duyệt 4 mục mới và 4 câu mới.
- [x] `choiceExplanations` (giải thích riêng từng đáp án) đã có đủ cho **cả 23 chuyên đề, 694 câu**. Đáp án sai nhưng vẫn chấp nhận được trong tiếng Anh tự nhiên đã được ghi rõ trong lời giải thích; danh sách câu cần viết lại cho chỉ còn một đáp án đúng nằm ở mục dưới.
- [x] Đã sửa 40 câu có nhiều đáp án chấp nhận được: thay lựa chọn "sai nhưng vẫn nói được" bằng lựa chọn sai rõ ràng (sai thì, sai hòa hợp, sai chia). Việc này làm giảm phần đối chiếu "đơn vs tiếp diễn" trong một số câu; khi mở rộng ngân hàng lên 50–70 câu nên bổ sung câu có dấu hiệu rõ (at that exact moment, while...) để giữ phần đối chiếu.
- [x] Cân lại độ khó 10/10/10 cho 6 chuyên đề lệch (subjunctive, pronouns-determiners, adverbial-clauses, tag-questions, present-perfect-continuous, adjective-adverb-order) bằng cách xếp lại mức theo độ phức tạp thực của từng câu, không đổi nội dung. present-continuous nay có 34 câu (10/10/14) do nhận 4 câu tương phản; cân nhắc rút còn 30. [x] Kiểm định độc lập chuyên đề 18–23 (đã làm 26/10: sửa nhiễu chấp nhận được, ví dụ trùng, điều bài tập kiểm tra mà lý thuyết chưa dạy).
- [x] Nhãn cấp độ của chuyên đề không hiển thị cho người học (quyết định cũ). [ ] Gắn cấp CEFR ở mức từng câu và mô tả năng lực (giai đoạn 3).
- [x] Mỗi lượt bốc 10 câu theo từng mức độ khó, xếp dễ → khó. [x] Chế độ "Nhức đầu" (`/hoc/[topic]/nhuc-dau`, 10 câu khó nhất; chưa tách riêng điểm số so với lượt thường).
- [x] `commonMistakes` đã tách thành {mô tả, cặp ví dụ sai/đúng, ghi chú} (105/106 mục có ví dụ). [x] Gắn thẻ lỗi: 145 lỗi thường gặp có `usageIds` nối với mục lý thuyết và bài tập (validator bắt buộc).
- [ ] Mô hình dữ liệu nội dung dùng chung: mục học (từ, cụm, chủ điểm ngữ pháp, bài đọc, bài nghe), gắn **ngôn ngữ, thang, cấp độ, kỹ năng, chủ đề, thẻ lỗi (tag)**.
- [x] Khu Học → Bài tập: một câu mỗi lần, tiến độ, phản hồi tức thì, kết quả cuối bài, làm lại.
- [x] Kiểu câu: trắc nghiệm, xếp từ, gõ đáp án, nghe chép, tìm lỗi sai (chạm vào chỗ sai). [x] Ghép cặp là game mini bấm giờ. [x] Sửa lỗi bằng cách gõ lại câu đúng (kiểu `fix`).
- [x] Nhận xét và gợi ý có cấu trúc: vì sao sai, quy tắc liên quan, lỗi hay gặp, link về lý thuyết, nên ôn tiếp (`WrongFeedback`); với Viết/Nói: chấm v2 bóc tách từng tiêu chí (xem `docs/cham-diem-viet-noi.md`).
- [x] Màn **Tiến độ** `/tien-do`: tổng quan (số câu, % đúng, số chuyên đề), danh sách **mục cần ôn lại** (thẻ sai nhiều nhất lên đầu) kèm nút "Xem lại lý thuyết" và "Luyện lại mục này", và tỷ lệ đúng theo chuyên đề. Dùng bảng `answers`; tổng hợp lúc đọc (`src/lib/analytics`).
- [x] Chuỗi ngày học (hiện tại và dài nhất), mục tiêu hằng ngày (10 câu, có vòng tiến độ) và bản đồ nhiệt 12 tuần trên `/tien-do`; tính từ bảng `answers`, mọi lượt trả lời (đúng lẫn sai) đều tính. Ngày theo giờ trình duyệt.
- [x] Phân tích nâng cao (một phần): tỷ lệ đúng theo tuần, mục tiêu hằng ngày chỉnh được, thẻ mới/ngày chỉnh được, gợi ý học tiếp trên bản đồ chuyên đề. [ ] Còn: tiến độ theo thang trình độ (chờ giai đoạn 3).
- [x] Kiểm thử tự động cho hàm thuần (`npm test`, 14 ca).
- [x] **Thẻ ôn tập (SRS)** `/on-tap`: thẻ tự tạo từ câu sai (không trùng; sai lại thẻ đã thuộc thì mở lại), lật 3D có họa tiết, chấm Lại/Khó/Tốt/Dễ (phím 1–4, lật bằng Space), "Lại" xếp thẻ về cuối hàng. Lịch ôn là SM-2 rút gọn viết mới (`src/lib/srs/scheduler.ts`); chưa đối chiếu với thuật toán SRS cũ vì tệp `Controller_Srs.gs` chưa có trong repo. [x] FSRS chạy song song SM-2; đọc to trên thẻ; thẻ từ vựng (nút thêm), thẻ Nghe/Đọc có liên kết về bài gốc.
- [x] Thẻ ôn tập: màn quản lý `/on-tap/quan-ly` (xem/xóa), giới hạn 10 thẻ mới mỗi ngày (đếm theo trình duyệt), chỉnh được 5/10/20. [x] FSRS đã triển khai; [ ] còn: so sánh bằng số liệu thật (`scripts/srs-report.mjs`) khi đủ lượt ôn.
- [x] Bước dạy trước khi thi (`PreLesson`, bắt buộc trước bài kiểm tra); ví dụ che từ đích; độ khó đổi theo màn (gợi ý giảm dần, kiểu câu khó dần theo vị trí).

## Giai đoạn 2 — Lớp game
- [x] Nhân vật 4 trạng thái (3 nhân vật), 5 âm thanh (đúng, sai, bấm, lên cấp, xu; tự tổng hợp, tắt được), hiệu ứng pop/lắc/nảy/pháo giấy, combo, sao, xu có chỗ tiêu (cửa hàng), huy hiệu.
- [x] Bản đồ tiến trình theo chủ điểm ở `/hoc` (không khóa cứng, có gợi ý học tiếp). [ ] Chưa có đường đi dạng bản đồ vẽ tay.
- [x] Game mini ghép cặp bấm giờ tự được mời sau mỗi 3 lượt luyện (đếm theo trình duyệt). [x] "Trùm cuối" `/tran-cuoi`, xếp từ chạy đua và nghe-gõ (`SprintGame` dùng chung), thử thách từ vựng 60 giây; mỗi game là một component độc lập nhận danh sách câu.
- [x] Hai bộ giao diện theo lứa tuổi (lớp 4–6 / lớp 7–9), chọn nhân vật (cú, cáo, robot) và chủ đề giao diện (3 skin).

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

- [x] Nghiên cứu: mô tả "can-do" từng bậc theo kỹ năng trích từ Thông tư 33/2026 (`src/content/cando/vi.json`, `/khung-nang-luc`; chép từ bản quét nên cần người soát) và rubric chấm Speaking/Writing có mô tả từng mức điểm (`src/lib/rubric.ts`).
- [x] Bảng quy đổi có ghi nguồn và mức chắc chắn: `docs/quy-doi-thang.md`. Chỉ Bậc ↔ CEFR đã kiểm chứng (Thông tư 33/2026). [ ] Quy đổi điểm chứng chỉ (IELTS/VSTEP…) và thang ngôn ngữ khác: chưa có văn bản để kiểm chứng, KHÔNG đưa ra giao diện.
- [x] Bài xếp trình độ `/xep-trinh-do` (gợi ý chuyên đề, chưa quy đổi thang). [x] Bài kiểm tra cuối chủ điểm (10 câu, đạt từ 80%).
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
- [x] Thuật toán ôn lặp lại: đã triển khai FSRS song song SM-2 (`docs/srs-sm2-vs-fsrs.md`); [ ] đánh giá bằng số liệu thật còn chờ dữ liệu.
- [ ] Độ khó thích ứng và xếp trình độ liên tục.
- [ ] Phản hồi lỗi: sửa ngay hay gợi ý trước, phản hồi theo tag lỗi.
- [ ] Luyện cách quãng xen kẽ (interleaving) và ôn theo ngữ cảnh.
- [ ] Động lực: streak, mục tiêu hằng ngày, và cách tránh gây áp lực/lo âu cho học sinh 9–15 tuổi.
- [ ] Trình bày kết quả cho học sinh, phụ huynh và giáo viên (ba góc nhìn khác nhau).
- [x] Khả năng truy cập (đợt 1): cỡ chữ, tương phản, bàn phím, liên kết bỏ qua, quét axe-core sạch. [ ] Còn: thử với trình đọc màn hình thật, chế độ tương phản cao, kiểm tra trên thiết bị thật.

## Câu hỏi mở
- Kế hoạch chuyển nền tảng dữ liệu khi mở rộng (Amazon Postgres hay Cloudflare): chọn hệ đăng nhập thay thế Supabase Auth khi đến lúc; xem nguyên tắc ở CLAUDE.md mục 3b.
- Nhân vật: emoji, SVG tự vẽ, hay bộ hình miễn phí bản quyền?
- Theo dõi tiến độ của học sinh: chỉ trên máy, hay đăng nhập? Có khu cho phụ huynh/giáo viên xem từ xa không?
- Giai đoạn 3 bắt đầu với ngôn ngữ nào sau tiếng Anh (Nhật, Trung hay Hàn)?

## Cập nhật đối chiếu chuẩn (đã làm)
- [x] Đọc Thông tư 01/2014 (khung 6 bậc) và Framework CEFR; đối chiếu English Grammar Profile (EGP). Chi tiết: `docs/egp-doi-chieu-va-tu-vung.md`.
- [x] Thêm trường `bac` (bậc 1–6) cho câu và mục lý thuyết, có kiểm tra trong `check:content`.
- [x] Rà soát `present-simple` (60 câu, bậc 1–3) và `subjunctive` (30 câu, bậc 4). Đã đặt `bac` cho toàn bộ 26 chuyên đề (ước lượng, cần chuyên gia kiểm lại).
- [ ] Module từ vựng: danh sách gốc EVP (bổ sung Oxford 3000/5000 khi cần), tham khảo `Oxford Word Skills`.
- [x] Đã thêm 3 chuyên đề thì từ bảng cũ (future continuous, past perfect continuous, future perfect), mỗi chuyên đề rà bằng agent phản biện độc lập.
- [ ] Còn thiếu 5 chuyên đề từ bảng cũ: đảo ngữ không điều kiện, câu chẻ, so/neither, liên từ, phrasal verbs (quy tắc).

## Cập nhật 24/10/2026 (đã làm trong đợt này)
Nghe chép thích ứng; bài xếp trình độ theo bậc; chấm Viết/Nói bằng Gemini (route + thang tiêu chí); đọc to bằng Gemini TTS; module từ vựng A1–B1; 6 chuyên đề mới + 3 chuyên đề mở rộng 50 câu. Việc tiếp theo: lưu điểm Viết/Nói (bảng riêng), CAPTCHA/đăng nhập thật trước khi công khai, kiểm chứng mã mô hình Gemini, từ vựng B2+ và nghĩa tiếng Việt (Gemini), liên từ phụ thuộc cho chuyên đề `conjunctions`, mở rộng 50 câu cho các chuyên đề còn lại, trang About ghi nguồn, dọn `legacy/`, game mini cho từ vựng.

## Cập nhật 25/10/2026
Đã làm: lưu điểm Viết/Nói, nghĩa tiếng Việt cho từ vựng, game ghép từ, bố cục rộng, 5 chuyên đề mở rộng 50 câu + liên từ phụ thuộc, module Đọc hiểu `/doc`. Để sau (theo ý chủ dự án): CAPTCHA/hạn mức chấm, trang About + dọn `legacy/`, Shadowing, Nghe hiểu (tái dùng khung của Đọc hiểu), bài gợi ý đề Viết (mindmap) theo `writing controller.txt`, tra từ theo ngữ cảnh bằng Gemini theo `civocab controller.txt`.

## Cập nhật 26/10/2026
Đã làm: 21 chuyên đề mở rộng lên 50 câu (có phản biện độc lập + sửa), từ vựng B2, Nghe hiểu `/nghe`, gợi ý dàn ý Viết, tra từ theo ngữ cảnh. Còn lại: CAPTCHA/hạn mức chấm (đã hoãn), trang About + dọn `legacy/`, Shadowing, đăng nhập thật; nhờ giáo viên duyệt nghĩa tiếng Việt của từ vựng, bài đọc/bài nghe và số liệu thật trong bài đọc.

## Cập nhật 27/10/2026
- Đã làm/tick: mở rộng 50–70 câu cho mọi chuyên đề, nhận xét có cấu trúc, gắn thẻ lỗi, sửa lỗi gõ lại câu đúng, bước dạy trước + độ khó theo màn, 5 âm thanh, hai bộ giao diện theo tuổi, FSRS, hai game mới, can-do và rubric, bảng quy đổi thang (phần đã kiểm chứng).
- Phần Nghe: nút "Xem lời thoại" xem được bất cứ lúc nào; sau mỗi câu trả lời, lời thoại hiện kèm đoạn làm căn cứ được tô sáng (lấy từ phần trích dẫn trong lời giải thích; tìm thấy ở 212/232 câu).
- Chưa làm (theo thứ tự chủ dự án chọn để sau): CAPTCHA kèm hạn mức chấm điểm, trang giới thiệu nguồn và dọn `legacy/`, Shadowing.
