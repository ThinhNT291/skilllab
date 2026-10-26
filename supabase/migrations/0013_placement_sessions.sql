-- Bài xếp trình độ tổng hợp (36 câu): lưu dở dang và kết quả. Chạy trong Supabase > SQL Editor (chạy lại được nhiều lần).
--
-- Một dòng mỗi lần làm. `state` là trạng thái đang làm (khối đã xong, câu đã trả lời, mã câu đã dùng) do ứng dụng kiểm tra khi đọc;
-- `result` là kết quả khi xong (bậc từng kỹ năng, bậc tổng, danh sách câu đã làm kèm đúng/sai để lần sau tránh lặp, trừ câu từng sai).
-- Chỉ tài khoản thật mới lưu dở dang (giao diện bỏ qua với tài khoản ẩn danh).
--
-- Quy tắc: mỗi hồ sơ chỉ có MỘT lần đang làm; làm xong phải cách ít nhất 14 ngày mới bắt đầu lần mới (khớp RETAKE_GAP_DAYS ở
-- src/lib/placement/full.ts). Quản trị đặt lại bằng chức năng "Đặt lại dữ liệu học" (xóa các dòng này).

create table if not exists public.placement_sessions (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid not null references public.profiles (id) on delete cascade,
  status       text not null default 'in_progress' check (status in ('in_progress', 'completed', 'abandoned')),
  state        jsonb not null default '{}'::jsonb check (jsonb_typeof(state) = 'object' and pg_column_size(state) < 32768),
  result       jsonb check (result is null or (jsonb_typeof(result) = 'object' and pg_column_size(result) < 32768)),
  started_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  completed_at timestamptz
);

create unique index if not exists placement_one_active on public.placement_sessions (profile_id) where status = 'in_progress';
create index if not exists placement_profile_idx on public.placement_sessions (profile_id, started_at desc);

create or replace function public.placement_gap_guard()
returns trigger
language plpgsql
as $$
declare last_done timestamptz;
begin
  select max(completed_at) into last_done from public.placement_sessions where profile_id = new.profile_id and status = 'completed';
  if last_done is not null and last_done > now() - interval '14 days' then
    raise exception 'placement_too_soon' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists placement_gap_guard_insert on public.placement_sessions;
create trigger placement_gap_guard_insert before insert on public.placement_sessions
  for each row execute function public.placement_gap_guard();

alter table public.placement_sessions enable row level security;

drop policy if exists "placement_select_own" on public.placement_sessions;
create policy "placement_select_own" on public.placement_sessions for select to authenticated using (profile_id = public.current_profile_id());

drop policy if exists "placement_insert_own" on public.placement_sessions;
create policy "placement_insert_own" on public.placement_sessions for insert to authenticated with check (profile_id = public.current_profile_id());

drop policy if exists "placement_update_own" on public.placement_sessions;
create policy "placement_update_own" on public.placement_sessions for update to authenticated
  using (profile_id = public.current_profile_id()) with check (profile_id = public.current_profile_id());

drop policy if exists "placement_select_staff" on public.placement_sessions;
create policy "placement_select_staff" on public.placement_sessions for select to authenticated using (public.can_view_profile(profile_id));
