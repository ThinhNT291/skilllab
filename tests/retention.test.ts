import test from "node:test"
import assert from "node:assert/strict"
import { cardBac, MIN_CARDS_FOR_RETENTION, retentionByBac, type RetentionCard } from "../src/lib/path/retention.ts"
import { jumpReadinessAt } from "../src/lib/path/jump.ts"

const meta = { "en-x-001": [3, 2], "rq-rd-b4-001-1": [4, 2] } as Record<string, [number, number]>
const NOW = new Date("2026-11-10T00:00:00Z")
const daysAgo = (d: number) => new Date(NOW.getTime() - d * 86_400_000)
const fsrsCard = (topic: string, stability: number, ago: number, sourceKey: string | null = null): RetentionCard => ({
  topic, sourceKey,
  fsrs: { stability, difficulty: 5, state: 2, reps: 3, lapses: 0, lastReview: daysAgo(ago) },
  sm2: { intervalDays: 5, ease: 2.5, reps: 3, lapses: 0 },
  lastReviewedAt: daysAgo(ago).toISOString(),
})

test("bậc của thẻ: từ vựng theo cấp, đọc/nghe theo bậc bài, ngữ pháp theo nhãn câu gốc; không xác định thì null", () => {
  assert.equal(cardBac({ topic: "vocab-b2", sourceKey: "vocab-b2-w1" }, meta), 4)
  assert.equal(cardBac({ topic: "reading-b5", sourceKey: null }, meta), 5)
  assert.equal(cardBac({ topic: "listening-b1", sourceKey: null }, meta), 1)
  assert.equal(cardBac({ topic: "present-simple", sourceKey: "grammar-present-simple-en-x-001" }, meta), 3)
  assert.equal(cardBac({ topic: "present-simple", sourceKey: "grammar-present-simple-en-x-001~typed" }, meta), 3, "câu biến thể trỏ về câu gốc")
  assert.equal(cardBac({ topic: "present-simple", sourceKey: "grammar-present-simple-zzz" }, meta), null)
  assert.equal(cardBac({ topic: "present-simple", sourceKey: null }, meta), null)
  assert.equal(cardBac({ topic: "colloc-make-do", sourceKey: "x" }, meta), null)
  assert.equal(cardBac({ topic: "vocab-zz", sourceKey: "x" }, meta), null)
})

test("mức nhớ theo bậc: trung bình xác suất nhớ của thẻ đã ôn; ôn đúng hạn cao, để quá lâu thấp", () => {
  const good = Array.from({ length: MIN_CARDS_FOR_RETENTION }, () => fsrsCard("vocab-b1", 30, 1)) // vừa ôn: nhớ rất tốt
  const bad = Array.from({ length: MIN_CARDS_FOR_RETENTION }, () => fsrsCard("vocab-b2", 1, 365)) // bỏ quên rất lâu
  const r = retentionByBac([...good, ...bad], meta, NOW)
  assert.ok((r.get(3) ?? 0) > 0.95, `bậc 3: ${r.get(3)}`)
  assert.ok((r.get(4) ?? 1) < 0.6, `bậc 4: ${r.get(4)}`)
  assert.equal(r.get(1), null, "bậc không có thẻ")
  // đúng hạn (khoảng cách = độ bền) thì khoảng 90%
  const due = Array.from({ length: 5 }, () => fsrsCard("reading-b2", 10, 10))
  assert.ok(Math.abs((retentionByBac(due, meta, NOW).get(2) ?? 0) - 0.9) < 0.03)
})

test("quá ít thẻ thì không kết luận (null); thẻ chưa ôn và thẻ không xác định bậc không tính", () => {
  const few = Array.from({ length: MIN_CARDS_FOR_RETENTION - 1 }, () => fsrsCard("vocab-b1", 10, 5))
  assert.equal(retentionByBac(few, meta, NOW).get(3), null)
  const unreviewed: RetentionCard = { topic: "vocab-b1", sourceKey: null, fsrs: null, sm2: { intervalDays: 0, ease: 2.5, reps: 0, lapses: 0 }, lastReviewedAt: null }
  const mixed = [...few, fsrsCard("vocab-b1", 10, 5), unreviewed, unreviewed, fsrsCard("present-simple", 10, 5, null)]
  assert.ok(retentionByBac(mixed, meta, NOW).get(3) !== null, "5 thẻ đã ôn → có kết luận")
  assert.equal(retentionByBac([], meta, NOW).get(3), null)
})

test("thẻ cũ chỉ có SM-2 được quy đổi và vẫn tính", () => {
  const sm2Only: RetentionCard[] = Array.from({ length: 5 }, () => ({ topic: "vocab-b1", sourceKey: null, fsrs: null, sm2: { intervalDays: 10, ease: 2.5, reps: 4, lapses: 0 }, lastReviewedAt: daysAgo(10).toISOString() }))
  const v = retentionByBac(sm2Only, meta, NOW).get(3)
  assert.ok(v !== null && v !== undefined && v > 0.8 && v < 0.97, String(v))
})

test("nối vào điều kiện nhảy bậc: nhớ kém thì chưa nhảy, nhớ tốt hoặc chưa đủ thẻ thì không chặn", () => {
  const rows = Array.from({ length: 4 }, (_, d) => Array.from({ length: 30 }, (_, i) => ({ correct: i < 28, day: `2026-11-0${d + 1}` }))).flat()
  assert.equal(jumpReadinessAt(3, rows, 0.4).ready, false)
  assert.equal(jumpReadinessAt(3, rows, 0.85).ready, true)
  assert.equal(jumpReadinessAt(3, rows, null).ready, true)
})
