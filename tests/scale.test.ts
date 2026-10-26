import test from "node:test"
import assert from "node:assert/strict"
import { computeScale, currentBac, grammarTotals, type Totals } from "../src/lib/progress/scale.ts"

const meta = { g1: [1, 1], g2: [1, 2], g3: [2, 2] } as Record<string, [number, number]>
const totals: Totals = { grammar: grammarTotals(meta), vocab: { 1: 10 }, reading: { 1: 5 }, listening: {} }
const t = (n: number) => new Date(2026, 9, 1, 10, n).toISOString()

test("grammarTotals đếm theo bậc", () => {
  assert.deepEqual(grammarTotals(meta), { 1: 2, 2: 1 })
})

test("ngữ pháp: tính câu có lần trả lời gần nhất đúng; biến thể cùng mã gốc", () => {
  const r = computeScale(
    [
      { exerciseId: "g1", topic: "present-simple", correct: false, created_at: t(1) },
      { exerciseId: "g1~reorder", topic: "present-simple", correct: true, created_at: t(2) },
      { exerciseId: "g2", topic: "present-simple", correct: true, created_at: t(3) },
      { exerciseId: "g2", topic: "present-simple", correct: false, created_at: t(4) },
    ],
    meta,
    totals,
  )
  // g1: sai rồi đúng ở dạng biến thể → tính; g2: đúng rồi sai → không tính
  assert.equal(r.grammar[0].total, 2)
  assert.equal(r.grammar[0].covered, 1)
  assert.equal(r.grammar[2].ratio, null) // bậc 3 chưa có nội dung
})

test("từ vựng và bài đọc: tính theo từ và theo bài (≥3 câu đúng)", () => {
  const ans = [
    { exerciseId: "vq-m-v-a-noun-1", topic: "vocab-a1", correct: true, created_at: t(1) },
    { exerciseId: "vq-c-v-a-noun-1", topic: "vocab-a1", correct: true, created_at: t(2) },
    { exerciseId: "rq-p1-1", topic: "reading-b1", correct: true, created_at: t(3) },
    { exerciseId: "rq-p1-2", topic: "reading-b1", correct: true, created_at: t(4) },
    { exerciseId: "rq-p1-3", topic: "reading-b1", correct: true, created_at: t(5) },
    { exerciseId: "rq-p2-1", topic: "reading-b1", correct: true, created_at: t(6) },
  ]
  const r = computeScale(ans, meta, totals)
  assert.equal(r.vocab[0].covered, 1)
  assert.equal(r.reading[0].covered, 1)
  assert.equal(r.reading[0].ratio, 0.2)
})

test("currentBac: bậc thấp nhất có nội dung chưa đạt 70%", () => {
  const r = computeScale([], meta, totals)
  assert.equal(currentBac(r.grammar), 1)
  assert.equal(currentBac(r.listening), null)
})
