import test from "node:test"
import assert from "node:assert/strict"
// @ts-expect-error tệp .mjs của script, không có kiểu
import { collectItems, hashOf, stableStringify, summarize } from "../scripts/lib/content-items.mjs"

test("mã băm không phụ thuộc thứ tự khóa", () => {
  assert.equal(stableStringify({ b: 1, a: [2, { d: 1, c: 2 }] }), stableStringify({ a: [2, { c: 2, d: 1 }], b: 1 }))
  assert.equal(hashOf({ x: 1, y: 2 }), hashOf({ y: 2, x: 1 }))
  assert.notEqual(hashOf({ x: 1 }), hashOf({ x: 2 }))
})

test("gom nội dung: mã không trùng, đủ các loại, số lượng khớp kho hiện có", () => {
  const items = collectItems("src/content") as { id: string; collection: string; data: unknown; content_hash: string }[]
  const ids = items.map((i) => i.id)
  assert.equal(new Set(ids).size, ids.length, "có mã trùng giữa các loại nội dung")
  const s = summarize(items) as Record<string, number>
  assert.equal(s.exercise, 1560)
  assert.equal(s.theory, 31)
  assert.equal(s.reading, 56)
  assert.equal(s.listening, 58)
  assert.equal(s.vocab, 1941)
  assert.equal(s.collocation, 8)
  assert.equal(s.vocab_topics, 1)
  assert.equal(s.theory_index, 1)
  for (const it of items) assert.ok(it.data && it.content_hash.length === 16)
})
