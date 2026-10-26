# Lộ trình một con đường, phòng thử thách và cách xếp bậc

Tài liệu thiết kế (thảo luận 26/10/2026). Mục **ĐÃ CHỐT** là quyết định của chủ dự án; mục **ĐỀ XUẤT** là cách làm chưa xây. Các **con số** (ngưỡng, trọng số, số câu/ngày…) đã được chủ dự án đồng ý làm **giá trị khởi điểm**, không có bằng chứng khoa học, và phải xem lại sau 1 tháng có dữ liệu học sinh thật (mục 11). Đã xây: script đo chất lượng câu (mục 7). Phần còn lại chưa xây.

## 1. Vấn đề cần giải quyết

- (Đã giải quyết ở mục 9, bước 3) Trước đây bậc được tính ở nhiều nơi, mỗi nơi một kiểu: `estimateBac` (xếp trình độ ngữ pháp, từ vựng), `stairResult` (đọc/nghe bậc thang), Elo ở `src/lib/progress/ability.ts`.
- Nhãn `bac` và `difficulty` trên câu do người/Claude gán, chưa hiệu chỉnh bằng dữ liệu làm bài. Với từ vựng, độ khó chỉ theo cấp của từ, không tính đáp án nhiễu hay dạng câu.
- Nhiều cửa vào song song, chưa có một trục chính nên người học không biết "bước tiếp theo là gì".

## 2. Hai luồng trên cùng một nền (ĐÃ CHỐT hướng đi)

Cả hai luồng đọc và ghi cùng bảng `answers`, cùng một ước lượng năng lực. Khác nhau ở điều kiện làm bài.

| | **Lộ trình** (mặc định) | **Phòng thử thách** (chẩn đoán) |
|---|---|---|
| Mục đích | Tận dụng thời gian mỗi ngày, tiến chậm | Đo thật, không chủ quan |
| Áp lực | Thấp, đáp án ngay, không phạt | Cao: giới hạn thời gian, không hiện đáp án giữa chừng, không gợi ý |
| Cập nhật bậc | Rất chậm (mục 5) | Rõ hơn, nhưng chỉ ĐỀ XUẤT nâng/hạ, cần bài thứ hai xác nhận |
| Dữ liệu | Ghi như luyện thường | Ghi gắn `mode='test'`, trọng số lớn hơn |

**Lời giải thích bắt buộc** (ĐÃ CHỐT) hiển thị kèm kết quả Phòng thử thách, để tránh đánh giá sai do căng thẳng. Nội dung gốc, soạn lại giọng cho từng độ tuổi khi làm giao diện:

> Bài này tính giờ và không có gợi ý, nên kết quả có thể thấp hơn lúc bạn học bình thường vì hồi hộp. Đây là một lần đo, chưa phải kết luận. Bậc của bạn trong Lộ trình sẽ không bị hạ chỉ vì một bài.

Hệ quả thiết kế: một bài thử thách tệ KHÔNG tự hạ bậc. Nó chỉ gợi ý "nên ôn" và mời làm lại sau.

## 3. Cách xếp bậc: tiêu chí

### 3.1 Bậc theo từng kỹ năng (ĐÃ CHỐT một ước lượng chung)
- Bốn kỹ năng nhận biết (ngữ pháp, từ vựng, nghe, đọc) mỗi kỹ năng có một mức năng lực liên tục từ Elo (`ability.ts`). Đây là **nguồn duy nhất** cho mọi chỗ hiển thị bậc: placement, game, luyện chủ điểm, luyện thích ứng, trang chủ, tiến độ.
- Placement test và game không còn công thức bậc riêng; chúng chỉ là nguồn câu trả lời đưa vào Elo (placement chỉ khác ở cách chọn câu để hội tụ nhanh).
- Viết và Nói: có điểm chấm 4 tiêu chí (`graded_attempts`) nhưng chưa có ước lượng liên tục, nên hiển thị riêng, không tham gia bậc tổng.

### 3.2 Bậc tổng = trung vị của các kỹ năng (ĐÃ CHỐT)
- Trung vị của bốn kỹ năng nhận biết (số chẵn nên lấy trung bình hai kỹ năng ở giữa), hiển thị làm tròn xuống theo chặng.
- Chỉ hiện khi có ít nhất 3 kỹ năng đủ độ tin cậy từ "vừa" trở lên (`Confidence` trong `ability.ts`); chưa đủ thì ghi "chưa đủ dữ liệu".
- Lý do chọn trung vị thay vì kỹ năng thấp nhất: người có một kỹ năng rất yếu và các kỹ năng khác ổn không bị kéo tụt cả bậc tổng. Đổi lại, kỹ năng yếu được bù bằng mục 6.

### 3.3 Hiển thị kèm khung chuẩn
- Mọi chỗ hiện Bậc đều kèm CEFR (đã kiểm chứng ở `docs/quy-doi-thang.md` mục 1; `src/lib/content/bac.ts`).
- **Chứng chỉ (IELTS, TOEFL, VSTEP, Cambridge…): BỎ HẲN việc quy đổi** (chủ dự án chốt 26/10/2026: văn bản nhà nước không có bảng quy đổi, tìm không ra). Không ghi điểm quy đổi ở bất kỳ đâu. VSTEP chỉ còn là gợi ý cấu trúc đề (bốn kỹ năng, tính giờ) cho Phòng thử thách. Chỉ giữ Bậc ↔ CEFR đã kiểm chứng.
- Luôn ghi: "Bậc do máy ước lượng, tham khảo, không phải kết quả thi".

### 3.4 Độ tin cậy của câu hỏi (ĐỀ XUẤT)
Nhãn câu hỏi là điểm yếu lớn nhất, nên làm cơ chế đo trước khi tin nhãn (mục 7).

## 4. Lộ trình: cấu trúc "nấc"

### 4.1 Nấc là gì (ĐỀ XUẤT)
- Một **nấc** là một nhóm bài (ngữ pháp, từ vựng, đọc, nghe) cùng một chặng của một bậc, ví dụ "Bậc 3 · chặng 2". Mỗi bậc chia thành khoảng 5 chặng (số chặng chỉnh được).
- Một **bài** là một đơn vị học vài phút, trỏ vào nội dung đã có (chuyên đề, bộ từ, bài đọc, bài nghe). Nội dung hiện tại được xếp vào nấc theo `bac` của mục dạy/câu, không viết lại.
- Trạng thái nấc: `khóa` → `mở` → `xong`. Trong nấc `xong` có ghi **cách mở**: `tuần tự` hoặc `thử sức`.

### 4.2 Đi tuần tự (mặc định)
Làm hết các bài của nấc thì nấc kế mở. Học sinh luôn thấy một nút "Học tiếp".

### 4.3 Thử sức nấc cao hơn (ĐÃ CHỐT)
- Học sinh có thể bấm làm một nấc cao hơn nấc đang học. Đây **không phải** bài kiểm tra hay vượt bậc.
- Nếu làm được **hết các bài trong nấc đó** thì nấc đó mở khóa luôn. **Các nấc cũ không tự mở khóa**: nấc bị bỏ qua vẫn ở trạng thái chưa xong, hiển thị nhẹ nhàng "nấc bị bỏ qua", có thể quay lại làm, không bắt buộc.
- Thử sức KHÔNG đổi bậc. Câu trả lời đi vào Elo như luyện thường, và bậc chỉ nhảy theo mục 5. Nhờ đó thử sức không thành đường tắt lên bậc.
- Thất bại không mất gì: bài chưa đạt làm lại được, câu sai thành thẻ ôn như thường.

Tham số khởi điểm (đã đồng ý, xem lại sau 1 tháng):
- "Làm được" một bài = đúng từ **70%** (thấp hơn ngưỡng 80% của bài kiểm tra cuối chủ điểm vì đây là bài luyện; ngưỡng chọn theo thiết kế, không lấy từ nguồn nào).
- Chỉ cho thử sức tối đa **2 nấc** phía trên nấc cao nhất đang mở, để học sinh bậc 1 không thử thẳng Bậc 6.
- Bài làm lại phải bốc câu khác (không nhớ đáp án), dùng cơ chế bốc câu hiện có.

Rủi ro cần theo dõi: học sinh đoán mò để mở khóa. Giảm nhẹ bằng cách bốc câu khác mỗi lần và dùng tỷ lệ đúng thật đi vào Elo; nếu thử sức xong mà Elo thấp hơn nhiều so với nấc, hiển thị gợi ý "nên ôn các nấc bị bỏ qua".

## 5. Nhảy bậc chậm (số liệu khởi điểm)

Bậc là thanh tiến độ liên tục. Chặng nhích hằng ngày; **nhảy sang bậc kế** chỉ khi đồng thời đủ ba điều kiện:

1. Độ tin cậy ước lượng cao: đủ số câu ở bậc đó (khởi điểm 40–60 câu trên kỹ năng đó).
2. Tỷ lệ đúng từ 80% trên câu của bậc đó, giữ qua **nhiều ngày khác nhau** (khởi điểm: ít nhất 3 ngày), không phải một lượt may mắn.
3. Thẻ ôn của bậc đó (FSRS) còn đạt mức nhớ tối thiểu.

Quy tắc khác:
- Trong Lộ trình **không bao giờ hạ bậc tự động**, chỉ đánh dấu "nên ôn". Hợp tinh thần học thẩm dần, không áp lực tụt hạng.
- Phòng thử thách chỉ ĐỀ XUẤT nâng/hạ; cần bài thứ hai xác nhận mới đổi.

Mức chắc chắn của các con số: thấp đến vừa; chỉnh khi có dữ liệu thật (`docs/hoc-thuat-dong-luc.md`).

## 6. Bài hôm nay và đẩy mạnh kỹ năng yếu

### 6.1 Bài hôm nay (độ dài linh hoạt, ĐÃ CHỐT như hiện tại)
Giữ mục tiêu hằng ngày 5/10/20/30 câu như hiện có. Một bài hôm nay gồm các khối, bỏ khối nào cũng được:
1. Khởi động: thẻ đến hạn ôn, tối đa 5.
2. Bài chính: một bài của nấc đang mở, chọn theo năng lực từng kỹ năng; ngày đọc/nghe xen kẽ.
3. Củng cố: câu sai hôm nay thành thẻ và hiện lại một lần.
4. Thưởng (tùy chọn): một game 60 giây đúng nội dung vừa học.

### 6.2 Đẩy kỹ năng yếu nhất (ĐÃ CHỐT hướng; con số khởi điểm)
Khi chọn bài chính, bài luyện, game và thẻ ôn, kỹ năng có Elo thấp nhất trong bốn kỹ năng được **trọng số 1,5** so với 1,0 của các kỹ năng còn lại ("đẩy hơn một chút", không dồn hết). Giới hạn trên: không quá khoảng 40% số bài trong ngày. Kỹ năng ở mức tin cậy thấp không được tính là "yếu nhất" (tránh đẩy theo nhiễu). Cách chọn nên là hàm thuần có test.

### 6.3 Module "hoa lá" kết nối ra sao
Quy tắc chung: Lộ trình chỉ **gợi ý** phần tùy chọn bằng một thẻ nhỏ, không chặn đường chính.

| Module | Cách xuất hiện |
|---|---|
| Ôn tập SRS | Luôn ở đầu bài hôm nay, không cổng riêng |
| Game mini | Mở khi xong khối chính, đúng chủ đề hôm nay |
| Trùm cuối | Sau một chặng, gợi ý một lần "thử các mục hay sai" |
| Thử thách nâng cao | Nằm trong Phòng thử thách; Lộ trình chỉ gợi ý khi thanh tiến độ gần nhảy bậc |
| Viết/Nói | Gợi ý theo tuần vì tốn chi phí chấm |

## 7. Điều chỉnh nhãn câu hỏi theo thời gian (ĐỀ XUẤT: bán tự động)

| Bước | Việc | Cần làm gì |
|---|---|---|
| Đo | Báo cáo từng câu: số lượt, tỷ lệ đúng, so với dự đoán từ nhãn; đánh dấu "nhãn khó mà ai cũng đúng" và ngược lại | **ĐÃ CÓ:** `npm run report:items` (`scripts/item-report.mjs`, logic ở `src/lib/analytics/item-quality.ts`, có test). Dự kiến theo năng lực học sinh ngay trước lượt đó; gom được theo nhóm (chủ đề · dạng câu). Cờ: dễ hơn nhãn, khó hơn nhãn (lệch > 15 điểm %, ≥ 30 lượt và ≥ 8 học sinh), dưới mức đoán mò (<25%). Cần Supabase thật và `.env.local`; chưa chạy thử trên dữ liệu thật |
| Duyệt | Người xem danh sách câu bị đánh dấu rồi sửa JSON | Sửa dữ liệu, sinh lại `items.json` bằng `scripts/build-item-meta.mjs` |
| Hiệu chỉnh tự động | Độ khó thực của câu cập nhật dần từ dữ liệu | Chỉ làm sau khi đủ dữ liệu (ước tính vài chục lượt/câu); chưa làm |

Không tự đổi nhãn khi chưa có người duyệt, để không làm trôi chuẩn nội dung (CLAUDE.md, quyết định 1).

Việc nhỏ cho từ vựng, làm cùng đợt: chọn đáp án nhiễu gần nghĩa/cùng chủ đề, cho độ khó phụ thuộc dạng câu (nghĩa tiếng Việt dễ hơn đọc nghĩa tiếng Anh), tăng số câu mỗi cấp trong bài xếp trình độ và cho dừng sớm khi kết quả rõ.

## 8. Dữ liệu cần thêm (ĐỀ XUẤT, chưa xây)
- Bảng `path_progress` (khóa theo `profile_id`, mã nấc, trạng thái, cách mở, thời điểm): migration mới; tuân CLAUDE.md 3b (Postgres thuần, qua lớp `src/lib/db`).
- Cột/nhãn `mode` ('practice' | 'test') ở bảng `answers` hoặc bảng ghi riêng cho Phòng thử thách.
- Bảng định nghĩa nấc và bài: bắt đầu bằng tệp JSON trong repo (như nội dung), có validator `check:content`.

## 9. Thứ tự làm
1. Duyệt tài liệu này (bạn).
2. `scripts/item-report.mjs` (đo chất lượng câu).
3. **XONG (26/10/2026):** một nơi duy nhất đổi Elo thành Bậc + CEFR: `src/lib/progress/level.ts` (`skillLevel`, `placementLevel`, `overallLevel`, `levelOfAbility`) và `levelLabel` ở `src/lib/content/bac.ts`. Đã dùng ở bốn bài xếp trình độ (ngữ pháp, từ vựng, đọc, nghe), `LevelHint`, ghi chú của luyện thích ứng và hồ sơ năng lực ở `/tien-do` (có dòng Bậc tổng). Đã gỡ `estimateBac` và `stairResult`. Bài xếp trình độ (ngắn, 12–36 câu) dùng ước lượng MAP cùng mô hình xác suất (`estimateThetaMAP`), không dùng Elo tuần tự (Elo với vài câu nhích quá ít); lấy bậc dưới khi chưa rõ. Chi tiết và mô phỏng: `docs/xep-trinh-do-tong-hop.md`. Bậc tổng cần ≥3 kỹ năng không ở mức tin cậy thấp. Còn lại: bậc Viết/Nói (do Gemini ước lượng) vẫn hiển thị riêng, chưa gộp.
4. **XONG (26/10/2026):** hàm thuần cho Lộ trình ở `src/lib/path/`: `catalog.ts` (danh mục 6 bậc × 5 chặng dựng từ nội dung có sẵn; bài = chuyên đề × bậc, phần từ vựng, bài đọc, bài nghe), `progress.ts` (xong/hiện tại/thử sức/khóa/bỏ qua, tính lại từ kết quả từng bài), `jump.ts` (điều kiện nhảy bậc), `focus.ts` (kỹ năng yếu nhất ×1,5, trần 40%, bài hôm nay). Có test (`tests/path.test.ts`).
4b. **XONG bản đầu (26/10/2026), thay cho một phần bước 6:** migration `0014_path_lessons.sql` (bảng `path_lessons`, hàm `record_path_lesson`, kết quả tốt nhất mỗi bài), lớp `src/lib/db/path.ts`, nạp nội dung `src/lib/path/data.ts`, trang `/lo-trinh` (nấc hiện tại, Học tiếp, gợi ý hôm nay, bản đồ các chặng) và `/lo-trinh/bai/[mã bài]` (dùng lại bộ làm bài ngữ pháp/từ vựng/đọc/nghe; ghi kết quả; mời bài kế trong nấc). Đặt lại dữ liệu của quản trị có thêm phạm vi "Lộ trình". CHƯA: nối điều kiện nhảy bậc vào giao diện (thanh tiến độ tới bậc kế, lưu bậc Lộ trình), Phòng thử thách (bước 5), đồ họa (bước 6), cho giáo viên xem nấc bỏ qua. (Đã nối nút "Học tiếp" ở trang chủ vào bài kế của Lộ trình, 26/10/2026: hook dùng chung `usePathState`.)
5. **XONG bản đầu (26/10/2026):** Phòng thử thách và lời giải thích áp lực (mục 13).
6. Giao diện và đồ họa (sau cùng).

## 10. Câu hỏi còn mở
- Có cho giáo viên thấy nấc "bỏ qua" của học sinh không (liên quan `docs/phan-quyen.md`)?

## 11. Việc cần xem lại khi có dữ liệu thật (hẹn: khoảng 26/11/2026, 1 tháng sau khi có học sinh dùng)
Chạy `npm run report:items` và `node scripts/srs-report.mjs`, rồi chỉnh theo số liệu. Dưới ~1.000 lượt trả lời hoặc ~8 học sinh thì số liệu chưa đủ; hoãn thêm đến khi đủ.
- [ ] Nhãn `bac`/`difficulty` của câu: duyệt các câu bị đánh dấu và các nhóm (chủ đề · dạng câu) lệch, sửa JSON, chạy `node scripts/build-item-meta.mjs`. Đặc biệt kiểm từ vựng B2 và dạng câu "nghĩa tiếng Việt".
- [ ] Ngưỡng cờ (`MIN_ATTEMPTS`=30, `MIN_LEARNERS`=8, `FLAG_GAP`=0,15, `BELOW_GUESS`=0,25 ở `item-quality.ts`): nhiều quá hay ít quá cờ?
- [ ] Hằng số Elo (`ability.ts`: K, `TARGET_SUCCESS`=0,8, `BAC_STEP`=200, `DIFF_STEP`=40, `START_RATING`): bậc ước lượng có khớp cảm nhận của giáo viên không?
- [ ] Ngưỡng bài "làm được" 70% và giới hạn thử sức 2 nấc: có học sinh đoán mò để mở khóa không?
- [ ] Điều kiện nhảy bậc (40–60 câu, 80% đúng, ≥3 ngày, thẻ còn nhớ): nhảy quá chậm hay quá nhanh?
- [ ] Số chặng mỗi bậc (khởi điểm 5).
- [ ] Trọng số kỹ năng yếu 1,5 và trần 40% mỗi ngày.
- [ ] Số câu và dừng sớm của bài xếp trình độ từ vựng.
- [ ] Ngưỡng 80% bài kiểm tra cuối chủ điểm và các mức khác của `docs/hoc-thuat-dong-luc.md` ("Chưa làm / cần dữ liệu thật").
(Phần Lộ trình/Phòng thử thách chưa xây thì chưa có dữ liệu cho các mục tương ứng; khi xây xong mới đo.)

## 12. Điểm bắt đầu, bài vượt cấp và độ khó tăng dần theo bậc (chốt 26/10/2026, ĐÃ XÂY bản đầu)

**Điểm bắt đầu** (bảng `path_state`, migration `0015`, chỉ tăng, không tự hạ):
- Có kết quả **bài xếp trình độ tổng hợp** thì bắt đầu ở chặng 1 của bậc tổng (dưới Bậc 1 → Bậc 1). Trang `/lo-trinh` tự đọc kết quả gần nhất khi mở.
- Hoặc **bài vượt cấp**: nút "🚀 Vượt cấp tới đây" ở các chặng phía trên chặng hiện tại. 20 câu đủ kỹ năng của chặng đó (8 ngữ pháp, 4 từ vựng, một bài đọc 4 câu, một bài nghe 4 câu; thiếu kỹ năng nào thì chia lại cho ngữ pháp/từ vựng), **phải đúng hết** thì bắt đầu từ chặng đó. Không đạt thì cứ tiếp tục ở chặng hiện tại, thử lại được (câu khác). Câu trả lời vẫn đi vào Elo như luyện thường.
- Không có gì thì chặng 1 của Bậc 1. Nấc dưới điểm bắt đầu không bắt buộc ("Ôn lại"), vẫn mở để quay lại, không bị coi là "bỏ qua".

**Độ nghiêm ngặt tăng theo bậc, kiểu game** (`src/lib/path/rules.ts`, `jump.ts`; mọi số là giá trị khởi điểm, chỉnh dần):

| Bậc | Đúng để xong một bài | Câu cần để lên bậc kế | Đúng | Số ngày | Câu/ngày (tối thiểu) | Thẻ ôn còn nhớ |
|---|---|---|---|---|---|---|
| 1 | 60% | 25 | 75% | 2 | 5 | 60% |
| 2 | 65% | 35 | 78% | 2 | 5 | 65% |
| 3 | 70% | 50 | 80% | 3 | 5 | 70% |
| 4 | 75% | 70 | 83% | 4 | 6 | 72% |
| 5 | 80% | 100 | 85% | 5 | 8 | 75% |
| 6 | 80% | 150 | 88% | 7 | 10 | 78% |

**Cổng bậc:** làm hết các chặng của một bậc chưa đủ để sang bậc kế; còn phải đủ điều kiện nhảy bậc ở bảng trên (tính trên các câu đã trả lời ở bậc đó, gộp bốn kỹ năng nhận biết). Chưa đủ thì chặng đầu của bậc kế hiện "Chờ lên bậc" kèm danh sách điều kiện còn thiếu, các nấc sau khóa; thử sức không vượt được cổng, chỉ bài vượt cấp hoặc bài xếp trình độ mới nhảy qua. Thanh "Tiến độ lên Bậc kế" luôn hiện ở thẻ đầu trang.

Chưa làm: điều kiện thẻ ôn đang truyền `null` (bỏ qua) vì chưa tính mức nhớ theo bậc từ FSRS; điều kiện chưa tách theo từng kỹ năng; giới hạn số lần thử bài vượt cấp mỗi ngày (hiện thử lại thoải mái); nhắc giáo viên khi học sinh vượt cấp.

## 13. Phòng thử thách (ĐÃ XÂY bản đầu, 26/10/2026)

Trang `/phong-thu-thach` (chọn bậc, mặc định bậc đang học) và `/phong-thu-thach/[bậc]` (bài làm). Migration `0016_challenge.sql` (bảng `challenge_attempts`, hàm `record_challenge_attempt`, thêm nguồn điểm bắt đầu `challenge`), hàm thuần `src/lib/path/challenge.ts` (có test), giao diện `src/components/path/challenge-run.tsx`, `challenge-home.tsx`.

- **Bài thi:** 20 câu lấy từ MỌI chặng của bậc (8 ngữ pháp, 4 từ vựng, một bài đọc 4 câu, một bài nghe 4 câu), **15 phút** tính giờ thật (không trôi khi tab chạy nền; hết giờ tự nộp, câu chưa làm tính là chưa đúng), không báo đúng/sai giữa chừng, không gợi ý, không quay lại câu trước, bài nghe được nghe 2 lần, không có câu đọc to. Sau khi nộp mới xem lại các câu chưa đúng kèm giải thích; câu sai vẫn thành thẻ ôn.
- **Kết luận một bài (chỉ để đề xuất):** `up` khi đúng từ 85% và không kỹ năng nào dưới 50% (xét kỹ năng có từ 3 câu); `review` khi dưới 50%; còn lại `stay`. KHÔNG có kết luận "hạ": `review` chỉ gợi ý ôn các chặng của bậc, bậc không đổi.
- **Nâng điểm bắt đầu:** cần HAI lần gần nhất ở bậc đó đều `up` và rơi vào **hai ngày khác nhau** (giờ Việt Nam); lần gần nhất không `up` thì hủy đề xuất. Khi xác nhận, gọi `raise_path_start(bậc kế, chặng 1, 'challenge')`: các chặng dưới vẫn mở để ôn, và cổng nhảy bậc ở mục 12 không còn chặn bậc đã bỏ lại phía sau. Bậc 6 là bậc cuối nên không có đề xuất nâng.
- **Lời giải thích áp lực** hiện trước khi bắt đầu và kèm kết quả (`PRESSURE_NOTE`), đúng nội dung đã chốt ở mục 2.
- **Chưa làm:** cột `mode='test'` ở bảng `answers` và trọng số lớn hơn cho câu trả lời trong Phòng thử thách (hiện các câu vẫn ghi như luyện thường vào Elo); gợi ý hạ bậc có xác nhận bằng bài thứ hai (hiện chỉ gợi ý ôn); cấu trúc theo VSTEP (bốn kỹ năng gồm Viết/Nói); giới hạn số lần thử mỗi ngày; cho giáo viên xem lịch sử thử thách (bảng đã có chính sách đọc cho giáo viên, giao diện chưa có); điều chỉnh 85%/50%/15 phút khi có dữ liệu thật (mục 11).
