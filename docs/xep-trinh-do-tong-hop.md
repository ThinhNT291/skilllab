# Bài xếp trình độ tổng hợp

Trang: `/xep-trinh-do/tong-hop`. Quyết định và con số khởi điểm do chủ dự án đồng ý (26/10/2026); mọi con số xem lại sau 1 tháng có dữ liệu thật (`docs/lo-trinh-va-xep-bac.md` mục 11).

## Cấu trúc
- **36 câu, 8 phần** xen kẽ: ngữ pháp 6 → từ vựng 6 → đọc (1 bài, 3 câu) → nghe (1 bài, 3 câu) → lặp lại một lần nữa. Tổng: 12 ngữ pháp, 12 từ vựng, 6 đọc, 6 nghe. Khoảng 25–35 phút.
- **Thích ứng hai tầng:** trong phần câu lẻ, trình chạy bài tập tự lên/xuống độ khó theo từng câu (`PLACEMENT_STEPS` ±0,15 trên thang ~10 câu/bậc); giữa các phần, câu/bài chọn quanh mức ước lượng hiện tại của kỹ năng đó. Kỹ năng chưa có câu nào thì lấy trung bình ước lượng các kỹ năng đã làm (người giỏi ngữ pháp thường không bắt đầu đọc ở Bậc 2).
- Phủ **Bậc 1–6** (nội dung ngữ pháp, từ vựng C1/C2, đọc và nghe Bậc 5–6 đã có).

## Cách tính kết quả (`src/lib/placement/full.ts`, `src/lib/progress/level.ts`, `ability.ts`)
- Mỗi kỹ năng: ước lượng năng lực **MAP** theo mô hình xác suất đúng của Elo (có sàn đoán mò 25%) với phân phối tiên nghiệm rộng quanh Bậc 2. Khác Elo tuần tự: không phụ thuộc thứ tự câu và phản ứng mạnh với chỉ vài câu (Elo với 6 câu chỉ nhích rất ít; thử nghiệm sớm cho thấy Elo×2 báo thấp).
- **Chưa rõ nằm ở hai bậc nào thì lấy bậc dưới:** bậc số thực chỉ làm tròn lên khi đi được ≥ 60% quãng giữa hai bậc (`ROUND_UP_FROM = 0,6`).
- **Cần bằng chứng:** chỉ công nhận bậc b khi có ≥ 2 câu đúng ở độ khó từ bậc b trở lên (`MIN_CORRECT_FOR_BAC`); một câu đúng may mắn ở mức rất khó không đẩy bậc lên.
- **Bậc tổng** = trung vị của bậc số thực bốn kỹ năng, làm tròn một lần cùng quy tắc, không vượt bậc cao nhất của một kỹ năng nào (làm tròn từng kỹ năng rồi làm tròn lại bị trừ hai lần: mô phỏng cho thấy lệch ~0,6 bậc).
- Đọc và nghe chỉ có 6 câu nên ghi "chưa chắc lắm". Kết quả luôn kèm lời giải thích về căng thẳng/mệt và về cách lấy bậc dưới. Chỉ là ước lượng của máy, không phải điểm thi hay chứng chỉ.

## Mô phỏng (`node scripts/simulate-placement.mjs [số lần]`)
Học sinh giả có năng lực thật đã biết, trả lời theo đúng mô hình xác suất của ứng dụng, 400 lần mỗi mức. Dùng chính các hàm thuần của ứng dụng. **Chỉ nói về độ ổn định của thuật toán, không chứng minh độ đúng với học sinh thật** (mô hình trả lời và mô hình chấm là cùng một mô hình).

| Bậc thật | Bậc tổng báo ra (trung bình) | Đúng bậc nguyên | Lệch ≤ 1 bậc | Thấp hơn thật | Cao hơn thật |
|---|---|---|---|---|---|
| 1,0 | 1,09 | 76% | 100% | 8% | 17% |
| 2,0 | 2,01 | 75% | 100% | 12% | 13% |
| 2,5 | 2,41 | 59% | 99% | 0% | 1% |
| 3,0 | 2,85 | 74% | 100% | 21% | 5% |
| 4,0 | 3,77 | 66% | 100% | 29% | 6% |
| 5,0 | 4,62 | 59% | 99% | 39% | 2% |
| 6,0 | 5,45 | 47% | 98% | 53% | 0% |

Nhận xét: lệch ≤ 1 bậc ở ≥ 92% mọi mức; hơi thấp ở bậc cao (cố ý theo quy tắc lấy bậc dưới, cộng với kết quả đọc/nghe chỉ có 6 câu và trần ở Bậc 6). Đọc/nghe thấp hơn ngữ pháp/từ vựng khoảng 0,5–0,7 bậc ở bậc cao: nếu thực tế cũng vậy, cân nhắc thêm câu cho đọc/nghe thay vì chỉnh công thức.

## Lưu dở dang, làm lại, ngân hàng riêng
- **Tài khoản thật** (không ẩn danh): lưu trạng thái sau mỗi câu (phần câu lẻ) hoặc sau mỗi bài (đọc/nghe), làm tiếp lần sau; lưu kết quả. Bài đọc/nghe dở giữa chừng làm lại từ đầu bài đó (các câu đã trả lời vẫn đã ghi vào `answers`, có thể ghi hai lần trong trường hợp hiếm này). **Khách học thử:** làm một mạch, không lưu.
- **Làm lại sau 14 ngày** kể từ lần xong gần nhất (`RETAKE_GAP_DAYS`; cơ sở dữ liệu cũng chặn, trigger `placement_gap_guard`). Quản trị đặt lại được bằng "Đặt lại dữ liệu học… → Bài xếp trình độ tổng hợp".
- **Câu mới mỗi lần:** lần sau chỉ lấy câu chưa gặp, trừ câu từng sai (được xuất hiện lại); hết câu mới thì mới lấy lại câu đã gặp.
- **Ngân hàng riêng** (`src/content/placement/reserved.json`, tạo bằng `node scripts/build-placement-bank.mjs`, kiểm bằng `--check` và test): 60 câu ngữ pháp (10 mỗi bậc), 240 từ (40 mỗi cấp A1–C2), 18 bài đọc và 18 bài nghe (3 mỗi bậc). Các mục này **bị loại khỏi mọi bài luyện** (`getExercises`, `getVocab`, `getReadingPassages`, `getListeningItems`), nên học sinh không gặp trước. Chọn xác định theo băm mã, rải đều chuyên đề; chưa có câu soạn riêng cho placement (lấy từ nội dung đã phản biện). Đủ cho khoảng 3 lần làm không lặp ở ngữ pháp/từ vựng; đọc/nghe 3 bài mỗi bậc có thể hết sớm hơn nếu bậc ước lượng lặp lại, khi đó lấy lại bài đã gặp. Mở rộng ngân hàng riêng: quy trình sinh → giải mù → duyệt ở `docs/prompt-sinh-noi-dung.md`.
- Hai trang bài ngắn một kỹ năng (`/xep-trinh-do`, `/xep-trinh-do/[skill]`) vẫn còn, dùng phần nội dung không dành riêng; dùng cùng công thức MAP và quy tắc lấy bậc dưới.

## Cần chạy migration (Supabase SQL Editor)
- `0012_settings_dedupe.sql`: cài đặt theo tài khoản, `answers.client_id` chống ghi trùng.
- `0013_placement_sessions.sql`: bảng `placement_sessions` (một lần đang làm mỗi hồ sơ, chặn làm lại trong 14 ngày).
Chưa chạy 0013: trang vẫn chạy nhưng không lưu dở dang/kết quả (hàm DB trả lỗi, giao diện coi như khách học thử).

## Chưa làm
- Hiện kết quả xếp trình độ cho giáo viên/quản trị ở trang chi tiết học sinh (bảng đã cho phép giáo viên đọc).
- Kết quả xếp trình độ chưa tự điều chỉnh "Lộ trình" (chưa xây Lộ trình).
- Câu soạn riêng cho placement bằng quy trình Gemini.
