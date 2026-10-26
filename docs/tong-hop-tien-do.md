# Tổng hợp và "chốt" tiến độ khi số dòng `answers` lớn

Tài liệu thiết kế (26/10/2026). **Đã xây (bước 1, phần `daily_activity`):** migration `0011_daily_activity.sql` + đọc từ bảng này ở chuỗi ngày/bản đồ nhiệt/tỷ lệ đúng theo tuần/tóm tắt lớp/chi tiết học sinh (chưa chạy migration thì tự lùi về cách cũ). Còn lại chưa xây: `progress_counters` (topic/tag; sẽ làm khi có nơi đọc), ảnh chụp Elo, script dựng lại, hàng đợi ghi lại. Con số là ước lượng của Claude, chưa đo trên dữ liệu thật.

## 1. Vấn đề
Phần lớn số liệu tiến độ đang tính **lúc đọc** từ bảng `answers`, nhưng chỉ đọc một cửa sổ dòng gần nhất:
- `/tien-do` (tỷ lệ đúng, mục cần ôn, mastery): 1.000–2.000 dòng gần nhất (`src/lib/db/progress.ts`, `getRecentTopicRows`).
- Chuỗi ngày và bản đồ nhiệt: dòng trong 100 ngày, tối đa 10.000.
- Màn quản lý: học sinh 1.000 dòng, tổng hợp lớp 10.000 dòng của mọi học sinh (`src/lib/db/staff.ts`).
- Elo (`ability.ts`): chỉ 400 câu gần nhất mỗi kỹ năng, luôn bắt đầu từ mức khởi điểm.

Khi học sinh làm nhiều, các số này **bị cắt âm thầm**: tổng số câu sai, kỹ năng làm ít bị đẩy ra khỏi cửa sổ, ngày cũ biến mất khỏi bản đồ nhiệt. Ngày đang tính theo giờ trình duyệt nên cũng lệch khi đổi máy hoặc múi giờ.

## 2. Nguyên tắc
1. **Không xóa dòng thô khi tổng hợp.** `answers` vẫn là nguồn sự thật: cần cho đo nhãn câu (`npm run report:items`), kiểm tra, dựng lại, và reset. Tổng hợp chỉ là *bản tóm tắt đọc nhanh*.
2. **Đếm được thì đếm ngay lúc ghi** (bộ đếm), không cần "chốt". Chỉ phần **tuần tự** (Elo) mới cần chốt theo mốc.
3. **Dựng lại được từ đầu** bất cứ lúc nào bằng một lệnh, để khi cần đọc hết (nhãn câu đổi, phát hiện sai lệch, nâng công thức) thì không mất gì.
4. Mọi bảng tóm tắt khóa theo `profile_id`, cùng quy tắc RLS như `answers`, và **bị xóa cùng lúc khi admin reset học sinh**.

## 3. Ba tầng
### Tầng A — bộ đếm cập nhật ngay (trigger trên `answers`)
Mỗi lần chèn một dòng `answers`, trigger Postgres cộng dồn:
- `daily_activity(profile_id, day, answers, correct)`: một dòng mỗi ngày. `day` tính theo múi giờ cố định `Asia/Ho_Chi_Minh` (hết lệch múi giờ giữa các máy). Chuỗi ngày, bản đồ nhiệt, tỷ lệ đúng theo tuần đọc ở đây: tối đa ~365 dòng/năm, không còn giới hạn dòng.
- `progress_counters(profile_id, kind, key, correct, total)` với `kind` = `topic` hoặc `tag`: tổng đúng/sai trọn đời theo chuyên đề và thẻ lỗi.

Ưu điểm: luôn đúng ngay (không có độ trễ "chốt"), không cần tác vụ nền. Màn quản lý lớp tổng hợp bằng `SUM` trên các bảng này thay vì kéo 10.000 dòng về trình duyệt.

### Tầng B — ảnh chụp Elo (chốt khi đủ ~800 dòng chưa gộp)
Elo phụ thuộc thứ tự và nhãn câu (`items.json`), không cộng dồn bằng SQL được. Trạng thái đủ để *tiếp tục* Elo chỉ là `(theta, n)` của từng kỹ năng, nên:
- Bảng `progress_snapshots(profile_id, skill, theta, n, upto_answer_id, meta_version, updated_at)`.
- Đọc: lấy ảnh chụp + các dòng `answers` có `id > upto_answer_id` (bị chặn trên bởi ngưỡng chốt) → tính Elo tiếp từ `(theta, n)`. Kết quả **giống hệt** việc phát lại toàn bộ.
- **Chốt:** khi số dòng chưa gộp ≥ **800**, máy chủ (route `/api/progress/rollup`, quyền của chính học sinh hoặc service role) gộp phần cũ nhất vào ảnh chụp, **chừa lại ~400 dòng gần nhất** chưa gộp (để biểu đồ gần đây và mastery vẫn có dữ liệu thô). Cập nhật bằng so sánh-và-đặt (`where upto_answer_id = <giá trị đã đọc>`) để hai tab mở cùng lúc không ghi đè nhau.
- `meta_version` = băm của `items.json` lúc chụp. Nếu nhãn câu đã đổi (hiệu chỉnh theo `report:items`) thì ảnh chụp cũ lỗi thời → tự **dựng lại** (xem tầng C).

### Tầng C — dựng lại từ dòng thô (khi cần đọc hết)
`scripts/rebuild-progress.mjs` (chạy trên máy admin, service role): với mỗi học sinh đọc **toàn bộ** `answers` theo trang 1.000 dòng, tính lại `daily_activity`, `progress_counters`, `progress_snapshots`, so với giá trị đang lưu và báo lệch. Dùng khi:
- đổi nhãn `bac`/`difficulty` hoặc công thức Elo;
- nghi ngờ sai lệch (chạy chế độ chỉ kiểm tra: tổng `progress_counters` phải bằng `count(answers)`);
- khôi phục sau lỗi, hoặc sau khi nhập dữ liệu từ nơi khác.
Cũng là đường để quản trị "đọc hết" cho phân tích sâu theo từng học sinh mà không làm nặng giao diện thường ngày.

## 4. Dung lượng (ước lượng)
Một dòng `answers` ~ 100–150 byte cả chỉ mục. 100 học sinh × 50 câu/ngày × 365 ngày ≈ 1,8 triệu dòng ≈ 200–300 MB/năm. Gói miễn phí Supabase hiện giới hạn ~500 MB (kiểm tra lại giới hạn hiện hành trước khi dựa vào). Đề xuất chính sách sau (chưa làm, bàn khi có dữ liệu thật): giữ dòng thô 12 tháng; trước khi xóa dòng cũ phải (1) chạy tầng C để tóm tắt đã đủ, (2) xuất tệp lưu trữ, (3) đã dùng xong cho `report:items`.

## 5. Ảnh hưởng đến phần khác
- **Reset của admin:** xóa luôn `daily_activity`, `progress_counters`, `progress_snapshots` của học sinh đó (hoặc chỉ phạm vi được chọn). Ghi nhật ký quản lý.
- **Hiển thị:** `/tien-do`, hồ sơ năng lực, màn quản lý chuyển sang đọc bảng tóm tắt + phần dòng chưa gộp; giữ nguyên giao diện.
- **Mastery** (4 trạng thái chuyên đề) cần độ gần đây, nên vẫn tính từ dòng chưa gộp (~400–1.200 dòng gần nhất) kết hợp `topic_tests`; bộ đếm trọn đời chỉ làm số tổng.
- **`report:items`** vẫn đọc `answers` thô (không bị ảnh hưởng).

## 6. Thứ tự làm đề xuất
1. **XONG (26/10/2026):** migration `0011` (bảng `daily_activity` + trigger cộng/trừ + nạp lại + RLS), đã chạy thử SQL trên Postgres giả lập (cộng, trừ, chạy lại, xóa hồ sơ, múi giờ Việt Nam); chuỗi ngày/bản đồ nhiệt/tuần/lớp/chi tiết học sinh đọc bảng này. **Chưa làm:** `progress_counters` (tổng đúng/sai theo chuyên đề và thẻ lỗi), chờ có nơi dùng.
2. `progress_snapshots` + route chốt + đọc "ảnh chụp + dòng mới".
3. `scripts/rebuild-progress.mjs` kèm chế độ kiểm tra; test hàm thuần (gộp ảnh chụp ≡ phát lại toàn bộ).
4. Hàng đợi ghi lại khi lỗi mạng ở `recordAnswer` (hiện lỗi mạng làm mất câu trả lời âm thầm).
