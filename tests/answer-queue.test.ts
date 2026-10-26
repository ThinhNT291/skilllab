import test from "node:test"
import assert from "node:assert/strict"
import { afterFlush, enqueue, isTransientError, MAX_AGE_MS, MAX_TRIES, QUEUE_CAP, splitQueue, type PendingAnswer } from "../src/lib/db/answer-queue.ts"

const item = (id: string, over: Partial<PendingAnswer> = {}): PendingAnswer => ({ client_id: id, profile_id: "p1", exercise_id: "e", topic: "t", tags: [], correct: true, choice_index: 0, created_at: "2026-10-26T00:00:00Z", tries: 0, ...over })
const NOW = new Date("2026-10-27T00:00:00Z").getTime()

test("lỗi mạng và máy chủ bận đáng thử lại; lỗi quyền hoặc dữ liệu sai thì không", () => {
  assert.equal(isTransientError("TypeError: Failed to fetch"), true)
  assert.equal(isTransientError("Network request failed"), true)
  assert.equal(isTransientError("boom", 503), true)
  assert.equal(isTransientError("new row violates row-level security policy", 403), false)
  assert.equal(isTransientError("duplicate key", 409), false)
  assert.equal(isTransientError(undefined), false)
})

test("hàng đợi: không thêm trùng mã, giới hạn số mục (bỏ mục cũ nhất)", () => {
  const a = enqueue([], item("a"))
  assert.equal(enqueue(a, item("a")).length, 1)
  let list: PendingAnswer[] = []
  for (let i = 0; i < QUEUE_CAP + 5; i++) list = enqueue(list, item(String(i)))
  assert.equal(list.length, QUEUE_CAP)
  assert.equal(list[0].client_id, "5")
})

test("tách hàng đợi: chỉ gửi mục của hồ sơ hiện tại; mục quá hạn hoặc hết lượt thử bị bỏ", () => {
  const q = [item("a"), item("b", { profile_id: "p2" }), item("old", { created_at: new Date(NOW - MAX_AGE_MS - 1000).toISOString() }), item("tired", { tries: MAX_TRIES })]
  const { flush, keep } = splitQueue(q, "p1", NOW)
  assert.deepEqual(flush.map((p) => p.client_id), ["a"])
  assert.deepEqual(keep.map((p) => p.client_id), ["b"])
})

test("sau khi gửi: mục đã gửi được thì bỏ, chưa được thì tăng số lần thử", () => {
  const r = afterFlush([item("a"), item("b")], new Set(["a"]))
  assert.deepEqual(r.map((p) => [p.client_id, p.tries]), [["b", 1]])
})
