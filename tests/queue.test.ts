import test from "node:test"
import assert from "node:assert/strict"
import { isNewCard, limitNewCards } from "../src/lib/srs/queue.ts"

const card = (id: string, over = {}) => ({ id, intervalDays: 0, ease: 2.5, reps: 0, lapses: 0, ...over })
const old = (id: string) => card(id, { intervalDays: 3, reps: 2 })

test("nhận biết thẻ mới", () => {
  assert.equal(isNewCard(card("a")), true)
  assert.equal(isNewCard(old("a")), false)
  assert.equal(isNewCard(card("a", { lapses: 1 })), false)
})

test("giới hạn thẻ mới, giữ nguyên thứ tự và không đụng thẻ cũ", () => {
  const cards = [card("n1"), old("o1"), card("n2"), card("n3"), old("o2")]
  const r = limitNewCards(cards, 0, 2)
  assert.deepEqual(r.cards.map((c) => c.id), ["n1", "o1", "n2", "o2"])
  assert.equal(r.deferred, 1)
})

test("đã đủ thẻ mới trong ngày thì chỉ còn thẻ cũ", () => {
  const r = limitNewCards([card("n1"), old("o1")], 10, 10)
  assert.deepEqual(r.cards.map((c) => c.id), ["o1"])
  assert.equal(r.deferred, 1)
})
