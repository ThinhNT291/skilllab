# Ôn tập cách quãng: SM-2 (đang dùng) và FSRS

Tài liệu giải thích để chủ dự án quyết định có đổi hay không. Chưa đổi gì trong mã.

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

## Đề xuất
Chưa đổi ngay. Quy mô hiện tại (chưa có người dùng thật, mỗi học sinh ôn ít thẻ) chưa đủ dữ liệu để thấy lợi ích, và chưa có cách đo. Nếu muốn làm: (1) thêm các cột FSRS vào `srs_cards` bằng migration, giữ nguyên SM-2 làm mặc định; (2) ghi lại mỗi lượt ôn (thẻ, thời điểm, điểm, khoảng cách thực) vào bảng nhật ký để so SM-2 và FSRS trên cùng dữ liệu; (3) chỉ chuyển khi có số liệu (tỷ lệ nhớ thật lúc đến hạn). Cần kiểm chứng giấy phép và tham số mặc định của thư viện FSRS trước khi dùng.
