# Khoảng trống nội dung so với tài liệu tham khảo

Phân tích 26/10/2026 để quyết định soạn gì tiếp và viết lời nhắc cho phần nào. Đây là **bản đối chiếu của máy**, chưa phải thẩm định sư phạm: người có chuyên môn cần duyệt trước khi xếp lịch soạn.

## Cách đo và giới hạn
- **Ngữ pháp:** đối chiếu 40 chuyên đề (và các mục dạy `usages` của từng chuyên đề) với **English Grammar Profile** (`reference/English Grammar Profile Online.xlsx`, 1.222 mô tả "can-do" phân theo nhóm lớn, nhóm nhỏ và cấp A1–C2) và danh mục ngữ pháp CEFR-J (`reference/cefrj-grammar-profile-20180315.csv`, 500 mục). Việc ghép chuyên đề với nhóm EGP là phán đoán của tôi, kèm kiểm từ khóa trong toàn văn lý thuyết hiện có (ví dụ tìm "indirect question" ra 0 chuyên đề). Từ khóa chỉ cho biết nội dung **có nhắc** hay không, không cho biết có dạy đủ sâu.
- **Từ vựng:** so kho `src/content/vocab` với CEFR-J (A1–B2) và Octanove (C1–C2) theo từ khóa gốc (cấp thấp nhất của mỗi từ).
- **Chưa làm:** đối chiếu mục lục các sách PDF trong `reference/` (Grammar in Use, Collocations in Use, Oxford Word Skills…) và danh mục chức năng giao tiếp; chưa đọc kỹ phần "Strategies", "Language" của `Master_List_of_CEFR_CEF_Indicators`.
- Giấy phép của EGP, CEFR-J, Octanove chưa kiểm tra cho việc đóng gói vào sản phẩm; hiện chỉ dùng cho phân tích và công cụ kiểm tra nội bộ.

## 1. Ngữ pháp
Số mô tả EGP theo nhóm và cấp (A1/A2/B1/B2/C1/C2), và chuyên đề hiện có:

| Nhóm EGP | Tổng | A1 A2 B1 B2 C1 C2 | Chuyên đề hiện có | Nhận xét |
|---|---|---|---|---|
| MODALITY | 239 | 12 42 66 55 33 29 | modal-verbs (5 mục: khả năng, cho phép, nghĩa vụ, lời khuyên, suy đoán hiện tại), modals-advanced (C1–C2), subjunctive | **Nhóm lớn nhất, chỉ 1 chuyên đề ở A2–B2** (163 mô tả A2–B2). Thiếu rõ: modal ở quá khứ (must/might/should have) ở B1–B2, used to/would, be able to/have to |
| CLAUSES | 135 | 8 33 43 20 14 17 | relative, adverbial, conditional(s), participle, cleft, tag | **Thiếu mệnh đề danh ngữ** (that-/wh-/if-clause, câu hỏi gián tiếp: 0 chuyên đề nhắc), thiếu câu mệnh lệnh (17) và câu cảm thán (7) |
| PRONOUNS | 119 | 9 29 28 30 11 11 | pronouns-determiners (6 mục) | Có phản thân, sở hữu, some/any; thiếu đại từ nhân xưng chủ/tân ngữ, chỉ định (this/that), bất định ở mức hệ thống, one/ones |
| PAST | 93 | 2 15 33 29 7 7 | past simple/continuous/perfect(+continuous), present perfect | Đủ; thiếu used to/would (xem MODALITY) |
| ADJECTIVES | 79 | 5 28 22 12 5 7 | comparatives-superlatives, adjective-adverb-order | Tương đối đủ |
| FUTURE | 72 | 2 19 18 18 8 7 | 5 chuyên đề | Đủ |
| DETERMINERS | 70 | 12 24 17 6 4 7 | articles…, pronouns-determiners | Đủ cho A2–B1; chỉ định (this/that) mỏng |
| ADVERBS | 69 | 16 20 14 7 8 4 | adjective-adverb-order | **Mỏng:** loại và nghĩa trạng từ (31), trạng từ bổ nghĩa (15), vị trí (15) mới có phần vị trí tần suất/cách thức |
| VERBS | 62 | 11 17 16 13 3 2 | gerund-infinitive, phrasal-verb-rules | Thiếu mẫu "động từ + tân ngữ + to-V", make/let/help + động từ nguyên, there is/are, động từ nối |
| NOUNS | 56 | 13 15 16 6 5 1 | articles…, noun-phrases-advanced (C1–C2) | **Thiếu nền A1–B1:** số nhiều, sở hữu cách, cụm danh từ cơ bản |
| PASSIVES | 40 | 0 3 10 18 5 4 | passive-voice, advanced-passives | Đủ |
| PRESENT | 38 | 6 14 8 4 4 2 | present simple/continuous | Đủ |
| QUESTIONS | 35 | 1 13 13 2 4 2 | tag-questions | **Thiếu chuyên đề "Câu hỏi"** (yes/no, wh-, chủ ngữ/tân ngữ, lựa chọn, gián tiếp): 26 mô tả A2–B1 |
| NEGATION | 31 | 3 7 7 4 6 4 | negation-advanced (C1–C2) | Phủ định cơ bản nằm rải trong từng thì; tạm đủ |
| CONJUNCTIONS | 26 | 7 1 6 4 5 3 | conjunctions | Đủ |
| REPORTED SPEECH | 17 | 0 2 8 7 0 0 | reported-speech | Đủ |
| FOCUS | 15 | 0 1 2 2 5 5 | cleft, inversion | Đủ |
| PREPOSITIONS | 15 | 2 5 4 3 1 0 | prepositions | Đủ (phần từ vựng giới từ là việc của từ vựng/cụm từ) |
| DISCOURSE MARKERS | 11 | 0 2 5 3 1 0 | conjunctions, discourse-linking-advanced | Tạm đủ |

**Chuyên đề nên soạn thêm, theo ưu tiên cho lớp 4–9 (A2–B2):**
1. **Câu hỏi** (yes/no, wh-, câu hỏi chủ ngữ, câu hỏi lựa chọn; câu hỏi gián tiếp ở B1–B2). Nền tảng, hiện trống.
2. **Động từ khuyết thiếu ở quá khứ và used to/would/be used to** (B1–B2), tách khỏi `modal-verbs`; kèm be able to/have to so với must.
3. **Mệnh đề danh ngữ và câu hỏi gián tiếp** (that-/wh-/if-/whether-clause) (B1–B2).
4. **Mẫu động từ + tân ngữ** (want/tell/ask sb to V; make/let/help sb V; there is/are) (A2–B1).
5. **Trạng từ: loại, mức độ (very/quite/too/enough/so/such), vị trí** (A2–B1).
6. **Nền A1–A2 nếu học sinh cần:** danh từ số nhiều và sở hữu cách, đại từ nhân xưng chủ/tân ngữ, chỉ định this/that, câu mệnh lệnh/let's/câu cảm thán. (Đối tượng của dự án là A2 trở lên nên ưu tiên thấp hơn, nhưng học sinh lớp 4–5 có thể thiếu.)

## 2. Từ vựng
Độ phủ so với danh sách cấp độ đầy đủ (số từ khóa gốc; "app có" tính ở bất kỳ cấp nào của kho):

| Cấp | Từ khóa chuẩn | App có | Tỷ lệ |
|---|---|---|---|
| A1 | 1.057 | 352 | 33% |
| A2 | 1.221 | 426 | 35% |
| B1 | 2.099 | 761 | 36% |
| B2 | 2.427 | 792 | 33% |
| C1 | 921 | 113 | 12% |
| C2 | 882 | 25 | 3% |

Kho có 3.179 từ (A1 180, A2 345, B1 572, B2 844, C1 532, C2 706). Hai điều cần lưu ý:
- **Hụt cả từ rất cơ bản:** 757 từ khóa A1 theo CEFR-J chưa có trong kho; ngoài từ chức năng (a, an, am, are…) còn có từ nội dung như *animal, angry, baby, bed, big, beautiful, activity, address, afraid*. Kho được dựng từ English Vocabulary Profile bản có định nghĩa/ví dụ và đã lọc cho trẻ, nên không đại diện cho "toàn bộ từ vựng A1".
- **C1/C2 thấp một phần vì hai nguồn khác nhau** (kho dựng từ EVP, danh sách chuẩn ở đây là Octanove), nên con số C1/C2 không so được trực tiếp; A1–B2 (cùng loại nguồn CEFR-J) thì so được.
Hướng xử lý: dựng quy trình **bổ sung từ** (lấy từ khóa còn thiếu ở A1–B2, sinh định nghĩa tiếng Anh đơn giản, ví dụ và nghĩa tiếng Việt, kiểm bằng mã, giải mù, **giáo viên duyệt nghĩa tiếng Việt**). Cần quyết định có dùng danh sách CEFR-J làm nguồn chính thức cho độ phủ hay không (xem giấy phép).

## 3. Khối lượng nội dung và kỹ năng
- **Đọc 84 bài (14/bậc), nghe 86 bài (12–16/bậc), đề Viết/Nói 19 đề, cụm từ 8 bộ (120 câu):** mỏng cho dùng lặp lại. Bài xếp trình độ tổng hợp lấy 3 bài đọc và 3 bài nghe mỗi bậc làm ngân hàng riêng (khoảng 21% mỗi kỹ năng) khiến phần luyện còn 11 bài/bậc.
- **Chưa có:** phát âm/shadowing, hội thoại tương tác (nói qua lại), tóm tắt/diễn đạt lại (mediation, CEFR Companion Volume), chiến lược học (có trong `Master_List`, sheet Strategies). Ngoài phạm vi các bước tiếp theo trừ khi chủ dự án chọn.
- **Chưa có chế độ "đầu vào dễ hiểu"** (đọc/nghe thư giãn, câu hỏi mở tự đối chiếu) dù có sẵn lời nhắc (`docs/prompt-sinh-noi-dung.md` mục 10.6).

## 4. Lời nhắc và quy trình đã có, còn thiếu để lấp khoảng trống
| Cần soạn | Quy trình/lời nhắc | Trạng thái |
|---|---|---|
| Câu ngữ pháp trắc nghiệm mới (mở rộng chuyên đề đang có) | `gen-items` → `review-items` | Có (chưa thử với Gemini thật) |
| Bài đọc / bài nghe mới | `gen-passages` → `review-passages` | **Có (mới, chưa thử với Gemini thật)** |
| **Chuyên đề ngữ pháp mới** (lý thuyết: các mục dạy, công thức, từ nhận biết, lỗi thường gặp có `usageIds`) | Cần lời nhắc sinh lý thuyết (dựa lời nhắc cũ `prompt soạn nội dung.txt` đã sửa: mỗi mục dạy có `id`, lỗi thường gặp dạng có cấu trúc, cấp độ theo mục) rồi mới sinh câu | **Chưa có** |
| Từ vựng bổ sung (định nghĩa, ví dụ, nghĩa Việt) | Cần script + lời nhắc + kiểm bằng mã + giáo viên duyệt nghĩa Việt | **Chưa có** |
| Bộ cụm từ kết hợp | Lời nhắc theo mẫu `collocations/en/sets.json` | **Chưa có** |
| Đề Viết/Nói theo bậc | Lời nhắc sinh đề bám mô tả "can-do" của bậc | **Chưa có** |
| Đầu vào dễ hiểu (đọc/nghe tự nhiên) | Lời nhắc (mục 10.6) + mode trong app | Lời nhắc có; app chưa có |

## 5. Đề xuất thứ tự (để chủ dự án duyệt)
1. Soạn chuyên đề **Câu hỏi** và **Động từ khuyết thiếu ở quá khứ + used to** (khoảng trống lớn nhất, nội dung nền). Cần lời nhắc sinh lý thuyết trước.
2. Bổ sung **từ vựng A1–A2** (nền) với giáo viên duyệt nghĩa Việt.
3. Mở rộng **đọc/nghe** bằng `gen-passages` để bù phần đã dành cho placement.
4. Các chuyên đề còn lại ở mục 1 theo thứ tự trên.

## Đã bù (26/10/2026)
Chuyên đề `questions` (Câu hỏi, gồm câu hỏi gián tiếp cơ bản) và `past-modals` (modal quá khứ, used to/would) đã thêm. Còn thiếu: mệnh đề danh ngữ mở rộng, mẫu động từ + tân ngữ, trạng từ, danh từ/đại từ A1–A2.
