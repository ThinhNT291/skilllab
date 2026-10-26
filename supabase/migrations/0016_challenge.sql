-- Phòng thử thách (docs/lo-trinh-va-xep-bac.md mục 2): lịch sử các lần thử và nguồn điểm bắt đầu mới 'challenge'.
-- Chạy trong Supabase > SQL Editor SAU 0015 (chạy lại được nhiều lần).
--
-- Mỗi lần thử một dòng. `verdict` do ứng dụng tính (up / stay / review), CHỈ để đề xuất: một lần tệ không hạ bậc;
-- hai lần "up" ở hai ngày khác nhau mới nâng điểm bắt đầu (tính ở ứng dụng, src/lib/path/challenge.ts, rồi gọi raise_path_start).

create table if not exists public.challenge_attempts (
  id          bigint generated always as identity primary key,
  profile_id  uuid not null references public.profiles (id) on delete cascade,
  bac         smallint not null check (bac between 1 and 6),
  correct     smallint not null check (correct >= 0),
  total       smallint not null check (total between 1 and 60),
  seconds     integer not null check (seconds between 0 and 7200),
  skills      jsonb not null default '[]'::jsonb check (jsonb_typeof(skills) = 'array' and pg_column_size(skills) < 4096),
  verdict     text not null check (verdict in ('up', 'stay', 'review')),
  created_at  timestamptz not null default now(),
  check (correct <= total)
);

create index if not exists challenge_attempts_profile_idx on public.challenge_attempts (profile_id, bac, created_at desc);

alter table public.challenge_attempts enable row level security;

drop policy if exists "challenge_select_own" on public.challenge_attempts;
create policy "challenge_select_own" on public.challenge_attempts for select to authenticated using (profile_id = public.current_profile_id());

drop policy if exists "challenge_select_staff" on public.challenge_attempts;
create policy "challenge_select_staff" on public.challenge_attempts for select to authenticated using (public.can_view_profile(profile_id));

-- Ghi qua hàm (kiểm tra giá trị, tự lấy hồ sơ của người gọi).
create or replace function public.record_challenge_attempt(p_bac integer, p_correct integer, p_total integer, p_seconds integer, p_skills jsonb, p_verdict text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare pid uuid := public.current_profile_id();
begin
  if pid is null then raise exception 'no_profile'; end if;
  if p_bac is null or p_bac < 1 or p_bac > 6 or p_total is null or p_total < 1 or p_total > 60 or p_correct is null or p_correct < 0 or p_correct > p_total
     or p_seconds is null or p_seconds < 0 or p_seconds > 7200 or p_verdict not in ('up', 'stay', 'review') or jsonb_typeof(p_skills) <> 'array' then
    raise exception 'bad_attempt';
  end if;
  insert into public.challenge_attempts (profile_id, bac, correct, total, seconds, skills, verdict)
  values (pid, p_bac, p_correct, p_total, p_seconds, p_skills, p_verdict);
end;
$$;

revoke all on function public.record_challenge_attempt(integer, integer, integer, integer, jsonb, text) from public;
grant execute on function public.record_challenge_attempt(integer, integer, integer, integer, jsonb, text) to authenticated;

-- Nguồn điểm bắt đầu thêm 'challenge' (hai bài thử thách tốt ở hai ngày khác nhau).
alter table public.path_state drop constraint if exists path_state_source_check;
alter table public.path_state add constraint path_state_source_check check (source in ('placement', 'leap', 'challenge'));

create or replace function public.raise_path_start(p_bac integer, p_step integer, p_source text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare pid uuid := public.current_profile_id();
begin
  if pid is null then raise exception 'no_profile'; end if;
  if p_bac is null or p_bac < 1 or p_bac > 6 or p_step is null or p_step < 1 or p_step > 5 or p_source not in ('placement', 'leap', 'challenge') then
    raise exception 'bad_start';
  end if;
  insert into public.path_state as t (profile_id, start_bac, start_step, source)
  values (pid, p_bac, p_step, p_source)
  on conflict (profile_id) do update set
    start_bac = excluded.start_bac, start_step = excluded.start_step, source = excluded.source, updated_at = now()
  where (excluded.start_bac - 1) * 5 + excluded.start_step > (t.start_bac - 1) * 5 + t.start_step;
end;
$$;
