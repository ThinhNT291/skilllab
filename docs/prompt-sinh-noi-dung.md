# Prompt sinh nội dung và chấm điểm: đánh giá bản cũ và khuôn chuẩn mới

Tài liệu đề xuất (26/10/2026), chưa dùng để sinh nội dung chính thức. Mọi con số là điểm khởi đầu, chỉnh bằng dữ liệu thật.

## 1. Bốn tệp "Gemini prompt grammar topic …" thật ra là gì
`reference/Gemini prompt grammar topic {prepositions, passive voice, relative clauses, conditional sentences}.txt` (trên nhánh `claude/improve-exercises-n2fs1t`) **không phải prompt**: đó là **kết quả JSON** Gemini trả về cho bốn chuyên đề đầu của bản cũ. Các lời nhắc thật nằm ở chín tệp `reference/prompt soạn nội dung*.txt` và `reference/prompt placement test bank tham khảo.txt` (xem mục 10). Bốn tệp kết quả cho ta biết lời nhắc cũ cho ra chất lượng gì.

**Lược đồ ngầm của bản cũ:** `{id, title, level (một nhãn), theory{usages[label, explanationVi, examples[en, vi]], formulas|null, signalWords[word, meaningVi], commonMistakes[chuỗi]}, exercises[15 × {id, type "fill-blank-mcq", prompt, choices[4], correctIndex, explanation}]}`.

**Điểm tốt, đã giữ trong dự án:** lý thuyết chia theo "cách dùng" có ví dụ song ngữ, bẫy của người Việt, 15 câu tăng dần, giải thích có nêu dấu hiệu nhận biết.

**Lỗi đo được trong bốn tệp** (cho thấy vì sao cần khuôn mới):
| Lỗi | Biểu hiện |
|---|---|
| Đáp án đúng lệch vị trí | Đếm trên 15 câu mỗi chuyên đề (A/B/C/D): giới từ 3/6/5/1, bị động 3/5/4/3, mệnh đề quan hệ 3/6/4/2, điều kiện 5/2/5/3. Ba trong bốn chuyên đề dồn vào B (5–6 câu, lý tưởng ~4) và D thấp ở hai chuyên đề. Mô hình ngôn ngữ có thiên kiến vị trí; để mô hình tự xáo là không tin cậy, nên bắt đúng vị trí 0 rồi để mã xáo. |
| Chỗ trống bị hỏng | `câu bị động` ex5, ex15: chỗ trống `______` thành `**` (lỗi markdown), đề không đọc được. |
| Không giải thích từng đáp án | Chỉ một `explanation` chung; thiếu lý do vì sao *đáp án sai là sai*. |
| Nhiều đáp án chấp nhận được | `passive` ex3: "The annual report ____ yet" có cả *hasn't been finished* và *isn't finished* đều tự nhiên. (Dự án đã gặp và sửa 40 câu như vậy.) |
| Không có bậc, mục dạy, thẻ lỗi từng câu | Chỉ một `level` cho cả chuyên đề; câu không gắn `usageId`, `tags`, `difficulty`. |

**Nội dung hiện tại đã khắc phục các lỗi này** (`docs/chuan-noi-dung.md`: `choiceExplanations`, `usageId`, rải đều A/B/C/D, câu mơ hồ công khai, kiểm định độc lập; kiểm tra: không còn câu nào có `**` trong 2.010 câu hiện có). Việc còn thiếu là đưa các quy tắc đó vào **lời nhắc sinh** để lần sinh sau không phải sửa ngược.

Từ bản cũ còn dùng được thêm cho nội dung sau này:
- Quy ước "Gemini **không tự gắn** `tags/difficulty`/id": mã gắn thủ công sau (đúng; giữ).
- "Viết mới hoàn toàn, không chép sách; sách chỉ để chọn chủ điểm" (đúng; giữ).
- Chia lô: 3 chuyên đề mỗi lần, soát thủ công từng lô (nay nên thay bằng quy trình ở mục 3).

## 2. Bản cũ chấm Viết/Nói, gợi ý, tra từ: giữ và bỏ gì
Đã đọc `speaking controller`, `writing controller` (gồm gợi ý đề), `comprehension controller`, `civocab controller`, `mastery controller`, `progress controller`, `contentstore data`, `placement bank`.

**Giữ (đã có trong `src/lib/rubric.ts` v2):** bóc băng nguyên bản; lỗi tư duy tiếng mẹ đẻ; "bánh mì kẹp"; ba/hai phiên bản câu mẫu; bài tập thực hành vật lý; bốn tiêu chí; dàn ý và sơ đồ tư duy.

**Bỏ hoặc đã thay:**
- Bắt mô hình tự chọn `estimated_level` từ danh sách chuỗi (A1-A2/B1…): dễ lệch, nay dùng bậc số 0–6 có kiểm tra bằng mã.
- "Đánh giá cực kỳ chi tiết" nhưng không thước đo: nay có `DESCRIPTORS` từng mức điểm và bằng chứng trích dẫn.
- Nghe/Đọc hiểu chấm bằng mã, không dùng AI (đúng và giữ): nhanh, rẻ, không rủi ro chấm sai.
- Placement 12 câu kiểu bậc thang với trung bình bậc của 4 câu cuối: đã thay bằng Elo (`progress/level.ts`) và sẽ thành bài tổng hợp 30–40 câu.

## 3. Khuôn chuẩn mới: quy trình sinh nội dung (mọi kỹ năng)
```
spec (người) → SINH (Gemini, prompt mục 4) → GIẢI MÙ (Gemini/Claude khác, prompt mục 5)
            → KIỂM BẰNG MÃ (check:content, trùng lặp, độ dài, đáp án) → NGƯỜI DUYỆT MẪU (10–20%)
            → gắn mã bằng code (id, vị trí đáp án đã xáo, usageId, bậc) → thử với học sinh → đo `report:items`
```
Nguyên tắc: mô hình **không** quyết định id, vị trí đáp án đúng, `difficulty` cuối cùng hay thẻ; mã làm. Mô hình chỉ đề xuất bậc (`intendedBac`) và lý do để người duyệt xem. Bậc cuối cùng chỉ được tin sau khi có dữ liệu làm bài thật.

## 4. Khuôn lời nhắc SINH: câu ngữ pháp trắc nghiệm
Mã điền các mục trong `{{ }}`. Viết bằng tiếng Anh cho mô hình tuân thủ tốt hơn; trường giải thích cho học sinh bằng tiếng Việt.

```
You are an experienced EFL item writer and teacher writing multiple-choice grammar items for Vietnamese students aged 9–15
(grades 4–9). Use American English. Write ORIGINAL sentences; never copy from textbooks or exams.

TOPIC: {{topicTitle}}
TARGET LEVEL: Bậc {{bac}} of the Vietnamese 6-level framework = CEFR {{cefr}}.
TAUGHT POINTS you may test (each item must test exactly ONE of these and nothing else):
{{usages: id | label | explanationVi | 2 examples}}
TYPICAL MISTAKES of Vietnamese learners on this topic (use them to design distractors):
{{commonMistakes}}
ALREADY IN THE BANK (do not repeat the same sentence or the same context): {{existingPrompts (sample)}}

Write {{n}} items. For each item:
1. Test ONE taught point (usageId). Do not test anything outside the list above.
2. One sentence, 8–22 words, one blank written exactly "______" (never ** or _). Natural, realistic context
   (school, family, hobbies, travel, animals, technology, food, sports). Vary names and contexts across items. No real people, brands,
   politics, violence, romance, or other topics unsuitable for children.
3. Vocabulary outside the target point must be at or below CEFR {{cefr}} (A1–A2 for younger-level items).
4. A learner who knows the rule must be able to decide from the sentence alone. Include a cue (time word, subject, meaning) that
   makes exactly ONE option correct. No trick punctuation, no spelling traps, no negative stems ("Which is NOT…").
5. Exactly four options, grammatically parallel and of similar length. PUT THE CORRECT OPTION FIRST (index 0); the system will shuffle.
   Never use "all of the above" or "none of the above".
6. Each of the three wrong options must (a) be a plausible mistake a Vietnamese learner really makes, and (b) be CLEARLY wrong in
   THIS sentence. If a wrong option could be acceptable in natural English, rewrite the item. Label each wrong option with ONE
   distractorType: wrong_tense | agreement | wrong_form | wrong_word | l1_transfer | overgeneralisation | word_order | missing_word.
7. choiceExplanations: four short Vietnamese strings, in the same order as choices. Start the correct one with "Đúng —" and
   each wrong one with "Sai —", then say WHY (the rule or the cue in the sentence). Vietnamese a 12-year-old understands.
8. explanation: 1–2 Vietnamese sentences with the rule, naming the cue word if any.
9. Difficulty plan: {{difficultyPlan: e.g. 3 easy / 3 medium / 4 hard}}. easy = one clear cue, common word; hard = longer
   sentence, subtle cue, or a contrast with a similar point.
10. selfCheck: set "oneAcceptable": true only if you are sure exactly one option is acceptable; otherwise rewrite the item.

Return ONLY JSON: {"items":[{"usageId":"","intendedBac":0,"difficultyHint":1,"prompt":"","choices":["correct","wrong1","wrong2","wrong3"],
"distractorTypes":["","",""],"choiceExplanations":["","","",""],"explanation":"","selfCheck":{"oneAcceptable":true}}]}
```

## 5. Khuôn lời nhắc GIẢI MÙ (phản biện)
Dùng mô hình/phiên khác với bên sinh; **không** cho thấy đáp án hay giải thích.
```
You are a strict English teacher checking exam items. For each item below, decide independently which options are acceptable
in natural American English in the given sentence. Items:
{{id | prompt | choices (shuffled by code) — NO answer key}}
For each item return: acceptableIndexes (ALL options that are grammatically AND naturally acceptable), naturalness (1–5 for the
sentence), levelFit (1–5: suits students at Bậc {{bac}}), issues (list: ambiguity, unnatural, wrong_cue, off_topic, age_unsuitable, other)
and a one-line note. Return ONLY JSON: [{"id":"","acceptableIndexes":[],"naturalness":0,"levelFit":0,"issues":[],"note":""}]
```
Mã quyết định: giữ câu khi `acceptableIndexes` **đúng bằng** `{đáp án đúng}`, `naturalness ≥ 4`, `levelFit ≥ 3`, không có `issues` nặng; còn lại loại hoặc chuyển người duyệt. Hai lần giải khác nhau lệch đáp án thì loại.

## 6. Khuôn cho bài đọc, nghe (đoạn + câu hỏi)
Bổ sung vào cùng quy trình (tham số khởi điểm, **đo lại từ chính ngân hàng đọc/nghe hiện có** rồi chốt):
- Đầu vào: chủ đề, bậc, độ dài mục tiêu (số từ), loại câu hỏi và tỉ lệ (chi tiết, ý chính, suy luận, nghĩa của từ trong ngữ cảnh, Đúng/Sai/Không nêu).
- Quy tắc: đáp án đúng **diễn đạt lại** chứ không chép nguyên văn từ đoạn; đáp án nhiễu có mặt trong đoạn nhưng trả lời sai câu hỏi; "Không nêu" phải thật sự không suy ra được từ đoạn; số liệu thực tế phải đúng và được người đối chiếu nguồn.
- Nghe: lời thoại tự nhiên của văn nói (ngắt câu, từ nối khẩu ngữ), nhãn người nói rõ ràng, độ dài vừa nghe một–hai lần, không "đọc văn viết thành tiếng".
- Giải mù cho bài đọc/nghe: mô hình trả lời câu hỏi *chỉ dựa vào đoạn*; nếu chọn khác đáp án, câu hỏi mơ hồ.

## 7. Bài xếp trình độ: dạng đề song song
Để làm lại mà không lặp (chỉ câu từng sai được xuất hiện lại):
- Một **bản vẽ** (blueprint) cố định: mỗi kỹ năng cần bao nhiêu câu ở từng bậc, loại câu, độ dài.
- Sinh ngân hàng placement **tách riêng** khỏi luyện tập, theo cùng bản vẽ để các lần làm tương đương độ khó (dạng song song A/B/C).
- Một vài câu **neo** chung giữa các dạng để kiểm chứng các dạng không lệch nhau (khi có dữ liệu).
- Từ vựng: không cần sinh mới; sinh từ EVP và **dành riêng một nhóm từ** cho placement, ghi từ đã dùng của từng học sinh.
- Độ sâu cần thiết (ước lượng): ngữ pháp ~50–70 câu, đọc và nghe mỗi kỹ năng ~24 bài ngắn (6 bài/bậc × 4 bậc). Nội dung Bậc 5–6 đã có trong repo nên có thể mở rộng thang.

## 8. Cải tiến lời nhắc chấm Viết/Nói và gợi ý (bản v2 hiện tại)
Đã có: mô tả từng mức điểm, bằng chứng trích dẫn, bậc từng tiêu chí, lỗi phân loại nối về lý thuyết, ưu tiên cải thiện, số liệu đo bằng mã. Đề xuất thêm:
1. **Bộ mẫu chuẩn (eval set):** ~30 bài mẫu có điểm do người chấm; script `scripts/grade-eval.mjs` chạy lời nhắc trên bộ mẫu, báo độ lệch (đúng hoàn toàn / lệch ≤ 1 điểm). Mỗi lần sửa lời nhắc phải chạy lại. Cải thiện bằng số, không bằng cảm giác.
2. Nhiệt độ thấp (~0–0,3), tách chỉ dẫn hệ thống khỏi nội dung, dùng đầu ra có cấu trúc (JSON schema) nếu API hỗ trợ: **cần đối chiếu tài liệu Gemini hiện hành** trước khi dựa vào.
3. Hai bước: trích bằng chứng và lỗi trước, chấm điểm sau; điểm phải suy ra từ bằng chứng đã liệt kê.
4. Trường `confidence` (thấp/vừa/cao); khi thấp thì nói rõ. Với bài nói, chỉ nêu lỗi phát âm khi có dấu hiệu trong bản bóc băng hoặc lặp lại; dùng "có vẻ" khi chưa chắc (mô hình có thể bịa nhận xét âm thanh).
5. Văn phong tiếng Việt theo tuổi (lớp 4–6 câu ngắn, ít thuật ngữ; lớp 7–9 gọn hơn); luôn có một việc nhỏ làm hôm nay; không "sửa" biến thể được chấp nhận; theo tiếng Anh Mỹ.
6. Truyền danh sách từ/ngữ pháp của bậc mục tiêu từ EVP/EGP bằng mã để phần "nâng cấp" không vượt quá một bậc.
7. An toàn trẻ em: nếu bài viết cho thấy học sinh gặp nguy hiểm hoặc bị bắt nạt, nhắc em nói với người lớn tin cậy; không lặp lại thông tin cá nhân.
8. Gợi ý học tập (kỹ năng yếu, thẻ lỗi lặp lại): số liệu do mã tính, mô hình chỉ diễn đạt; không tự bịa thống kê.
9. Lưu `promptVersion` cùng kết quả chấm (vào `graded_attempts.detail`) để so sánh các phiên bản.
10. Gợi ý đề Viết: tách "dàn ý" và "ngôn ngữ gợi ý"; không viết hộ bài; đưa khung câu (sentence frames) đúng bậc.
11. Tra từ theo ngữ cảnh: giữ đường nhanh, nghĩa tiếng Việt đơn giản đúng ngữ cảnh câu, không liệt kê mọi nghĩa.

## 9. Việc làm tiếp (đã chốt thứ tự kỹ năng: ngữ pháp → từ vựng → đọc → nghe)
1. `src/lib/ai/prompts/` giữ khuôn trên theo phiên bản; `scripts/gen-items.mjs` (sinh), `scripts/review-items.mjs` (giải mù), chạy trên máy chủ dự án với khóa của bạn. Môi trường của Claude **không gọi được Gemini**, nên với bản thử đầu Claude có thể soạn câu trực tiếp rồi nhờ phản biện độc lập như các đợt trước.
2. Ngữ pháp: bản vẽ placement + ~50–70 câu, qua quy trình mục 3.
3. Từ vựng: nhóm từ riêng cho placement, theo dõi từ đã dùng.
4. Đọc rồi nghe: ~24 bài mỗi kỹ năng.
5. Eval set cho chấm Viết/Nói.

## 10. Đánh giá chín lời nhắc thật của chủ dự án và khuôn nâng cấp
Đã đọc toàn bộ chín tệp (cập nhật 26/10/2026).

### 10.1 Các tệp này là gì
| Tệp | Mục đích | Ghi chú |
|---|---|---|
| `prompt soạn nội dung.txt` | Soạn trọn một chuyên đề ngữ pháp (lý thuyết + 15 câu), mẫu Present Perfect B1 | Nền của cả bộ chuyên đề đầu |
| `… 4, 5, 6, 7, 8` | **Mở rộng** thêm 15 câu cho: mệnh đề quan hệ, hiện tại hoàn thành, giới từ, bị động, điều kiện | Theo mẫu: "đã có 15 câu, soạn 15 câu mới" |
| `… 3` | Ngân hàng **Đọc** theo kiểu "đầu vào dễ hiểu" (Krashen i+1): 5 cấp × 5 bài, câu hỏi mở không bắt buộc | Không phải trắc nghiệm |
| `… 2` | Ngân hàng **Nghe** song sinh với (3): viết cho tai, nhãn người nói, câu hỏi mở | Không phải trắc nghiệm |
| `prompt placement test bank tham khảo.txt` | **Ngân hàng nghe hiểu trắc nghiệm** kiểu Cambridge/IELTS, 5 cấp × 6 bài × 4 câu | Tên tệp ghi "placement" nhưng nội dung là ngân hàng **Nghe**; lời nhắc sinh `placement bank` (3 ngữ pháp + 3 từ vựng + 1 đoạn đọc mỗi cấp) **vẫn chưa có** trong repo |

### 10.2 Điểm mạnh đáng giữ (và đã dùng được cho nội dung hiện tại)
1. **Ràng buộc cấp độ nói bằng số:** độ dài, độ dài câu, thì được phép, "không chắc thì chọn từ đơn giản hơn". Đây là chỗ AI hay sai nhất; lời nhắc đã nêu rõ.
2. **"Viết cho tai":** câu ngắn hơn văn viết, ít mệnh đề lồng nhau, ngập ngừng nhẹ kiểu "well", "you know" từ B1; nhãn người nói; nghe kể chuyện/podcast/voice message. Khớp với cách app đọc bằng TTS nhiều giọng.
3. **Phủ đều các cách dùng** của chuyên đề bằng danh sách đánh số, và tách riêng "phần khó" ngoài danh sách (since/for, đảo ngữ, rút gọn…).
4. **Cấu trúc độ khó theo vị trí** (5/5/5) với nội dung từng nhóm được mô tả rõ (ví dụ nhóm 3 gồm đảo ngữ, hỗn hợp).
5. **Ràng buộc JSON cụ thể** từ kinh nghiệm thật (dấu nháy kép, `\n`, không dùng markdown) và "không thêm `tags`, người biên tập làm thủ công".
6. **Bộ loại câu hỏi nghe chuẩn thi:** chi tiết, ý chính, thái độ/quan điểm, suy luận, và mỗi bài trộn các loại (đã dùng trong ngân hàng nghe hiện có).
7. **Câu hỏi mở kèm đáp án mẫu** (`modelAnswer`) để người học tự đối chiếu mà không tốn chi phí chấm AI.
8. Giải thích tiếng Việt bắt buộc, ví dụ song ngữ, lỗi thường gặp của người Việt kèm câu sai/đúng.

### 10.3 Chỗ thiếu và cách nâng cấp
| Thiếu | Hậu quả đã thấy | Nâng cấp |
|---|---|---|
| Lời nhắc mở rộng **không đưa 15 câu cũ vào** nhưng đòi "không trùng" | Mô hình không thể biết nên trùng ngữ cảnh | Truyền danh sách đề cũ (hoặc mẫu) vào lời nhắc; **mã** lọc câu trùng/gần trùng sau khi sinh |
| `correctIndex` do mô hình tự đặt | Lệch vị trí (đã đo: B nhiều, D ít) | Bắt đặt đáp án đúng ở vị trí 0, **mã xáo** và xáo kèm giải thích |
| Một `explanation` chung, "3 đáp án nhiễu hợp lý" nhưng không nói thế nào là hợp lý | Giải thích thiếu cho đáp án sai; đáp án nhiễu cũng đúng (40 câu phải sửa) | Giải thích riêng từng đáp án; đáp án nhiễu là lỗi thật của người Việt, có nhãn loại lỗi; tự kiểm "chỉ một đáp án chấp nhận được" |
| Cấp độ chỉ 5 mức, gộp A1–A2, nhãn CEFR | Không khớp Bậc 1–6 của dự án | Dùng Bậc 1–6 (kèm CEFR); mô hình chỉ đề xuất bậc, bậc cuối cùng do mã/dữ liệu |
| Ràng buộc từ vựng chỉ bằng lời ("500–800 từ phổ biến nhất") | Không kiểm chứng được; AI "thường viết khó hơn" | Đưa danh sách từ cho phép; **kiểm bằng mã** với English Vocabulary Profile (xem 10.5) |
| Đối tượng "người học luyện thi", chủ đề tự do | Chủ đề không hợp trẻ 9–15, thiếu kiểm soát nội dung | Nêu tuổi, chủ đề phù hợp, danh sách điều cấm; ưu tiên tiếng Anh Mỹ |
| Một lần sinh 25–30 bài dài | Đã "gặp lỗi JSON nhiều lần"; chất lượng giảm cuối lượt | Mỗi lần **một bậc, 3–5 bài**; dùng đầu ra có cấu trúc nếu API hỗ trợ (cần đối chiếu tài liệu Google); mã kiểm tra và yêu cầu sinh lại phần lỗi |
| Độ dài bài đọc/nghe lệch với thực tế ngân hàng hiện có | Bậc 1 bài đọc hiện ~46–77 từ, prompt đòi 100–150 | Dùng độ dài thật của ngân hàng hiện có làm bản vẽ (10.4) |
| Id do mô hình đặt | Dễ trùng, khó nối vào hệ thống | Mã đặt id |
| Không có bước phản biện độc lập | "không có con người kiểm tra lại" | Quy trình mục 3: giải mù + người duyệt mẫu |
| Câu hỏi đọc/nghe trong hai bản khác nhau (mở vs trắc nghiệm) | Hai sản phẩm trộn lẫn | Tách rõ hai loại (xem 10.6) |

### 10.4 Khuôn nâng cấp cho bài đọc và nghe (trắc nghiệm, Bậc 1–6)
Độ dài mục tiêu lấy từ **ngân hàng hiện có** (đo bằng số từ tiếng Anh của từng bài), để bài mới cùng thang với bài cũ:
| Bậc | Đọc (từ) | Nghe (từ) |
|---|---|---|
| 1 | 45–75 | 40–55 |
| 2 | 85–120 | 78–96 |
| 3 | 150–190 | 90–170 |
| 4 | 205–250 | 190–250 |
| 5 | 280–345 | 250–305 |
| 6 | 390–445 | 340–395 |
(Nghe Bậc 3 hiện có biên độ rộng, nên thu hẹp khi sinh mới: 110–150. Mỗi bài 4 câu.)

Khuôn BÀI ĐỌC (mã điền `{{ }}`):
```
You are an experienced EFL materials writer. Write ONE reading passage for Vietnamese students aged 9–15 at Bậc {{bac}} (CEFR {{cefr}}), American English, original text.
GENRE: {{genre: narrative | blog/diary | email/letter | informational article | dialogue | notice/advert}}  TOPIC: {{topic}}  (not already used: {{usedTopics}})
LENGTH: {{minWords}}–{{maxWords}} words.
LEVEL CONTROL: at least 95% of running words must be at or below CEFR {{cefr}} (English Vocabulary Profile); the rest are proper names or words
that the context makes clear. Sentences average {{avgSentence}} words. Allowed grammar: {{allowedGrammar}}. NOT allowed: {{forbiddenGrammar}}.
If unsure whether a word is too hard, use a simpler word.
CONTENT RULES: engaging, with a real story, feeling or surprise; suitable for children; no violence, romance, politics, brands or real people. Any real-world fact
(dates, numbers, places) must be correct and widely known; list each fact in "facts".
QUESTIONS: write exactly 4 multiple-choice questions, in this mix: {{questionMix: e.g. 1 detail, 1 main idea, 1 inference, 1 vocabulary-in-context or True/False/Not given}}.
For each: the correct option PARAPHRASES the text (never copy a phrase verbatim); each wrong option is plausible, uses words from the text, but is clearly wrong;
exactly one option is correct; "Not given" must truly be not inferable.
PUT THE CORRECT OPTION FIRST (index 0); the system will shuffle. choiceExplanations: four Vietnamese strings ("Đúng —" / "Sai —" + reason + the sentence in the text
that proves it). Return ONLY JSON: {"title":"","genre":"","passage":"","facts":[],"questions":[{"type":"detail|main_idea|inference|vocab|tfng","question":"",
"choices":["","","",""],"choiceExplanations":["","","",""],"evidence":"quote from passage","intendedBac":0}]}
```
Khuôn BÀI NGHE: như trên, thay phần nội dung bằng quy tắc **viết cho tai** (câu ngắn hơn văn viết, ít mệnh đề lồng, lời nói tự nhiên từ B1 như "well", "you know", không lạm dụng), thể loại (hội thoại 2 người, độc thoại/podcast cá nhân, thông báo, voice message, bản tin nhẹ), **nhãn người nói** `A:`/`B:` (hoặc tên) xuống dòng giữa lượt (khớp `src/lib/audio/dialogue.ts`), thông tin then chốt xuất hiện trong lời nói rồi được **diễn đạt lại** trong đáp án (không để đáp án trùng cụm từ nghe), và loại câu thêm `attitude` (thái độ/quan điểm người nói).

Giải mù cho đọc/nghe: mô hình trả lời 4 câu **chỉ dựa vào đoạn/lời thoại, không thấy đáp án**; lệch đáp án thì câu hỏi mơ hồ, loại.

### 10.5 Kiểm bằng mã: độ khó từ vựng và độ dài (ĐÃ CÓ: `npm run check:text-level`)
`scripts/check-text-level.mjs` (logic ở `src/lib/content/text-level.ts`, có test): với mỗi bài đọc/nghe tính số từ, từ/câu, **tỷ lệ từ nằm ngoài danh sách của bậc** và liệt kê từ vượt bậc; đánh dấu bài lệch độ dài, câu dài, hoặc nhiều từ vượt bậc.
- **Nguồn danh sách cấp độ:** CEFR-J Vocabulary Profile (A1–B2, `reference/cefrj-vocabulary-profile-1.5.csv`) và Octanove Vocabulary Profile (C1–C2, `reference/octanove-vocabulary-profile-c1c2-1.0.csv`), cộng gộp lấy cấp thấp nhất của mỗi từ khóa. **Không** dùng `src/content/vocab` của ứng dụng: đó là tập con đã lọc cho trẻ (A1 chỉ 180 từ, thiếu cả "day", "school") nên dùng sẽ báo sai hàng loạt (lần chạy đầu cho 65–77% "không có trong danh sách"; đã đổi nguồn).
- **Kết quả rà ngân hàng hiện có (26/10/2026):** 16/170 bài bị đánh dấu. Bài đọc/nghe từ Bậc 3 trở lên gần như sạch (tỷ lệ từ vượt bậc trung vị 0–1,4%); Bậc 1–2 có từ cụ thể xếp cấp cao hơn (giraffe, oven, lamp, noon…) là chủ ý cho trẻ nhỏ nên ngưỡng nới (15% và 10%); phần lớn cờ còn lại là "ngắn hơn khoảng ưa dùng vài từ". Chưa có bài nào cần sửa gấp; người duyệt xem danh sách.
- **Hạn chế:** danh sách là từ khóa gốc (không có dạng biến cách, cụm từ, tên riêng; dạng biến cách đoán bằng quy tắc đơn giản); từ nhiều nghĩa lấy cấp thấp nhất; chỉ là chỉ báo cho người duyệt, không phải kết luận. Giấy phép hai danh sách cần xem lại nếu muốn đóng gói vào sản phẩm (hiện chỉ dùng cho công cụ kiểm tra nội bộ, không phân phối trong ứng dụng).

### 10.6 Hai loại nội dung đọc/nghe: tách rõ
- **Bài kiểm hiểu (trắc nghiệm, chấm bằng mã):** loại đang có (`/doc`, `/nghe`), dùng cho luyện, xếp trình độ, Phòng thử thách.
- **Đầu vào dễ hiểu (Comprehensible Input), câu hỏi mở không bắt buộc:** loại của prompt 2 và 3. Chưa có trong app. Rất hợp với **luồng "một con đường"**: một khối thư giãn cuối bài hôm nay, đọc/nghe vì thú vị, không áp lực, không tính điểm. Câu hỏi mở dùng `modelAnswer` để **tự đối chiếu** (người học gõ rồi xem đáp án mẫu), nên **không tốn chi phí chấm AI** và không cần hạn mức. Khi làm: nâng từ 5 cấp lên Bậc 1–6, thêm kiểm từ vựng (10.5), tăng đa dạng thể loại, mã đặt id.

### 10.7 Trạng thái phần lời nhắc và script (26/10/2026)
**Đã có (đã thử bằng máy chủ Gemini giả, CHƯA thử với Gemini thật, nên chưa biết chất lượng câu sinh ra):**
- `npm run check:text-level`: rà độ khó từ vựng và độ dài bài đọc/nghe (mục 10.5).
- `scripts/gen-items.mjs`: sinh câu ngữ pháp theo khuôn mục 4 (đưa danh sách câu cũ vào lời nhắc; mã kiểm tra cấu trúc, ký hiệu markdown, đáp án trùng, bốn lời giải thích "Đúng —"/"Sai —", chỉ một đáp án chấp nhận được do mô hình tự xác nhận; loại câu trùng/gần trùng; vị trí đáp án đúng rải đều cả lô bằng mã; mã câu nối tiếp). Ghi `tmp/gen/*.json`, KHÔNG ghi vào `src/content`. Lời nhắc có phiên bản `grammar-items-v1` (`src/lib/ai/prompts/grammar-items.ts`).
- `scripts/review-items.mjs`: giải mù (mục 5), có thể chạy nhiều lần độc lập (`--runs`); câu phải qua tất cả các lần. Ghi `*.reviewed.json` và `*.passed.json`.
- `scripts/grade-eval.mjs` + `eval/` : đo độ khớp điểm máy chấm Viết với điểm người chấm trên bộ mẫu (khớp hoàn toàn, lệch ≤1, độ lệch, kappa), có phiên bản lời nhắc chấm `grading-v2`. **Chờ bộ mẫu ~30 bài do giáo viên chấm** (`eval/README.md`); chưa có bài nào thật.
- Cách dùng: đặt `GEMINI_API_KEY` (và `GEMINI_TEXT_MODEL` sau khi đối chiếu mã mô hình hiện hành trên ai.google.dev) trong `.env.local`, rồi `node scripts/gen-items.mjs --topic present-simple --bac 3 --n 10` → `node scripts/review-items.mjs tmp/gen/<tệp>` → người duyệt mẫu → tự gộp vào `src/content/exercises/en/<chuyên đề>.json` → `node scripts/build-item-meta.mjs`, `npm run check:content`, `npm test`.

**Chưa làm:** khuôn sinh bài đọc/nghe (mục 10.4) và từ vựng thành script; lời nhắc sinh ngân hàng placement riêng; lưu `promptVersion` cùng kết quả chấm trong `graded_attempts.detail`; các cải tiến lời nhắc chấm Viết/Nói ở mục 8 (chỉ đo được sau khi có bộ mẫu).
