-- FSRS (thuật toán ôn cách quãng dựa trên mô hình trí nhớ), chạy song song với SM-2. Chạy trong Supabase > SQL Editor (chạy lại được nhiều lần).
-- Mỗi lượt ôn cập nhật CẢ HAI bộ trường (SM-2: interval_days/ease/reps/lapses; FSRS: stability/difficulty/fsrs_state);
-- thuật toán đang chọn (cài đặt trên máy học sinh) quyết định due_at. Nhờ vậy đổi qua lại không mất dữ liệu.
-- srs_reviews ghi từng lượt ôn (xác suất nhớ dự đoán lúc ôn, kết quả thật, khoảng cách của từng thuật toán) để sau này so sánh bằng số liệu thật.

alter table public.srs_cards add column if not exists stability   real;
alter table public.srs_cards add column if not exists difficulty  real;
-- 0 = mới, 1 = đang học, 2 = ôn tập, 3 = học lại (theo FSRS)
alter table public.srs_cards add column if not exists fsrs_state  smallint not null default 0 check (fsrs_state between 0 and 3);

create table if not exists public.srs_reviews (
  id                bigint generated always as identity primary key,
  card_id           uuid not null references public.srs_cards (id) on delete cascade,
  profile_id        uuid not null references public.profiles (id) on delete cascade,
  reviewed_at       timestamptz not null default now(),
  rating            smallint not null check (rating between 1 and 4),      -- 1 Lại, 2 Khó, 3 Tốt, 4 Dễ
  algorithm         text not null check (algorithm in ('fsrs', 'sm2')),    -- thuật toán đang quyết định lịch lúc đó
  elapsed_days      real,                                                  -- số ngày thật kể từ lần ôn trước (null nếu lần đầu)
  retrievability    real check (retrievability is null or retrievability between 0 and 1), -- xác suất nhớ FSRS dự đoán ngay trước khi ôn
  scheduled_days    real not null,                                         -- khoảng cách đã hẹn theo thuật toán đang chọn
  fsrs_days         real,                                                  -- khoảng cách FSRS sẽ hẹn
  sm2_days          real                                                   -- khoảng cách SM-2 sẽ hẹn
);
create index if not exists srs_reviews_profile_idx on public.srs_reviews (profile_id, reviewed_at desc);

alter table public.srs_reviews enable row level security;

drop policy if exists "srs_reviews_select_own" on public.srs_reviews;
create policy "srs_reviews_select_own" on public.srs_reviews for select to authenticated using (profile_id = public.current_profile_id());

drop policy if exists "srs_reviews_insert_own" on public.srs_reviews;
create policy "srs_reviews_insert_own" on public.srs_reviews for insert to authenticated with check (profile_id = public.current_profile_id());

drop policy if exists "srs_reviews_select_staff" on public.srs_reviews;
create policy "srs_reviews_select_staff" on public.srs_reviews for select to authenticated using (public.can_view_profile(profile_id));
