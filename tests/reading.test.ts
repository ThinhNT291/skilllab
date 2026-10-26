import assert from "node:assert/strict"
import { test } from "node:test"
import { passageToExercises, passedReading, readingTopic, type ReadingPassage } from "../src/lib/reading/types.ts"

const p: ReadingPassage = {
  id: "rd-b1-001",
  bac: 1,
  title: "My cat",
  text: "I have a cat.",
  questions: [{ prompt: "What do I have?", choices: ["a dog", "a cat", "a bird", "a fish"], correctIndex: 1, explanation: "x", choiceExplanations: ["Sai", "Đúng", "Sai", "Sai"] }],
}

test("đổi câu hỏi bài đọc thành câu trắc nghiệm có mã ổn định", () => {
  const [q] = passageToExercises(p)
  assert.equal(q.id, "rq-rd-b1-001-1")
  assert.equal(q.topic, readingTopic(1))
  assert.equal(q.choices[q.correctIndex], "a cat")
})
test("ngưỡng đạt 75%", () => {
  assert.equal(passedReading(3, 4), true)
  assert.equal(passedReading(2, 4), false)
  assert.equal(passedReading(0, 0), false)
})

import fs from "node:fs"
import { deriveEvidence, deriveListeningDictation, deriveReadingReorder, evidenceCandidates, listeningLines, listeningExtras, readingExtras, splitSentences } from "../src/lib/content/passage-extras.ts"
import { gradeTyped } from "../src/lib/grading.ts"
import type { ListeningItem } from "../src/lib/listening/types.ts"
import type { ReadingPassage as RP } from "../src/lib/reading/types.ts"

const loadAll = <T>(dir: string): T[] => [1, 2, 3, 4, 5, 6].flatMap((b) => JSON.parse(fs.readFileSync(`src/content/${dir}/en/bac${b}.json`, "utf8")) as T[])

test("tách câu: theo dòng và dấu kết câu, bỏ câu quá ngắn", () => {
  assert.deepEqual(splitSentences("Tom is a boy. He likes football!\n\nYes.\nHe plays every day."), ["Tom is a boy.", "He likes football!", "He plays every day."])
  assert.deepEqual(splitSentences("We hike with Ms. Green on Monday. Dr. Lee comes at 5 p.m. today. Bring a hat."), ["We hike with Ms. Green on Monday.", "Dr. Lee comes at 5 p.m. today.", "Bring a hat."])
})

test("tìm câu làm căn cứ: chỉ sinh khi đúng một câu chứa phần trích dẫn", () => {
  const p: RP = {
    id: "t1", bac: 2, title: "Test", text: "Mai lives in Hue. She has a small cat. The cat sleeps all day long.",
    questions: [
      { prompt: "Where does Mai live?", choices: ["Hue", "Hanoi", "Hoi An", "Da Nang"], correctIndex: 0, explanation: "x", choiceExplanations: ["Đúng — bài viết: 'Mai lives in Hue'.", "Sai", "Sai", "Sai"] },
      { prompt: "What is the cat like?", choices: ["lazy", "x", "y", "z"], correctIndex: 0, explanation: "Không có trích dẫn", choiceExplanations: ["Đúng", "Sai", "Sai", "Sai"] },
    ],
  }
  assert.deepEqual(evidenceCandidates(p), [{ question: 0, sentence: 0 }])
  const ev = deriveEvidence(p, () => 0)!
  assert.equal(ev.kind, "evidence")
  assert.equal(ev.sentences[ev.answerIndex], "Mai lives in Hue.")
  assert.equal(ev.answerText, "Hue")
  assert.equal(ev.id, "rq-t1-x-evidence")
  assert.equal(ev.card.key, "rq-t1-1")
  // câu hỏi chung chung → không dùng
  assert.deepEqual(evidenceCandidates({ ...p, questions: [{ ...p.questions[0], prompt: "Which sentence is true?" }] }), [])
  // câu trích dẫn xuất hiện ở hai câu → không sinh
  const dup: RP = { ...p, text: "Mai lives in Hue. Mai lives in Hue too. And she smiles a lot." }
  assert.equal(deriveEvidence(dup), null)
})

test("trên toàn ngân hàng bài đọc: câu căn cứ đúng chỉ số, sắp xếp từ hợp lệ, đủ nhiều", () => {
  const passages = loadAll<RP>("reading")
  let evidence = 0, reorder = 0
  for (const p of passages) {
    const ev = deriveEvidence(p)
    if (ev) {
      evidence++
      assert.ok(ev.answerIndex >= 0 && ev.answerIndex < ev.sentences.length, p.id)
      assert.ok(ev.sentences.length >= 3, p.id)
      assert.equal(new Set(ev.sentences).size, ev.sentences.length, `${p.id}: câu trùng nhau làm đáp án mập mờ`)
    }
    const ro = deriveReadingReorder(p)
    if (ro) {
      reorder++
      assert.deepEqual([...ro.pool].sort(), [...ro.answerWords].sort(), p.id)
      assert.notEqual(ro.pool.join(" "), ro.answerWords.join(" "), p.id)
      assert.ok(p.text.includes(ro.answerWords.join(" ")), `${p.id}: câu phải có trong bài`)
    }
    assert.ok(readingExtras(p).length <= 2)
  }
  console.log(`# ${passages.length} bài đọc: căn cứ ${evidence}, sắp xếp ${reorder}`)
  assert.ok(evidence >= passages.length * 0.6 && reorder >= passages.length * 0.6)
})

test("trên toàn ngân hàng bài nghe: nghe gõ lại câu có thật trong lời thoại, chấm được", () => {
  const items = loadAll<ListeningItem>("listening")
  let n = 0
  for (const it of items) {
    const d = deriveListeningDictation(it)
    if (!d) continue
    n++
    assert.ok(it.transcript.includes(d.text), `${it.id}: ${d.text}`)
    assert.ok(gradeTyped(d.text, d.answers), it.id)
    assert.ok(listeningLines(it).includes(d.text), it.id)
    assert.ok(listeningExtras(it).length >= 1)
  }
  console.log(`# ${items.length} bài nghe: gõ lại ${n}`)
  assert.ok(n >= items.length * 0.9)
})

import { buildDefIndex, deriveListeningGapfill, deriveWordfind } from "../src/lib/content/passage-extras.ts"
import { gradeTyped as gradeTypedGap } from "../src/lib/grading.ts"

test("bảng nghĩa: chỉ từ có đúng một mục, bỏ từ dành riêng nhưng vẫn đếm chúng", () => {
  const idx = buildDefIndex([
    { word: "bottle", def: "a container for liquids", vi: "chai", pos: "noun" },
    { word: "quickly", def: "fast", pos: "adverb" },
    { word: "run", def: "to move fast on foot", pos: "verb" },
    { word: "light", def: "not heavy", pos: "adjective" },
    { word: "light", def: "bright, with a lot of light" },
    { word: "Cloud", def: "a white mass in the sky", reserved: true, pos: "noun" },
    { word: "river", def: "a large natural stream of water", reserved: false, pos: "noun" },
    { word: "river", def: "other", reserved: true },
  ])
  assert.deepEqual([...idx.keys()], ["bottle"])
  assert.equal(idx.get("bottle")?.vi, "chai")
})

test("tìm từ theo nghĩa: chỉ khi định nghĩa không chứa từ, không trùng định nghĩa với từ khác trong bài", () => {
  const p: RP = { id: "w1", bac: 2, title: "T", text: "Mai drinks water from a bottle. Her bottle is blue. She walks to school.", questions: [] }
  const defs = new Map([
    ["bottle", { def: "a container for liquids", vi: "chai" }],
    ["water", { def: "the clear liquid in rivers", vi: "nước" }],
    ["blue", { def: "the colour of the sky on a sunny day", vi: null }],
  ])
  const ex = deriveWordfind(p, defs, () => 0)!
  assert.equal(ex.kind, "wordfind")
  assert.ok(["bottle", "water", "blue"].includes(ex.target))
  assert.ok(ex.answerIndexes.length >= 1 && ex.answerIndexes.every((i) => ex.words[i].toLowerCase().replace(/[^a-z]/g, "") === ex.target))
  if (ex.target === "bottle") assert.equal(ex.answerIndexes.length, 2, "mọi chỗ xuất hiện đều đúng")
  // hai từ cùng định nghĩa → cả hai bị loại
  const same = new Map([["bottle", { def: "x thing", vi: null }], ["water", { def: "x thing", vi: null }]])
  assert.equal(deriveWordfind({ ...p, text: "Mai drinks water from a bottle." }, same), null)
  // định nghĩa chứa chính từ → bị loại
  assert.equal(deriveWordfind({ ...p, text: "Mai has a bottle." }, new Map([["bottle", { def: "a bottle for water", vi: null }]])), null)
  assert.equal(deriveWordfind(p, new Map()), null)
  // dạng số nhiều cũng đúng
  const plural = deriveWordfind({ ...p, text: "The road is long. Many roads are closed." }, new Map([["road", { def: "a long hard surface for vehicles", vi: null }]]), () => 0)!
  assert.equal(plural.target, "road")
  assert.deepEqual(plural.answerIndexes.map((i) => plural.words[i]), ["road", "roads"])
})

test("nghe điền chỗ trống: từ bị khuyết là từ nội dung xuất hiện một lần, đáp án chấm được, câu đầy đủ có trong lời thoại", () => {
  const it: ListeningItem = { id: "t1", bac: 2, title: "T", transcript: "A: Where is the library, please?\nB: The library is next to the big supermarket.", questions: [] }
  const g = deriveListeningGapfill(it, () => 0)!
  assert.equal(g.kind, "gapfill")
  assert.ok(g.shown.includes("______"))
  assert.equal(g.shown.split("______").length, 2)
  assert.ok(gradeTypedGap(g.answers[0], g.answers))
  assert.equal(g.text.replace(new RegExp(g.answers[0], "i"), "______").replace(/[.,?!]/g, ""), g.shown.replace(/[.,?!]/g, ""))
  // không dùng từ chức năng, tên riêng, từ lặp
  const none: ListeningItem = { ...it, transcript: "A: That is what they will do.\nB: Is Linh there? Yes, Linh is here." }
  assert.equal(deriveListeningGapfill(none), null)
})

test("trên toàn ngân hàng: nghe điền từ có ở hầu hết bài nghe, hợp lệ", () => {
  const items = loadAll<ListeningItem>("listening")
  let n = 0
  for (const it of items) {
    const g = deriveListeningGapfill(it)
    if (!g) continue
    n++
    assert.ok(it.transcript.includes(g.text), it.id)
    assert.equal(g.shown.split("______").length, 2, it.id)
    assert.ok(g.text.toLowerCase().includes(g.answers[0]), it.id)
    const ex = listeningExtras(it)
    assert.ok(ex.length >= 1 && ex.length <= 2)
    if (ex.length === 2) assert.notEqual((ex[0] as { text: string }).text, (ex[1] as { text: string }).text, `${it.id}: hai câu hỏi thêm trùng một câu`)
  }
  console.log(`# ${items.length} bài nghe: điền từ ${n}`)
  assert.ok(n >= items.length * 0.9)
})

test("trên toàn ngân hàng bài đọc: tìm từ theo nghĩa có ở nhiều bài, đáp án đúng chỗ", () => {
  const entries = ["a1", "a2", "b1", "b2", "c1", "c2"].flatMap((l) => JSON.parse(fs.readFileSync(`src/content/vocab/en/${l}.json`, "utf8")) as { word: string; def: string; vi?: string; pos?: string }[])
  const defs = buildDefIndex(entries)
  const passages = loadAll<RP>("reading")
  let n = 0
  for (const p of passages) {
    const w = deriveWordfind(p, defs)
    if (!w) continue
    n++
    assert.ok(w.answerIndexes.length >= 1, p.id)
    for (const i of w.answerIndexes) {
      const tok = w.words[i].replace(/^[^A-Za-z]+|[^A-Za-z]+$/g, "").toLowerCase()
      assert.ok([w.target, `${w.target}s`, `${w.target}es`, `${w.target.slice(0, -1)}ies`].includes(tok), `${p.id}: ${tok} ≠ ${w.target}`)
    }
    assert.ok(!w.definition.toLowerCase().includes(w.target), `${p.id}: định nghĩa lộ đáp án`)
    assert.ok(readingExtras(p, Math.random, defs).length <= 2)
  }
  console.log(`# ${passages.length} bài đọc: tìm từ theo nghĩa ${n}`)
  assert.ok(n >= passages.length * 0.5)
})
