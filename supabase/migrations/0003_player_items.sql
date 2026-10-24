-- Vật phẩm trang trí linh vật mà học sinh đã mua. Chạy trong Supabase > SQL Editor (chạy lại được nhiều lần).
-- XP, cấp độ, xu và huy hiệu KHÔNG lưu: tính lại từ bảng answers. Bảng này chỉ nhớ "đã mua gì, đang đeo gì".
-- Lưu ý: giá được kiểm ở phía trình duyệt; đây là xu trong game không có giá trị thật nên chưa cần chặn gian lận.

create table if not exists public.player_items (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  item_id    text not null,
  equipped   boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (profile_id, item_id)
);

alter table public.player_items enable row level security;

drop policy if exists "items_select_own" on public.player_items;
create policy "items_select_own" on public.player_items
  for select to authenticated using (profile_id = public.current_profile_id());

drop policy if exists "items_insert_own" on public.player_items;
create policy "items_insert_own" on public.player_items
  for insert to authenticated with check (profile_id = public.current_profile_id());

drop policy if exists "items_update_own" on public.player_items;
create policy "items_update_own" on public.player_items
  for update to authenticated
  using (profile_id = public.current_profile_id())
  with check (profile_id = public.current_profile_id());
