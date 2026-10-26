# Bảng quy đổi giữa các thang năng lực

Nguyên tắc (ROADMAP giai đoạn 3): mỗi dòng có **nguồn** và **mức chắc chắn**; chỉ dòng "đã kiểm chứng" mới được đưa ra giao diện. Cập nhật lần đầu theo văn bản đã đọc trực tiếp.

## 1. Khung năng lực ngoại ngữ Việt Nam ↔ CEFR — ĐÃ KIỂM CHỨNG
Nguồn: Khung năng lực ngoại ngữ dùng cho Việt Nam kèm **Thông tư 33/2026/TT-BGDĐT** (15/04/2026; hiệu lực 31/05/2026; thay Thông tư 01/2014), Phần I, bảng "Mức độ tương thích giữa KNLNNVN và CEFR" (trang PDF 4 của `reference/33-bgddt.pdf`; đọc trực tiếp từ bản quét).

| Cấp | KNLNNVN | CEFR |
|---|---|---|
| (chưa phân cấp) | Tiền Bậc 1 | Pre A1 |
| Sơ cấp | Bậc 1 | A1 |
| Sơ cấp | Bậc 2 | A2 |
| Trung cấp | Bậc 3 | B1 |
| Trung cấp | Bậc 4 | B2 |
| Cao cấp | Bậc 5 | C1 |
| Cao cấp | Bậc 6 | C2 |

Hiệu lực chuyển tiếp (Điều 5, khoản 3): chương trình, kiểm tra đang theo Thông tư 01/2014 được dùng tiếp đến hết 31/12/2027. Mô tả "can-do" từng bậc theo kỹ năng: `src/content/cando/vi.json` (chép từ bản quét, cần người soát). Ứng dụng đã dùng bảng này ở `src/lib/content/bac.ts` và trang `/khung-nang-luc`.

## 2. Điểm chứng chỉ (IELTS, TOEFL, Cambridge, VSTEP…) ↔ Bậc — KHÔNG CÓ TRONG VĂN BẢN; CHỦ DỰ ÁN QUYẾT ĐỊNH BỎ (26/10/2026)
Không làm quy đổi điểm chứng chỉ trong dự án này (văn bản nhà nước không đưa bảng, không tìm được nguồn). Phần dưới chỉ giữ để ghi lý do.
Đã đọc toàn bộ Thông tư và phần mở đầu của Khung: **không có bảng quy đổi điểm chứng chỉ**. Điều 3, khoản 6 chỉ nói Khung là "căn cứ để công nhận các cấp độ của chứng chỉ năng lực ngoại ngữ của nước ngoài tương đương với các bậc", tức việc quy đổi sẽ do văn bản hướng dẫn riêng quy định. Vì vậy:
- Không ghi con số quy đổi (ví dụ IELTS 5.0 = Bậc 3) vào mã hay giao diện cho tới khi có văn bản hướng dẫn chính thức.
- Mức chắc chắn của các con số thường gặp trên mạng hoặc từ khung cũ (2014/Công văn 729): **chưa kiểm chứng với văn bản đang hiệu lực** → chỉ dùng để tham khảo nội bộ, không hiển thị.
- VSTEP: là kỳ thi đánh giá theo KNLNNVN; cấu trúc và thang điểm cụ thể chưa được đối chiếu với văn bản hiện hành.

## 3. Thang của các ngôn ngữ khác (JLPT, HSK, TOPIK, TOCFL) — CHƯA KIỂM CHỨNG, CHƯA CẦN
Dự án hiện chỉ có tiếng Anh. Khi thêm ngôn ngữ thứ hai: tra văn bản của chính tổ chức ban hành thang (JLPT N5–N1, HSK bản đang áp dụng, TOPIK I–II) và khung quy đổi CEFR do họ công bố (nếu có); bản nháp cũ trong repo (nếu còn) không dùng làm nguồn. Điều 4, khoản 3 của Thông tư: với ngôn ngữ không dùng chữ Latin đã có khung riêng, việc áp dụng và quy đổi tương đương theo hướng dẫn riêng của Bộ GD&ĐT.

## 4. Bậc do máy ước lượng trong ứng dụng
`estimateBac` (bài xếp trình độ) và Bậc trong báo cáo chấm Viết/Nói là **ước lượng tham khảo của máy**, không phải kết quả thi và không được quy ra điểm chứng chỉ.
