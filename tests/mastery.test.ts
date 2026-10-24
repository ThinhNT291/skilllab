import test from "node:test"
import assert from "node:assert/strict"
import { nextTopic, passedTest, topicStats, type AnswerLite } from "../src/lib/progress/mastery.ts"

const rows = (topic: string, n: number, correct: number, base = 0): AnswerLite[] =>
  Array.from({ length: n }, (_, i) => ({ topic, correct: i < correct, created_at: `2026-01-01T00:${String(base + i).padStart(2, "0")}:00Z` }))

test("đạt bài kiểm tra từ 80%", () => {
  assert.equal(passedTest(8, 10), true)
  assert.equal(passedTest(7, 10), false)
  assert.equal(passedTest(0, 0), false)
})

test("trạng thái: mới, đang học, gần vững, đã vững", () => {
  const all = [...rows("a", 5, 3), ...rows("b", 20, 18), ...rows("c", 20, 10), ...rows("d", 3, 1)]
  const s = topicStats(all, new Set(["d"]), ["a", "b", "c", "d", "e"])
  assert.equal(s.get("a")!.status, "learning")
  assert.equal(s.get("b")!.status, "ready")
  assert.equal(s.get("c")!.status, "learning")
  assert.equal(s.get("d")!.status, "mastered")
  assert.equal(s.get("e")!.status, "new")
  assert.equal(s.get("e")!.recentAccuracy, null)
})

test("gần vững chỉ tính 20 câu gần nhất", () => {
  // 10 câu cũ sai hết rồi 20 câu mới đúng hết → vẫn gần vững
  const old = rows("a", 10, 0, 0)
  const recent = rows("a", 20, 20, 10)
  assert.equal(topicStats([...old, ...recent], new Set(), ["a"]).get("a")!.status, "ready")
})

test("chuyên đề đã vượt kiểm tra thì vững dù chưa đủ câu", () => {
  assert.equal(topicStats([], new Set(["a"]), ["a"]).get("a")!.status, "mastered")
})

test("gợi ý học tiếp: đang học trước, rồi gần vững, rồi mới", () => {
  const all = [...rows("b", 20, 18), ...rows("c", 5, 2)]
  const s = topicStats(all, new Set(), ["a", "b", "c"])
  assert.equal(nextTopic(["a", "b", "c"], s), "c")
  assert.equal(nextTopic(["a", "b"], topicStats(rows("b", 20, 18), new Set(), ["a", "b"])), "b")
  assert.equal(nextTopic(["a"], topicStats([], new Set(["a"]), ["a"])), null)
})
