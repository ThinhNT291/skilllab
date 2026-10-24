-- Cho phép học sinh xóa thẻ ôn tập của chính mình (màn quản lý thẻ). Chạy trong Supabase > SQL Editor (chạy lại được nhiều lần).
drop policy if exists "srs_delete_own" on public.srs_cards;
create policy "srs_delete_own" on public.srs_cards
  for delete to authenticated using (profile_id = public.current_profile_id());
