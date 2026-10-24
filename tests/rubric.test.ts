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
