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
