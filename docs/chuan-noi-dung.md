# Chuẩn nội dung ngữ pháp

Các quy tắc đã chốt từ quá trình xây bản cũ (rút từ ghi chú đầu `Data_GrammarTopicBank.gs` do chủ dự án cung cấp). Áp dụng cho mọi chuyên đề mới và khi nhập chuyên đề cũ.

## Cấu trúc một chuyên đề
- `theory`: `usages` (mỗi mục một cách dùng, có ví dụ song ngữ và `id` ổn định), `formulas` (có thể không có), `signalWords`, `commonMistakes`.
- `exercises`: **30 câu/chuyên đề**, trắc nghiệm 4 đáp án, chia đúng **10 dễ / 10 vừa / 10 khó** (`difficulty` 1/2/3).
- Mỗi lượt học bốc **10 câu** từ 30 câu, ngẫu nhiên trong từng mức độ khó, rồi xếp **dễ → khó** (chống học vẹt nhưng vẫn mạch tăng dần). Hiện đang bốc 4 dễ / 3 vừa / 3 khó.
- Chế độ "Nhức đầu" (dự kiến làm lại): 10 câu `difficulty = 3` của chuyên đề.

## Quy tắc bắt buộc
1. **Không bài tập nào được kiểm tra kiến thức mà lý thuyết chưa dạy.** Mỗi câu gắn `usageId` trỏ tới một mục `usages` có thật. Nếu câu cần kiến thức chưa có "nhà", phải thêm hẳn một mục dạy nội dung đó trước khi viết bài tập. (Bản cũ từng bị lỗi này ở since/for, mệnh đề quan hệ rút gọn, đảo ngữ điều kiện.)
2. **`choiceExplanations` bắt buộc** (giải thích riêng từng đáp án A/B/C/D, cùng độ dài `choices`), kèm `explanation` chung. Chuyên đề cũ chưa có thì hiện `explanation` chung.
3. **Vị trí đáp án đúng phải rải đều**: mỗi chuyên đề 30 câu ≈ 8/8/7/7 ở A/B/C/D, xáo ngẫu nhiên giữa các câu. (Bản cũ từng bị lỗi đáp án đúng dồn vào A: có chuyên đề 30/30 câu.) Khi xáo, `choiceExplanations` đi theo đáp án.
4. **Chuẩn tiếng Anh**: 11 chuyên đề đầu của bản cũ theo Anh-Anh, **chuyên đề mới theo Anh-Mỹ** làm mặc định. Chỗ khác biệt đáng chú ý thì ghi chú trong `explanation`, không giấu.
5. **Đáp án mập mờ phải công khai**: nếu một đáp án "sai" thực ra vẫn chấp nhận được trong tiếng Anh tự nhiên, nói rõ trong `choiceExplanations` và giải thích vì sao đáp án đúng phù hợp ngữ cảnh hơn, thay vì khẳng định tuyệt đối.
6. Không có hai đáp án trùng nhau trong một câu; không có câu trùng đề (kể cả giữa các chuyên đề); đề bài không được để chỗ trống mà đáp án cũng chứa phần đã có sẵn trong đề.
7. Nội dung viết mới hoàn toàn, **không sao chép sách**; sách chỉ dùng làm căn cứ chọn chủ điểm và thứ tự sư phạm.
8. **Kiểm định độc lập**: mỗi chuyên đề mới nên được một người/agent phản biện độc lập rà soát (lỗi ngữ pháp, đáp án gây tranh cãi, câu không tự nhiên, nhãn thẻ sai, lỗ hổng kiểu quy tắc 1). Chuyên đề do Claude soạn trong repo này cũng cần bước này trước khi coi là xong.

## Thứ tự, nhóm và cấp độ
- `order` là **thứ tự học thực tế** (nền tảng trước). Mỗi lần thêm chuyên đề phải rà lại `order` của tất cả, không chỉ gắn số cuối.
- `category`: đúng một trong `tenses` (Thì), `word-classes` (Từ loại), `sentence-structure` (Cấu trúc câu). Thứ tự hiển thị nhóm = `order` nhỏ nhất trong nhóm. Không tự thêm nhóm thứ tư khi chưa bàn.
- **Nhãn cấp độ (`level`/`levels`) của chuyên đề chỉ để tham khảo nội bộ, không hiển thị cho người học**: một chuyên đề trải nhiều cấp, nhãn một cấp dễ gây hiểu nhầm. Cấp độ có ý nghĩa nằm ở từng câu (`level` của bài tập) và ở các mô tả năng lực (can-do) theo CEFR, làm ở giai đoạn 3 của lộ trình.

## Thẻ (tag)
- Mỗi mục `usages` có `id` duy nhất toàn hệ thống (bản cũ gọi `tagId`, ví dụ `ps-u1-habits-routines`). Bài tập gắn `usageId` và `tags` (thẻ lỗi). Dùng chung một kho tên, không tách theo module, để sau này gắn cho Nói/Viết.
- Thẻ "chéo chủ điểm" bản cũ: `pp-vs-simple-past`, `prep-since-for`, `rc-reduced-clauses`, `cond-connectors`, `cond-inversion`, `ps-vs-pc`, `past-simple-vs-continuous`. Nhãn tiếng Việt của chúng nằm ở `Controller_ErrorLog.gs` (chưa có trong repo; cần chủ dự án gửi nếu muốn dùng). Mỗi thẻ chéo phải có mục lý thuyết dạy nội dung đó (quy tắc 1).

## Nhập nội dung từ bản cũ
Nội dung đầy đủ (lý thuyết + bài tập) của bản cũ nằm trên Google Drive, thư mục `TrainingZone_ContentStore_DoNotDelete`, mỗi chuyên đề một tệp `grammar__<topicId>.json`. Cách đưa vào repo:
1. Tải cả thư mục về, giải nén vào `import/grammar/` trong thư mục dự án.
2. Commit và push (tạm thời, sau khi chuyển xong sẽ xóa thư mục `import/`).
3. Claude chuyển sang `src/content/` theo mô hình mới, chạy `npm run check:content`, và so với lý thuyết hiện có.
