import test from "node:test"
import assert from "node:assert/strict"
import { buildHeatmap, computeStreaks, countByDay, dayKey, levelFor } from "../src/lib/analytics/activity.ts"
import { summarize } from "../src/lib/analytics/progress.ts"

const at = (y: number, m: number, d: number, h = 12) => new Date(y, m - 1, d, h).toISOString()

test("chuỗi ngày: tính đến hôm nay khi hôm nay đã học", () => {
  const counts = countByDay([at(2026, 10, 20), at(2026, 10, 21), at(2026, 10, 22), at(2026, 10, 22, 15)])
  const s = computeStreaks(counts, new Date(2026, 9, 22, 20))
  assert.equal(s.current, 3)
  assert.equal(s.activeToday, true)
})

test("chuỗi ngày: hôm nay chưa học thì chuỗi vẫn tính đến hôm qua", () => {
  const counts = countByDay([at(2026, 10, 20), at(2026, 10, 21)])
  const s = computeStreaks(counts, new Date(2026, 9, 22, 8))
  assert.equal(s.current, 2)
  assert.equal(s.activeToday, false)
})

test("chuỗi ngày: đứt chuỗi khi bỏ qua một ngày; best là chuỗi dài nhất", () => {
  const counts = countByDay([at(2026, 10, 10), at(2026, 10, 11), at(2026, 10, 12), at(2026, 10, 20)])
  const s = computeStreaks(counts, new Date(2026, 9, 22))
  assert.equal(s.current, 0)
  assert.equal(s.best, 3)
})

test("bản đồ nhiệt: 12 cột x 7 hàng, tuần cuối chứa hôm nay, thứ Hai đầu hàng", () => {
  const today = new Date(2026, 9, 22) // thứ Năm
  const counts = countByDay([at(2026, 10, 22), at(2026, 10, 22), at(2026, 10, 19)])
  const grid = buildHeatmap(counts, today, 12)
  assert.equal(grid.length, 12)
  assert.ok(grid.every((c) => c.length === 7))
  const last = grid[11]
  assert.equal(last[0].key, dayKey(new Date(2026, 9, 19))) // thứ Hai 19/10
  assert.equal(last[0].count, 1)
  assert.equal(last[3].key, "2026-10-22")
  assert.equal(last[3].count, 2)
  assert.equal(last[4].future, true) // thứ Sáu chưa tới
})

test("mức đậm nhạt", () => {
  assert.deepEqual([0, 1, 4, 5, 9, 10, 19, 20].map(levelFor), [0, 1, 1, 2, 2, 3, 3, 4])
})

test("tổng hợp tiến độ: thẻ sai nhiều nhất lên đầu, bỏ thẻ chưa từng sai", () => {
  const rows = [
    { topic: "t1", tags: ["a"], correct: false, created_at: "2026-10-01T00:00:00Z" },
    { topic: "t1", tags: ["a"], correct: false, created_at: "2026-10-02T00:00:00Z" },
    { topic: "t1", tags: ["b"], correct: false, created_at: "2026-10-03T00:00:00Z" },
    { topic: "t1", tags: ["c"], correct: true, created_at: "2026-10-03T00:00:00Z" },
  ]
  const s = summarize(rows, { a: { label: "A", topicId: "t1", topicTitle: "T1" } }, { t1: "T1" })
  assert.equal(s.total, 4)
  assert.equal(s.correct, 1)
  assert.deepEqual(s.weakTags.map((w) => w.tag), ["a", "b"])
  assert.equal(s.weakTags[0].label, "A")
  assert.equal(s.weakTags[1].label, "b") // không có trong bảng tra thì dùng chính mã thẻ
})

test("độ chính xác theo tuần: chia đúng tuần thứ Hai–Chủ nhật, bỏ qua dữ liệu quá cũ", async () => {
  const { weeklyAccuracy } = await import("../src/lib/analytics/activity.ts")
  const today = new Date("2026-03-18T12:00:00") // thứ Tư
  const at = (d: string, correct: boolean) => ({ correct, created_at: `${d}T10:00:00` })
  const b = weeklyAccuracy([at("2026-03-16", true), at("2026-03-18", false), at("2026-03-15", true), at("2025-01-01", true)], today, 3)
  assert.equal(b.length, 3)
  assert.deepEqual(b.map((x) => x.start), ["2026-03-02", "2026-03-09", "2026-03-16"])
  assert.deepEqual([b[2].attempts, b[2].correct], [2, 1]) // tuần này: thứ Hai và thứ Tư
  assert.deepEqual([b[1].attempts, b[1].correct], [1, 1]) // Chủ nhật 15/3 thuộc tuần trước
  assert.deepEqual([b[0].attempts, b[0].correct], [0, 0])
})
