import assert from "node:assert/strict"
import { test } from "node:test"
import { buildLadder, nextPosition, pickAtPosition, START_POSITION } from "../src/lib/content/adaptive.ts"
import type { Exercise } from "../src/lib/content/types.ts"

function d(id: string, text: string, difficulty: 1 | 2 | 3 = 1): Exercise {
  return { id, kind: "dictation", language: "en", topic: "t", tags: [], difficulty, text, answers: [text], explanation: "" } as unknown as Exercise
}
const pool = [d("c", "a b c d e f g h i j", 3), d("a", "a b c"), d("b", "a b c d e f", 2)]

test("thang xếp từ dễ đến khó", () => {
  assert.deepEqual(buildLadder(pool).map((e) => e.id), ["a", "b", "c"])
})
test("đúng thì lên, sai thì lùi, giữ trong 0..1", () => {
  assert.ok(nextPosition(0.5, true) > 0.5)
  assert.ok(nextPosition(0.5, false) < 0.5)
  assert.equal(nextPosition(0.95, true), 1)
  assert.equal(nextPosition(0.05, false), 0)
})
test("câu đầu là câu dễ, không lặp câu đã dùng", () => {
  const ladder = buildLadder(pool)
  assert.equal(pickAtPosition(ladder, new Set(), START_POSITION, () => 0)?.id, "a")
  const used = new Set(["a", "b"])
  assert.equal(pickAtPosition(ladder, used, 0, () => 0)?.id, "c")
  assert.equal(pickAtPosition(ladder, new Set(["a", "b", "c"]), 0.5), null)
})

import { MCQ_STEPS, nextPosition as np } from "../src/lib/content/adaptive.ts"

test("bước thích ứng cho trắc nghiệm: cân bằng ở tỷ lệ đúng khoảng 80%", () => {
  const drift = (p: number) => p * MCQ_STEPS.up - (1 - p) * MCQ_STEPS.down
  assert.ok(Math.abs(drift(0.8)) < 1e-9)
  assert.ok(drift(0.95) > 0, "đúng nhiều thì lên")
  assert.ok(drift(0.5) < 0, "đúng ít thì xuống")
  assert.equal(np(0.5, true, MCQ_STEPS), 0.55)
  assert.ok(Math.abs(np(0.5, false, MCQ_STEPS) - 0.3) < 1e-9)
  assert.equal(np(0.01, false, MCQ_STEPS), 0)
})
