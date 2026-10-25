import test from "node:test"
import assert from "node:assert/strict"
import { attentionReasons, summarizeActivity } from "../src/lib/staff/summary.ts"

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
