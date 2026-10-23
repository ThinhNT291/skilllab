# Training Zone (skilllab)

Web học và luyện ngoại ngữ có chấm điểm, nhận xét, gợi ý và phân tích tiến độ.
Ngữ cảnh và quyết định dự án: `CLAUDE.md`. Lộ trình: `ROADMAP.md`. Quy trình pull/gộp/Supabase/Vercel: `docs/quy-trinh-lam-viec.md`.

## Chạy trên máy
```bash
npm install
cp .env.example .env.local   # điền khóa Supabase/Gemini (chưa cần cho bản demo bài tập)
npm run dev                  # http://localhost:3000
```
Kiểm tra trước khi đẩy code: `npm run check:content`, `npm run lint` và `npm run build`.

## Thêm bài tập
Mỗi chuyên đề một tệp `src/content/exercises/en/<id-chuyên-đề>.json`, là mảng câu (xem `src/content/exercises/en/subjunctive.json` làm mẫu, có đủ `choiceExplanations`). Quy tắc soạn: `docs/chuan-noi-dung.md`. Mỗi câu cần: `id` duy nhất, `usageId` trùng một mục `usages[].id` của chuyên đề (để có link "Xem lại lý thuyết"), `choices`, `correctIndex`, `explanation` và nên có `choiceExplanations` (giải thích riêng từng đáp án). Chạy `npm run check:content` để bắt lỗi trước khi đẩy.

## Cấu trúc
- `src/app/` trang: `/` trang chủ, `/hoc` danh sách chuyên đề, `/hoc/[topic]` lý thuyết, `/hoc/[topic]/luyen-tap` luyện tập (10 câu xáo ngẫu nhiên mỗi lượt)
- `src/content/grammar/<ngôn ngữ>/` lý thuyết từng chuyên đề (JSON) + `index.json`; `src/content/exercises/<ngôn ngữ>/<chuyên đề>.json` bài tập
- `scripts/validate-content.mjs` kiểm tra nội dung (`npm run check:content`)
- `src/components/exercise/` bài tập: `ExerciseRunner`, `ChoiceButton`, `ProgressBar`
- `src/lib/content/` mô hình nội dung (`types.ts`) và nơi nạp nội dung (`grammar.ts`)
- `src/lib/db/` lớp truy cập dữ liệu (đăng nhập ẩn danh, hồ sơ, ghi câu trả lời); `supabase/migrations/` schema SQL
- `src/lib/supabase/` client Supabase (chỉ lớp truy cập dữ liệu được gọi), `src/app/api/health` kiểm tra kết nối
- `src/lib/settings.ts` giao diện (3 skin) và âm thanh, lưu trong trình duyệt
- `legacy/` bản JS thuần cũ, giữ để tham khảo (đặc biệt `grammar_theory_bank.js`), không build
