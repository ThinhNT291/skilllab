-- Khởi tạo dữ liệu người học: hồ sơ (profiles) và lịch sử trả lời (answers).
-- Chạy trong Supabase > SQL Editor (dán toàn bộ tệp này rồi Run). Chạy lại được nhiều lần.
--
-- Thiết kế để dễ chuyển nền tảng: bảng dữ liệu chỉ tham chiếu profiles.id (mã của ứng dụng),
-- không tham chiếu thẳng vào hệ đăng nhập. Chỗ DUY NHẤT gắn với đăng nhập Supabase là cột
-- profiles.auth_user_id và hàm current_profile_id() (dùng auth.uid()). Đổi hệ đăng nhập
-- sau này chỉ cần sửa hai chỗ đó.

create table if not exists public.profiles (
  id           uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique,
  nickname     text check (nickname is null or char_length(nickname) between 1 and 30),
  role         text not null default 'student' check (role in ('student', 'teacher', 'admin')),
  created_at   timestamptz not null default now()
);

create table if not exists public.answers (
  id           bigint generated always as identity primary key,
  profile_id   uuid not null references public.profiles (id) on delete cascade,
  exercise_id  text not null,
  topic        text not null,
  tags         text[] not null default '{}',
  correct      boolean not null,
  choice_index integer,
  created_at   timestamptz not null default now()
);

create index if not exists answers_profile_created_idx on public.answers (profile_id, created_at desc);
create index if not exists answers_profile_topic_idx on public.answers (profile_id, topic);

-- Hàm duy nhất ánh xạ người đăng nhập hiện tại sang mã hồ sơ của ứng dụng.
create or replace function public.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.profiles where auth_user_id = auth.uid()
$$;

alter table public.profiles enable row level security;
alter table public.answers enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select to authenticated using (auth_user_id = auth.uid());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check (auth_user_id = auth.uid() and role = 'student');

-- Người dùng chỉ được đổi biệt danh. Quyền ghi cột role bị thu hồi nên không tự nâng quyền được
-- (admin/teacher do quản trị đặt bằng khóa service_role hoặc trong SQL Editor).
revoke update on public.profiles from authenticated;
grant update (nickname) on public.profiles to authenticated;

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (auth_user_id = auth.uid())
  with check (auth_user_id = auth.uid());

drop policy if exists "answers_select_own" on public.answers;
create policy "answers_select_own" on public.answers
  for select to authenticated using (profile_id = public.current_profile_id());

drop policy if exists "answers_insert_own" on public.answers;
create policy "answers_insert_own" on public.answers
  for insert to authenticated with check (profile_id = public.current_profile_id());
