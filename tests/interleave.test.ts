import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import { CONFUSABLE_GROUPS, interleave } from "../src/lib/content/interleave.ts"

test("xen kẽ: đủ số câu, không hai câu liền nhau cùng nhóm khi còn nhóm khác, mỗi nhóm đều có mặt", () => {
  for (let run = 0; run < 50; run++) {
    const groups = ["a", "b", "c"].map((t) => Array.from({ length: 6 }, (_, i) => ({ topic: t, i })))
    const out = interleave(groups, 12)
    assert.equal(out.length, 12)
    for (let k = 1; k < out.length; k++) assert.notEqual(out[k].topic, out[k - 1].topic, `lượt ${run}, vị trí ${k}`)
    for (const t of ["a", "b", "c"]) assert.equal(out.filter((x) => x.topic === t).length, 4)
  }
})

test("xen kẽ: nhóm thiếu câu thì các nhóm còn lại bù; một nhóm thì giữ nguyên; rỗng thì rỗng", () => {
  const out = interleave([[1, 2], [10, 20, 30, 40, 50]], 7)
  assert.equal(out.length, 7)
  assert.deepEqual(interleave([[1, 2, 3]], 2), [1, 2])
  assert.deepEqual(interleave([[], []], 5), [])
})

test("các nhóm dễ nhầm chỉ gồm chuyên đề có thật và có đủ câu", () => {
  const ids = new Set(JSON.parse(fs.readFileSync("src/content/grammar/en/index.json", "utf8")).map((t: { id: string }) => t.id))
  for (const g of CONFUSABLE_GROUPS) {
    assert.ok(g.topics.length >= 2)
    for (const t of g.topics) assert.ok(ids.has(t), `${g.id}: chuyên đề không tồn tại ${t}`)
  }
})
