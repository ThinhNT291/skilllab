-- Lộ trình một con đường: kết quả từng bài (docs/lo-trinh-va-xep-bac.md mục 4, 8). Chạy trong Supabase > SQL Editor (chạy lại được nhiều lần).
--
-- Một dòng mỗi (hồ sơ, bài). `lesson_id` là mã bài do ứng dụng sinh từ nội dung (vd g.present-simple.b2, v.b1.p3, r.rd-b2-001), không có
-- khóa ngoại vì nội dung nằm trong tệp. Trạng thái nấc (xong/hiện tại/thử sức/bỏ qua) KHÔNG lưu: tính lại từ các dòng này.
-- Ghi qua hàm record_path_lesson để `best_ratio` chỉ tăng và `first_passed_at` ghi một lần.

create table if not exists public.path_lessons (
  profile_id      uuid not null references public.profiles (id) on delete cascade,
  lesson_id       text not null check (length(lesson_id) between 3 and 120),
  best_ratio      numeric(4, 3) not null check (best_ratio between 0 and 1),
  last_ratio      numeric(4, 3) not null check (last_ratio between 0 and 1),
  attempts        integer not null default 1 check (attempts >= 1),
  first_passed_at timestamptz,
  updated_at      timestamptz not null default now(),
  primary key (profile_id, lesson_id)
);

alter table public.path_lessons enable row level security;

drop policy if exists "path_lessons_select_own" on public.path_lessons;
create policy "path_lessons_select_own" on public.path_lessons for select to authenticated using (profile_id = public.current_profile_id());

drop policy if exists "path_lessons_select_staff" on public.path_lessons;
create policy "path_lessons_select_staff" on public.path_lessons for select to authenticated using (public.can_view_profile(profile_id));

-- Không cho ghi trực tiếp: chỉ qua hàm dưới (security definer, tự lấy hồ sơ của người gọi).
create or replace function public.record_path_lesson(p_lesson_id text, p_correct integer, p_total integer, p_pass_ratio numeric default 0.7)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  pid uuid := public.current_profile_id();
  ratio numeric;
begin
  if pid is null then raise exception 'no_profile'; end if;
  if p_total is null or p_total < 1 or p_total > 100 or p_correct is null or p_correct < 0 or p_correct > p_total then
    raise exception 'bad_result';
  end if;
  ratio := round(p_correct::numeric / p_total, 3);
  insert into public.path_lessons as t (profile_id, lesson_id, best_ratio, last_ratio, first_passed_at)
  values (pid, p_lesson_id, ratio, ratio, case when ratio >= p_pass_ratio then now() end)
  on conflict (profile_id, lesson_id) do update set
    best_ratio = greatest(t.best_ratio, excluded.best_ratio),
    last_ratio = excluded.last_ratio,
    attempts = t.attempts + 1,
    first_passed_at = coalesce(t.first_passed_at, excluded.first_passed_at),
    updated_at = now();
end;
$$;

revoke all on function public.record_path_lesson(text, integer, integer, numeric) from public;
grant execute on function public.record_path_lesson(text, integer, integer, numeric) to authenticated;
