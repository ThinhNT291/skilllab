import assert from "node:assert/strict"
import { test } from "node:test"
import { summarizeAttempts, type AttemptRow } from "../src/lib/analytics/attempts.ts"

const row = (skill: AttemptRow["skill"], total: number, day: number): AttemptRow => ({ skill, task_id: "t", target_bac: 2, total, estimated_bac: 2, scores: {}, note: null, created_at: `2026-10-${String(day).padStart(2, "0")}T08:00:00Z` })

test("nhóm theo kỹ năng, sắp cũ → mới, lấy bài mới nhất", () => {
  const [w, s] = summarizeAttempts([row("writing", 6, 3), row("writing", 5, 1), row("speaking", 7, 2)])
  assert.deepEqual(w.series, [5, 6])
  assert.equal(w.latest?.total, 6)
  assert.equal(w.trend, null)
  assert.equal(s.count, 1)
  assert.equal(s.best, 7)
})
test("xu hướng: 3 bài mới nhất so với 3 bài trước", () => {
  const rows = [4, 4, 4, 6, 6, 6].map((t, i) => row("writing", t, i + 1))
  assert.equal(summarizeAttempts(rows)[0].trend, 2)
})
test("không có dữ liệu", () => {
  const [w] = summarizeAttempts([])
  assert.equal(w.count, 0)
  assert.equal(w.latest, null)
  assert.equal(w.best, 0)
})
