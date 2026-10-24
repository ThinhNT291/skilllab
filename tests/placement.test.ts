import test from "node:test"
import assert from "node:assert/strict"
import { bandOf, pickPlacement, scorePlacement, type PlacementTopic } from "../src/lib/placement.ts"
import type { Exercise } from "../src/lib/content/types.ts"

const topics: PlacementTopic[] = [
  { id: "a", title: "A", firstLevel: "A1", order: 1 },
  { id: "b", title: "B", firstLevel: "A2", order: 2 },
  { id: "c", title: "C", firstLevel: "A2", order: 3 },
  { id: "d", title: "D", firstLevel: "B1", order: 4 },
  { id: "e", title: "E", firstLevel: "B2", order: 5 },
]
const mk = (topic: string, n: number, difficulty: 1 | 2 | 3 = 1): Exercise[] =>
  Array.from({ length: n }, (_, i) => ({ id: `${topic}-${difficulty}-${i}`, kind: "mcq", language: "en", topic, tags: [], difficulty, prompt: "", choices: ["a", "b", "c", "d"], correctIndex: 0, explanation: "" }) as Exercise)
const entries = topics.map((t) => ({ topic: t, exercises: [...mk(t.id, 10, 1), ...mk(t.id, 10, 2), ...mk(t.id, 10, 3)] }))

test("nhóm theo cấp đầu tiên; B2 gộp với B1", () => {
  assert.deepEqual(["A1", "A2", "B1", "B2"].map(bandOf), [0, 1, 2, 2])
})

test("chọn đủ 20 câu, đúng số mỗi nhóm, không mức 3, không trùng, nhóm dễ trước", () => {
  const picked = pickPlacement(entries)
  assert.equal(picked.length, 20)
  assert.equal(new Set(picked.map((p) => p.id)).size, 20)
  assert.ok(picked.every((p) => p.difficulty <= 2))
  const bands = picked.map((p) => bandOf(topics.find((t) => t.id === p.topic)!.firstLevel))
  assert.deepEqual(bands, [...bands].sort())
  assert.equal(bands.filter((b) => b === 0).length, 4)
})

test("chọn luân phiên giữa chuyên đề của nhóm", () => {
  const picked = pickPlacement(entries)
  const band1 = picked.filter((p) => p.topic === "b" || p.topic === "c")
  assert.equal(band1.filter((p) => p.topic === "b").length, 4)
})

test("chấm: đạt nhóm khởi động, trượt nhóm cơ bản → bắt đầu ở nhóm cơ bản, gợi ý chuyên đề đã sai trước", () => {
  const picked = pickPlacement(entries)
  const answers = picked.map((p) => {
    const band = bandOf(topics.find((t) => t.id === p.topic)!.firstLevel)
    return { exerciseId: p.id, correct: band === 0 }
  })
  const r = scorePlacement(answers, picked, topics)
  assert.equal(r.startBand, 1)
  assert.deepEqual(r.bands.map((b) => b.passed), [true, false, false])
  assert.ok(r.recommended.length > 0 && r.recommended.length <= 4)
  assert.ok(["b", "c"].includes(r.recommended[0].id))
})

test("đúng hết → không có nhóm xuất phát", () => {
  const picked = pickPlacement(entries)
  const r = scorePlacement(picked.map((p) => ({ exerciseId: p.id, correct: true })), picked, topics)
  assert.equal(r.startBand, null)
  assert.deepEqual(r.recommended, [])
})
