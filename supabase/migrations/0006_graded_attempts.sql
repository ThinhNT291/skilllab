-- Lịch sử bài Viết/Nói đã chấm. Chạy trong Supabase > SQL Editor (chạy lại được nhiều lần).
-- Chỉ lưu điểm và nhận xét ngắn, KHÔNG lưu bài viết đầy đủ hay bản ghi âm (dữ liệu của trẻ vị thành niên).

create table if not exists public.graded_attempts (
  id            bigint generated always as identity primary key,
  profile_id    uuid not null references public.profiles (id) on delete cascade,
  skill         text not null check (skill in ('writing', 'speaking')),
  task_id       text not null,
  target_bac    smallint not null check (target_bac between 1 and 6),
  total         numeric(3, 1) not null check (total between 0 and 10),
  estimated_bac smallint not null check (estimated_bac between 0 and 6),
  scores        jsonb not null,
  note          text,
  created_at    timestamptz not null default now()
);

create index if not exists graded_attempts_profile_idx on public.graded_attempts (profile_id, skill, created_at desc);

alter table public.graded_attempts enable row level security;

drop policy if exists "attempts_select_own" on public.graded_attempts;
create policy "attempts_select_own" on public.graded_attempts
  for select to authenticated using (profile_id = public.current_profile_id());

drop policy if exists "attempts_insert_own" on public.graded_attempts;
create policy "attempts_insert_own" on public.graded_attempts
  for insert to authenticated with check (profile_id = public.current_profile_id());

drop policy if exists "attempts_delete_own" on public.graded_attempts;
create policy "attempts_delete_own" on public.graded_attempts
  for delete to authenticated using (profile_id = public.current_profile_id());
