# Bộ bài mẫu để đo chấm Viết

`grade-samples.example.json` chỉ minh họa ĐỊNH DẠNG (các mẫu có `"example": true` và điểm KHÔNG phải do người chấm thật; script từ chối chạy
trừ khi thêm `--allow-example`). Để dùng thật:

1. Gom khoảng 30 bài viết của học sinh (đã xóa thông tin cá nhân), trải đều các bậc 1–5, độ dài khác nhau.
2. Một hoặc hai giáo viên chấm độc lập theo đúng thang 4 tiêu chí × 0–4 ở `src/lib/rubric.ts` (mô tả từng mức điểm ở `DESCRIPTORS`), ghi `human.scores` và `human.bac`.
   Hai người chấm khác nhau nhiều thì bàn lại trước khi dùng làm chuẩn.
3. Lưu thành `eval/grade-samples.json` (đừng đẩy lên git nếu có bài viết thật của học sinh).
4. `node scripts/grade-eval.mjs eval/grade-samples.json` rồi so các chỉ số với lần chạy trước mỗi khi sửa lời nhắc.

Chỉ số: tỷ lệ khớp hoàn toàn và lệch ≤ 1 điểm, độ lệch trung bình (dương = máy chấm cao hơn người), kappa có trọng số bình phương.
Bộ mẫu nhỏ thì chỉ số dao động nhiều; hãy chạy `--runs 3` để xem độ ổn định của chính máy chấm.
