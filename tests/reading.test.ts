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
    assert.equal(listeningExtras(it).length, 1)
  }
  console.log(`# ${items.length} bài nghe: gõ lại ${n}`)
  assert.ok(n >= items.length * 0.9)
})
