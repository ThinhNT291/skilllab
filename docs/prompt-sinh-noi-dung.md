# Prompt sinh nội dung và chấm điểm: đánh giá bản cũ và khuôn chuẩn mới

Tài liệu đề xuất (26/10/2026), chưa dùng để sinh nội dung chính thức. Mọi con số là điểm khởi đầu, chỉnh bằng dữ liệu thật.

## 1. Bốn tệp "Gemini prompt grammar topic …" thật ra là gì
`reference/Gemini prompt grammar topic {prepositions, passive voice, relative clauses, conditional sentences}.txt` (trên nhánh `claude/improve-exercises-n2fs1t`) **không phải prompt**: đó là **kết quả JSON** Gemini trả về cho bốn chuyên đề đầu của bản cũ. **Lời nhắc gốc không còn trong repo**. Nếu bạn còn lịch sử trò chuyện Gemini cũ thì dán đoạn lời nhắc vào `reference/`; nếu không, bốn tệp cho ta biết *lời nhắc cũ đã đòi gì* (lược đồ ngầm) và chất lượng nó cho ra.

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
