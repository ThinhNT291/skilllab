-- Cài đặt theo tài khoản và chống ghi trùng câu trả lời. Chạy trong Supabase > SQL Editor (chạy lại được nhiều lần).
--
-- 1) profile_settings: cài đặt giao diện/học tập và kỷ lục game lưu theo hồ sơ (trước đây chỉ nằm ở trình duyệt, đổi máy là mất).
--    Cột `settings` là JSON do ứng dụng kiểm tra và làm sạch khi đọc; `updated_at` chỉ để tham khảo (ứng dụng so thời điểm sửa nằm trong JSON).
-- 2) answers.client_id: mã do trình duyệt tạo cho mỗi lượt trả lời để ghi lại an toàn khi mạng lỗi (hàng đợi ghi lại): lần ghi thứ hai
--    cùng mã bị bỏ qua, không thành hai dòng. Dòng cũ không có mã (NULL), các NULL không trùng nhau.

create table if not exists public.profile_settings (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  settings   jsonb not null default '{}'::jsonb check (jsonb_typeof(settings) = 'object' and pg_column_size(settings) < 8192),
  updated_at timestamptz not null default now()
);

alter table public.profile_settings enable row level security;

drop policy if exists "profile_settings_select_own" on public.profile_settings;
create policy "profile_settings_select_own" on public.profile_settings for select to authenticated using (profile_id = public.current_profile_id());

drop policy if exists "profile_settings_insert_own" on public.profile_settings;
create policy "profile_settings_insert_own" on public.profile_settings for insert to authenticated with check (profile_id = public.current_profile_id());

drop policy if exists "profile_settings_update_own" on public.profile_settings;
create policy "profile_settings_update_own" on public.profile_settings for update to authenticated
  using (profile_id = public.current_profile_id()) with check (profile_id = public.current_profile_id());

alter table public.answers add column if not exists client_id uuid;
create unique index if not exists answers_client_id_key on public.answers (client_id);
