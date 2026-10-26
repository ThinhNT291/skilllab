-- Bộ đếm hoạt động theo ngày (bước A của docs/tong-hop-tien-do.md). Chạy trong Supabase > SQL Editor (chạy lại được nhiều lần).
--
-- Vì sao: chuỗi ngày, bản đồ nhiệt, tỷ lệ đúng theo tuần và tóm tắt lớp từng phải kéo hàng nghìn dòng `answers` về trình duyệt rồi
-- tính ở đó, nên bị cắt khi học sinh làm nhiều (tóm tắt lớp 7 ngày chỉ đọc tối đa 10.000 dòng của cả lớp). Mỗi dòng `answers` mới nay cộng
-- ngay vào `daily_activity` (một dòng mỗi học sinh mỗi ngày). Không có bước "chốt" nào; con số luôn đúng ngay lúc ghi.
--
-- `answers` vẫn là nguồn sự thật và không bị xóa. Ngày tính theo giờ Việt Nam (Asia/Ho_Chi_Minh), không phụ thuộc máy học sinh.
-- Nạp lại từ `answers` bất cứ lúc nào bằng đoạn "Nạp lại" ở cuối tệp (hoặc chạy lại cả tệp); kiểm tra lệch bằng câu truy vấn cuối tệp.

create or replace function public.vn_day(ts timestamptz)
returns date
language sql
immutable
as $$ select (ts at time zone 'Asia/Ho_Chi_Minh')::date $$;

create table if not exists public.daily_activity (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  day        date not null,
  answers    integer not null default 0 check (answers >= 0),
  correct    integer not null default 0 check (correct >= 0 and correct <= answers),
  primary key (profile_id, day)
);
create index if not exists daily_activity_day_idx on public.daily_activity (day);

-- Cộng/trừ khi chèn/xóa dòng `answers` (xóa xảy ra khi quản trị đặt lại dữ liệu một học sinh). Chạy với quyền chủ bảng để học sinh không phải có quyền ghi bảng này.
create or replace function public.bump_daily_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.daily_activity (profile_id, day, answers, correct)
    values (new.profile_id, public.vn_day(new.created_at), 1, case when new.correct then 1 else 0 end)
    on conflict (profile_id, day) do update
      set answers = public.daily_activity.answers + 1,
          correct = public.daily_activity.correct + case when new.correct then 1 else 0 end;
    return new;
  else
    update public.daily_activity
      set answers = greatest(0, answers - 1),
          correct = greatest(0, correct - case when old.correct then 1 else 0 end)
      where profile_id = old.profile_id and day = public.vn_day(old.created_at);
    delete from public.daily_activity where profile_id = old.profile_id and day = public.vn_day(old.created_at) and answers = 0;
    return old;
  end if;
end;
$$;

drop trigger if exists answers_bump_daily on public.answers;
create trigger answers_bump_daily after insert or delete on public.answers
  for each row execute function public.bump_daily_activity();

-- Quyền đọc: học sinh đọc của mình; giáo viên/quản trị đọc của học sinh được phép xem. Không có chính sách ghi: chỉ trigger ghi.
alter table public.daily_activity enable row level security;

drop policy if exists "daily_activity_select_own" on public.daily_activity;
create policy "daily_activity_select_own" on public.daily_activity for select to authenticated using (profile_id = public.current_profile_id());

drop policy if exists "daily_activity_select_staff" on public.daily_activity;
create policy "daily_activity_select_staff" on public.daily_activity for select to authenticated using (public.can_view_profile(profile_id));

-- Nạp lại từ `answers` (đặt giá trị đúng theo dữ liệu thô; chạy lại an toàn).
insert into public.daily_activity (profile_id, day, answers, correct)
select profile_id, public.vn_day(created_at), count(*)::int, (count(*) filter (where correct))::int
from public.answers
group by profile_id, public.vn_day(created_at)
on conflict (profile_id, day) do update set answers = excluded.answers, correct = excluded.correct;
-- Xóa dòng đếm mà dữ liệu thô không còn (sau khi dữ liệu bị xóa tay).
delete from public.daily_activity d
where not exists (select 1 from public.answers a where a.profile_id = d.profile_id and public.vn_day(a.created_at) = d.day);

-- Kiểm tra lệch (kỳ vọng 0 dòng): tổng bộ đếm phải bằng số dòng thô của từng học sinh.
--   select a.profile_id, a.n as raw, coalesce(d.n, 0) as counted
--   from (select profile_id, count(*) n from public.answers group by 1) a
--   left join (select profile_id, sum(answers) n from public.daily_activity group by 1) d using (profile_id)
--   where a.n <> coalesce(d.n, 0);
