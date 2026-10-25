import test from "node:test"
import assert from "node:assert/strict"
import { evaluateReviews, type ReviewLog } from "../src/lib/srs/evaluate.ts"

const log = (rating: number, r: number | null, fsrs: number | null = null, sm2: number | null = null): ReviewLog => ({ rating, retrievability: r, elapsedDays: null, fsrsDays: fsrs, sm2Days: sm2 })

test("hiệu chỉnh: dự đoán 90% mà nhớ đúng 9/10 thì khớp", () => {
  const logs = [...Array.from({ length: 9 }, () => log(3, 0.9)), log(1, 0.9)]
  const r = evaluateReviews(logs)
  assert.equal(r.reviews, 10)
  assert.equal(r.withPrediction, 10)
  assert.equal(r.recallRate, 0.9)
  assert.ok(Math.abs(r.meanPredicted! - 0.9) < 1e-9)
  const b = r.calibration.find((x) => x.from === 0.9)!
  assert.equal(b.count, 10)
  assert.ok(Math.abs(b.actual - b.predicted) < 1e-9)
})

test("log loss thấp hơn khi dự đoán đúng hướng; lượt chưa có dự đoán không tính", () => {
  const good = evaluateReviews([log(3, 0.95), log(1, 0.1)])
  const bad = evaluateReviews([log(3, 0.1), log(1, 0.95)])
  assert.ok(good.logLoss! < bad.logLoss!)
  const none = evaluateReviews([log(3, null)])
  assert.equal(none.logLoss, null)
  assert.equal(none.withPrediction, 0)
  assert.equal(none.reviews, 1)
})

test("tỷ lệ khoảng cách FSRS/SM-2 trên các lượt có đủ hai số", () => {
  const r = evaluateReviews([log(3, 0.9, 6, 3), log(3, 0.9, 4, 4), log(3, 0.9, null, 5)])
  assert.equal(r.intervalRatio, 1.5)
  assert.equal(evaluateReviews([]).recallRate, null)
})
