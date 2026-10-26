# Nội dung Bậc 5–6 (C1–C2): cách làm và việc cần người duyệt

Thêm 25/10–26/10/2026. Quy trình: soạn (agent) → phản biện độc lập (agent khác sửa lỗi, viết lại giải thích) → gộp vào kho → kiểm bằng `npm run check:content`. KHÔNG có người bản ngữ duyệt: coi là bản nháp chất lượng cao, chưa phải bản cuối.

## Đã thêm
- **Ngữ pháp:** 9 chuyên đề × 50 câu (17/17/16), mỗi chuyên đề 8 mục dạy: `participle-clauses`, `advanced-passives`, `modals-advanced`, `negation-advanced`, `noun-phrases-advanced`, `conditionals-advanced`, `ellipsis-substitution`, `discourse-linking-advanced`, `style-and-register`. Tổng 450 câu; kho ngữ pháp thành 40 chuyên đề, 2.010 câu.
- **Đọc hiểu:** Bậc 5 và 6, mỗi bậc 14 bài × 4 câu (một câu Đúng/Sai/Không nêu mỗi bài).
- **Nghe hiểu:** Bậc 5 và 6, mỗi bậc 14 bài × 4 câu.
- **Từ vựng:** C1 (532 từ) và C2 (706 từ) từ English Vocabulary Profile qua `scripts/build-vocab.py c1 c2`, nghĩa tiếng Việt do Claude soạn và qua phản biện (9 sửa, 3 loại); đã loại từ không hợp lứa tuổi.

## Việc cần người duyệt
- **Giọng đọc bài nghe:** tên và đại từ người nói đã đổi cho khớp giới tính giọng TTS theo thứ tự xuất hiện (A = Kore nữ, B = Puck nam, C = Zephyr nữ). Cần nghe thử để xác nhận; đổi `VOICES` trong `src/lib/audio/dialogue.ts` thì phải xem lại tên.
- **Kiến thức cần đối chiếu nguồn:** bài đọc Bậc 5 (saudade, Gutenberg và chữ rời Đông Á, Loftus–Palmer, nấm rễ, "hitting the wall"), bài đọc Bậc 6 (bài 008 chụp ảnh và trí nhớ, 002 sông uốn khúc, 013), `noun-phrases-advanced` (Huế, Fuji).
- **Độ khó C2 chưa thật đủ:** nhiều câu đọc/nghe Bậc 6 chỉ tra chi tiết; nhiều câu ngữ pháp gắn bậc 5 nhiều hơn bậc 6; `noun-phrases-advanced` và `discourse-linking-advanced` thực chất thiên B2–C1. Muốn nhiều C2 thật thì cần soạn thêm (notwithstanding sau danh từ, "Be that as it may"…), không nâng nhãn.
- **Tranh cãi Anh-Mỹ/Anh-Anh:** `whilst`, `daren't`, `shall I`, `than I/than me`, "who/whom", `get owned` (tiếng lóng), litotes (`not a little surprised`).
- Một số đáp án nhiễu vẫn dễ loại; nhiều đáp án đúng dài hơn nhiễu.
- Chưa gắn mã id English Grammar Profile cho từng mục; nội dung chọn theo mô tả can-do C1/C2.
- Báo cáo phản biện chi tiết từng chuyên đề nằm ở thư mục làm việc tạm (không đưa vào repo); các điểm còn lại đã tóm ở đây.

## Chưa làm
- Placement cho bậc cao (placement Đọc/Nghe hiện dừng ở Bậc 4; Từ vựng placement chỉ A1–B2).
- Bài tập từ vựng C1/C2 theo chủ đề (`/tu-vung/chu-de` chỉ phân loại A1–B2).
- `npm run content:push` để đẩy nội dung mới lên cơ sở dữ liệu.
