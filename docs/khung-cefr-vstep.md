# Khung CEFR và VSTEP

Hướng dẫn bám chuẩn cho nội dung. Phần **đã kiểm chứng** ghi nguồn; phần **chưa kiểm chứng** để ở mục riêng, không đưa lên giao diện cho tới khi đối chiếu văn bản chính thức.

## Đã kiểm chứng (từ tìm kiếm ngày soạn tài liệu)
- Khung năng lực ngoại ngữ 6 bậc dùng cho Việt Nam ban hành theo **Thông tư 01/2014/TT-BGDĐT**: 3 cấp (Sơ cấp, Trung cấp, Cao cấp), 6 bậc, tương thích A1–C2 của CEFR (Bậc 1–2 ≈ A1–A2, Bậc 3–4 ≈ B1–B2, Bậc 5–6 ≈ C1–C2). Bộ GD-ĐT đã công bố dự thảo khung mới có thêm bậc Pre-A1 và mô tả kỹ năng chi tiết hơn. ([Thông tư 01/2014](https://www.moj.gov.vn/vbpq/Lists/Vn%20bn%20php%20lut/Attachments/29454/01.2014.TT.BGDDT.doc), [tổng hợp](https://hoatieu.vn/khung-nang-luc-ngoai-ngu-6-bac-cua-viet-nam-nhu-the-nao-135434))
- **VSTEP** có định dạng riêng cho A2 và một bài thi thống nhất cho **Bậc 3–5 (B1–C1)**: Nghe khoảng 40 phút, 35 câu trắc nghiệm, 3 phần; Đọc 60 phút, 40 câu, 4 bài đọc; Viết 60 phút, 2 bài (thư/email và bài luận, điểm tỷ lệ 1/3 và 2/3); Nói khoảng 12 phút, 3 phần. ([ĐHQGHN](https://www.is.vnu.edu.vn/en/test-format-for-the-vstep-test/), [Wikipedia](https://en.wikipedia.org/wiki/Vietnamese_Standardized_Test_of_English_Proficiency))

## Chưa kiểm chứng (cần đọc văn bản chính thức trước khi dùng)
- Ngưỡng điểm quy đổi: các nguồn khác nhau (phổ biến: 4.0 = B1, 6.0 = B2, 8.5 = C1 trên thang 10, điểm cuối là trung bình bốn kỹ năng; một bài báo khác ghi B1 4–5.5, B2 6–8, C1 8.5–10 và viện dẫn Quyết định 729/QĐ-BGDĐT).
- **Mô tả ngữ pháp và độ chính xác theo từng bậc** của Thông tư 01/2014 (tìm kiếm chưa thấy đoạn nào nêu rõ).
- Mức CEFR của từng điểm ngữ pháp (English Grammar Profile của Cambridge, danh mục từ vựng English Vocabulary Profile, Oxford 3000/5000): chưa đối chiếu giấy phép dùng lại và bảng gốc.
- Cách VSTEP tính ngữ pháp: kỳ thi không có phần ngữ pháp riêng; ngữ pháp được đánh giá gián tiếp qua Đọc/Nghe và qua tiêu chí chấm Viết/Nói (độ đa dạng và độ chính xác cấu trúc). Đây là hiểu biết chung, cần đối chiếu thang chấm chính thức.

## Nguyên tắc áp dụng cho nội dung
1. **Cấp độ gắn ở mức mục dạy và từng câu**, không gắn cho cả chuyên đề (một chuyên đề trải nhiều cấp; nhãn một cấp gây hiểu nhầm). Trường `level` của mục lý thuyết (`usages[].level`) và của câu (`level`) là tùy chọn, định hướng, **không hiển thị cho người học** cho tới khi được kiểm chứng.
2. **Phạm vi cho học sinh 9–15 tuổi:** nền tảng A1–B1 là trọng tâm; B2 trở lên (câu giả định, đảo ngữ, mệnh đề rút gọn...) là mục mở rộng, đánh dấu rõ là nâng cao.
3. **Cầu nối sang VSTEP/CEFR:** mỗi mục lý thuyết nên trả lời được "dùng ở đâu khi viết/nói" (một ví dụ gần với đề Viết/Nói), và mỗi chuyên đề cuối cùng nên có bài ôn tổng hợp kiểu thi (đọc điền từ, biến đổi câu). Việc này làm ở giai đoạn 3 của `ROADMAP.md`.
4. **Không đưa bảng quy đổi (CEFR ↔ Bậc ↔ điểm VSTEP) lên giao diện** khi chưa kiểm chứng, theo `CLAUDE.md`.

## Cấp độ định hướng đã gắn (đề xuất, chưa kiểm chứng)
| Mục | Cấp |
|---|---|
| `ps-vs-pc` (Hiện tại đơn và tiếp diễn) | A2 |
| `pp-vs-simple-past` (Hiện tại hoàn thành và Quá khứ đơn) | B1 |
| `past-simple-vs-continuous` (Quá khứ đơn và tiếp diễn) | B1 |
| `cond-connectors` (unless, as long as, in case, even if...) | B1 |
