-- Vai trò, lớp học và quyền xem của giáo viên. Chạy trong Supabase > SQL Editor (chạy lại được nhiều lần).
--
-- Nguyên tắc: phân quyền nằm ở cơ sở dữ liệu (RLS), giao diện chỉ ẩn nút cho gọn.
--  * Học sinh chỉ thấy dữ liệu của chính mình (các chính sách *_select_own đã có từ các tệp trước).
--  * Giáo viên thêm quyền ĐỌC dữ liệu của học sinh trong lớp mình dạy. Không ghi được dữ liệu học tập của học sinh.
--  * Quản trị đọc tất cả. Tạo/sửa/khóa tài khoản, đặt lại mật khẩu đi qua API route phía máy chủ
--    dùng khóa service_role (khóa này chỉ nằm ở biến môi trường máy chủ, không bao giờ vào trình duyệt)
--    và ghi vào audit_log.
--  * Thiết kế sẵn nhiều giáo viên, nhiều lớp, nhiều ngôn ngữ (cột language_code), dù hiện chỉ dùng một lớp.
--
-- Đặt tài khoản quản trị đầu tiên (chạy một lần, thay UUID bằng profiles.id của bạn sau khi đăng nhập thật):
--   update public.profiles set role = 'admin' where id = '<uuid>';

-- ---------- Cột bổ sung cho hồ sơ ----------
alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists disabled_at timestamptz;

-- Tên đăng nhập của tài khoản lớp học: chữ thường, số, gạch dưới/chấm, 3–30 ký tự; duy nhất.
alter table public.profiles drop constraint if exists profiles_username_format;
alter table public.profiles add constraint profiles_username_format
  check (username is null or username ~ '^[a-z0-9][a-z0-9._]{2,29}$');
create unique index if not exists profiles_username_key on public.profiles (username) where username is not null;

-- ---------- Ngôn ngữ và lớp ----------
create table if not exists public.languages (
  code    text primary key check (code ~ '^[a-z]{2,3}$'),
  name    text not null,
  enabled boolean not null default true
);
insert into public.languages (code, name) values ('en', 'Tiếng Anh') on conflict (code) do nothing;

create table if not exists public.classes (
  id            uuid primary key default gen_random_uuid(),
  name          text not null check (char_length(name) between 1 and 60),
  language_code text not null default 'en' references public.languages (code),
  created_by    uuid references public.profiles (id) on delete set null,
  archived_at   timestamptz,
  created_at    timestamptz not null default now()
);

create table if not exists public.class_teachers (
  class_id   uuid not null references public.classes (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  primary key (class_id, profile_id)
);

create table if not exists public.class_members (
  class_id   uuid not null references public.classes (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  joined_at  timestamptz not null default now(),
  primary key (class_id, profile_id)
);
create index if not exists class_members_profile_idx on public.class_members (profile_id);
create index if not exists class_teachers_profile_idx on public.class_teachers (profile_id);

-- Nhật ký thao tác quản trị. Chỉ máy chủ (service_role) ghi; chỉ quản trị đọc.
create table if not exists public.audit_log (
  id                bigint generated always as identity primary key,
  actor_profile_id  uuid references public.profiles (id) on delete set null,
  action            text not null,
  target_profile_id uuid references public.profiles (id) on delete set null,
  detail            jsonb not null default '{}'::jsonb,
  created_at        timestamptz not null default now()
);
create index if not exists audit_log_created_idx on public.audit_log (created_at desc);

-- ---------- Hàm trợ giúp (security definer để không bị chính RLS chặn và tránh vòng lặp chính sách) ----------
create or replace function public.current_role_name()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where auth_user_id = auth.uid() and disabled_at is null
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_role_name() = 'admin', false)
$$;

-- Giáo viên (hoặc quản trị) có dạy lớp nào chứa học sinh này không.
create or replace function public.can_view_profile(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    target = public.current_profile_id()
    or public.is_admin()
    or (
      public.current_role_name() = 'teacher'
      and exists (
        select 1
        from public.class_teachers ct
        join public.class_members cm on cm.class_id = ct.class_id
        where ct.profile_id = public.current_profile_id() and cm.profile_id = target
      )
    )
$$;

create or replace function public.teaches_class(cls uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin() or exists (
    select 1 from public.class_teachers
    where class_id = cls and profile_id = public.current_profile_id()
  )
$$;

-- ---------- RLS cho bảng mới ----------
alter table public.languages enable row level security;
alter table public.classes enable row level security;
alter table public.class_teachers enable row level security;
alter table public.class_members enable row level security;
alter table public.audit_log enable row level security;

-- Danh sách ngôn ngữ ai cũng đọc được. Ghi: chỉ quản trị.
drop policy if exists "languages_select_all" on public.languages;
create policy "languages_select_all" on public.languages for select to authenticated using (true);
drop policy if exists "languages_write_admin" on public.languages;
create policy "languages_write_admin" on public.languages for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Lớp: quản trị và giáo viên của lớp xem; học sinh xem lớp mình học. Ghi: chỉ quản trị.
drop policy if exists "classes_select" on public.classes;
create policy "classes_select" on public.classes
  for select to authenticated
  using (
    public.teaches_class(id)
    or exists (select 1 from public.class_members m where m.class_id = id and m.profile_id = public.current_profile_id())
  );
drop policy if exists "classes_write_admin" on public.classes;
create policy "classes_write_admin" on public.classes for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "class_teachers_select" on public.class_teachers;
create policy "class_teachers_select" on public.class_teachers
  for select to authenticated using (public.teaches_class(class_id) or profile_id = public.current_profile_id());
drop policy if exists "class_teachers_write_admin" on public.class_teachers;
create policy "class_teachers_write_admin" on public.class_teachers for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "class_members_select" on public.class_members;
create policy "class_members_select" on public.class_members
  for select to authenticated using (public.teaches_class(class_id) or profile_id = public.current_profile_id());
drop policy if exists "class_members_write_admin" on public.class_members;
create policy "class_members_write_admin" on public.class_members for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "audit_log_select_admin" on public.audit_log;
create policy "audit_log_select_admin" on public.audit_log for select to authenticated using (public.is_admin());
-- Không có chính sách insert/update/delete: chỉ service_role (bỏ qua RLS) ghi được.

-- ---------- Quyền đọc thêm của giáo viên/quản trị trên dữ liệu học tập ----------
drop policy if exists "profiles_select_staff" on public.profiles;
create policy "profiles_select_staff" on public.profiles
  for select to authenticated using (public.can_view_profile(id));

drop policy if exists "answers_select_staff" on public.answers;
create policy "answers_select_staff" on public.answers
  for select to authenticated using (public.can_view_profile(profile_id));

drop policy if exists "srs_select_staff" on public.srs_cards;
create policy "srs_select_staff" on public.srs_cards
  for select to authenticated using (public.can_view_profile(profile_id));

drop policy if exists "items_select_staff" on public.player_items;
create policy "items_select_staff" on public.player_items
  for select to authenticated using (public.can_view_profile(profile_id));

drop policy if exists "topic_tests_select_staff" on public.topic_tests;
create policy "topic_tests_select_staff" on public.topic_tests
  for select to authenticated using (public.can_view_profile(profile_id));

drop policy if exists "graded_attempts_select_staff" on public.graded_attempts;
create policy "graded_attempts_select_staff" on public.graded_attempts
  for select to authenticated using (public.can_view_profile(profile_id));

-- Tài khoản bị khóa (disabled_at) không còn đọc/ghi được gì thuộc về mình khi đăng nhập lại:
-- current_profile_id() vẫn trả mã, nên việc khóa được thực hiện ở máy chủ bằng cách vô hiệu hóa
-- tài khoản đăng nhập (Supabase Auth: ban user). Cột disabled_at chỉ để hiển thị và loại khỏi vai trò.
