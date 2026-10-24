-- Kết quả bài kiểm tra cuối chủ điểm. Chạy trong Supabase > SQL Editor (chạy lại được nhiều lần).
-- Mỗi lần làm bài là một dòng; "đã vượt qua" = có ít nhất một dòng passed = true.

create table if not exists public.topic_tests (
  id         bigint generated always as identity primary key,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  topic      text not null,
  correct    integer not null check (correct >= 0),
  total      integer not null check (total > 0),
  passed     boolean not null,
  created_at timestamptz not null default now()
);

create index if not exists topic_tests_profile_idx on public.topic_tests (profile_id, topic);

alter table public.topic_tests enable row level security;

drop policy if exists "tests_select_own" on public.topic_tests;
create policy "tests_select_own" on public.topic_tests
  for select to authenticated using (profile_id = public.current_profile_id());

drop policy if exists "tests_insert_own" on public.topic_tests;
create policy "tests_insert_own" on public.topic_tests
  for insert to authenticated with check (profile_id = public.current_profile_id());
