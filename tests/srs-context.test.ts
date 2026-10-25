import test from "node:test"
import assert from "node:assert/strict"
import { contextFront } from "../src/lib/srs/context.ts"
import { interleaveByTopic } from "../src/lib/srs/queue.ts"

test("contextFront: chỉ thẻ từ vựng đã ôn lẻ lần và câu chứa từ", () => {
  const base = { topic: "vocab-a2", answer: "borrow", filled: "Can I borrow your pen?", reps: 1 }
  assert.equal(contextFront(base), "Can I _____ your pen?")
  assert.equal(contextFront({ ...base, reps: 0 }), null)
  assert.equal(contextFront({ ...base, reps: 2 }), null)
  assert.equal(contextFront({ ...base, topic: "present-simple" }), null)
  assert.equal(contextFront({ ...base, filled: "Lend me a pen." }), null)
})

test("interleaveByTopic: không cùng chuyên đề liền nhau khi còn lựa chọn, giữ đủ thẻ", () => {
  const cards = ["a", "a", "a", "b", "b", "c"].map((topic, i) => ({ topic, i }))
  const out = interleaveByTopic(cards)
  assert.equal(out.length, 6)
  assert.deepEqual(out.map((c) => c.i).sort(), [0, 1, 2, 3, 4, 5])
  for (let k = 1; k < 4; k++) assert.notEqual(out[k].topic, out[k - 1].topic)
})
