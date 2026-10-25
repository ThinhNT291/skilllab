import test from "node:test"
import assert from "node:assert/strict"
import { buildSprintLadder, sprintRating } from "../src/lib/game/sprint-ladder.ts"
import type { Exercise } from "../src/lib/content/types.ts"

const reorder = (id: string, n: number): Exercise =>
  ({ id, kind: "reorder", topic: "present-simple", difficulty: 2, bac: 2, tags: [], answerWords: Array.from({ length: n }, (_, i) => `w${i}`), pool: [], prompt: "", explanation: "" }) as unknown as Exercise

test("câu dài hơn thì khó hơn; thang xếp dễ → khó", () => {
  const ladder = buildSprintLadder([reorder("a", 11), reorder("b", 4), reorder("c", 7)], {})
  assert.deepEqual(ladder.map((e) => e.id), ["b", "c", "a"])
  assert.ok(sprintRating(reorder("x", 12), {}) - sprintRating(reorder("y", 4), {}) === 200)
})
