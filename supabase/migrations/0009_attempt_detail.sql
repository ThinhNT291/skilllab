-- Chi tiết mỗi lần chấm Viết/Nói để theo dõi điểm yếu lặp lại: bậc từng tiêu chí, thẻ lỗi, số lỗi theo loại.
-- Chạy trong Supabase > SQL Editor (chạy lại được nhiều lần). Vẫn KHÔNG lưu bài làm hay bản ghi âm.
alter table public.graded_attempts add column if not exists detail jsonb;
