import test from "node:test"
import assert from "node:assert/strict"
import { paceNote, speakingMetrics, wordsOf, writingMetrics } from "../src/lib/grading/metrics.ts"

test("đếm từ giữ dạng rút gọn", () => {
  assert.deepEqual(wordsOf("I don't like it, but She's here."), ["i", "don't", "like", "it", "but", "she's", "here"])
})

test("số liệu bài viết: câu, đoạn, từ nối, từ lặp", () => {
  const text = "I like dogs because they are friendly. I like dogs and cats. However, dogs need walks.\n\nFor example, my dog runs every day. My dog likes dogs."
  const m = writingMetrics(text)
  assert.equal(m.sentences, 5)
  assert.equal(m.paragraphs, 2)
  assert.ok(m.connectors.includes("because") && m.connectors.includes("however") && m.connectors.includes("for example"))
  assert.deepEqual(m.repeatedWords, [{ word: "dogs", count: 4 }])
  assert.equal(m.words, 27)
  assert.equal(m.lexicalVariety, 0.74)
  assert.equal(m.avgSentenceWords, 5.4)
  assert.equal(m.longestSentenceWords, 7)
})

test("bài quá ngắn không tính độ đa dạng từ", () => {
  assert.equal(writingMetrics("I am Mia.").lexicalVariety, null)
  assert.equal(writingMetrics("").sentences, 0)
})

test("số liệu bài nói: từ/phút, từ đệm, đoạn nghe không rõ", () => {
  const m = speakingMetrics("Um I like, uh, football [unintelligible] and you know music", 12)
  assert.equal(m.words, 9)
  assert.equal(m.fillers, 3)
  assert.equal(m.unclear, 1)
  assert.equal(m.wpm, 45)
  assert.equal(speakingMetrics("hello there", 2).wpm, null)
  assert.equal(speakingMetrics("hello", null).wpm, null)
})

test("nhận xét tốc độ", () => {
  assert.equal(paceNote(null), null)
  assert.match(paceNote(30)!, /chậm/)
  assert.match(paceNote(80)!, /phù hợp/)
  assert.match(paceNote(140)!, /nhanh/)
})
