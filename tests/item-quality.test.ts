import test from "node:test"
import assert from "node:assert/strict"
import { familyOf, familyQuality, itemQuality, replayExpected, MIN_ATTEMPTS, MIN_LEARNERS, type QualityAnswer } from "../src/lib/analytics/item-quality.ts"
import type { ItemMeta } from "../src/lib/progress/ability.ts"

const meta: ItemMeta = { "en-x-1": [4, 2], "en-x-2": [2, 2] }
let t = 0
const ans = (profileId: string, exerciseId: string, correct: boolean, topic = "present-simple"): QualityAnswer => ({
  profileId,
  exerciseId,
  topic,
  correct,
  created_at: `2026-01-01T00:00:${String(t++ % 60).padStart(2, "0")}Z`,
})
const many = (id: string, correctOf: (i: number) => boolean) => Array.from({ length: 40 }, (_, i) => ans(`p${i % 10}`, id, correctOf(i)))

test("câu nhãn khó (Bậc 4) mà ai cũng đúng bị đánh dấu dễ hơn nhãn", () => {
  const r = itemQuality(many("en-x-1", () => true), meta).find((x) => x.exerciseId === "en-x-1")!
  assert.ok(r.gap > 0.15)
  assert.ok(r.flags.includes("easier-than-label"))
})

test("câu nhãn dễ (Bậc 2) mà đa số sai bị đánh dấu khó hơn nhãn; sai gần hết thì thêm cờ dưới đoán mò", () => {
  const r = itemQuality(many("en-x-2", (i) => i % 10 === 0), meta).find((x) => x.exerciseId === "en-x-2")!
  assert.ok(r.flags.includes("harder-than-label"))
  assert.ok(r.flags.includes("below-guess"))
})

test("chưa đủ lượt hoặc học sinh thì không đánh dấu", () => {
  const few = itemQuality(Array.from({ length: MIN_ATTEMPTS - 1 }, (_, i) => ans(`p${i % 10}`, "en-x-1", true)), meta)
  assert.deepEqual(few[0].flags, [])
  const oneLearner = itemQuality(Array.from({ length: MIN_ATTEMPTS + 5 }, () => ans("solo", "en-x-1", true)), meta)
  assert.ok(MIN_LEARNERS > 1)
  assert.deepEqual(oneLearner[0].flags, [])
})

test("xác suất dự kiến dùng năng lực trước lượt đó: lượt đầu của học sinh mới là ở mức khởi điểm", () => {
  const rows = replayExpected([ans("a", "en-x-2", true)], meta)
  assert.equal(rows.length, 1)
  assert.ok(Math.abs(rows[0].expected - 0.625) < 1e-9)
})

test("bỏ qua câu không có nhãn; học sinh khác nhau không lẫn năng lực", () => {
  assert.equal(replayExpected([ans("a", "khong-co-meta", true)], meta).length, 0)
  const rows = replayExpected([ans("a", "en-x-2", true), ans("a", "en-x-2", true), ans("b", "en-x-2", true)], meta)
  const firstB = rows.filter((r) => r.profileId === "b")[0]
  assert.ok(Math.abs(firstB.expected - 0.625) < 1e-9)
})

test("nhóm dạng câu: từ vựng theo tiền tố, câu sinh theo hậu tố sau ~", () => {
  assert.equal(familyOf("vq-v-b2-123"), "vq-v")
  assert.equal(familyOf("en-present-simple-001~typed"), "typed")
  assert.equal(familyOf("en-present-simple-001"), "gốc")
})

test("gom theo nhóm cho thấy cả nhóm lệch", () => {
  const meta2: ItemMeta = {}
  const rows: QualityAnswer[] = []
  for (const w of ["1", "2", "3"]) for (let i = 0; i < 40; i++) rows.push(ans(`p${i % 10}`, `vq-v-b2-${w}`, true, "vocab-b2"))
  const f = familyQuality(rows, meta2)
  assert.equal(f[0].family, "vq-v")
  assert.equal(f[0].items, 3)
  assert.ok(f[0].gap > 0.15)
})
