-- Nháp nội dung sinh bằng Gemini để quản trị duyệt (docs/quan-ly-noi-dung-tren-giao-dien.md). Chạy trong Supabase > SQL Editor
-- (chạy lại được nhiều lần). CHỈ quản trị đọc và ghi (RLS qua public.is_admin()). Nháp KHÔNG phải nội dung học sinh thấy:
-- nội dung học vẫn nằm ở src/content; mục đã duyệt được xuất thành tệp rồi gộp vào repo.

create table if not exists public.content_batches (
  id             uuid primary key default gen_random_uuid(),
  kind           text not null check (kind in ('grammar', 'reading', 'listening')),
  topic          text,
  bac            smallint not null check (bac between 1 and 6),
  model          text not null check (length(model) <= 80),
  prompt_version text not null check (length(prompt_version) <= 80),
  blind_runs     smallint check (blind_runs is null or blind_runs between 1 and 8),
  -- {kept, rejectedByCode, duplicates}: số câu giữ lại / bị loại bằng mã / bị loại vì trùng, để tính tỷ lệ qua kiểm bằng mã
  counts         jsonb not null default '{}'::jsonb check (jsonb_typeof(counts) = 'object'),
  source         text not null default 'import' check (source in ('import', 'ui')),
  created_by     uuid references public.profiles (id) on delete set null,
  created_at     timestamptz not null default now()
);

create table if not exists public.content_drafts (
  id            uuid primary key default gen_random_uuid(),
  batch_id      uuid not null references public.content_batches (id) on delete cascade,
  item_id       text not null check (length(item_id) between 1 and 80),
  kind          text not null check (kind in ('grammar', 'reading', 'listening')),
  topic         text not null,
  bac           smallint not null check (bac between 1 and 6),
  data          jsonb not null check (jsonb_typeof(data) = 'object' and pg_column_size(data) < 65536),
  meta          jsonb check (meta is null or jsonb_typeof(meta) = 'object'),
  blind         jsonb check (blind is null or jsonb_typeof(blind) = 'object'),
  status        text not null default 'generated' check (status in ('generated', 'review_failed', 'review_passed', 'approved', 'rejected')),
  reject_reason text check (reject_reason is null or length(reject_reason) <= 200),
  decided_by    uuid references public.profiles (id) on delete set null,
  decided_at    timestamptz,
  created_at    timestamptz not null default now(),
  unique (batch_id, item_id)
);

create index if not exists content_drafts_batch_idx on public.content_drafts (batch_id, status);
create index if not exists content_drafts_status_idx on public.content_drafts (status, created_at desc);

alter table public.content_batches enable row level security;
alter table public.content_drafts enable row level security;

drop policy if exists "content_batches_admin" on public.content_batches;
create policy "content_batches_admin" on public.content_batches for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "content_drafts_admin" on public.content_drafts;
create policy "content_drafts_admin" on public.content_drafts for all to authenticated using (public.is_admin()) with check (public.is_admin());
