# Thử các script sinh nội dung bằng Gemini thật

Các script `gen-items`, `review-items`, `gen-passages`, `review-passages` đã chạy thử với máy chủ giả, **chưa với Gemini thật**. Chạy thử nhỏ trước (vài câu), xem kết quả bằng mắt, rồi mới sinh nhiều. Không script nào ghi vào `src/content`: kết quả nằm ở `tmp/gen/` (không đẩy lên git); người duyệt rồi mới gộp tay.

## 1. Chuẩn bị (một lần)
1. Tạo/lấy khóa tại Google AI Studio (aistudio.google.com → Get API key).
2. Mở `.env.local` ở thư mục gốc dự án (tạo nếu chưa có), thêm hai dòng:
   ```
   GEMINI_API_KEY=khóa-của-bạn
   GEMINI_TEXT_MODEL=mã-mô-hình-Flash-Lite-mới-nhất
   ```
   Mã mô hình tra ở ai.google.dev/gemini-api/docs/models (đừng đoán; mã đổi theo thời gian). Không dán khóa vào chat hay commit.
3. Script đọc `.env.local` và biến môi trường của máy; nếu thấy "thiếu GEMINI_API_KEY" nghĩa là chưa có một trong hai.

## 2. Sinh câu ngữ pháp (thử 10 câu)
```
node scripts/gen-items.mjs --topic present-simple --bac 3 --n 10
```
- `--topic`: mã chuyên đề (tên tệp trong `src/content/grammar/en`, không có `.json`).
- `--bac`: 1–6. `--n`: số câu (nên 10 mỗi lần). `--difficulty "3 easy / 4 medium / 3 hard"` nếu muốn chia mức khó.
- Kết quả: `tmp/gen/present-simple-bac3-<giờ>.json`. Script tự kiểm bằng mã (đủ trường, 4 đáp án không trùng, giải thích từng đáp án, bỏ câu trùng đề có sẵn), tự xáo vị trí đáp án đúng, tự gán mã câu. Cuối lần chạy in số câu giữ/loại và lý do.

Giải mù (mô hình khác lượt, không thấy đáp án, tự làm lại câu):
```
node scripts/review-items.mjs tmp/gen/present-simple-bac3-<giờ>.json --runs 2
```
Ra `….reviewed.json` (kết quả từng câu) và `….passed.json` (chỉ câu qua **cả hai** lần: chọn đúng đáp án đúng và chỉ đáp án đó). Câu trượt giải mù thường là câu có hai đáp án cùng đúng hoặc đáp án đúng gượng: đọc vài câu trượt để biết mô hình hay sai ở đâu.

## 3. Sinh bài đọc / bài nghe (thử 2 bài)
```
node scripts/gen-passages.mjs --kind reading --bac 3 --n 2
node scripts/gen-passages.mjs --kind listening --bac 3 --n 2
node scripts/review-passages.mjs tmp/gen/<tệp vừa ra>.json --runs 2
```
Mỗi bài một lần gọi (4 câu hỏi kèm đoạn bằng chứng). Mã kiểm: độ dài theo bậc, nhãn người nói (bài nghe), đoạn bằng chứng có thật trong bài, đáp án đúng diễn đạt lại (không chép nguyên văn), và **cảnh báo** từ vựng vượt bậc theo CEFR-J + Octanove (chỉ cảnh báo, không tự loại).

## 4. Việc của người duyệt (không bỏ)
Giải mù chỉ bắt lỗi logic. Người duyệt đọc mẫu **tất cả** bài/câu trong `passed.json` (lô nhỏ thì đọc hết) và soi: tự nhiên không, đúng ngữ pháp không, số liệu thực tế đúng không, có phù hợp lớp 4–9 không. Có thể nhờ Claude phản biện độc lập trước (đúng quy trình trong CLAUDE.md).

## 5. Gộp vào kho (làm tay)
1. Chép câu đã duyệt vào `src/content/exercises/en/<chuyên đề>.json` (hoặc `src/content/reading|listening/en/bac<N>.json`); giữ mã câu do script gán, không trùng mã cũ.
2. `node scripts/build-item-meta.mjs` (chỉ với câu ngữ pháp/từ vựng), `npm run check:content`, `npm test` (sửa số đếm ở `tests/content-items.test.ts`), `npm run lint`.
3. `npm run content:push` để đồng bộ lên cơ sở dữ liệu.

## 6. Chi phí và sự cố thường gặp
- Mô hình Flash-Lite rất rẻ: 10 câu + 2 lần giải mù thường chưa tới vài trăm đồng. Gói miễn phí có giới hạn số yêu cầu mỗi phút: script tự chờ rồi thử lại; nếu báo 429 kéo dài, đợi một lúc.
- "Gemini trả JSON hỏng": script thử lại một lần; nếu vẫn hỏng, giảm `--n` (5 câu mỗi lần).
- Câu bị loại nhiều (>50%): mở `.reviewed.json` xem lý do chung; nếu cùng một lý do thì sửa lời nhắc ở `src/lib/ai/prompts/` (đổi số phiên bản `grammar-items-vN`/`passages-vN` để lần sau biết đã đổi).
- Muốn thử không tốn khóa: đặt `GEMINI_API_BASE` trỏ tới một máy chủ giả (cách các bài test đã làm).
