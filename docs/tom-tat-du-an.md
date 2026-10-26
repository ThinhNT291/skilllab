# Tóm tắt dự án để tiếp tục ở cuộc trò chuyện khác (26/10/2026)

**Là gì:** Training Zone / skilllab, web học và luyện tiếng Anh có chấm điểm cho học sinh Việt Nam lớp 4–9 (9–15 tuổi). Next.js 16.4 + React 19 + Tailwind 4 + Supabase + Vercel. Repo `ThinhNT291/skilllab`, nhánh làm việc `claude/improve-exercises-n2fs1t` (không tự tạo PR). Đọc `CLAUDE.md` (bộ nhớ chính), `ROADMAP.md`, `README.md`.

**Đã có (tóm tắt):** 40 chuyên đề ngữ pháp 2.010 câu (A1–C2), đọc hiểu và nghe hiểu Bậc 1–6 (14 bài/bậc), từ vựng A1–C2 (3.179 từ), cụm từ kết hợp, SRS (FSRS + SM-2), Viết/Nói chấm bằng Gemini, game (ghép cặp, chạy đua, nghe-gõ, trùm cuối, thử thách 60 giây), hồ sơ năng lực + ước lượng bậc (Elo), luyện thích ứng/xen kẽ, xếp trình độ (ngữ pháp, từ vựng, đọc, nghe), tiến độ theo thang A1–C2, bản đồ chặng ở `/hoc`, tài khoản + phân quyền + quản lý lớp, nội dung có bản sao trong DB.

**Việc tiếp theo đã chốt:** soạn thêm nội dung C2 thật → placement bậc cao → từ vựng C1/C2 theo chủ đề; chủ dự án duyệt/đối chiếu nguồn (`docs/noi-dung-bac5-6.md`).

**Để sau hẳn:** CAPTCHA + hạn mức chấm Gemini trước khi công khai, trang About + dọn `legacy/`, Shadowing, giáo viên duyệt nội dung.

**Chủ dự án cần làm:** `npm run content:push` sau mỗi đợt nội dung; đặt `SUPABASE_SERVICE_ROLE_KEY` (Vercel + `.env.local`) để tạo tài khoản; thử Gemini chấm và đăng nhập thật (chưa chạy trên backend thật); kiểm chứng mã mô hình Gemini.

**Kiểm tra:** `npm run check:content`, `npm test`, `npm run lint`, `npm run build`; cổng dev/start 4000.
