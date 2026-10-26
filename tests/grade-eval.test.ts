import test from "node:test"
import assert from "node:assert/strict"
import { agreement, errors, quadraticKappa, validateSamples } from "../src/lib/grading/eval.ts"

const P = (pairs: [number, number][]) => pairs.map(([human, machine]) => ({ human, machine }))

test("khớp hoàn toàn, lệch ≤ 1, sai số và độ lệch", () => {
  const a = agreement(P([[2, 2], [3, 2], [1, 4], [0, 0]]))
  assert.deepEqual([a.n, a.exact, a.within], [4, 0.5, 0.75])
  assert.deepEqual(agreement([]), { n: 0, exact: 0, within: 0 })
  const e = errors(P([[2, 3], [2, 3], [4, 2]]))
  assert.ok(Math.abs(e.mae - 4 / 3) < 1e-9)
  assert.ok(Math.abs(e.bias - 0) < 1e-9)
  assert.ok(errors(P([[1, 3], [2, 4]])).bias > 0)
})

test("kappa có trọng số: khớp hoàn toàn = 1, khớp theo chiều ngược thì âm, một bên luôn cùng một mức thì 0, hai bên cùng một mức thì null", () => {
  const same = P([[0, 0], [1, 1], [2, 2], [3, 3], [4, 4], [2, 2]])
  assert.equal(quadraticKappa(same, 0, 4), 1)
  const opposite = P([[0, 4], [4, 0], [1, 3], [3, 1]])
  assert.ok((quadraticKappa(opposite, 0, 4) ?? 0) < 0)
  assert.ok(Math.abs(quadraticKappa(P([[0, 2], [1, 2], [3, 2]]), 0, 4) ?? 9) < 1e-9)
  assert.equal(quadraticKappa(P([[2, 2], [2, 2]]), 0, 4), null)
  assert.equal(quadraticKappa(P([[1, 1]]), 0, 4), null)
  const near = P([[0, 1], [1, 1], [2, 2], [3, 4], [4, 4], [2, 3]])
  const k = quadraticKappa(near, 0, 4)!
  assert.ok(k > 0.5 && k < 1)
})

test("kiểm tra định dạng bộ mẫu: báo đủ lỗi", () => {
  const keys = ["task", "organization", "vocabulary", "grammar"]
  const ok = { id: "a", skill: "writing", task: "Write about x", targetBac: 2, text: "This is a long enough text for the sample here.", human: { scores: { task: 3, organization: 2, vocabulary: 2, grammar: 1 }, bac: 2 } }
  assert.deepEqual(validateSamples([ok], keys), [])
  assert.ok(validateSamples("x", keys)[0].includes("mảng"))
  const bad = validateSamples([{ ...ok, human: { scores: { task: 5, organization: 2 }, bac: 9 } }, { ...ok, skill: "speaking", text: "short" }], keys).join(" | ")
  for (const needle of ["human.bac", "human.scores.task", "human.scores.vocabulary", "trùng id", "skill", "quá ngắn"]) assert.ok(bad.includes(needle), needle)
})
