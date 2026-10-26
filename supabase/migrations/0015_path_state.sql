-- Điểm bắt đầu của Lộ trình (docs/lo-trinh-va-xep-bac.md): từ bài xếp trình độ tổng hợp hoặc bài vượt cấp (đúng hết 20 câu).
-- Chạy trong Supabase > SQL Editor (chạy lại được nhiều lần). Một dòng mỗi hồ sơ; điểm bắt đầu CHỈ TĂNG, không bao giờ tự hạ.
-- Ghi qua hàm raise_path_start (security definer, tự lấy hồ sơ của người gọi và kiểm tra giá trị).

create table if not exists public.path_state (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  start_bac  smallint not null check (start_bac between 1 and 6),
  start_step smallint not null check (start_step between 1 and 5),
  source     text not null check (source in ('placement', 'leap')),
  updated_at timestamptz not null default now()
);

alter table public.path_state enable row level security;

drop policy if exists "path_state_select_own" on public.path_state;
create policy "path_state_select_own" on public.path_state for select to authenticated using (profile_id = public.current_profile_id());

drop policy if exists "path_state_select_staff" on public.path_state;
create policy "path_state_select_staff" on public.path_state for select to authenticated using (public.can_view_profile(profile_id));

create or replace function public.raise_path_start(p_bac integer, p_step integer, p_source text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare pid uuid := public.current_profile_id();
begin
  if pid is null then raise exception 'no_profile'; end if;
  if p_bac is null or p_bac < 1 or p_bac > 6 or p_step is null or p_step < 1 or p_step > 5 or p_source not in ('placement', 'leap') then
    raise exception 'bad_start';
  end if;
  insert into public.path_state as t (profile_id, start_bac, start_step, source)
  values (pid, p_bac, p_step, p_source)
  on conflict (profile_id) do update set
    start_bac = excluded.start_bac, start_step = excluded.start_step, source = excluded.source, updated_at = now()
  where (excluded.start_bac - 1) * 5 + excluded.start_step > (t.start_bac - 1) * 5 + t.start_step;
end;
$$;

revoke all on function public.raise_path_start(integer, integer, text) from public;
grant execute on function public.raise_path_start(integer, integer, text) to authenticated;
