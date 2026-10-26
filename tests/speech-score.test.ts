import test from "node:test"
import assert from "node:assert/strict"
import { bestOf, normalizeWords, scoreSpeech, SPEAK_PASS_RATIO } from "../src/lib/speech/score.ts"

test("chuẩn hóa: chữ thường, bỏ dấu câu, gạch nối, số thành chữ", () => {
  assert.deepEqual(normalizeWords("Hello, World!"), ["hello", "world"])
  assert.deepEqual(normalizeWords("well-known"), ["well", "known"])
  assert.deepEqual(normalizeWords("I have 5 books and 21 pens"), ["i", "have", "five", "books", "and", "twenty", "one", "pens"])
  assert.deepEqual(normalizeWords("I have 150"), ["i", "have", "150"], "số lớn giữ nguyên")
})

test("viết tắt tương đương dạng đầy đủ ở cả hai phía", () => {
  assert.deepEqual(normalizeWords("I'm"), normalizeWords("I am"))
  assert.deepEqual(normalizeWords("don't"), normalizeWords("do not"))
  assert.deepEqual(normalizeWords("isn’t"), ["is", "not"])
  assert.deepEqual(normalizeWords("It's late"), normalizeWords("it is late"))
  assert.deepEqual(normalizeWords("won't"), ["will", "not"])
  assert.deepEqual(normalizeWords("Nam's bike"), ["nam", "bike"], "sở hữu cách bỏ 's")
})

test("đọc đúng hết: ratio 1, đạt, mọi từ được đánh dấu nghe được", () => {
  const s = scoreSpeech("She goes to school every day.", "she goes to school every day")
  assert.equal(s.ratio, 1)
  assert.equal(s.passed, true)
  assert.ok(s.words.every((w) => w.heard))
  assert.equal(s.words.length, 6)
  assert.equal(s.words[0].word, "She", "giữ chữ như trong câu gốc")
})

test("thiếu từ hoặc đọc sai từ: từ đó bị đánh dấu chưa rõ, ratio theo số từ", () => {
  const s = scoreSpeech("She goes to school every day", "she go to school every day") // sai đuôi -es
  assert.deepEqual(s.words.map((w) => w.heard), [true, false, true, true, true, true])
  assert.equal(Math.round(s.ratio * 100), 83)
  assert.equal(s.passed, true, "5/6 ≥ 80%")
  const s2 = scoreSpeech("She goes to school every day", "she to school")
  assert.equal(s2.passed, false)
  assert.deepEqual(s2.words.map((w) => w.heard), [true, false, true, true, false, false])
})

test("thứ tự được tính: các từ đúng nhưng đảo thứ tự không được đủ điểm", () => {
  const s = scoreSpeech("I like red apples", "apples red like I")
  assert.ok(s.ratio <= 0.5)
  assert.equal(s.passed, false)
})

test("từ thừa không bị trừ; chuỗi rỗng thì 0; từ viết tắt tính theo từ gốc", () => {
  assert.equal(scoreSpeech("I like apples", "um I really like apples").ratio, 1)
  const empty = scoreSpeech("I like apples", "")
  assert.equal(empty.ratio, 0)
  assert.equal(empty.passed, false)
  const c = scoreSpeech("I don't like apples", "i do not like apples")
  assert.equal(c.ratio, 1)
  assert.equal(c.words.length, 4)
  const half = scoreSpeech("I don't like apples", "i do like apples") // thiếu "not": từ don't chưa rõ
  assert.deepEqual(half.words.map((w) => w.heard), [true, false, true, true])
})

test("số trong câu mẫu khớp với chữ nhận dạng được và ngược lại", () => {
  assert.equal(scoreSpeech("I have 2 brothers", "i have two brothers").ratio, 1)
  assert.equal(scoreSpeech("I have two brothers", "i have 2 brothers").ratio, 1)
})

test("bestOf chọn cách nghe khớp nhất", () => {
  const b = bestOf("She likes tea", ["she lakes tea", "she likes tea", "see likes tea"])
  assert.equal(b.text, "she likes tea")
  assert.equal(b.score.ratio, 1)
  assert.equal(bestOf("x y", []).score.ratio, 0)
  assert.equal(SPEAK_PASS_RATIO, 0.8)
})
