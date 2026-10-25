import test from "node:test"
import assert from "node:assert/strict"
import { fsrsFromSm2, previewFsrs, retrievabilityNow, scheduleFsrs, type FsrsState } from "../src/lib/srs/fsrs.ts"

const T0 = new Date("2026-01-01T08:00:00Z")
const day = (d: number) => new Date(T0.getTime() + d * 86_400_000)

test("thẻ mới: bốn nút cho khoảng cách tăng dần, không có bước học trong ngày", () => {
  const p = previewFsrs(null, T0)
  assert.ok(p.again >= 1, "Lại vẫn hẹn từ 1 ngày (không dùng bước phút)")
  assert.ok(p.again <= p.hard && p.hard <= p.good && p.good <= p.easy)
  assert.ok(p.easy > p.good)
})

test("ôn đúng nhiều lần: khoảng cách và độ bền tăng; Lại làm độ bền tụt và tính một lần quên", () => {
  let s: FsrsState | null = null
  let now = T0
  let last = 0
  for (let i = 0; i < 5; i++) {
    const r = scheduleFsrs(s, "good", now, 0.9, false)
    assert.ok(r.scheduledDays >= last, `lần ${i + 1}: ${r.scheduledDays} < ${last}`)
    last = r.scheduledDays
    s = r.next
    now = r.dueAt
  }
  assert.ok(last >= 10, `sau 5 lần Tốt nên hẹn xa (được ${last} ngày)`)
  const stableBefore = s!.stability
  const lapse = scheduleFsrs(s, "again", now, 0.9, false)
  assert.ok(lapse.next.stability < stableBefore)
  assert.equal(lapse.next.lapses, s!.lapses + 1)
})

test("mức nhớ mục tiêu cao hơn thì ôn dày hơn", () => {
  const warm = scheduleFsrs(null, "good", T0, 0.9, false).next
  const at = day(5)
  const lo = scheduleFsrs(warm, "good", at, 0.85, false).scheduledDays
  const hi = scheduleFsrs(warm, "good", at, 0.95, false).scheduledDays
  assert.ok(hi < lo, `95% (${hi} ngày) phải ngắn hơn 85% (${lo} ngày)`)
})

test("xác suất nhớ giảm theo thời gian và bằng khoảng mức mục tiêu đúng hạn", () => {
  const r = scheduleFsrs(null, "good", T0, 0.9, false)
  const s = r.next
  const early = retrievabilityNow(s, day(1))!
  const due = retrievabilityNow(s, r.dueAt)!
  const late = retrievabilityNow(s, day(r.scheduledDays + 30))!
  assert.ok(early > due && due > late)
  assert.ok(Math.abs(due - 0.9) < 0.06, `đúng hạn nên gần 90% (được ${due})`)
  assert.equal(retrievabilityNow(null, T0), null)
})

test("thẻ cũ chỉ có SM-2 được đưa sang FSRS hợp lý", () => {
  assert.equal(fsrsFromSm2({ intervalDays: 0, ease: 2.5, reps: 0, lapses: 0 }, null, T0).state, 0)
  const easy = fsrsFromSm2({ intervalDays: 10, ease: 3, reps: 4, lapses: 0 }, null, T0)
  const hard = fsrsFromSm2({ intervalDays: 10, ease: 1.3, reps: 4, lapses: 2 }, null, T0)
  assert.equal(easy.state, 2)
  assert.equal(easy.stability, 10)
  assert.ok(easy.difficulty < hard.difficulty)
  assert.ok(easy.difficulty >= 1 && hard.difficulty <= 10)
  const r = scheduleFsrs(easy, "good", day(10), 0.9, false)
  assert.ok(r.scheduledDays > 10, `đúng hạn rồi bấm Tốt phải giãn ra (được ${r.scheduledDays})`)
})

import { formatDays, previewLabels } from "../src/lib/srs/preview.ts"

test("nhãn xem trước: SM-2 và FSRS đều trả bốn nhãn; thẻ cũ chưa có FSRS vẫn xem trước được", () => {
  const card = { sm2: { intervalDays: 6, ease: 2.5, reps: 3, lapses: 0 }, fsrs: null, lastReviewedAt: day(-6) }
  const a = previewLabels(card, "sm2", 0.9, T0)
  const b = previewLabels(card, "fsrs", 0.9, T0)
  for (const labels of [a, b]) assert.deepEqual(Object.keys(labels).sort(), ["again", "easy", "good", "hard"])
  assert.equal(formatDays(0), "hôm nay")
  assert.equal(formatDays(1), "1 ngày")
  assert.equal(formatDays(45), "2 tháng")
  assert.equal(formatDays(730), "2 năm")
})
