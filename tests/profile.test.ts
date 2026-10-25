import test from "node:test"
import assert from "node:assert/strict"
import { buildProfile, skillOfTopic, suggestToday } from "../src/lib/progress/profile.ts"

const NOW = new Date("2026-03-10T12:00:00Z")
const rows = (topic: string, n: number, correct: number, day: string) =>
  Array.from({ length: n }, (_, i) => ({ topic, correct: i < correct, created_at: `${day}T10:${String(i % 60).padStart(2, "0")}:00Z` }))

test("phân loại kỹ năng theo mã chuyên đề", () => {
  assert.equal(skillOfTopic("present-simple"), "grammar")
  assert.equal(skillOfTopic("vocab-a2"), "vocab")
  assert.equal(skillOfTopic("reading-b2"), "reading")
  assert.equal(skillOfTopic("listening-b3"), "listening")
})

test("hồ sơ: cần đủ 10 lượt mới có điểm; Viết/Nói lấy trung bình 3 bài mới nhất", () => {
  const p = buildProfile(
    [...rows("present-simple", 20, 15, "2026-03-09"), ...rows("vocab-a1", 5, 5, "2026-03-09")],
    [
      { skill: "writing", total: 6, created_at: "2026-03-01T00:00:00Z" },
      { skill: "writing", total: 8, created_at: "2026-03-02T00:00:00Z" },
    ],
  )
  const by = Object.fromEntries(p.map((x) => [x.skill, x]))
  assert.equal(by.grammar.score, 0.75)
  assert.equal(by.vocab.score, null)
  assert.equal(by.vocab.samples, 5)
  assert.equal(by.writing.score, 0.7)
  assert.equal(by.speaking.samples, 0)
})

test("gợi ý: thẻ đến hạn trước, rồi kỹ năng yếu nhất, bỏ quên, chưa thử", () => {
  const p = buildProfile(
    [...rows("present-simple", 20, 10, "2026-03-09"), ...rows("vocab-a1", 20, 19, "2026-03-01")],
    [],
  )
  const s = suggestToday(p, 4, NOW, 4)
  assert.deepEqual(s.map((x) => x.key), ["srs", "weak-grammar", "neglect-vocab", "new-listening"])
})

test("gợi ý luôn có ít nhất một mục", () => {
  const s = suggestToday(buildProfile([], []), 0, NOW)
  assert.ok(s.length >= 1)
  assert.equal(s[0].key, "new-grammar")
})
