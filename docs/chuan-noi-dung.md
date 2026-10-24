# Chuẩn nội dung ngữ pháp

Các quy tắc đã chốt từ quá trình xây bản cũ (rút từ ghi chú đầu `Data_GrammarTopicBank.gs` do chủ dự án cung cấp). Áp dụng cho mọi chuyên đề mới và khi nhập chuyên đề cũ.

## Cấu trúc một chuyên đề
- `theory`: `usages` (mỗi mục một cách dùng, có ví dụ song ngữ và `id` ổn định), `formulas` (có thể không có), `signalWords`, `commonMistakes`.
- `exercises`: **tối thiểu 30 câu/chuyên đề** (mục tiêu dài hạn **50–70 câu** để bớt lặp), trắc nghiệm 4 đáp án, chia **đều ba mức** (10/10/10 khi đủ 30; mức khó `difficulty` 1/2/3). Một chuyên đề có thể nhiều hơn mức chuẩn nếu nhận thêm câu chuyển từ chuyên đề khác (hiện present-continuous: 34 câu). **Chuyên đề thử nghiệm đã mở rộng: `present-simple` có 60 câu (20/20/20, đáp án đúng rải 15/15/15/15)**; các chuyên đề còn lại mở rộng sau khi chủ dự án duyệt chuyên đề mẫu này.
- Mỗi lượt học bốc **10 câu** từ cả ngân hàng của chuyên đề, ngẫu nhiên trong từng mức độ khó, rồi xếp **dễ → khó** (chống học vẹt nhưng vẫn mạch tăng dần). Hiện đang bốc 4 dễ / 3 vừa / 3 khó.
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
- **Nhãn cấp độ (`level`/`levels`) của chuyên đề chỉ để tham khảo nội bộ, không hiển thị cho người học**: một chuyên đề trải nhiều cấp, nhãn một cấp dễ gây hiểu nhầm. Cấp độ có ý nghĩa nằm ở từng mục dạy và từng câu (`level`, tùy chọn) và ở các mô tả năng lực (can-do) theo CEFR. Chi tiết và phần chưa kiểm chứng: `docs/khung-cefr-vstep.md`.

## Thẻ (tag)
- Mỗi mục `usages` có `id` duy nhất toàn hệ thống (bản cũ gọi `tagId`, ví dụ `ps-u1-habits-routines`). Bài tập gắn `usageId` và `tags` (thẻ lỗi). Dùng chung một kho tên, không tách theo module, để sau này gắn cho Nói/Viết.
- Thẻ "chéo chủ điểm" bản cũ: `pp-vs-simple-past`, `prep-since-for`, `rc-reduced-clauses`, `cond-connectors`, `cond-inversion`, `ps-vs-pc`, `past-simple-vs-continuous`. Nhãn tiếng Việt nằm ở mục "Dữ liệu từ nhật ký lỗi sai" bên dưới. **Bốn thẻ trong số đó chưa có mục lý thuyết nào dạy riêng** (`cond-connectors`, `ps-vs-pc`, `pp-vs-simple-past`, `past-simple-vs-continuous`), trái với quy tắc 1: xem danh sách ở `ROADMAP.md`. Mỗi thẻ chéo phải có mục lý thuyết dạy nội dung đó (quy tắc 1).

## Dữ liệu từ nhật ký lỗi sai (bản cũ, `Controller_ErrorLog.gs`)
Thiết kế đã chốt, dùng làm nền cho phần phân tích khi làm lại:
- Mỗi lần trả lời sai ghi một sự kiện thô: (người dùng, ngày, kỹ năng, ngôn ngữ, chuyên đề, mã câu, danh sách thẻ). **Không cộng dồn lúc ghi**; việc tổng hợp theo thẻ làm lúc đọc. Trong dự án mới, bảng `answers` (ghi cả đúng lẫn sai) đã thay vai trò này.
- Tổng hợp: sắp thẻ **yếu nhất (sai nhiều nhất) lên đầu**, kèm chuyên đề, số lần sai, ngày gần nhất, để dựng nút "Xem lại" (cuộn tới đúng mục lý thuyết) và "Học lại" (mở lại cả chuyên đề).
- Từ câu sai tự sinh thẻ ôn tập ngắt quãng (SRS), **không tạo trùng**: nếu đã có thẻ chưa thuộc cho cùng câu của người đó thì bỏ qua.
- Mọi lượt trả lời (đúng lẫn sai) đều tính vào chuỗi ngày học và bản đồ nhiệt.
- Hướng mở chưa làm: sắp lại lộ trình theo điểm yếu từng người; xếp hạng theo số điểm yếu đã khắc phục; sau này gắn thẻ cho Nói/Viết.
- Nhãn tiếng Việt của thẻ chéo chủ điểm:
  - `pp-vs-simple-past`: Phân biệt Hiện tại hoàn thành và Quá khứ đơn
  - `prep-since-for`: Phân biệt giới từ Since và For
  - `rc-reduced-clauses`: Rút gọn mệnh đề quan hệ
  - `cond-connectors`: Liên từ điều kiện (unless, in case, as long as, even if...)
  - `cond-inversion`: Đảo ngữ trong câu điều kiện
  - `ps-vs-pc`: Phân biệt Hiện tại đơn và Hiện tại tiếp diễn
  - `past-simple-vs-continuous`: Phân biệt Quá khứ đơn và Quá khứ tiếp diễn

## Nhập nội dung từ bản cũ (đã xong)
Nội dung đầy đủ của bản cũ nằm trên Google Drive, thư mục `TrainingZone_ContentStore_DoNotDelete`, mỗi chuyên đề một tệp `grammar__<topicId>.json`. Đã nhập 23 chuyên đề × 30 câu = 690 câu vào `src/content/exercises/en/`: mã câu đổi thành `en-<chuyên-đề>-NNN`, `tags` giữ nguyên, `usageId` lấy từ thẻ khớp mục lý thuyết của chính chuyên đề, thêm `kind: "mcq"`. Lý thuyết trong tệp Drive trùng với lý thuyết đã chuyển trước đó (đã đối chiếu mã mục và ví dụ). Tệp gốc vẫn nằm trên Drive.
