-- Kho nội dung học tập trong cơ sở dữ liệu (giai đoạn 1: bản sao có kiểm soát của các tệp trong src/content).
-- Chạy trong Supabase > SQL Editor (chạy lại được nhiều lần). Cần đã chạy 0007 (bảng languages, hàm is_admin).
--
-- Một bảng chung cho mọi loại nội dung để dễ sao lưu, đối chiếu và gắn thêm module mới:
--   collection: exercise (câu bài tập), theory (lý thuyết một chuyên đề), theory_index (danh mục chuyên đề),
--               reading, listening, vocab (một từ), vocab_topics (phân chủ đề từ vựng), collocation (một bộ cụm từ)
-- Nội dung nằm trong cột data (jsonb) đúng như tệp JSON. content_hash giúp biết tệp và cơ sở dữ liệu đã khớp chưa.
-- Ghi: chỉ quản trị hoặc service_role (script scripts/content-sync.mjs). Đọc: mọi người đã đăng nhập (kể cả học thử ẩn danh).
-- Mỗi lần sửa/xóa một mục, bản cũ được lưu vào content_revisions để khôi phục.

create table if not exists public.content_items (
  id            text primary key,
  collection    text not null check (collection in ('exercise', 'theory', 'theory_index', 'reading', 'listening', 'vocab', 'vocab_topics', 'collocation')),
  language_code text not null default 'en' references public.languages (code),
  topic         text,
  bac           smallint check (bac is null or bac between 0 and 6),
  sort          integer not null default 0,
  data          jsonb not null,
  content_hash  text not null,
  active        boolean not null default true,
  updated_at    timestamptz not null default now()
);
create index if not exists content_items_lookup_idx on public.content_items (collection, language_code, topic, sort);

create table if not exists public.content_revisions (
  id           bigint generated always as identity primary key,
  item_id      text not null,
  data         jsonb not null,
  content_hash text not null,
  op           text not null check (op in ('update', 'delete')),
  changed_at   timestamptz not null default now()
);
create index if not exists content_revisions_item_idx on public.content_revisions (item_id, changed_at desc);

-- security definer: người sửa (quản trị) không có quyền ghi trực tiếp vào content_revisions, hàm này ghi thay.
create or replace function public.content_items_keep_revision()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' then
    if old.content_hash is distinct from new.content_hash then
      insert into public.content_revisions (item_id, data, content_hash, op) values (old.id, old.data, old.content_hash, 'update');
    end if;
    new.updated_at = now();
    return new;
  end if;
  insert into public.content_revisions (item_id, data, content_hash, op) values (old.id, old.data, old.content_hash, 'delete');
  return old;
end;
$$;

drop trigger if exists content_items_revision on public.content_items;
create trigger content_items_revision
  before update or delete on public.content_items
  for each row execute function public.content_items_keep_revision();

alter table public.content_items enable row level security;
alter table public.content_revisions enable row level security;

drop policy if exists "content_items_select" on public.content_items;
create policy "content_items_select" on public.content_items for select to authenticated using (active or public.is_admin());

drop policy if exists "content_items_write_admin" on public.content_items;
create policy "content_items_write_admin" on public.content_items for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "content_revisions_select_admin" on public.content_revisions;
create policy "content_revisions_select_admin" on public.content_revisions for select to authenticated using (public.is_admin());
