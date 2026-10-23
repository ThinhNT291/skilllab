# Training Zone (skilllab)

Web học và luyện ngoại ngữ có chấm điểm, nhận xét, gợi ý và phân tích tiến độ.
Ngữ cảnh và quyết định dự án: `CLAUDE.md`. Lộ trình: `ROADMAP.md`.

## Chạy trên máy
```bash
npm install
cp .env.example .env.local   # điền khóa Supabase/Gemini (chưa cần cho bản demo bài tập)
npm run dev                  # http://localhost:3000
```
Kiểm tra trước khi đẩy code: `npm run lint` và `npm run build`.

## Cấu trúc
- `src/app/` trang (`/` trang chủ, `/luyen-tap` bài tập mẫu)
- `src/components/exercise/` bài tập: `ExerciseRunner`, `ChoiceButton`, `ProgressBar`
- `src/lib/content/` mô hình nội dung (`types.ts`) và câu mẫu
- `src/lib/settings.ts` giao diện (3 skin) và âm thanh, lưu trong trình duyệt
- `legacy/` bản JS thuần cũ, giữ để tham khảo (đặc biệt `grammar_theory_bank.js`), không build
