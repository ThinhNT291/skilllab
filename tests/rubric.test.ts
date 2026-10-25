import assert from "node:assert/strict"
import { test } from "node:test"
import { buildGradingPrompt, clampBac, countWords, parseFeedback, totalFromScores } from "../src/lib/rubric.ts"

test("tổng điểm đổi ra thang 10, làm tròn 0,5", () => {
  assert.equal(totalFromScores({ task: 4, organization: 4, vocabulary: 4, grammar: 4 }, "writing"), 10)
  assert.equal(totalFromScores({ task: 2, organization: 2, vocabulary: 2, grammar: 2 }, "writing"), 5)
  assert.equal(totalFromScores({ task: 3, organization: 2, vocabulary: 2, grammar: 2 }, "writing"), 5.5)
})
test("bậc bị chặn trong 0..6", () => {
  assert.equal(clampBac(9), 6)
  assert.equal(clampBac(-2), 0)
})
test("parseFeedback làm sạch dữ liệu mô hình", () => {
  const f = parseFeedback({ scores: { task: 9, organization: "3", vocabulary: -1, grammar: 2 }, estimatedBac: 3.4, strengths: ["Tốt", 5], improvements: [], corrections: [{ original: "he go", fixed: "he goes", reasonVi: "x" }, { bad: 1 }], corrected: "He goes." }, "writing")
  assert.ok(f)
  assert.deepEqual(f.scores, { task: 4, organization: 3, vocabulary: 0, grammar: 2 })
  assert.equal(f.estimatedBac, 3)
  assert.deepEqual(f.strengths, ["Tốt"])
  assert.equal(f.corrections.length, 1)
  assert.equal(parseFeedback(null, "writing"), null)
  assert.equal(parseFeedback({}, "writing"), null)
})
test("đếm từ và lời nhắc có thẻ dữ liệu", () => {
  assert.equal(countWords("  one two  three "), 3)
  assert.match(buildGradingPrompt("writing", "Describe your day", 2), /<answer>/)
})

test("parseFeedback v2: tiêu chí có bằng chứng, lỗi có phân loại và thẻ hợp lệ", () => {
  const raw = {
    scores: { task: 3, organization: 2, vocabulary: 2, grammar: 1 },
    estimatedBac: 2,
    criteria: [
      { key: "grammar", score: 1, bac: 1, evidence: ["he go to school", 7], strengths: ["Biết dùng câu đơn"], weaknesses: ["Quên -s"], howToImprove: "Viết lại 3 câu với he/she." },
      { key: "bogus", score: 4 },
    ],
    priorities: [{ criterion: "grammar", issue: "Quên -s", why: "Gây hiểu sai thì", action: "Làm 5 câu" }, { criterion: "xyz", issue: "Khác" }, { nope: 1 }],
    corrections: [
      { original: "he go", fixed: "he goes", reasonVi: "ngôi thứ ba", category: "grammar", transfer: true, tag: "ps-u1-habits-routines", severity: 3 },
      { original: "x", fixed: "y", category: "lạ", tag: "khong-co", severity: 9 },
    ],
    versions: [{ label: "Bản 1", text: "He goes to school." }, { text: "" }],
    practicePlan: [{ title: "Viết 3 câu", how: "Dùng he/she", minutes: 99 }],
  }
  const f = parseFeedback(raw, "writing", new Set(["ps-u1-habits-routines"]))!
  assert.equal(f.criteria.length, 4)
  const g = f.criteria.find((c) => c.key === "grammar")!
  assert.equal(g.bac, 1)
  assert.deepEqual(g.evidence, ["he go to school"])
  assert.equal(f.criteria.find((c) => c.key === "task")!.bac, null)
  assert.equal(f.priorities.length, 2)
  assert.equal(f.priorities[1].criterion, "")
  assert.equal(f.corrections[0].tag, "ps-u1-habits-routines")
  assert.equal(f.corrections[0].transfer, true)
  assert.equal(f.corrections[0].severity, 3)
  assert.equal(f.corrections[1].tag, null)
  assert.equal(f.corrections[1].category, "other")
  assert.equal(f.corrections[1].severity, 3)
  assert.equal(f.versions.length, 1)
  assert.equal(f.corrected, "He goes to school.")
  assert.equal(f.practicePlan[0].minutes, 30)
  assert.equal(f.phonetics, null)
})

test("parseFeedback bài nói: bóc băng và phát âm; bài viết bỏ qua hai trường này", () => {
  const raw = { scores: { pronunciation: 2, fluency: 3, vocabulary: 2, grammar: 2 }, transcript: "I sink so", phonetics: { sounds: [{ sound: "/θ/", examples: ["think"], tipVi: "Đặt lưỡi giữa răng" }], stressVi: "Nhấn âm đầu" } }
  const sp = parseFeedback(raw, "speaking")!
  assert.equal(sp.transcript, "I sink so")
  assert.equal(sp.phonetics!.sounds[0].sound, "/θ/")
  const wr = parseFeedback({ ...raw, scores: { task: 1, organization: 1, vocabulary: 1, grammar: 1 } }, "writing")!
  assert.equal(wr.transcript, "")
  assert.equal(wr.phonetics, null)
})

test("lời nhắc chứa mô tả mức điểm, yêu cầu bằng chứng và danh sách thẻ", () => {
  const p = buildGradingPrompt("writing", "Describe your day", 2, "ps-u1 | Thói quen (Hiện tại đơn)")
  assert.match(p, /Task Achievement/)
  assert.match(p, /evidence/)
  assert.match(p, /ps-u1 \| Thói quen/)
  assert.match(p, /priorities/)
  const s = buildGradingPrompt("speaking", "Talk", 3)
  assert.match(s, /VERBATIM/)
  assert.match(s, /phonetics/)
  assert.doesNotMatch(s, /Never invent ids/)
})
