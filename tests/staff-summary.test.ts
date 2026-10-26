import test from "node:test"
import assert from "node:assert/strict"
import { attentionReasons, summarizeActivity, summarizeDaily } from "../src/lib/staff/summary.ts"

const NOW = new Date("2026-03-10T12:00:00Z")
const row = (id: string, correct: boolean, at: string) => ({ profile_id: id, correct, created_at: at })

test("tóm tắt: số lượt, tỷ lệ đúng, ngày học, lần cuối", () => {
  const m = summarizeActivity([row("a", true, "2026-03-09T08:00:00Z"), row("a", false, "2026-03-09T09:00:00Z"), row("a", true, "2026-03-10T07:00:00Z"), row("b", false, "2026-03-01T07:00:00Z")])
  const a = m.get("a")!
  assert.equal(a.answers, 3)
  assert.equal(a.correct, 2)
  assert.equal(a.activeDays, 2)
  assert.equal(a.lastAt, "2026-03-10T07:00:00Z")
  assert.equal(m.get("b")!.accuracy, 0)
  assert.equal(m.get("zzz"), undefined)
})

test("cần chú ý: lâu không học hoặc tỷ lệ đúng thấp (đủ dữ liệu)", () => {
  assert.deepEqual(attentionReasons(undefined, NOW), ["chưa học trong tuần"])
  const quiet = summarizeActivity([row("a", true, "2026-03-05T08:00:00Z")]).get("a")
  assert.deepEqual(attentionReasons(quiet, NOW), ["5 ngày chưa học"])
  const low = summarizeActivity(Array.from({ length: 12 }, (_, i) => row("a", i < 4, "2026-03-10T08:00:00Z"))).get("a")
  assert.deepEqual(attentionReasons(low, NOW), ["tỷ lệ đúng thấp (33%)"])
  const few = summarizeActivity([row("a", false, "2026-03-10T08:00:00Z")]).get("a")
  assert.deepEqual(attentionReasons(few, NOW), [])
})

test("tóm tắt từ bộ đếm ngày cho cùng kết quả với tóm tắt từng lượt, không bị cắt theo số dòng", () => {
  const m = summarizeDaily([
    { profile_id: "a", day: "2026-03-09", answers: 2, correct: 1 },
    { profile_id: "a", day: "2026-03-10", answers: 1, correct: 1 },
    { profile_id: "b", day: "2026-03-01", answers: 1, correct: 0 },
    { profile_id: "c", day: "2026-03-10", answers: 0, correct: 0 },
  ])
  const a = m.get("a")!
  assert.equal(a.answers, 3)
  assert.equal(a.correct, 2)
  assert.equal(a.activeDays, 2)
  assert.equal(m.get("b")!.accuracy, 0)
  assert.equal(m.get("c"), undefined)
  // học sinh làm 5.000 lượt trong ngày vẫn tính đủ
  assert.equal(summarizeDaily([{ profile_id: "x", day: "2026-03-10", answers: 5000, correct: 4000 }]).get("x")!.answers, 5000)
  // cuối ngày học gần nhất tính theo giờ Việt Nam: 10/3 sáng 12h UTC thì chưa "ngày nào chưa học"
  assert.deepEqual(attentionReasons(m.get("a"), NOW), [])
  assert.deepEqual(attentionReasons(m.get("b"), NOW), ["8 ngày chưa học"])
})
