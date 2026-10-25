# Ôn tập cách quãng: SM-2 (đang dùng) và FSRS

Tài liệu giải thích SM-2 và FSRS. **Đã triển khai FSRS (chạy song song với SM-2, mặc định FSRS)** theo yêu cầu của chủ dự án; xem phần "Đã triển khai" ở cuối.

## Hiện tại: SM-2 rút gọn (`src/lib/srs/scheduler.ts`)
Mỗi thẻ có `interval_days`, `ease`, `reps`, `lapses`. Bấm Lại/Khó/Tốt/Dễ thì khoảng cách đến lần ôn sau nhân với hệ số dễ (ease), Lại thì về đầu và ease giảm. Đơn giản, dễ hiểu, dễ kiểm tra, mỗi thẻ chỉ cần vài số.
Điểm yếu: dùng chung một công thức cho mọi thẻ và mọi người; không biết thật sự "bạn còn nhớ bao nhiêu phần trăm" lúc đến hạn; thẻ trễ hạn nhiều ngày vẫn được xử lý như đúng hạn.

## FSRS (Free Spaced Repetition Scheduler)
Thuật toán lập lịch dựa trên mô hình trí nhớ, do cộng đồng Anki phát triển, nay là lựa chọn có sẵn trong Anki. Mỗi thẻ có hai đại lượng: **Stability** (độ bền: sau bao nhiêu ngày thì xác suất nhớ rơi còn 90%) và **Difficulty** (độ khó của thẻ với người học). Từ đó tính **Retrievability** (xác suất nhớ lúc này) theo đường cong quên; hẹn lần ôn sau khi xác suất nhớ chạm mức mục tiêu (mặc định thường 90%). Mức mục tiêu chỉnh được: đặt cao thì ôn nhiều hơn nhưng nhớ chắc hơn.
Lợi ích thường được nêu: ít lượt ôn hơn cho cùng mức nhớ; xử lý đúng thẻ trễ hạn; có thể tinh chỉnh tham số theo lịch sử của từng người (tối ưu hóa), và đo được "mức nhớ ước tính" của cả bộ thẻ.
Cái giá: công thức phức tạp hơn (khoảng 17–21 tham số), khó giải thích cho học sinh 9–15 tuổi (nên giao diện vẫn là Lại/Khó/Tốt/Dễ), cần lưu thêm dữ liệu mỗi thẻ (stability, difficulty, lần ôn cuối) và cần di chuyển dữ liệu từ SM-2; tham số mặc định được huấn luyện trên dữ liệu người lớn dùng Anki nên với trẻ em chưa có bằng chứng riêng.

## So sánh nhanh
| | SM-2 rút gọn | FSRS |
|---|---|---|
| Lưu mỗi thẻ | interval, ease, reps, lapses | stability, difficulty, lần ôn cuối, trạng thái |
| Cơ sở | quy tắc kinh nghiệm | mô hình xác suất nhớ |
| Thẻ trễ hạn | xử lý như đúng hạn | tính theo thời gian đã quên thật |
| Tinh chỉnh theo người học | không | có (cần đủ lịch sử, vài trăm lượt ôn) |
| Độ phức tạp mã và kiểm thử | thấp | vừa (có thư viện mã nguồn mở, cần chọn giấy phép phù hợp) |
| Giao diện | Lại/Khó/Tốt/Dễ | giữ nguyên |

## Đề xuất ban đầu (đã được thay bằng quyết định triển khai)
Chưa đổi ngay. Quy mô hiện tại (chưa có người dùng thật, mỗi học sinh ôn ít thẻ) chưa đủ dữ liệu để thấy lợi ích, và chưa có cách đo. Nếu muốn làm: (1) thêm các cột FSRS vào `srs_cards` bằng migration, giữ nguyên SM-2 làm mặc định; (2) ghi lại mỗi lượt ôn (thẻ, thời điểm, điểm, khoảng cách thực) vào bảng nhật ký để so SM-2 và FSRS trên cùng dữ liệu; (3) chỉ chuyển khi có số liệu (tỷ lệ nhớ thật lúc đến hạn). Cần kiểm chứng giấy phép và tham số mặc định của thư viện FSRS trước khi dùng.

## Đã triển khai
- Thư viện `ts-fsrs` (MIT; FSRS-6, 21 tham số mặc định) bọc ở `src/lib/srs/fsrs.ts`; quy ước: tắt bước học trong ngày (học sinh ôn theo ngày), bật "fuzz" khi chạy thật.
- **Chạy song song**: mỗi lượt ôn tính cả SM-2 và FSRS và lưu cả hai trạng thái (`0010_fsrs.sql`: `stability`, `difficulty`, `fsrs_state`); cài đặt trên máy học sinh (`/on-tap/quan-ly`) chọn thuật toán nào quyết định ngày ôn (mặc định FSRS) và mức nhớ mục tiêu 85/90/95%. Đổi qua lại không mất dữ liệu. Chưa chạy migration thì tự lùi về SM-2.
- Thẻ cũ chỉ có SM-2 được đưa sang FSRS lúc ôn lần đầu: độ bền ≈ khoảng cách hiện tại, độ khó suy từ hệ số dễ (`fsrsFromSm2`).
- **Nhật ký lượt ôn** (`srs_reviews`): xác suất nhớ FSRS dự đoán ngay trước khi ôn, kết quả thật, khoảng cách của từng thuật toán. `node scripts/srs-report.mjs` (đọc bằng service_role, chỉ in số liệu tổng hợp) cho biết dự đoán có khớp thực tế không (hiệu chỉnh, log loss) và FSRS hẹn xa hơn SM-2 bao nhiêu lần (`src/lib/srs/evaluate.ts`). Cần ít nhất vài trăm lượt ôn thật mới kết luận được.
- Điều chưa biết: tham số mặc định huấn luyện trên người lớn dùng Anki, chưa có bằng chứng riêng cho học sinh 9–15 tuổi; vì vậy mới có nhật ký để kiểm chứng. Chưa tối ưu hóa tham số theo từng học sinh (cần nhiều lượt ôn mỗi người).
