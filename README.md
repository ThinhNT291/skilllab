# Training Zone (skilllab)

Web học và luyện ngoại ngữ có chấm điểm, nhận xét, gợi ý và phân tích tiến độ.
Ngữ cảnh và quyết định dự án: `CLAUDE.md`. Lộ trình: `ROADMAP.md`. Quy trình pull/gộp/Supabase/Vercel: `docs/quy-trinh-lam-viec.md`.

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
- `src/lib/db/` lớp truy cập dữ liệu (đăng nhập ẩn danh, hồ sơ, ghi câu trả lời); `supabase/migrations/` schema SQL
- `src/lib/supabase/` client Supabase (chỉ lớp truy cập dữ liệu được gọi), `src/app/api/health` kiểm tra kết nối
- `src/lib/settings.ts` giao diện (3 skin) và âm thanh, lưu trong trình duyệt
- `legacy/` bản JS thuần cũ, giữ để tham khảo (đặc biệt `grammar_theory_bank.js`), không build
