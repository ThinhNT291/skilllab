# Đối chiếu English Grammar Profile và đề xuất module từ vựng

Nháp để chủ dự án duyệt. Nguồn: `reference/English Grammar Profile Online.xlsx` (1.222 mô tả "can-do" có cấp CEFR, dựa trên dữ liệu học viên thật).

## 1. Cách đọc "độ khó" và đề xuất chia lại

Hiện tại mỗi câu có `difficulty` 1–3, và chuẩn nội dung yêu cầu mỗi chuyên đề chia đều 10/10/10. Hai thứ này đang bị lẫn:

- `difficulty` hiện đo **độ khó tương đối trong chuyên đề** (câu dễ, vừa, khó của chính chủ đề đó).
- Điều học sinh cần biết là câu đó kiểm tra **bậc nào của khung 6 bậc**.

**Đề xuất:** giữ `difficulty` 1–3 và chuẩn 10/10/10 như cũ, thêm một trường riêng `bac` (1–6) cho từng câu, lấy từ mục lý thuyết (`usage.level`) đã đối chiếu với EGP. Khi đó:

- `difficulty` vẫn cho phép lượt luyện đi từ dễ đến khó.
- `bac` cho biết câu đó thuộc bậc mấy, dùng để báo cáo tiến độ và đối chiếu với khung chuẩn.

**Ví dụ với `present-simple`:** câu "She cleans her room" có `difficulty: 1` và `bac: 2`. Câu "Everyone ... needs" có `difficulty: 3` và `bac: 3`. Cả hai đều thuộc chuyên đề thì hiện tại đơn, nhưng khác nhau về bậc.

Cách này giải quyết mâu thuẫn ở bản đánh giá trước: không cần đổi phân bố 10/10/10, nhưng vẫn ghi được bậc thật của từng câu.

## 2. Đối chiếu các chuyên đề với EGP

Đây là ước lượng từ các nhóm mô tả trong EGP. Bảng dùng cấp chiếm nhiều dòng nhất trong mỗi nhóm, không phải một con số chính xác. "Chưa tìm thấy" nghĩa là EGP không có nhóm tương ứng rõ ràng.

| Chuyên đề | Nhóm EGP tương ứng | Phân bố chính | Ước lượng bậc |
|---|---|---|---|
| present-simple | present simple | A1: thói quen, sự thật; A2: phủ định, nghi vấn; B1: động từ tư duy | 2 (A2) |
| present-continuous | present continuous | A2 (5), B1 (3) | 2–3 |
| past-simple | past simple | A1–A2 khẳng định, nghi vấn; B1 thói quen quá khứ | 2–3 |
| past-continuous | past continuous | A2 (4), B1 (5) | 3 |
| future-simple | future simple (will, shall) | A2 (8), B1 (3) | 2 |
| future-going-to | be going to | A2 (dự định, dự đoán); B1 (kế hoạch quá khứ) | 2–3 |
| present-perfect | present perfect simple | A2: kinh nghiệm, yet; B1: since, already | 2–3 |
| past-perfect | past perfect simple | B1 (5), B2 (11) | 4 |
| present-perfect-continuous | present perfect continuous | B1 (4), B2 (3) | 3–4 |
| prepositions | prepositions | A1–A2 (7), B1 (4) | 2 |
| articles-countable-uncountable | articles, uncountable | A1 (6), B1 (6) | 2–3 |
| modal-verbs | can, could, should, must | A2–B1 phần lớn; must và may có nhiều mục B2 | 3 |
| gerund-infinitive | verbs + to/-ing | B1 (6), B2 (4) | 3 |
| comparatives-superlatives | comparatives, superlatives | A2 (9 và 11) | 2 |
| passive-voice | passives: form | A2 (3), B1 (9), B2 (15) | 3–4 |
| relative-clauses | relative | A2 (8), B1 (7), B2 (4) | 2–4 |
| reported-speech | reported speech | A2 (2), B1 (8), B2 (7) | 3–4 |
| conditional-sentences | conditional | A2 (4), B1 (10), C2 (8) | 3 |
| tag-questions | tags | A2 (1), B1 (4) | 3 |
| adverbial-clauses | subordinated | rải đều A1–C2 | 3 |
| pronouns-determiners | determiners, pronouns | A2–B1 | 2–3 |
| adjective-adverb-order | adjectives: position | A1–B1 | 2–3 |
| subjunctive | Chưa tìm thấy nhóm trực tiếp | — | cần kiểm tra thêm |

**Nhận xét:**
- Thì hiện tại đơn nằm ở bậc 2 trong EGP, khớp với đánh giá trước.
- Nhiều chuyên đề có nội dung kéo dài từ A2 đến B2. Đây là lý do không nên gắn một bậc duy nhất cho cả chuyên đề. Nên gắn bậc theo từng mục lý thuyết (`usage`).
- Mục `subjunctive` chưa có nhóm tương ứng trong EGP. Cần kiểm tra thêm trước khi đặt bậc cho nó.

## 3. Module từ vựng: nên làm thế nào

Bạn hỏi tham khảo cách các hệ thống làm. Kết quả tìm kiếm:

**Danh sách từ theo cấp CEFR:**
- **English Vocabulary Profile (Cambridge):** gắn cấp A1–B2 cho khoảng 7.000 từ, cụm từ, cụm động từ và thành ngữ. Dựa trên dữ liệu từ học viên và từ các kỳ thi. Nguồn: [Cambridge Core](https://www.cambridge.org/core/product/418955FC7ED2455E98A499BC40C2C816).
- **Oxford 3000 và 5000:** bản 3000 có khoảng 900 từ A1, 800 A2, 700 B1, 600 B2. Oxford ghi rõ đây chỉ là hướng dẫn, cấp độ nghĩa là học viên ở cấp đó nên nhận ra từ khi nghe hoặc đọc, chưa chắc đã dùng được. Nguồn: [Oxford Learner's Dictionaries](https://www.oxfordlearnersdictionaries.com/about/wordlists/oxford3000-5000).
- **Lưu ý bản quyền:** danh sách Oxford là tài liệu có bản quyền. EVP trên web có thể dùng để tham khảo. Với dự án phi thương mại, vẫn phải ghi nguồn rõ ràng.

**Cách Duolingo làm:** theo blog của họ, các khóa học được xây lại theo CEFR, A1–A2 khoảng 800 từ mỗi bậc, và mỗi phần kết thúc bằng một bài kiểm tra. Nguồn: [Duolingo blog](https://blog.duolingo.com/how-are-duolingo-courses-evolving). Đây là nội dung từ chính công ty, chưa được kiểm chứng độc lập.

**Cách danh sách CEFR được xây:** có ba hướng. (1) Đếm tần suất trong kho ngữ liệu tiếng mẹ đẻ. (2) Dựa vào chuyên gia, như mô tả RLD của CEFR. (3) Học từ dữ liệu sách giáo khoa và bài viết học viên, như dự án CEFRLex. Nguồn: [bài tổng quan trên Oxford Learner's Dictionaries](https://www.oxfordlearnersdictionaries.com/about/wordlists/cefr).

**Ôn lặp (SRS):** nguồn đáng tin nhất tìm được là Woźniak 1990, cho thấy SM-2 đạt khoảng 92% ghi nhớ sau một năm trên 10.255 từ. Đây là một trường hợp tự báo cáo, không phải thí nghiệm có đối chứng. Các so sánh FSRS và SM-2 chủ yếu đến từ bài viết của nhà cung cấp và diễn đàn Anki. Chưa tìm thấy nghiên cứu ngang hàng nào so sánh hai thuật toán này riêng cho từ vựng. Nguồn: [DEV Community](https://dev.to/palachdigital_20fd679f5fe/why-fsrs-is-better-than-sm-2-2m17), [Anki Forums](https://forums.ankiweb.net/t/new-progress-in-implement-the-custom-algorithm/22961?page=2).

**Chưa tìm thấy:** cách Memrise và Quizlet chọn danh sách từ.

### Đề xuất thiết kế module từ vựng

1. **Danh sách gốc:** dùng EVP làm khung cấp độ (miễn phí, ghi nguồn), kết hợp danh sách tần suất cho những từ chưa có trong EVP. Không dùng Oxford 3000/5000 nếu chưa xin phép, hoặc chỉ dùng để đối chiếu.
2. **Đơn vị học là từ có nghĩa trong ngữ cảnh**, không phải từ tách rời. Mỗi từ có câu ví dụ, ghi rõ loại từ, và có ít nhất một cụm từ đi kèm (collocation).
3. **Hai chiều:** nhận biết (nghe, đọc hiểu) trước, dùng chủ động (viết, nói) sau. Đây là điều Oxford mô tả khi nói về cấp độ.
4. **Gắn với ngữ pháp:** mỗi từ có thể được dùng trong bài tập chuyên đề, để học từ và cấu trúc cùng lúc.
5. **Ôn lặp:** tái dùng hàng đợi SRS đã có. Chưa đổi sang FSRS cho đến khi có bằng chứng so sánh trên dữ liệu của chính dự án.
6. **Đo kết quả:** tỷ lệ từ đã nhận biết và đã dùng được theo bậc, lấy từ lịch sử trả lời, cùng với bài kiểm tra cuối chủ điểm.

## 4. Đề xuất cho lộ trình

1. Thêm trường `bac` cho từng câu, lấy từ `usage.level` (đối chiếu với EGP ở mục 2). Đây là thay đổi dữ liệu, không đổi code, và có thể làm ngay sau khi bạn duyệt bảng mục 2.
2. Làm module từ vựng theo thiết kế ở mục 3, bắt đầu với bậc 2 và 3, vì đó là nhóm học sinh mục tiêu.
3. Ghi nguồn EGP và EVP trong trang "Giới thiệu" khi có.

## 5. Điều cần bạn quyết định

- Bạn có duyệt cách tách `difficulty` (tương đối trong chuyên đề) và `bac` (bậc khung chuẩn) không?
- Bạn có đồng ý dùng EVP làm danh sách gốc cho module từ vựng không?
- Mục `subjunctive`: bạn có tài liệu nào khác (ví dụ sách) để đối chiếu không?

## 6. Kết quả duyệt chuyên đề đầu tiên (đã áp dụng)

- **Trường `bac`** đã thêm vào kiểu dữ liệu (1–6), có kiểm tra trong `check:content`. Đã gắn cho `present-simple` (60 câu, 7 mục lý thuyết): bậc 1 cho thói quen và sự thật, bậc 2 cho lịch trình, trạng thái, chỉ dẫn và trạng từ tần suất, bậc 3 cho hòa hợp chủ-vị.
- **Chuyên đề `subjunctive`** (30 câu, 7 mục) đã rà soát: đáp án đúng, không có câu trùng, giải thích khớp với `Câu giả định.pdf`. Gắn bậc 4 (B2) theo cấp của chuyên đề, vì EGP không có nhóm tương ứng để đối chiếu thêm. Một điểm mập mờ nhỏ: câu 009 có đáp án "could" bị loại, nên nêu thêm lý do trong giải thích nếu cần.
- **Việc còn lại:** đặt `bac` cho 22 chuyên đề còn lại theo từng mục lý thuyết, dựa trên bảng ước lượng ở mục 2.
