import test from "node:test"
import assert from "node:assert/strict"
import { formatInterval, schedule } from "../src/lib/srs/scheduler.ts"
import { cardContentFromExercise } from "../src/lib/srs/card-from-exercise.ts"
import type { Exercise } from "../src/lib/content/types.ts"

const fresh = { intervalDays: 0, ease: 2.5, reps: 0, lapses: 0 }
const now = new Date("2026-10-24T00:00:00Z")

test("Lại: ôn lại sau 10 phút, tính một lần quên, giảm ease nhưng không dưới 1.3", () => {
  const r = schedule({ ...fresh, ease: 1.35, reps: 4, intervalDays: 10 }, "again", now)
  assert.equal(r.reps, 0)
  assert.equal(r.lapses, 1)
  assert.equal(r.ease, 1.3)
  assert.equal(r.dueAt.getTime() - now.getTime(), 10 * 60 * 1000)
})

test("Tốt: 1 ngày, rồi 3 ngày, rồi nhân theo ease", () => {
  const a = schedule(fresh, "good", now)
  assert.equal(a.intervalDays, 1)
  const b = schedule(a, "good", now)
  assert.equal(b.intervalDays, 3)
  const c = schedule(b, "good", now)
  assert.equal(c.intervalDays, Math.round(3 * 2.5))
})

test("Dễ nhanh hơn Tốt và tăng ease; Khó chậm hơn và giảm ease", () => {
  const easy = schedule(fresh, "easy", now)
  const hard = schedule({ ...fresh, reps: 2, intervalDays: 10 }, "hard", now)
  assert.equal(easy.intervalDays, 3)
  assert.equal(easy.ease, 2.65)
  assert.equal(hard.intervalDays, 12)
  assert.equal(hard.ease, 2.35)
})

test("thẻ thành 'đã thuộc' khi khoảng ôn từ 60 ngày", () => {
  const r = schedule({ intervalDays: 40, ease: 2.5, reps: 6, lapses: 0 }, "good", now)
  assert.equal(r.intervalDays, 100)
  assert.equal(r.status, "mastered")
})

test("nhãn khoảng ôn", () => {
  assert.equal(formatInterval(fresh, "again"), "10 phút")
  assert.equal(formatInterval(fresh, "good"), "1 ngày")
  assert.equal(formatInterval({ intervalDays: 40, ease: 2.5, reps: 6, lapses: 0 }, "good"), "3 tháng")
})

const ex = (over: Partial<Exercise>): Exercise => ({
  id: "en-x-001", kind: "mcq", language: "en", topic: "x", tags: [], difficulty: 1,
  prompt: "She ______ (clean) her room.", choices: ["cleans", "clean", "cleaned", "cleaning"], correctIndex: 0,
  explanation: "giải thích chung", ...over,
}) as Exercise

test("dựng thẻ: điền đáp án vào một chỗ trống và bỏ gợi ý động từ", () => {
  const c = cardContentFromExercise(ex({}))
  assert.equal(c.answer, "cleans")
  assert.equal(c.filled, "She cleans her room.")
})

test("dựng thẻ: nhiều chỗ trống dùng đáp án tách bằng ' / '", () => {
  const c = cardContentFromExercise(ex({ prompt: "He usually ______ (read), but today he ______ (write).", choices: ["reads / is writing", "read / write", "x", "y"] }))
  assert.equal(c.filled, "He usually reads, but today he is writing.")
})

test("dựng thẻ: không khớp số chỗ trống thì không dựng câu hoàn chỉnh; lấy giải thích của đáp án đúng", () => {
  const c = cardContentFromExercise(ex({ prompt: "Which sentence is correct?", choiceExplanations: ["Đúng — vì A", "Sai — B", "Sai — C", "Sai — D"] }))
  assert.equal(c.filled, null)
  assert.equal(c.explanation, "vì A")
})
