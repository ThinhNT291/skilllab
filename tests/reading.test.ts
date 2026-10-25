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
