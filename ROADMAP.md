# Lộ trình Training Zone

Trạng thái: bản nháp thảo luận, chưa có phần nào được xây. Mục đánh dấu **(cần kiểm chứng)** là nhận định chưa đối chiếu nguồn chính thức.

## Nguyên tắc
- Nội dung và chuẩn đánh giá đi trước, hình thức game đi sau nhưng song song.
- Mỗi bước nhỏ phải chạy được và dùng được trước khi sang bước kế.
- Mọi gợi ý học thuật phải truy được về nguồn (khung chuẩn, danh mục từ vựng/ngữ pháp, nghiên cứu); không bịa quy đổi.

## Giai đoạn 0 — Chuẩn bị
- [x] Cấp quyền cho phiên Claude vào repo `daotao`.
- [x] Chốt hướng A: Next.js + Supabase + Vercel; bỏ Google Apps Script.
- [x] Rà kỹ component/design token của `daotao`, chọn cái dùng lại (bảng màu mới tươi hơn cho học sinh). (đã dùng design token riêng + skin; chưa cài shadcn/ui, thêm khi cần)
- [x] Kiểm tra số project Supabase đang hoạt động, tạo project riêng; tạo project Vercel; chủ dự án cấp biến môi trường. (đã chạy toàn bộ migration trên Supabase thật)
- [x] Dựng khung Next.js, 3 skin, `ExerciseRunner` với câu mẫu (chưa nối dữ liệu).
- [x] Client Supabase (browser/server) và route `/api/health` kiểm tra kết nối khi chạy dev.
- [x] Chốt: đăng nhập ẩn danh trước. Có `supabase/migrations/0001_init.sql` (`profiles`, `answers`, RLS) và lớp `src/lib/db` ghi từng câu trả lời.
- [x] Thêm đường đăng nhập: tài khoản do quản trị tạo (cần màn quản lý) và Google; gắn tài khoản cho người đang dùng ẩn danh. Bật CAPTCHA trước khi mở rộng. [x] Đã có: tài khoản do quản trị tạo + màn quản lý, Google (bật bằng `NEXT_PUBLIC_GOOGLE_LOGIN`). [ ] CÒN: bật CAPTCHA + hạn mức chấm điểm trước khi mở công khai.
- [x] Phân tích từ `answers`: tiến độ theo chủ điểm/thẻ lỗi, mức thuộc, SRS.
- [x] Chuyển `legacy/grammar_theory_bank.js` thành dữ liệu nguồn. [ ] CÒN: xóa phần còn lại của `legacy/` sau khi chủ dự án xác nhận.
- [x] Đưa phần Gemini (chấm, nhận xét, TTS) vào API route phía server (đã chốt: Flash-Lite bản mới nhất; TTS dùng Flash-Lite TTS bản mới nhất).

## Giai đoạn 1 — Lõi học và luyện (ưu tiên cao nhất)
- [x] Lý thuyết 23 chuyên đề tiếng Anh đã chuyển sang JSON (`src/content/grammar/en`), có trang `/hoc` và `/hoc/[topic]`; validator `npm run check:content`.
- [x] Mở rộng lên 50–70 câu/chuyên đề: `present-simple` 60 câu, 30 chuyên đề còn lại 50 câu (17/17/16), tổng 1.560 câu; phần mở rộng đã qua phản biện độc lập.
- [x] Nhập ngân hàng bài tập cũ: 23 chuyên đề × 30 = 690 câu (`src/content/exercises/en/`).
- [x] **Đã vá lỗ hổng nội dung**: thêm 4 mục lý thuyết (`cond-connectors`, `ps-vs-pc`, `pp-vs-simple-past`, `past-simple-vs-continuous`) và gắn lại `usageId` (validator chặn thẻ chưa có mục dạy). 4 câu present-simple kiểm tra hiện tại tiếp diễn đã chuyển sang present-continuous (id `en-present-continuous-031..034`, `usageId` `ps-vs-pc`); present-simple được soạn lại 4 câu thuần hiện tại đơn (026–029). Cần chủ dự án đọc duyệt 4 mục mới và 4 câu mới.
- [x] `choiceExplanations` (giải thích riêng từng đáp án) đã có đủ cho **cả 23 chuyên đề, 694 câu**. Đáp án sai nhưng vẫn chấp nhận được trong tiếng Anh tự nhiên đã được ghi rõ trong lời giải thích; danh sách câu cần viết lại cho chỉ còn một đáp án đúng nằm ở mục dưới.
- [x] Đã sửa 40 câu có nhiều đáp án chấp nhận được: thay lựa chọn "sai nhưng vẫn nói được" bằng lựa chọn sai rõ ràng (sai thì, sai hòa hợp, sai chia). Việc này làm giảm phần đối chiếu "đơn vs tiếp diễn" trong một số câu; khi mở rộng ngân hàng lên 50–70 câu nên bổ sung câu có dấu hiệu rõ (at that exact moment, while...) để giữ phần đối chiếu.
- [x] Cân lại độ khó 10/10/10 cho 6 chuyên đề lệch (subjunctive, pronouns-determiners, adverbial-clauses, tag-questions, present-perfect-continuous, adjective-adverb-order) bằng cách xếp lại mức theo độ phức tạp thực của từng câu, không đổi nội dung. present-continuous nay có 34 câu (10/10/14) do nhận 4 câu tương phản; cân nhắc rút còn 30. [x] Kiểm định độc lập chuyên đề 18–23 (đã làm 26/10: sửa nhiễu chấp nhận được, ví dụ trùng, điều bài tập kiểm tra mà lý thuyết chưa dạy).
- [x] Nhãn cấp độ của chuyên đề không hiển thị cho người học (quyết định cũ). [x] Gắn cấp CEFR ở mức từng câu và mô tả năng lực (giai đoạn 3).
- [x] Mỗi lượt bốc 10 câu theo từng mức độ khó, xếp dễ → khó. [x] Chế độ "Nhức đầu" (`/hoc/[topic]/nhuc-dau`, 10 câu khó nhất; chưa tách riêng điểm số so với lượt thường).
- [x] `commonMistakes` đã tách thành {mô tả, cặp ví dụ sai/đúng, ghi chú} (105/106 mục có ví dụ). [x] Gắn thẻ lỗi: 145 lỗi thường gặp có `usageIds` nối với mục lý thuyết và bài tập (validator bắt buộc).
- [x] Mô hình dữ liệu nội dung dùng chung: mục học (từ, cụm, chủ điểm ngữ pháp, bài đọc, bài nghe), gắn **ngôn ngữ, thang, cấp độ, kỹ năng, chủ đề, thẻ lỗi (tag)**.
- [x] Khu Học → Bài tập: một câu mỗi lần, tiến độ, phản hồi tức thì, kết quả cuối bài, làm lại.
- [x] Kiểu câu: trắc nghiệm, xếp từ, gõ đáp án, nghe chép, tìm lỗi sai (chạm vào chỗ sai). [x] Ghép cặp là game mini bấm giờ. [x] Sửa lỗi bằng cách gõ lại câu đúng (kiểu `fix`).
- [x] Nhận xét và gợi ý có cấu trúc: vì sao sai, quy tắc liên quan, lỗi hay gặp, link về lý thuyết, nên ôn tiếp (`WrongFeedback`); với Viết/Nói: chấm v2 bóc tách từng tiêu chí (xem `docs/cham-diem-viet-noi.md`).
- [x] Màn **Tiến độ** `/tien-do`: tổng quan (số câu, % đúng, số chuyên đề), danh sách **mục cần ôn lại** (thẻ sai nhiều nhất lên đầu) kèm nút "Xem lại lý thuyết" và "Luyện lại mục này", và tỷ lệ đúng theo chuyên đề. Dùng bảng `answers`; tổng hợp lúc đọc (`src/lib/analytics`).
- [x] Chuỗi ngày học (hiện tại và dài nhất), mục tiêu hằng ngày (10 câu, có vòng tiến độ) và bản đồ nhiệt 12 tuần trên `/tien-do`; tính từ bảng `answers`, mọi lượt trả lời (đúng lẫn sai) đều tính. Ngày theo giờ trình duyệt.
- [x] Phân tích nâng cao (một phần): tỷ lệ đúng theo tuần, mục tiêu hằng ngày chỉnh được, thẻ mới/ngày chỉnh được, gợi ý học tiếp trên bản đồ chuyên đề. [x] Tiến độ theo thang trình độ (chờ giai đoạn 3).
- [x] Kiểm thử tự động cho hàm thuần (`npm test`, 14 ca).
- [x] **Thẻ ôn tập (SRS)** `/on-tap`: thẻ tự tạo từ câu sai (không trùng; sai lại thẻ đã thuộc thì mở lại), lật 3D có họa tiết, chấm Lại/Khó/Tốt/Dễ (phím 1–4, lật bằng Space), "Lại" xếp thẻ về cuối hàng. Lịch ôn là SM-2 rút gọn viết mới (`src/lib/srs/scheduler.ts`); chưa đối chiếu với thuật toán SRS cũ vì tệp `Controller_Srs.gs` chưa có trong repo. [x] FSRS chạy song song SM-2; đọc to trên thẻ; thẻ từ vựng (nút thêm), thẻ Nghe/Đọc có liên kết về bài gốc.
- [x] Thẻ ôn tập: màn quản lý `/on-tap/quan-ly` (xem/xóa), giới hạn 10 thẻ mới mỗi ngày (đếm theo trình duyệt), chỉnh được 5/10/20. [x] FSRS đã triển khai; [ ] còn: so sánh bằng số liệu thật (`scripts/srs-report.mjs`) khi đủ lượt ôn.
- [x] Bước dạy trước khi thi (`PreLesson`, bắt buộc trước bài kiểm tra); ví dụ che từ đích; độ khó đổi theo màn (gợi ý giảm dần, kiểu câu khó dần theo vị trí).

## Giai đoạn 2 — Lớp game
- [x] Nhân vật 4 trạng thái (3 nhân vật), 5 âm thanh (đúng, sai, bấm, lên cấp, xu; tự tổng hợp, tắt được), hiệu ứng pop/lắc/nảy/pháo giấy, combo, sao, xu có chỗ tiêu (cửa hàng), huy hiệu.
- [x] Bản đồ tiến trình theo chủ điểm ở `/hoc` (không khóa cứng, có gợi ý học tiếp). [x] Đường đi dạng bản đồ chặng A1→C2 (SVG) ở `/hoc`.
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
- [x] Độ khó thích ứng và xếp trình độ liên tục. (Elo theo bậc/mức khó, `/hoc/[topic]/thich-ung`, bậc ước lượng ở `/tien-do`; cần dữ liệu thật để chỉnh. Xem `docs/hoc-thuat-dong-luc.md`)
- [x] Phản hồi lỗi: sửa ngay hay gợi ý trước, phản hồi theo tag lỗi. (mặc định xem đáp án ngay; "gợi ý rồi thử lại" là tùy chọn vì chưa có bằng chứng cho lứa tuổi này)
- [x] Luyện cách quãng xen kẽ (interleaving) và ôn theo ngữ cảnh. (`/luyen-xen-ke` chỉ trong nhóm chuyên đề dễ lẫn; hàng thẻ ôn xen chuyên đề; thẻ từ vựng đổi sang điền từ vào câu)
- [x] Động lực: streak, mục tiêu hằng ngày, và cách tránh gây áp lực/lo âu cho học sinh 9–15 tuổi. (ngày nghỉ 1/7 ngày, lời lẽ không trách, chế độ nhẹ nhàng, nhắc nghỉ; bằng chứng về lo âu do streak còn yếu)
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
- [x] Module từ vựng: danh sách gốc EVP (bổ sung Oxford 3000/5000 khi cần), tham khảo `Oxford Word Skills`.
- [x] Đã thêm 3 chuyên đề thì từ bảng cũ (future continuous, past perfect continuous, future perfect), mỗi chuyên đề rà bằng agent phản biện độc lập.
- [x] Còn thiếu 5 chuyên đề từ bảng cũ: đảo ngữ không điều kiện, câu chẻ, so/neither, liên từ, phrasal verbs (quy tắc).

## Cập nhật 24/10/2026 (đã làm trong đợt này)
Nghe chép thích ứng; bài xếp trình độ theo bậc; chấm Viết/Nói bằng Gemini (route + thang tiêu chí); đọc to bằng Gemini TTS; module từ vựng A1–B1; 6 chuyên đề mới + 3 chuyên đề mở rộng 50 câu. Việc tiếp theo: lưu điểm Viết/Nói (bảng riêng), CAPTCHA/đăng nhập thật trước khi công khai, kiểm chứng mã mô hình Gemini, từ vựng B2+ và nghĩa tiếng Việt (Gemini), liên từ phụ thuộc cho chuyên đề `conjunctions`, mở rộng 50 câu cho các chuyên đề còn lại, trang About ghi nguồn, dọn `legacy/`, game mini cho từ vựng.

## Cập nhật 25/10/2026
Đã làm: lưu điểm Viết/Nói, nghĩa tiếng Việt cho từ vựng, game ghép từ, bố cục rộng, 5 chuyên đề mở rộng 50 câu + liên từ phụ thuộc, module Đọc hiểu `/doc`. Để sau (theo ý chủ dự án): CAPTCHA/hạn mức chấm, trang About + dọn `legacy/`, Shadowing, Nghe hiểu (tái dùng khung của Đọc hiểu), bài gợi ý đề Viết (mindmap) theo `writing controller.txt`, tra từ theo ngữ cảnh bằng Gemini theo `civocab controller.txt`.

## Cập nhật 26/10/2026
Đã làm: 21 chuyên đề mở rộng lên 50 câu (có phản biện độc lập + sửa), từ vựng B2, Nghe hiểu `/nghe`, gợi ý dàn ý Viết, tra từ theo ngữ cảnh. Còn lại: CAPTCHA/hạn mức chấm (đã hoãn), trang About + dọn `legacy/`, Shadowing, đăng nhập thật; nhờ giáo viên duyệt nghĩa tiếng Việt của từ vựng, bài đọc/bài nghe và số liệu thật trong bài đọc.

## Cập nhật 25/10/2026 (học thuật và động lực)
- Đã làm 4 mục "học thuật + động lực": thích ứng/ước lượng năng lực, phản hồi lỗi (đáp án ngay hoặc gợi ý trước), xen kẽ + ôn theo ngữ cảnh, động lực không áp lực. Bằng chứng, mức chắc chắn và điều chưa kiểm chứng: `docs/hoc-thuat-dong-luc.md`.

## Việc tiếp theo (đã chốt 26/10/2026; thứ tự mới nhất xem mục "Kế hoạch tổng hợp" ngay dưới)
- [ ] **Soạn thêm nội dung C2 thật** (Bậc 6): nhiều câu/bài hiện chỉ ở mức C1. Ngữ pháp: thêm mục và câu C2 (notwithstanding sau danh từ, "Be that as it may", đảo ngữ văn chương, mệnh đề nhượng bộ nâng cao, tinh tế về sắc thái/văn phong…), cân lại phân bố `bac` 5/6; đọc và nghe Bậc 6: thêm câu suy luận về thái độ, ngụ ý, giọng điệu thay vì tra chi tiết; từ vựng C2 theo chủ đề. Mỗi đợt có phản biện độc lập.
- [ ] **Placement cho bậc cao**: mở rộng bậc thang Đọc/Nghe tới Bậc 6 (hiện dừng ở Bậc 4), từ vựng C1/C2, ngữ pháp Bậc 5–6 (hiện `/xep-trinh-do` chưa đo). Cần nhiều bài mỗi bậc để đủ chính xác (hiện 1 bài/bậc). Làm sau khi có thêm nội dung C2.
- [ ] Từ vựng C1/C2 theo chủ đề (`/tu-vung/chu-de`), người bản ngữ duyệt nội dung Bậc 5–6, đối chiếu nguồn các điểm kiến thức (xem `docs/noi-dung-bac5-6.md`), `npm run content:push`.

## Cập nhật 30/10/2026 (nội dung Bậc 5–6)
- Đã thêm nội dung Bậc 5–6 (xem `docs/noi-dung-bac5-6.md`): 9 chuyên đề ngữ pháp C1–C2 (450 câu), 28 bài đọc, 28 bài nghe, từ vựng C1 và C2 (1.238 từ). Có phản biện độc lập nhưng CHƯA có người bản ngữ duyệt. Còn: placement cho bậc cao, từ vựng C1/C2 theo chủ đề, thêm nội dung C2 thật (nhiều câu vẫn ở mức C1), `npm run content:push`.

## Cập nhật 29/10/2026
- Đã làm: tiến độ theo thang trình độ (`/tien-do` → "Đường lên các bậc": mức bao phủ nội dung A1–C2 theo kỹ năng, bậc chưa có nội dung ghi "sắp có"; `lib/progress/scale.ts`), mô tả can-do kèm bậc đang học/ước lượng, `/khung-nang-luc` có dòng "Nội dung trong ứng dụng" từng bậc, bản đồ chặng A1→C2 vẽ bằng SVG ở `/hoc` (chuyển được sang danh sách). Còn: nội dung Bậc 5–6 (chặng C1/C2 đang "sắp có"); độ bao phủ chỉ tính trong 1000 câu trả lời gần nhất.

## Cập nhật 28/10/2026
- Game 60 giây xếp từ chạy đua và nghe-gõ giờ thích ứng: câu xếp dễ → khó (theo số từ + bậc), bắt đầu theo năng lực ước lượng (kể cả từ bài xếp trình độ), đúng thì khó dần, sai thì dễ lại (`lib/game/sprint-ladder.ts`, `useStartPosition`). Luyện thường chọn câu quanh năng lực (tăng dần trong lượt); có xếp trình độ Từ vựng/Đọc/Nghe (`/xep-trinh-do/[skill]`) và gợi ý bậc ở các trang kỹ năng; kết quả placement đi vào ước lượng năng lực chung. Còn: thử thách từ vựng chưa thích ứng; đọc/nghe mỗi bậc chỉ 1 bài placement; Nói/Viết chưa có placement (chấm bằng Gemini, tốn hạn mức).

## Cập nhật 27/10/2026
- Đã làm/tick: mở rộng 50–70 câu cho mọi chuyên đề, nhận xét có cấu trúc, gắn thẻ lỗi, sửa lỗi gõ lại câu đúng, bước dạy trước + độ khó theo màn, 5 âm thanh, hai bộ giao diện theo tuổi, FSRS, hai game mới, can-do và rubric, bảng quy đổi thang (phần đã kiểm chứng).
- Phần Nghe: nút "Xem lời thoại" xem được bất cứ lúc nào; sau mỗi câu trả lời, lời thoại hiện kèm đoạn làm căn cứ được tô sáng (lấy từ phần trích dẫn trong lời giải thích; tìm thấy ở 212/232 câu).
- Chưa làm (theo thứ tự chủ dự án chọn để sau): CAPTCHA kèm hạn mức chấm điểm, trang giới thiệu nguồn và dọn `legacy/`, Shadowing.

## Kế hoạch tổng hợp (sắp xếp lại 26/10/2026, thứ tự làm)
Nguyên tắc xếp: việc chặn người dùng thật trước, rồi nền nội dung (vì Lộ trình cần nhiều câu), rồi Lộ trình, rồi game/dạng câu mới, cuối cùng việc cần dữ liệu thật hoặc chủ dự án để sau.

### A. Việc của chủ dự án (không cần code)
- [ ] Chạy migration `0011`, `0012`, `0013`, `0014`, `0015` trên Supabase SQL Editor (chưa chạy thì app lùi về cách cũ, bài xếp trình độ tổng hợp không lưu dở được).
- [ ] Nhờ giáo viên chấm 30 bài mẫu: `eval/phieu-cham.csv` + `eval/huong-dan-cham.md` → `node scripts/eval-import.mjs <phiếu>` → `node scripts/grade-eval.mjs eval/grade-samples.json` (cần khóa Gemini). Kết quả quyết định có tin máy chấm Viết hay không.
- [ ] Thử `gen-items`/`gen-passages` với Gemini thật theo `docs/thu-gen-noi-dung.md`.
- [ ] Merge nhánh (PR) về `main`; sau 1 tháng có dữ liệu thật thì xem lại các ngưỡng ở `docs/lo-trinh-va-xep-bac.md` mục 11.

### B. Nội dung nền (làm trước Lộ trình, vì mỗi nấc cần đủ bài)
1. [x] ĐÃ XONG `questions` + `past-modals` (26/10/2026, 50 câu mỗi chuyên đề, có phản biện độc lập). Còn lại: ngữ pháp thiếu rõ nhất theo `docs/khoang-trong-noi-dung.md`: **Câu hỏi** (`questions`), rồi **Modal ở quá khứ + used to/would** (`past-modals`); sau đó: mệnh đề danh từ + câu hỏi gián tiếp mở rộng, mẫu động từ + tân ngữ, trạng từ, danh từ/đại từ cơ bản A1–A2. Mỗi chuyên đề 50 câu, phản biện độc lập.
2. [ ] **Mở rộng từ vựng A1–B2 từ CEFR-J** (công khai, đã có trong `reference/`): hiện kho chỉ phủ ~33–36% từ gốc CEFR-J A1–B2 (thiếu cả animal, baby, bed, big…). Quy trình: lấy danh sách từ thiếu → Gemini gợi ý nghĩa Việt + câu ví dụ theo `docs/prompt-sinh-noi-dung.md` → giải mù → người duyệt → `scripts/build-vocab.py`.
3. [ ] Cụm từ kết hợp (collocations) thêm bộ; từ vựng C1/C2 theo chủ đề.
4. [ ] Đề Viết/Nói thêm (hiện Viết 12 đề bậc 1–4): thêm bậc 5–6 và đề theo chủ điểm lớp 4–9.
5. [ ] Nội dung C2 thật; mở rộng ngân hàng xếp trình độ (`reserved.json`) cho bậc 5–6 và cho Đọc/Nghe nhiều bài mỗi bậc.
6. [ ] **Sinh/duyệt/gộp nội dung trên giao diện quản trị** (`/quan-ly/noi-dung`, thiết kế ở `docs/quan-ly-noi-dung-tren-giao-dien.md`; giai đoạn A: bảng nháp, duyệt, thống kê tỷ lệ, xuất JSON; giai đoạn B = đọc nội dung từ DB). Làm sau Lộ trình bước đầu.
7. [ ] Người bản ngữ/giáo viên duyệt: nghĩa Việt từ vựng, bài đọc/nghe, nội dung Bậc 5–6.

### C. Lộ trình một con đường + Phòng thử thách
**Đã xây bản đầu (26/10/2026):** nút "Học tiếp" ở trang chủ trỏ vào bài kế của Lộ trình, `/lo-trinh`, bài trong nấc, mở nấc tuần tự/thử sức, bỏ qua, gợi ý hôm nay có đẩy kỹ năng yếu (cần migration `0014`). **Đã thêm (26/10/2026):** điểm bắt đầu từ bài xếp trình độ / bài vượt cấp 20 câu (migration `0015`), cổng nhảy bậc + thanh tiến độ, ngưỡng nghiêm dần theo bậc (`docs/lo-trinh-va-xep-bac.md` mục 12). Còn lại: mức nhớ thẻ ôn theo bậc cho điều kiện nhảy bậc, điều kiện theo từng kỹ năng, giới hạn thử bài vượt cấp, Phòng thử thách + lời giải thích áp lực, giáo viên xem nấc bỏ qua, đồ họa. Thiết kế đã chốt ở `docs/lo-trinh-va-xep-bac.md`; ban đầu gồm: bảng nấc/tiến độ nấc, mở nấc khi làm hết bài, thử sức nấc cao hơn, trang `/lo-trinh`, Phòng thử thách tính giờ, đề xuất nâng/hạ bậc, kỹ năng yếu nhất đẩy nhiều hơn khi chọn bài.

### D. Dạng câu hỏi và game mới cho Đọc/Nghe (dùng lại bài sẵn có, không cần soạn thêm bài)
Mọi dạng dưới đây sinh từ bài và câu có sẵn bằng hàm thuần (như `derive.ts` làm cho ngữ pháp) và **máy chấm bằng mã, không dùng Gemini** vì đáp án cố định. Chỉ bài tự luận mở (Viết/Nói) mới cần Gemini.
- [ ] Điền từ vào bài đọc (cloze): che 6–8 từ nội dung của đoạn, chọn từ từ kho từ của bài (chấm: so khớp chuỗi).
- [ ] Xếp lại câu/đoạn theo thứ tự (reorder) cho bài đọc ngắn; xếp lời thoại theo thứ tự cho bài nghe (chấm: so thứ tự).
- [ ] Ghép ý chính với đoạn / ghép nhan đề với đoạn (matching; chấm: so cặp). Tiêu đề lấy từ nhãn của bài hoặc trường mới `title`.
- [ ] Nghe-điền chỗ trống (bài nghe, che từ khóa; chấm: so khớp chuỗi có chấp nhận biến thể chính tả Anh-Mỹ).
- [ ] Tìm bằng chứng: chạm vào câu trong bài làm căn cứ cho đáp án (dùng dữ liệu `evidence` sẵn có; chấm: câu chạm trùng câu căn cứ).
- [ ] Game "săn từ khóa" cho đọc: 60 giây chạm đúng từ/cụm theo yêu cầu; game "nghe nhanh" cho nghe: câu Đúng/Sai/Không nêu bấm giờ (tái dùng `SprintGame`).
- [x] **ĐÃ XÂY bản đầu (26/10/2026, giai đoạn chấm 1 bằng nhận dạng giọng nói của trình duyệt)** — **Câu đọc to (read-aloud) lồng vào các bài sẵn có** (đề xuất và làm rõ của chủ dự án 26/10/2026: KHÔNG phải bài tập riêng, chỉ là một dạng câu cho đa dạng): thêm `kind: "speak"` cạnh sắp xếp/gõ/nghe chép/tìm lỗi. Sinh từ câu trắc nghiệm có sẵn bằng `deriveSpeak` trong `derive.ts` (lấy câu đúng hoàn chỉnh), chen vào qua `mixVariants` (tối đa 1 câu mỗi lượt, ở nửa sau lượt, câu ngắn trước câu dài), nên tự có mặt ở luyện chủ điểm, luyện thích ứng, bài trong Lộ trình, bài kiểm tra cuối chủ điểm, bài vượt cấp, game 60 giây (một số game bấm giờ có thể bỏ vì đọc to chậm). Quy tắc: chỉ xuất hiện khi trình duyệt có nhận dạng giọng nói và đã cho phép micro; có công tắc "Tắt câu đọc to" ở thanh cài đặt (ngại nói, lớp ồn); câu đọc to luôn có nút "Bỏ qua câu này" và bỏ qua không bị tính sai. Chấm: (1) nhận dạng giọng nói của trình duyệt, chấm bằng mã (so từng từ với câu mẫu, báo từ nào chưa rõ, đúng khi từ 80% từ đúng); không lưu âm thanh; chỉ đo mức nghe hiểu được, không đo từng âm, nên nhãn trên giao diện là "đọc rõ từ nào" chứ không phải "điểm phát âm"; (2) sau này, khi đã có CAPTCHA/hạn mức, nhận xét từng âm bằng Gemini nghe âm thanh và đo bằng bộ mẫu giáo viên chấm trước khi tin điểm. Điểm câu đọc to ghi ở chủ điểm riêng `speak` (tính chuỗi ngày và XP, KHÔNG vào Elo/độ vững chuyên đề/thẻ ôn/cổng nhảy bậc, vì nhận dạng giọng nói có thể nghe sai). Hiện có mặt ở luyện tập, bài kiểm tra cuối chủ điểm, bài trong Lộ trình (ngữ pháp, từ vựng); không chen vào bài đo trình độ, bài vượt cấp, bài thích ứng, đọc/nghe; trong bài kiểm tra và bài của Lộ trình câu đọc to không tính vào đạt/chưa đạt. Còn lại: game 60 giây, Phòng thử thách, nhận xét từng âm bằng Gemini, thử trên điện thoại/Safari thật.
- [ ] Tóm tắt một câu (viết ngắn sau khi đọc/nghe) — dạng mở, chấm bằng Gemini nên để sau cùng và chỉ làm khi đã có CAPTCHA + hạn mức.

### E. Theo dõi tiến độ (chỉ làm khi có dữ liệu thật)
- [ ] Không xây bảng chụp riêng 800 dòng: Elo đã dùng chung các dòng `answers` đang đọc (`getRecentTopicRows`). Chỉ khi một học sinh vượt ~5.000 dòng thì mới cần `progress_counters`/ảnh chụp Elo (mô tả ở `docs/tong-hop-tien-do.md`).
- [ ] Tối ưu đọc dữ liệu cho các chỗ còn đọc dòng thô (bản đồ chuyên đề, bảng thang, trùm, hồ sơ năng lực) sau khi có số liệu tải thật.

### F. Hoãn theo ý chủ dự án
CAPTCHA + hạn mức chấm Gemini (cần trước khi mở công khai và trước mọi dạng chấm bằng Gemini mới), trang About ghi nguồn + dọn `legacy/`, Shadowing, giáo viên duyệt nội dung hàng loạt, tách tài khoản Vercel/Supabase khi thương mại hóa.
