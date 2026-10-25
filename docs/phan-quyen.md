# Vai trò, lớp học và phân quyền

Quyết định đã chốt với chủ dự án: phân quyền đặt ở cơ sở dữ liệu (RLS). Giao diện chỉ ẩn nút cho gọn, không phải lớp bảo vệ.

## Vai trò (`profiles.role`)
| Vai trò | Quyền |
|---|---|
| `student` | Đọc/ghi dữ liệu học tập của chính mình. Không tự đổi vai trò (quyền ghi cột `role` đã bị thu hồi). |
| `teacher` | Thêm quyền ĐỌC dữ liệu học tập của học sinh trong lớp mình dạy (`class_teachers` ∩ `class_members`). Không ghi thay học sinh, không tạo lớp. |
| `admin` | Đọc tất cả, quản lý lớp/thành viên/giáo viên. Thao tác tài khoản đi qua API route phía máy chủ. |

## Bảng (migration `0007_roles_classes.sql`)
`languages` (mã ngôn ngữ), `classes` (có `language_code`, một lớp trước nhưng thiết kế sẵn nhiều lớp/nhiều ngôn ngữ), `class_teachers`, `class_members`, `audit_log` (chỉ `service_role` ghi, chỉ quản trị đọc). `profiles` thêm `username` (tên đăng nhập tài khoản lớp học) và `disabled_at`.

## Hàm SQL
`current_role_name()`, `is_admin()`, `can_view_profile(target)`, `teaches_class(class_id)`: đều `security definer` để không vướng chính RLS. Chỗ gắn với hệ đăng nhập vẫn chỉ là `profiles.auth_user_id` và `auth.uid()`.

## Quy tắc về khóa
- `service_role` chỉ dùng trong API route phía máy chủ (biến môi trường không có tiền tố `NEXT_PUBLIC_`). Không đưa vào trình duyệt, không commit.
- Tạo/sửa/khóa tài khoản, đặt lại mật khẩu: API route kiểm vai trò quản trị rồi mới dùng `service_role`, và ghi `audit_log`.

## Kiểm tra
`node scripts/test-rls.mjs` (cần `npm i --no-save @electric-sql/pglite`) chạy toàn bộ migration trên Postgres trong bộ nhớ rồi kiểm 22 tình huống (học sinh không thấy dữ liệu người khác, giáo viên chỉ thấy lớp mình, giáo viên không ghi thay học sinh, không tự nâng quyền, chỉ quản trị đọc audit_log…).

## Đặt quản trị đầu tiên
Sau khi có đăng nhập thật (bước tiếp theo), chạy trong SQL Editor: `update public.profiles set role = 'admin' where id = '<profiles.id của bạn>';`

## Đăng nhập và quản lý tài khoản (bước b, c)
Tham khảo cách làm của repo `daotao` (API route dùng `service_role`, nhập lại mật khẩu quản trị cho mỗi thao tác, cờ `must_change_password`, khóa bằng `ban_duration`, chặn tự khóa mình và khóa quản trị cuối cùng, ghi nhật ký cả thao tác bị từ chối), chỉnh cho học sinh nhỏ tuổi:

| Việc | `daotao` | Ở đây |
|---|---|---|
| Định danh | email thật | tên đăng nhập; email giả `<tên>@accounts.skilllab.invalid` (không gửi thư, quản trị đặt lại mật khẩu) |
| Mật khẩu tạm | quản trị tự gõ | hệ thống sinh 8 ký tự, bỏ ký tự dễ nhầm, hiện MỘT lần |
| Độ dài tối thiểu | 8 | học sinh 6, giáo viên/quản trị 8 |
| Đổi lần đầu | bắt buộc nếu email ngoài danh sách | luôn bắt buộc với tài khoản do quản trị tạo |
| Tạo quản trị | qua giao diện | KHÔNG qua giao diện: chỉ `scripts/create-admin.mjs` chạy trên máy bạn |
| Xóa tài khoản | xóa mềm có lý do | chưa làm (chỉ khóa); xóa dữ liệu trẻ em cần quy tắc riêng |
| Học thử | không có | vẫn dùng đăng nhập ẩn danh; hồ sơ ẩn danh không có `username` nên không lẫn vào danh sách lớp |

### Các thành phần
- Máy chủ: `src/lib/supabase/admin.ts` (service_role, `server-only`), `src/lib/auth/server.ts` (`getCaller`), `src/app/api/admin/accounts/route.ts` (create / reset_password / lock / unlock / update), `src/app/api/account/change-password/route.ts`.
- Cổng: `src/proxy.ts` (Next 16 thay `middleware`): chặn `/quan-ly` với người không phải giáo viên/quản trị, chuyển người còn cờ đổi mật khẩu về `/doi-mat-khau`, `/tai-khoan` cần tài khoản thật. Các trang học không đi qua proxy nên học sinh học thử không bị chậm. Chặn thật vẫn là RLS và API route.
- Trang: `/dang-nhap`, `/doi-mat-khau`, `/tai-khoan`, `/quan-ly` (học sinh), `/quan-ly/hoc-sinh/[id]`, `/quan-ly/lop`, `/quan-ly/tai-khoan`, `/quan-ly/nhat-ky`.
- Google: có nút và `/auth/callback`, chỉ hiện khi `NEXT_PUBLIC_GOOGLE_LOGIN=1` sau khi bạn bật Google trong Supabase. Người đăng nhập Google tạo ra hồ sơ học sinh; nâng thành giáo viên cần quản trị sửa vai trò (chưa có giao diện cho tài khoản không có tên đăng nhập).

### Thiết lập một lần
1. Chạy `0007_roles_classes.sql`.
2. Thêm `SUPABASE_SERVICE_ROLE_KEY` vào biến môi trường Vercel (Production) và `.env.local` (khóa ở Supabase > Project Settings > API, mục `service_role`). Không dán khóa vào chat hay commit.
3. Tạo quản trị đầu tiên: mở terminal trong VS Code (đang ở thư mục dự án), điền `NEXT_PUBLIC_SUPABASE_URL` và `SUPABASE_SERVICE_ROLE_KEY` vào `.env.local`, rồi chạy `node scripts/create-admin.mjs tenban`. Script tự đọc `.env.local` và hỏi mật khẩu (gõ không hiện chữ). Cần Node 20.12 trở lên.
4. Vào `/dang-nhap`, đăng nhập, mở `/quan-ly/lop` tạo lớp, rồi `/quan-ly/tai-khoan` tạo tài khoản học sinh.

### Rủi ro đã biết
- Supabase có thể từ chối email đuôi `.invalid` khi tạo người dùng; nếu gặp, đổi `accountEmail` ở `src/lib/auth/roles.ts` sang một tên miền bạn kiểm soát (không cần nhận thư).
- Hồ sơ học thử ẩn danh cũ không tự gắn sang tài khoản mới (chưa có người dùng thật nên chấp nhận).
- Phần API và đăng nhập chưa chạy thử trên Supabase thật (chỉ phần SQL được kiểm bằng `scripts/test-rls.mjs`); cần thử theo các bước trên và báo lỗi nếu có.
