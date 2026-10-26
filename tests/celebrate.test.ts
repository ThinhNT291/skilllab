import test from "node:test"
import assert from "node:assert/strict"
import { buildPath, type PathInput, BACS } from "../src/lib/path/catalog.ts"
import { computePath } from "../src/lib/path/progress.ts"
import { describeEvents, diffSnapshot, hasEvents, NO_EVENTS, parseSnapshot, snapshotOf, type Snapshot } from "../src/lib/path/celebrate.ts"

const input: PathInput = {
  grammar: BACS.flatMap((bac) => ["a", "b", "c", "d", "e"].map((t, i) => ({ topic: t, title: t, bac, order: i, count: 20 }))),
  vocabWords: Object.fromEntries(BACS.map((b) => [b, 300])),
  reading: BACS.flatMap((bac) => [1, 2, 3, 4, 5].map((i) => ({ id: `r${bac}${i}`, title: "r", bac }))),
  listening: BACS.flatMap((bac) => [1, 2, 3, 4, 5].map((i) => ({ id: `l${bac}${i}`, title: "l", bac }))),
}
const path = buildPath(input)
const doneIds = (n: number) => new Map(path.slice(0, n).flatMap((s) => s.lessons.map((l) => [l.id, { bestRatio: 1 }] as const)))

test("ảnh chụp: chặng xong, bậc đã qua cổng, chặng hiện tại", () => {
  const snap = snapshotOf(computePath(path, doneIds(2)), [1])
  assert.deepEqual(snap.done, ["b1-s1", "b1-s2"])
  assert.deepEqual(snap.cleared, [1])
  assert.equal(snap.current, "b1-s3")
  assert.equal(snapshotOf(computePath(path, doneIds(30)), []).current, null)
})

test("lần đầu xem (chưa có ảnh chụp) không ăn mừng gì", () => {
  const now = snapshotOf(computePath(path, doneIds(3)), [])
  assert.deepEqual(diffSnapshot(null, now), NO_EVENTS)
  assert.equal(hasEvents(NO_EVENTS), false)
})

test("so với lần trước: chặng vừa xong, cổng vừa mở, linh vật sang chặng mới", () => {
  const before = snapshotOf(computePath(path, doneIds(2)), [])
  const after = snapshotOf(computePath(path, doneIds(3)), [])
  const e = diffSnapshot(before, after)
  assert.deepEqual(e, { newlyDone: ["b1-s3"], gatesOpened: [], movedTo: "b1-s4" })
  // mở cổng bậc 1
  const e2 = diffSnapshot({ ...after, cleared: [] }, { ...after, cleared: [1] })
  assert.deepEqual(e2.gatesOpened, [1])
  assert.deepEqual(e2.newlyDone, [])
  assert.equal(e2.movedTo, null)
  // không đổi gì → không có sự kiện
  assert.equal(hasEvents(diffSnapshot(after, after)), false)
  // làm lại chặng cũ hoặc tụt xuống (xóa dữ liệu) không ăn mừng
  assert.equal(diffSnapshot(after, before).newlyDone.length, 0)
  // hết lộ trình: current null không tính là "sang chặng mới"
  assert.equal(diffSnapshot(after, snapshotOf(computePath(path, doneIds(30)), [])).movedTo, null)
})

test("thử sức xong một chặng phía trên cũng được ăn mừng, linh vật vẫn ở chặng hiện tại", () => {
  const before = snapshotOf(computePath(path, new Map()), [])
  const trial = new Map(path[2].lessons.map((l) => [l.id, { bestRatio: 1 }] as const))
  const e = diffSnapshot(before, snapshotOf(computePath(path, trial), []))
  assert.deepEqual(e.newlyDone, ["b1-s3"])
  assert.equal(e.movedTo, null)
})

test("đọc ảnh chụp đã lưu: hỏng hoặc sai khuôn thì coi như chưa có", () => {
  const ok: Snapshot = { done: ["b1-s1"], cleared: [1], current: "b1-s2" }
  assert.deepEqual(parseSnapshot(JSON.parse(JSON.stringify(ok))), ok)
  assert.deepEqual(parseSnapshot({ done: [], cleared: [], current: null }), { done: [], cleared: [], current: null })
  for (const bad of [null, "x", 5, {}, { done: "a", cleared: [], current: null }, { done: [1], cleared: [], current: null }, { done: [], cleared: [9], current: null }, { done: [], cleared: [], current: 3 }, { done: Array(300).fill("a"), cleared: [], current: null }]) assert.equal(parseSnapshot(bad), null)
})

test("câu thông báo: cổng mở, một hoặc nhiều chặng, sang chặng mới; rỗng thì null", () => {
  const name = (id: string) => `Chặng ${id.slice(-1)}`
  const bac = (b: number) => `Bậc ${b}`
  assert.equal(describeEvents(NO_EVENTS, name, bac), null)
  assert.equal(describeEvents({ newlyDone: ["b1-s3"], gatesOpened: [], movedTo: "b1-s4" }, name, bac), "Bạn vừa hoàn thành Chặng 3!")
  assert.equal(describeEvents({ newlyDone: ["b1-s1", "b1-s2"], gatesOpened: [], movedTo: null }, name, bac), "Bạn vừa hoàn thành 2 chặng!")
  assert.equal(describeEvents({ newlyDone: ["b1-s5"], gatesOpened: [1], movedTo: "b2-s1" }, name, bac), "Cổng lên Bậc 2 đã mở! Bạn vừa hoàn thành Chặng 5!")
  assert.equal(describeEvents({ newlyDone: [], gatesOpened: [], movedTo: "b2-s1" }, name, bac), "Bạn đã sang Chặng 1.")
})
