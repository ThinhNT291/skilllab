import test from "node:test"
import assert from "node:assert/strict"
import { nextPassageIds, speakerLabels, toPassageJsons, validateRawPassage, type RawPassage } from "../src/lib/content/passage-gen.ts"
import { buildPassagePrompt, buildPassageReviewPrompt, GRAMMAR_BY_BAC, passesPassageReview } from "../src/lib/ai/prompts/passages.ts"

const words = (n: number) => Array.from({ length: n }, (_, i) => (i % 9 === 8 ? "park." : "dog")).join(" ")
const TEXT = `Tom has a small dog named Max. ${words(52)} On Sunday they walk in the big park near the river.`
const mc = (over = {}) => ({ type: "detail", question: "Where do they walk on Sunday?", choices: ["In a green place by the water", "At school", "In a shop", "On a bus"], choiceExplanations: ["Đúng — công viên gần sông.", "Sai — không phải trường.", "Sai — không phải cửa hàng.", "Sai — không phải xe buýt."], explanation: "Bài nói họ đi dạo trong công viên gần sông.", evidence: "they walk in the big park near the river", ...over })
const tf = (over = {}) => ({ type: "tfng", question: "True, False, or Not given? Tom has a cat.", answer: "False", choiceExplanations: ["Sai — không đúng.", "Đúng — Tom có chó, không có mèo.", "Sai — bài có nói."], explanation: "Tom có một con chó.", evidence: "Tom has a small dog named Max", ...over })
const raw = (over: RawPassage = {}): RawPassage => ({ title: "A Walk", genre: "narrative", text: TEXT, facts: [], intendedBac: 1, questions: [mc(), mc({ question: "Who is Max?", evidence: "Tom has a small dog named Max" }), tf(), mc({ question: "What day is it?", evidence: "On Sunday" })], ...over })

test("bài hợp lệ qua kiểm tra; lỗi được liệt kê (độ dài, bằng chứng, giải thích, số câu)", () => {
  const ok = validateRawPassage(raw(), "reading", 1)
  assert.equal(ok.ok, true, ok.ok ? "" : ok.reasons.join("|"))
  const bad = validateRawPassage(raw({ text: "Too short text here.", questions: [mc({ evidence: "không có trong bài" }), mc({ choiceExplanations: ["x", "y", "z", "w"] }), tf({ answer: "Maybe" })] }), "reading", 1)
  assert.equal(bad.ok, false)
  if (!bad.ok) {
    const r = bad.reasons.join(" | ")
    for (const needle of ["ngoài khoảng", "evidence không có trong bài", "Đúng —", "answer phải là", "cần đúng 4 câu hỏi"]) assert.ok(r.includes(needle), needle)
  }
})

test("câu Đúng/Sai/Không nêu: Not given không cần bằng chứng, True/False cần; tối đa 2; đáp án đúng không chép nguyên văn", () => {
  assert.equal(validateRawPassage(raw({ questions: [mc(), mc({ question: "Q2?" }), tf({ answer: "Not given", evidence: null, choiceExplanations: ["Sai — a.", "Sai — b.", "Đúng — không nói."] }), mc({ question: "Q4?" })] }), "reading", 1).ok, true)
  const noEv = validateRawPassage(raw({ questions: [mc(), mc({ question: "Q2?" }), tf({ evidence: null }), mc({ question: "Q4?" })] }), "reading", 1)
  assert.ok(!noEv.ok && noEv.reasons.some((r) => r.includes("cần evidence")))
  const many = validateRawPassage(raw({ questions: [tf(), tf(), tf(), mc()] }), "reading", 1)
  assert.ok(!many.ok && many.reasons.some((r) => r.includes("quá nhiều")))
  const copy = validateRawPassage(raw({ questions: [mc({ choices: ["they walk in the big park near the river", "At school", "In a shop", "On a bus"] }), mc({ question: "Q2?" }), tf(), mc({ question: "Q4?" })] }), "reading", 1)
  assert.ok(!copy.ok && copy.reasons.some((r) => r.includes("diễn đạt lại")))
})

test("bài nghe: hội thoại phải có nhãn người nói ở mọi dòng và ít nhất hai người", () => {
  assert.deepEqual(speakerLabels("Anna: Hi!\nTom: Hello"), ["Anna", "Tom"])
  const dialog = `Anna: Hi Tom, how is your dog Max?\nTom: ${words(38)} On Sunday they walk in the big park near the river.`
  const four = [mc(), mc({ question: "Q2?" }), mc({ question: "Q3?" }), mc({ question: "Q4?" })]
  assert.equal(validateRawPassage(raw({ text: dialog, questions: four }), "listening", 1).ok, true)
  const noLabels = validateRawPassage(raw({ text: `Hi Tom, how is your dog Max?\n${words(38)} On Sunday they walk in the big park near the river.`, questions: four }), "listening", 1)
  assert.ok(!noLabels.ok && noLabels.reasons.some((r) => r.includes("nhãn người nói")))
})

test("dựng bài: mã nối tiếp, đúng tên trường cho đọc/nghe, vị trí đáp án rải đều cả lô, câu Đúng/Sai/Không nêu giữ nguyên thứ tự", () => {
  const ok = validateRawPassage(raw(), "reading", 1)
  assert.ok(ok.ok)
  if (!ok.ok) return
  const ids = nextPassageIds("reading", 1, ["rd-b1-001", "rd-b1-014", "rd-b2-099"], 8)
  assert.equal(ids[0], "rd-b1-015")
  const batch = Array.from({ length: 8 }, () => ok.passage)
  const out = toPassageJsons(batch, "reading", 1, ids, () => 0.4)
  assert.equal(out[0].text, TEXT)
  assert.equal(out[0].transcript, undefined)
  const pos = [0, 0, 0, 0]
  for (const p of out) for (const q of p.questions) if (q.choices.length === 4) pos[q.correctIndex]++
  assert.ok(Math.max(...pos) - Math.min(...pos) <= 1, pos.join(","))
  const q = out[0].questions[2]
  assert.deepEqual(q.choices, ["True", "False", "Not given"])
  assert.equal(q.correctIndex, 1)
  const listen = toPassageJsons([ok.passage], "listening", 1, ["ls-b1-001"])
  assert.equal(listen[0].transcript, TEXT)
  assert.equal(listen[0].text, undefined)
  // giải thích đi theo lựa chọn sau khi xáo
  const m = out[0].questions[0]
  assert.ok(m.choiceExplanations[m.correctIndex].startsWith("Đúng"))
})

test("lời nhắc: đủ ràng buộc then chốt; giải mù không lộ đáp án; điều kiện giữ bài", () => {
  const g = GRAMMAR_BY_BAC[3]
  const p = buildPassagePrompt({ kind: "listening", bac: 3, cefr: "B1", genre: "dialogue", topic: "school trip", minWords: 110, maxWords: 150, avgSentence: g.avgSentence, allowedGrammar: g.allowed, forbiddenGrammar: g.forbidden, usedTopics: ["airport"], questionMix: "1 detail, 1 main_idea, 1 inference, 1 tfng" })
  for (const needle of ["FOR THE EAR", "speaker label", "PUT THE CORRECT OPTION FIRST", "110–150 words", "airport", "evidence", "Not given", "Bậc 3"]) assert.ok(p.includes(needle), needle)
  const r = buildPassageReviewPrompt([{ id: "x", text: "Tom has a dog.", questions: [{ question: "Who has a dog?", choices: ["Tom", "Ann", "Bob", "Sue"] }] }], "reading", 2)
  assert.ok(r.includes("A. Tom") && !/correct|answer:/i.test(r.split("###")[1].split("Return ONLY")[0]))
  const v = { id: "x", answers: [{ q: 1, acceptableIndexes: [2], issues: [] }, { q: 2, acceptableIndexes: [0], issues: [] }], naturalness: 5, levelFit: 4, overallIssues: [] as string[] }
  assert.equal(passesPassageReview(v, [2, 0]).pass, true)
  assert.equal(passesPassageReview(v, [2, 1]).pass, false)
  assert.equal(passesPassageReview({ ...v, answers: [{ q: 1, acceptableIndexes: [2, 3], issues: [] }, v.answers[1]] }, [2, 0]).pass, false)
  assert.equal(passesPassageReview({ ...v, overallIssues: ["wrong_level"] }, [2, 0]).pass, false)
  assert.equal(passesPassageReview(undefined, [0]).pass, false)
})
