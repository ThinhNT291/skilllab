-- Thẻ ôn tập ngắt quãng (SRS), tự tạo từ câu trả lời sai. Chạy trong Supabase > SQL Editor (chạy lại được nhiều lần).
-- Mỗi (hồ sơ, nguồn) chỉ có một thẻ: sai lại đúng câu cũ không tạo thẻ trùng.

create table if not exists public.srs_cards (
  id               uuid primary key default gen_random_uuid(),
  profile_id       uuid not null references public.profiles (id) on delete cascade,
  source_key       text not null,                 -- ví dụ: grammar-present-simple-en-present-simple-004
  kind             text not null default 'grammar',
  topic            text not null,
  usage_id         text,
  front            text not null,                 -- đề bài (còn chỗ trống)
  answer           text not null,                 -- đáp án đúng
  filled           text,                          -- câu hoàn chỉnh khi điền đáp án vào chỗ trống
  explanation      text,
  due_at           timestamptz not null default now(),
  interval_days    integer not null default 0,
  ease             numeric(4,2) not null default 2.5,
  reps             integer not null default 0,
  lapses           integer not null default 0,
  status           text not null default 'active' check (status in ('active', 'mastered')),
  created_at       timestamptz not null default now(),
  last_reviewed_at timestamptz,
  unique (profile_id, source_key)
);

create index if not exists srs_cards_due_idx on public.srs_cards (profile_id, status, due_at);

alter table public.srs_cards enable row level security;

drop policy if exists "srs_select_own" on public.srs_cards;
create policy "srs_select_own" on public.srs_cards
  for select to authenticated using (profile_id = public.current_profile_id());

drop policy if exists "srs_insert_own" on public.srs_cards;
create policy "srs_insert_own" on public.srs_cards
  for insert to authenticated with check (profile_id = public.current_profile_id());

drop policy if exists "srs_update_own" on public.srs_cards;
create policy "srs_update_own" on public.srs_cards
  for update to authenticated
  using (profile_id = public.current_profile_id())
  with check (profile_id = public.current_profile_id());
