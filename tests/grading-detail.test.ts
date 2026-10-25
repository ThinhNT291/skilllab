import assert from "node:assert/strict"
import { test } from "node:test"
import { detailFromFeedback, recurringWeaknesses, type AttemptDetail } from "../src/lib/grading/detail.ts"
import { parseFeedback } from "../src/lib/rubric.ts"

test("chi tiết lưu: bậc từng tiêu chí, thẻ không trùng, loại lỗi, lỗi dịch từng chữ", () => {
  const f = parseFeedback(
    {
      scores: { task: 3, organization: 3, vocabulary: 3, grammar: 2 },
      criteria: [{ key: "grammar", bac: 2 }],
      corrections: [
        { original: "a", fixed: "b", category: "grammar", tag: "t1", transfer: true },
        { original: "c", fixed: "d", category: "grammar", tag: "t1" },
        { original: "e", fixed: "f", category: "vocabulary", tag: null },
      ],
    },
    "writing",
  )!
  const d = detailFromFeedback(f)
  assert.deepEqual(d.tags, ["t1"])
  assert.deepEqual(d.categories, { grammar: 2, vocabulary: 1 })
  assert.equal(d.transfer, 1)
  assert.equal(d.criteriaBac.grammar, 2)
})

test("điểm yếu lặp lại: chỉ tính thẻ xuất hiện ≥ 2 lần chấm, tiêu chí yếu nhất cần ≥ 2 lần chấm", () => {
  const rows: { scores: Record<string, number>; detail: AttemptDetail | null }[] = [
    { scores: { grammar: 1, vocabulary: 3 }, detail: { criteriaBac: {}, tags: ["a", "b"], categories: { grammar: 2 }, transfer: 1 } },
    { scores: { grammar: 2, vocabulary: 3 }, detail: { criteriaBac: {}, tags: ["a"], categories: { grammar: 1, vocabulary: 1 }, transfer: 0 } },
    { scores: { grammar: 2, vocabulary: 4 }, detail: null },
  ]
  const r = recurringWeaknesses(rows)
  assert.deepEqual(r.tags, [{ tag: "a", count: 2 }])
  assert.deepEqual(r.categories[0], { category: "grammar", count: 3 })
  assert.deepEqual(r.weakest, { key: "grammar", avg: 1.7 })
  assert.equal(r.transfer, 1)
  assert.equal(recurringWeaknesses([rows[0]]).weakest, null)
})
