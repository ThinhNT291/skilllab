import test from "node:test"
import assert from "node:assert/strict"
import { analyzeText, baseForms, bacOfLevel, buildLevelIndex, flagsFor, stripSpeakers } from "../src/lib/content/text-level.ts"

const index = buildLevelIndex([
  { word: "dog", bac: 1 },
  { word: "walk", bac: 1 },
  { word: "park", bac: 1 },
  { word: "happy", bac: 1 },
  { word: "reluctant", bac: 5 },
  { word: "a.m./A.M./am", bac: 1 },
  { word: "ice cream", bac: 1 },
  { word: "city", bac: 1 },
  { word: "run", bac: 1 },
])

test("cấp CEFR thành bậc; mục từ nhiều dạng được tách; cụm nhiều từ bị bỏ; lấy bậc thấp nhất", () => {
  assert.equal(bacOfLevel("A1"), 1)
  assert.equal(bacOfLevel("c2"), 6)
  assert.equal(bacOfLevel("X9"), 0)
  assert.equal(index.get("am"), 1)
  assert.equal(index.has("ice cream"), false)
  assert.equal(buildLevelIndex([{ word: "book", bac: 3 }, { word: "book", bac: 1 }]).get("book"), 1)
})

test("dạng gốc của từ biến cách", () => {
  assert.ok(baseForms("cities").includes("city"))
  assert.ok(baseForms("walked").includes("walk"))
  assert.ok(baseForms("running").includes("run"))
  assert.ok(baseForms("dogs").includes("dog"))
})

test("nhãn người nói ở đầu dòng bị bỏ khi đo", () => {
  assert.equal(stripSpeakers("A: Hello there\nTom: Hi"), "Hello there\nHi")
})

test("đo bài: từ vượt bậc, tên riêng giữa câu bị bỏ, từ chức năng không tính", () => {
  const r = analyzeText("The dog walked in the park with Anna. It was a reluctant dog.", index, 1)
  assert.equal(r.above.length, 1)
  assert.equal(r.above[0].word, "reluctant")
  assert.equal(r.above[0].bac, 5)
  assert.equal(r.unknown.find((u) => u.word === "anna"), undefined)
  assert.ok(r.aboveRatio > 0 && r.aboveRatio < 1)
})

test("cờ: vượt bậc, quá dài/ngắn theo bậc, câu dài", () => {
  const base = { words: 50, sentences: 5, avgSentence: 10, checked: 20, aboveRatio: 0, above: [], unknownRatio: 0, unknown: [] }
  assert.deepEqual(flagsFor("reading", 1, { ...base, words: 60, avgSentence: 7 }), [])
  assert.deepEqual(flagsFor("reading", 1, { ...base, words: 30, avgSentence: 7 }).map((f) => f.kind), ["too-short"])
  assert.deepEqual(flagsFor("reading", 3, { ...base, words: 160, avgSentence: 13, aboveRatio: 0.2 }).map((f) => f.kind), ["above-level"])
  assert.deepEqual(flagsFor("listening", 2, { ...base, words: 80, avgSentence: 30 }).map((f) => f.kind), ["long-sentences"])
  // Bậc 6 không có bậc cao hơn để "vượt"
  assert.deepEqual(flagsFor("reading", 6, { ...base, words: 400, avgSentence: 20, aboveRatio: 0.5 }), [])
})
