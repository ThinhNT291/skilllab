import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import { analyzeWrong, buildRuleHints, pickWarmup, usagesInRound } from "../src/lib/content/rule-hints.ts"
import type { Exercise, GrammarTopic, McqExercise } from "../src/lib/content/types.ts"

const topic = JSON.parse(fs.readFileSync("src/content/grammar/en/present-simple.json", "utf8")) as GrammarTopic
const all = JSON.parse(fs.readFileSync("src/content/exercises/en/present-simple.json", "utf8")) as Exercise[]

test("gợi ý quy tắc: mỗi mục có nhãn, giải thích ngắn, ví dụ; lỗi thường gặp nối đúng mục", () => {
  const hints = buildRuleHints(topic.theory)
  const ids = topic.theory.usages.map((u) => u.id)
  assert.deepEqual(Object.keys(hints), ids)
  for (const h of Object.values(hints)) {
    assert.ok(h.label && h.explanationVi.length > 0 && h.explanationVi.length <= 262)
    assert.ok(h.example)
  }
  const linked = topic.theory.commonMistakes.flatMap((m) => m.usageIds)
  assert.ok(linked.every((u) => ids.includes(u)))
  assert.ok(Object.values(hints).some((h) => h.mistakes.length > 0))
})

test("ví dụ che từ đích: không lấy câu trong lượt, cùng mục lý thuyết, một chỗ trống", () => {
  const round = all.slice(0, 10)
  const warm = pickWarmup(all, round, 3)
  assert.ok(warm.length >= 1 && warm.length <= 3)
  const roundIds = new Set(round.map((e) => e.id))
  const used = new Set(usagesInRound(round, 6))
  for (const w of warm) {
    assert.ok(used.has(w.usageId))
    assert.equal((w.sentence.match(/_{2,}/g) ?? []).length, 1)
    assert.ok(w.answer.length > 0)
    const src = all.find((e): e is McqExercise => e.kind === "mcq" && e.choices[e.correctIndex] === w.answer && e.usageId === w.usageId && !roundIds.has(e.id))
    assert.ok(src)
  }
})

test("phân tích khi sai: dùng giải thích của đáp án đã chọn và nối quy tắc/lỗi thường gặp", () => {
  const hints = buildRuleHints(topic.theory)
  const ex = all.find((e): e is McqExercise => e.kind === "mcq" && !!e.usageId && (hints[e.usageId!]?.mistakes.length ?? 0) > 0 && !!e.choiceExplanations)!
  const wrongIdx = ex.choices.findIndex((_, i) => i !== ex.correctIndex)
  const a = analyzeWrong(ex, wrongIdx, hints)
  assert.equal(a.why, ex.choiceExplanations![wrongIdx].replace(/^Sai\s*[—-]\s*/, ""))
  assert.equal(a.rule?.id, ex.usageId)
  assert.ok(a.mistake)
  assert.equal(analyzeWrong(ex, ex.correctIndex, hints).why, ex.explanation)
  assert.equal(analyzeWrong(ex, wrongIdx, undefined).rule, null)
})
