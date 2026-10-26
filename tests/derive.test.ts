import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import { answerVariants, gradeReorder, gradeTyped, normalize } from "../src/lib/grading.ts"
import { deriveDictation, deriveReorder, deriveTyped, mixVariants } from "../src/lib/content/derive.ts"
import type { Exercise, McqExercise } from "../src/lib/content/types.ts"

const mcq = (over: Partial<McqExercise>): McqExercise => ({
  id: "en-present-simple-001", kind: "mcq", language: "en", topic: "present-simple", tags: [], difficulty: 1,
  prompt: "She ______ (clean) her room on Saturday morning.", choices: ["cleans", "clean", "cleaned", "cleaning"], correctIndex: 0, explanation: "x", ...over,
})

test("chuẩn hóa: bỏ hoa/thường, dấu câu, thống nhất dấu nháy", () => {
  assert.equal(normalize("  She Cleans her ROOM. "), "she cleans her room")
  assert.equal(normalize("Doesn’t"), "doesn't")
})

test("chấp nhận cả dạng viết tắt lẫn đầy đủ", () => {
  assert.ok(gradeTyped("does not", ["doesn't"]))
  assert.ok(gradeTyped("Doesn't", ["does not"]))
  assert.ok(gradeTyped("won't", ["will not"]))
  assert.ok(gradeTyped("cannot", ["can't"]))
  assert.ok(!gradeTyped("do not", ["doesn't"]))
  assert.ok(!gradeTyped("", ["x"]))
})

test("đáp án gõ phải đúng từng từ", () => {
  assert.ok(gradeTyped("cleans", ["cleans"]))
  assert.ok(!gradeTyped("clean", ["cleans"]))
  assert.ok(!gradeTyped("cleans up", ["cleans"]))
  assert.deepEqual(answerVariants("has been"), ["has been"])
})

test("chấm sắp xếp: đúng thứ tự mới đúng", () => {
  assert.ok(gradeReorder(["a", "b", "c"], ["a", "b", "c"]))
  assert.ok(!gradeReorder(["a", "c", "b"], ["a", "b", "c"]))
  assert.ok(!gradeReorder(["a", "b"], ["a", "b", "c"]))
})

test("sinh câu sắp xếp: tập từ giữ nguyên, thứ tự khác đáp án", () => {
  const r = deriveReorder(mcq({ prompt: "My brother ______ (study) English at the centre.", choices: ["studies", "study", "studys", "is studying"] }))!
  assert.equal(r.answerWords.join(" "), "My brother studies English at the centre.")
  assert.deepEqual([...r.pool].sort(), [...r.answerWords].sort())
  assert.notEqual(r.pool.join(" "), r.answerWords.join(" "))
})

test("không sinh câu sắp xếp với câu có trạng từ thời gian", () => {
  assert.equal(deriveReorder(mcq({ prompt: "She ______ (clean) her room yesterday.", choices: ["cleaned", "x", "y", "z"] })), null)
})

test("sinh câu gõ chỉ khi một chỗ trống, đáp án ngắn, có gợi ý động từ", () => {
  assert.ok(deriveTyped(mcq({})))
  assert.equal(deriveTyped(mcq({ prompt: "She ______ her room." })), null) // thiếu gợi ý
  assert.equal(deriveTyped(mcq({ prompt: "A ______ b ______ c (x).", choices: ["a", "b", "c", "d"] })), null)
  assert.equal(deriveTyped(mcq({ topic: "future-simple" })), null) // chuyên đề đáp án không xác định
  assert.equal(deriveTyped(mcq({ choices: ["reads / is reading", "a", "b", "c"] })), null)
})

test("câu gõ chấp nhận dạng viết tắt", () => {
  const t = deriveTyped(mcq({ prompt: "He ______ (not/like) spicy food.", choices: ["doesn't like", "x", "y", "z"] }))!
  assert.ok(gradeTyped("does not like", t.answers))
  assert.ok(gradeTyped("Doesn't like", t.answers))
})

test("sinh nghe chép từ câu hoàn chỉnh", () => {
  const d = deriveDictation(mcq({}))!
  assert.equal(d.text, "She cleans her room on Saturday morning.")
  assert.ok(gradeTyped("she cleans her room on saturday morning", d.answers))
})

test("trên toàn ngân hàng: biến thể hợp lệ và số lượng đủ dùng", () => {
  const dir = "src/content/exercises/en"
  let reorder = 0, typed = 0, dictation = 0, total = 0
  for (const f of fs.readdirSync(dir)) {
    for (const ex of JSON.parse(fs.readFileSync(`${dir}/${f}`, "utf8")) as McqExercise[]) {
      total++
      const r = deriveReorder(ex)
      if (r) {
        reorder++
        assert.deepEqual([...r.pool].sort(), [...r.answerWords].sort(), ex.id)
        assert.notEqual(r.pool.join(" "), r.answerWords.join(" "), ex.id)
      }
      const t = deriveTyped(ex)
      if (t) {
        typed++
        assert.ok(t.answers.length >= 1 && t.answers.every((a) => a.length > 0), ex.id)
        assert.ok(gradeTyped(ex.choices[ex.correctIndex], t.answers), ex.id)
      }
      const d = deriveDictation(ex)
      if (d) {
        dictation++
        assert.ok(gradeTyped(d.text, d.answers), ex.id)
      }
    }
  }
  console.log(`# ${total} câu gốc: sắp xếp ${reorder}, gõ ${typed}, nghe chép ${dictation}`)
  assert.ok(reorder > 100 && typed > 100 && dictation > 200)
})

test("trộn biến thể: giữ nguyên số câu, thay tối đa 3 câu, giữ chủ điểm và độ khó", () => {
  const list: Exercise[] = Array.from({ length: 10 }, (_, i) => mcq({ id: `en-present-simple-${i}` }))
  const mixed = mixVariants(list, Math.random, 3)
  assert.equal(mixed.length, 10)
  const changed = mixed.filter((e) => e.kind !== "mcq")
  assert.ok(changed.length >= 1 && changed.length <= 3)
  assert.ok(changed.every((e) => e.topic === "present-simple" && e.difficulty === 1))
})

test("tìm lỗi: điền đáp án sai vào chỗ trống và khoanh đúng vị trí", async () => {
  const { deriveSpot } = await import("../src/lib/content/derive.ts")
  const { gradeSpot } = await import("../src/lib/grading.ts")
  const ex = {
    id: "en-x-001", kind: "mcq", language: "en", topic: "present-simple", tags: [], difficulty: 1,
    prompt: "She ______ (clean) her room every Saturday.", choices: ["cleans", "clean", "is cleaning", "to clean"], correctIndex: 0,
    explanation: "x", choiceExplanations: ["Đúng — x", "Sai — 'She' là ngôi thứ ba.", "Sai — tiếp diễn.", "Sai — cấu trúc."],
  } as McqExercise
  const s = deriveSpot(ex, () => 0.5)!
  assert.equal(s.words.join(" "), "She is cleaning her room every Saturday.")
  assert.deepEqual([s.errorFrom, s.errorTo], [1, 2])
  assert.equal(gradeSpot(2, s.errorFrom, s.errorTo), true)
  assert.equal(gradeSpot(0, s.errorFrom, s.errorTo), false)
  assert.equal(s.correctSentence, "She cleans her room every Saturday.")
  assert.equal(s.explanation, "tiếp diễn.")
  assert.equal(deriveSpot({ ...ex, choiceExplanations: ["Đúng", "x", "y", "z"] }), null)
})

test("ghép cặp: đủ 5 cặp có đáp án khác nhau, hoặc không có cặp nào", async () => {
  const { pickMatchPairs } = await import("../src/lib/content/match.ts")
  const dir = new URL("../src/content/exercises/en/", import.meta.url)
  const all = JSON.parse(fs.readFileSync(new URL("present-simple.json", dir), "utf8")) as Exercise[]
  const pairs = pickMatchPairs(all)
  assert.equal(pairs.length, 5)
  assert.equal(new Set(pairs.map((p) => p.right.toLowerCase())).size, 5)
  assert.ok(pairs.every((p) => /_{2,}/.test(p.left) && !/\(/.test(p.left)))
  assert.deepEqual(pickMatchPairs(all.slice(0, 2)), [])
})

test("sửa lỗi: câu có lỗi và đáp án là cả câu đúng; chấp nhận hoa/thường và dấu câu", async () => {
  const { deriveFix } = await import("../src/lib/content/derive.ts")
  const ex = {
    id: "en-x-001", kind: "mcq", language: "en", topic: "present-simple", tags: [], difficulty: 1,
    prompt: "She ______ (clean) her room every Saturday.", choices: ["cleans", "clean", "is cleaning", "to clean"], correctIndex: 0,
    explanation: "x", choiceExplanations: ["Đúng — x", "Sai — 'She' là ngôi thứ ba.", "Sai — tiếp diễn.", "Sai — cấu trúc."],
  } as McqExercise
  const f = deriveFix(ex, () => 0.5)!
  assert.equal(f.kind, "fix")
  assert.equal(f.wrongSentence, "She is cleaning her room every Saturday.")
  assert.ok(gradeTyped("she cleans her room every saturday", f.answers))
  assert.ok(gradeTyped("She cleans her room every Saturday!", f.answers))
  assert.ok(!gradeTyped("She is cleaning her room every Saturday.", f.answers))
  assert.equal(f.id, "en-x-001~fix")
  assert.equal(deriveFix({ ...ex, choiceExplanations: undefined }), null)
})

test("độ khó theo màn: gợi ý giảm dần; ba câu đầu luôn là trắc nghiệm; biến thể ở cuối khó hơn giữa lượt", async () => {
  const { scaffoldFor, mixVariants } = await import("../src/lib/content/derive.ts")
  assert.deepEqual([0, 3, 5, 9].map((i) => scaffoldFor(i, 10)), [2, 2, 1, 0])
  assert.equal(scaffoldFor(0, 1), 0)
  const mk = (i: number) => ({
    id: `en-x-${i}`, kind: "mcq", language: "en", topic: "present-simple", tags: [], difficulty: 1,
    prompt: "She ______ (clean) her room every Saturday morning.", choices: ["cleans", "clean", "is cleaning", "to clean"], correctIndex: 0,
    explanation: "x", choiceExplanations: ["Đúng — x", "Sai — 'She' là ngôi thứ ba.", "Sai — tiếp diễn.", "Sai — cấu trúc."],
  }) as McqExercise
  for (let run = 0; run < 30; run++) {
    const out = mixVariants(Array.from({ length: 10 }, (_, i) => mk(i)), Math.random, 4)
    assert.ok(out.slice(0, 3).every((e) => e.kind === "mcq"))
    out.slice(3, 7).forEach((e) => assert.ok(["mcq", "reorder", "spot"].includes(e.kind), e.kind))
    out.slice(7).forEach((e) => assert.ok(["mcq", "typed", "fix", "spot"].includes(e.kind), e.kind))
    assert.ok(out.filter((e) => e.kind !== "mcq").length <= 4)
  }
})

import { deriveSpeak, injectSpeak, SPEAK_MAX_WORDS, SPEAK_MIN_WORDS } from "../src/lib/content/derive.ts"

test("câu đọc to: từ câu hoàn chỉnh, độ dài vừa đọc, chỉ chữ tiếng Anh", () => {
  const s = deriveSpeak(mcq({}))!
  assert.equal(s.kind, "speak")
  assert.equal(s.text, "She cleans her room on Saturday morning.")
  assert.equal(s.id, "en-present-simple-001~speak")
  assert.equal(s.topic, "present-simple")
  assert.equal(s.card.key, "en-present-simple-001", "sai vẫn trỏ về thẻ của câu gốc")
  assert.equal(deriveSpeak(mcq({ prompt: "I ______ (go) home.", choices: ["go", "went", "goes", "going"] })), null, "quá ngắn")
  assert.equal(deriveSpeak(mcq({ prompt: "She ______ (clean) her room on 5 May and again in the early evening with her little sister.", choices: ["cleans", "x", "y", "z"] })), null, "có số hoặc quá dài")
  assert.equal(deriveSpeak(mcq({ prompt: "A: Is she there? B: She ______ (clean) her room.", choices: ["cleans", "x", "y", "z"] })), null, "hội thoại")
})

test("trên toàn ngân hàng: đủ nhiều câu đọc to, độ dài và ký tự hợp lệ", () => {
  const dir = "src/content/exercises/en"
  let speak = 0
  let total = 0
  for (const f of fs.readdirSync(dir)) {
    for (const ex of JSON.parse(fs.readFileSync(`${dir}/${f}`, "utf8")) as McqExercise[]) {
      total++
      const s = deriveSpeak(ex)
      if (!s) continue
      speak++
      const n = s.text.split(/\s+/).length
      assert.ok(n >= SPEAK_MIN_WORDS && n <= SPEAK_MAX_WORDS, ex.id)
      assert.ok(/^[A-Za-z][A-Za-z ,.'’!?-]*$/.test(s.text), `${ex.id}: ${s.text}`)
    }
  }
  console.log(`# ${total} câu gốc: đọc to ${speak}`)
  assert.ok(speak > 150)
})

test("chèn câu đọc to: tối đa một câu, ở nửa sau, chọn câu ngắn nhất, không đổi câu biến thể, idempotent", () => {
  const mk = (i: number, prompt: string) => mcq({ id: `en-x-${i}`, prompt, choices: ["cleans", "clean", "cleaned", "cleaning"] })
  const list: Exercise[] = [
    mk(1, "She ______ (clean) her room on Saturday morning."), // nửa đầu: không được đổi dù ngắn
    mk(2, "She ______ (clean) her room."),
    mk(3, "She ______ (clean) her room on Saturday morning very early."),
    mk(4, "She ______ (clean) her small room every day."), // nửa sau, 7 từ
    mk(5, "She ______ (clean) her big room too."), // nửa sau, 6 từ ← ngắn nhất
    { ...mk(6, "She ______ (clean) her tidy room."), id: "en-x-6~reorder" },
  ]
  const out = injectSpeak(list, 0, () => 0)
  assert.equal(out.length, list.length)
  assert.equal(out.filter((e) => e.kind === "speak").length, 1)
  const i = out.findIndex((e) => e.kind === "speak")
  assert.ok(i >= 3, "nửa sau")
  assert.equal(i, 4, "câu ngắn nhất")
  assert.equal(out[0], list[0])
  assert.equal(injectSpeak(out, 0, () => 0), out, "đã có thì giữ nguyên")
  // không có ứng viên: trả lại đúng danh sách
  const none: Exercise[] = [mk(1, "I ______ (go) home."), mk(2, "I ______ (go) home.")]
  assert.equal(injectSpeak(none), none)
  // `from` chặn các câu đã qua
  const late = injectSpeak(list, 5, () => 0)
  assert.equal(late.some((e) => e.kind === "speak"), false)
})
