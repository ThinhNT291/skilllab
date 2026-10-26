import test from "node:test"
import assert from "node:assert/strict"
import { balancedPositions, dropDuplicates, nextIds, similarity, toExercise, validateRawItem, type RawItem } from "../src/lib/content/item-gen.ts"
import { buildGenerationPrompt, buildReviewPrompt, passesReview } from "../src/lib/ai/prompts/grammar-items.ts"

const good = (over: RawItem = {}): RawItem => ({
  usageId: "u1",
  intendedBac: 2,
  difficultyHint: 1,
  prompt: "My sister ______ to school by bus every day.",
  choices: ["goes", "go", "is going", "going"],
  distractorTypes: ["agreement", "wrong_tense", "wrong_form"],
  choiceExplanations: ["Đúng — 'My sister' là ngôi thứ ba số ít.", "Sai — thiếu -es.", "Sai — hiện tại tiếp diễn không hợp với 'every day'.", "Sai — thiếu trợ động từ."],
  explanation: "Ngôi thứ ba số ít thêm -es.",
  selfCheck: { oneAcceptable: true },
  ...over,
})
const ALLOWED = new Set(["u1"])

test("câu hợp lệ qua kiểm tra; mọi lỗi được liệt kê", () => {
  assert.equal(validateRawItem(good(), ALLOWED).ok, true)
  const bad = validateRawItem(good({ usageId: "zzz", prompt: "My sister ** to school.", choices: ["a", "a", "b", "c"], choiceExplanations: ["x", "y", "z", "w"], selfCheck: { oneAcceptable: false }, intendedBac: 9 }), ALLOWED)
  assert.equal(bad.ok, false)
  if (!bad.ok) {
    const r = bad.reasons.join(" | ")
    for (const needle of ["usageId", "chỗ trống", "markdown", "trùng", "Đúng —", "xác nhận", "intendedBac"]) assert.ok(r.includes(needle), needle)
  }
  assert.equal(validateRawItem(good({ prompt: "Hello ______ and ______ there my friend." }), ALLOWED).ok, false)
  assert.equal(validateRawItem(good({ choices: ["a", "b", "c"] }), ALLOWED).ok, false)
})

test("độ giống và loại câu trùng với câu đã có và trong lô", () => {
  assert.ok(similarity("She goes to school by bus", "She goes to school by bus.") > 0.9)
  assert.ok(similarity("She goes to school", "He plays football") < 0.2)
  const { kept, dropped } = dropDuplicates([{ prompt: "She goes to school by bus every day." }, { prompt: "My dog likes bones." }, { prompt: "My dog likes bones!" }], ["She goes to school by bus every day"])
  assert.deepEqual(kept.map((k) => k.prompt), ["My dog likes bones."])
  assert.equal(dropped.length, 2)
})

test("vị trí đáp án đúng rải đều cả lô", () => {
  const pos = balancedPositions(40, () => 0.3)
  const count = [0, 0, 0, 0]
  for (const p of pos) count[p]++
  assert.deepEqual(count, [10, 10, 10, 10])
  const odd = balancedPositions(10)
  assert.ok(Math.max(...[0, 1, 2, 3].map((p) => odd.filter((x) => x === p).length)) <= 3)
})

test("dựng câu: đáp án đúng ở vị trí chọn, giải thích đi theo, lược đồ kho bài tập", () => {
  const v = validateRawItem(good(), ALLOWED)
  assert.ok(v.ok)
  if (!v.ok) return
  for (const position of [0, 1, 2, 3]) {
    const ex = toExercise(v.item, { id: "en-x-001", topic: "x", position })
    assert.equal(ex.correctIndex, position)
    assert.equal(ex.choices[position], "goes")
    assert.ok(ex.choiceExplanations[position].startsWith("Đúng"))
    assert.equal(ex.choiceExplanations.filter((e) => e.startsWith("Sai")).length, 3)
    assert.deepEqual([...ex.choices].sort(), [...v.item.choices].sort())
    // giải thích của mỗi lựa chọn vẫn đúng với lựa chọn đó
    const i = ex.choices.indexOf("is going")
    assert.ok(ex.choiceExplanations[i].includes("tiếp diễn"))
  }
  const ex = toExercise(v.item, { id: "en-x-001", topic: "x", position: 2, bac: 3 })
  assert.deepEqual([ex.kind, ex.language, ex.usageId, ex.tags, ex.bac], ["mcq", "en", "u1", ["u1"], 3])
})

test("mã câu nối tiếp số lớn nhất của chuyên đề", () => {
  assert.deepEqual(nextIds("present-simple", ["en-present-simple-001", "en-present-simple-060", "en-past-simple-099"], 2), ["en-present-simple-061", "en-present-simple-062"])
  assert.deepEqual(nextIds("new-topic", [], 1), ["en-new-topic-001"])
})

test("lời nhắc có đủ ràng buộc then chốt; phản biện: giữ câu khi giải mù khớp đáp án và chỉ một đáp án", () => {
  const p = buildGenerationPrompt({ topicTitle: "Present simple", bac: 2, cefr: "A2", usages: [{ id: "u1", label: "Thói quen", explanationVi: "…", examples: [{ en: "She goes.", vi: "…" }] }], commonMistakes: ["quên -s"], existingPrompts: ["She runs every day."], count: 5, difficultyPlan: "2 easy / 2 medium / 1 hard" })
  for (const needle of ["PUT THE CORRECT OPTION FIRST", "u1 | Thói quen", "She runs every day.", "Write 5 items", "oneAcceptable", "Đúng —", "Sai —", "Bậc 2"]) assert.ok(p.includes(needle), needle)
  const r = buildReviewPrompt([{ id: "a", prompt: "x ______ y", choices: ["p", "q", "r", "s"] }], 2)
  assert.ok(r.includes("A. p") && !/correct/i.test(r.split("Items:")[1].split("For each")[0]))
  assert.equal(passesReview({ id: "a", acceptableIndexes: [2], naturalness: 5, levelFit: 4, issues: [] }, 2).pass, true)
  assert.equal(passesReview({ id: "a", acceptableIndexes: [1, 2], naturalness: 5, levelFit: 4, issues: [] }, 2).pass, false)
  assert.equal(passesReview({ id: "a", acceptableIndexes: [0], naturalness: 5, levelFit: 4, issues: [] }, 2).pass, false)
  assert.equal(passesReview({ id: "a", acceptableIndexes: [2], naturalness: 3, levelFit: 4, issues: [] }, 2).pass, false)
  assert.equal(passesReview({ id: "a", acceptableIndexes: [2], naturalness: 5, levelFit: 4, issues: ["ambiguity"] }, 2).pass, false)
  assert.equal(passesReview(undefined, 0).pass, false)
})
