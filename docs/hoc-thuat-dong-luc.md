# Học thuật và động lực: bằng chứng, quyết định, mức chắc chắn

Tài liệu cho bốn tính năng thêm 25/10/2026. Mức chắc chắn: **cao** = nhiều nghiên cứu/phân tích tổng hợp; **vừa** = có nghiên cứu nhưng điều kiện khác ứng dụng này; **thấp** = chủ yếu ý kiến/hướng dẫn, chưa có thử nghiệm đúng bối cảnh. Mọi số liệu cần đo lại bằng dữ liệu học sinh thật.

## 1. Độ khó thích ứng và xếp trình độ liên tục
- Ước lượng năng lực kiểu Elo (`src/lib/progress/ability.ts`): mỗi câu có độ khó từ (bậc, mức khó) (`src/content/meta/items.json`, sinh bằng `scripts/build-item-meta.mjs`), xác suất đúng có sàn đoán mò 0,25; hệ số K giảm dần theo số câu; độ tin cậy thấp/vừa/cao theo số câu.
- Mục tiêu đúng khoảng 80% ("85% rule", Wilson và cộng sự 2019, tác vụ đơn giản). Mức chắc chắn **vừa**: nghiên cứu trên bài phân loại đơn giản, chưa có cho ngữ pháp trẻ 9–15. Bậc thang thích ứng: đúng lên 0,05, sai lùi 0,2 (cân bằng ở 80%).
- Bậc hiển thị là **ước lượng tham khảo**, không phải xếp loại; chỉ dùng để chọn câu vừa sức (`/hoc/[topic]/thich-ung`) và gợi ý.

## 2. Phản hồi lỗi
- Mặc định **xem đáp án ngay**. Lý do: phân tích tổng hợp về thời điểm phản hồi cho kết quả không đồng nhất; phản hồi tức thì tốt hơn với học sinh nhỏ tuổi và kiến thức mức thấp (**vừa**). Chưa tìm thấy bằng chứng cho "gợi ý trước" ở đúng lứa tuổi này (**thấp**), nên chỉ là tùy chọn ("Gợi ý rồi thử lại", cho dạng gõ/sắp xếp/sửa lỗi), học sinh tự chọn ở `/cua-hang`.
- Phản hồi theo `tag` lỗi: nối về quy tắc, lỗi hay gặp, mục nên ôn (`WrongFeedback`, `ReviewNext`); lần sai thứ hai cùng mục có biểu ngữ nhắc. Lượt trộn nhiều chuyên đề dẫn đúng về chuyên đề của từng câu.

## 3. Xen kẽ và ôn theo ngữ cảnh
- Phân tích tổng hợp (Brunmair và Richter 2019): xen kẽ có lợi rõ (g≈0,42), nhưng với tài liệu dạng chữ/từ thì làm theo khối lại tốt hơn (g≈−0,39); lợi khi các loại giống nhau và cần phân biệt (**cao** cho kết luận chung, **vừa** cho việc áp vào ngữ pháp). Vì vậy **chỉ xen kẽ trong nhóm chuyên đề dễ lẫn** (`CONFUSABLE_GROUPS`: các thì hiện tại/quá khứ/tương lai, điều kiện, liên từ, mạo từ–đại từ), không trộn tùy ý; luyện từng chuyên đề vẫn là mặc định. Trang: `/luyen-xen-ke`.
- Hàng chờ ôn tập: hai thẻ liền nhau không cùng chuyên đề khi còn lựa chọn (`interleaveByTopic`).
- Ôn theo ngữ cảnh: thẻ từ vựng ở lần ôn lẻ (sau lần đầu) hiện câu ví dụ bị che từ thay vì hỏi nghĩa rời (`src/lib/srs/context.ts`). Mức chắc chắn **vừa**.

## 4. Động lực và tránh áp lực
- Chuỗi ngày có **ngày nghỉ**: bỏ đúng 1 ngày thì chuỗi vẫn giữ (không cộng ngày đó), tối đa 1 lần mỗi 7 ngày. Lý do thiết kế: tránh xóa công sức nhiều tuần vì một hôm bận. Bằng chứng về lo âu do chuỗi ngày chủ yếu từ hướng dẫn cho phụ huynh (**thấp**), nên đây là quyết định thận trọng, không phải kết luận khoa học.
- Mục tiêu hằng ngày là **gợi ý**, lời lẽ không trách ("Gợi ý hôm nay… Chỉ cần bắt đầu là tốt rồi"); không có hình phạt khi mất chuỗi.
- **Chế độ nhẹ nhàng** (`calmMode`, ở `/cua-hang`): ẩn chuỗi ngày và mục tiêu, còn bản đồ nhiệt và phần thưởng nhỏ.
- Nhắc nghỉ khi học rất nhiều trong ngày (từ 30 câu và gấp 3 mục tiêu).
- Vẫn giữ: xếp hạng bằng biệt danh và tắt được, không quảng cáo, tắt âm/giảm chuyển động (CLAUDE.md mục 6).

## Chưa làm / cần dữ liệu thật
Đo lại ngưỡng 80%, K của Elo, hiệu quả "gợi ý trước" và xen kẽ bằng dữ liệu học sinh thật (so hai nhóm). Hỏi ý kiến giáo viên về lời nhắc nghỉ và nhóm chuyên đề dễ lẫn.
