# Quy trình làm việc

## Phân công
- **Claude** sửa code trên nhánh `claude/improve-exercises-n2fs1t`, build và lint trước khi đẩy, rồi báo danh sách tệp đã đổi.
- **Chủ dự án** `git pull` về VS Code, chạy thử, tự sửa/commit/push khi cần, rồi báo lại để Claude kéo về trước khi làm tiếp (tránh xung đột).
- Gộp vào `main` bằng pull request trên GitHub **khi chủ dự án yêu cầu**; Claude không tự tạo.

## Lấy code mới về (VS Code)
```powershell
git pull
npm install        # chỉ cần khi package.json đổi
npm run dev        # http://localhost:3000
```

## Gộp nhánh vào main (cách trên web, không cần lệnh)
1. GitHub > repo `skilllab` > thanh vàng "Compare & pull request" (hoặc tab Pull requests > New).
2. Base: `main`, compare: `claude/improve-exercises-n2fs1t`. Create pull request, rồi Merge pull request.
3. Về máy: `git checkout main` và `git pull`.

Sau khi gộp, nhánh làm việc vẫn dùng tiếp được; nếu Claude báo cần nối lại với main thì làm theo hướng dẫn lúc đó.

## Kết nối Supabase (chạy dev)
1. Supabase > project `skilllab` > Project Settings > API: copy **Project URL** và khóa công khai (`anon` hoặc `publishable`).
2. Trong thư mục dự án: `copy .env.example .env.local`, mở `.env.local` và điền hai dòng `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Chạy `npm run dev`, mở http://localhost:3000/api/health, thấy `"ok": true` là đã kết nối.
4. **Không** dán khóa `service_role` hay khóa Gemini vào chat hoặc commit. Chỉ để trong `.env.local` và Vercel.

## Bật đăng nhập ẩn danh và tạo bảng (một lần)
1. Supabase > Authentication > Sign In / Providers > bật **Allow anonymous sign-ins** > Save.
2. Supabase > SQL Editor > New query > dán toàn bộ nội dung `supabase/migrations/0001_init.sql` > Run. Thấy "Success" là xong (chạy lại không hại gì).
3. `npm run dev`, mở http://localhost:3000/luyen-tap, làm một câu. Dưới ô bài tập hiện "Đã lưu kết quả." là đã ghi được.
4. Xem dữ liệu: Supabase > Table Editor > `answers` (và `profiles`). Mỗi trình duyệt/thiết bị là một người dùng ẩn danh riêng; xóa dữ liệu trình duyệt thì mất định danh đó.
5. **Ôn tập (thẻ lật):** dán và chạy thêm `supabase/migrations/0002_srs.sql` trong SQL Editor. Sau đó trả lời sai một câu trong phần luyện tập, vào `/on-tap` sẽ thấy thẻ (mỗi câu sai chỉ tạo một thẻ).
6. Trước khi mở cho nhiều người dùng thật: bật CAPTCHA cho đăng nhập ẩn danh (Authentication > Attack Protection) để tránh bị tạo hàng loạt tài khoản rác.

## Kết nối Vercel
1. Vercel > Add New > Project > Import repo `ThinhNT291/skilllab`. **Framework Preset phải là Next.js** (repo đã có `vercel.json` ghi sẵn `"framework": "nextjs"`).
2. Project Settings > Environment Variables, thêm (cho Production, Preview và Development):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - (sau này) `GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (không đặt tiền tố `NEXT_PUBLIC_`)
   Đổi biến môi trường xong phải **Redeploy** mới có hiệu lực.
3. Production Branch: `main`. Các nhánh khác tự có bản xem thử (Preview). Muốn xem nhánh làm việc trước khi gộp: tab Deployments, bản có tên nhánh `claude/improve-exercises-n2fs1t`.
4. Sau khi có địa chỉ `*.vercel.app`, mở `<địa chỉ>/api/health` để kiểm tra kết nối Supabase.

### Lỗi thường gặp
- `No Output Directory named "public" found`: Vercel đang coi dự án là trang tĩnh. Vào Project Settings > Build and Development Settings, đặt Framework Preset = Next.js, xóa mọi giá trị ghi đè ở Output Directory, rồi Redeploy.
- Bản deploy là code cũ: Vercel build đúng nhánh `main`; nếu chưa gộp nhánh làm việc vào `main` thì sẽ thấy bản cũ.
- Trang `/tien-do`, `/on-tap` báo chưa kết nối Supabase: thiếu biến môi trường ở bước 2, hoặc chưa Redeploy.
