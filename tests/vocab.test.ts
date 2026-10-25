import assert from "node:assert/strict"
import { test } from "node:test"
import { clozeQuestion, clozeSentence, meaningQuestion, pickVocabMatchPairs, pickVocabRound, viQuestion, type VocabWord } from "../src/lib/vocab/questions.ts"

const w = (word: string, pos = "noun", ex: string[] = [`I saw the ${word} today.`]): VocabWord => ({ id: `v-${word}-${pos}-1`, word, pos, def: `meaning of ${word}`, ex })
const pool = ["cat", "dog", "house", "river", "car", "book"].map((x) => w(x))

test("câu hỏi nghĩa: đúng một đáp án đúng, 4 lựa chọn khác nhau, giải thích đủ", () => {
  const q = meaningQuestion(pool[0], "a1", pool)
  assert.equal(q.choices.length, 4)
  assert.equal(new Set(q.choices).size, 4)
  assert.equal(q.choices[q.correctIndex], "cat")
  assert.equal(q.choiceExplanations?.length, 4)
  assert.match(q.choiceExplanations![q.correctIndex], /^Đúng/)
})
test("câu điền từ: thay từ bằng chỗ trống; bỏ qua khi từ xuất hiện hai lần hoặc không có ví dụ", () => {
  assert.equal(clozeSentence(pool[0]), "I saw the ______ today.")
  assert.equal(clozeSentence(w("cat", "noun", ["A cat chased a cat."])), null)
  assert.equal(clozeQuestion(w("cat", "noun", ["Dogs bark."]), "a1", pool), null)
})
test("từ gây nhiễu ưu tiên cùng từ loại", () => {
  const mixed = [w("run", "verb"), w("walk", "verb"), w("jump", "verb"), w("swim", "verb"), w("table")]
  const q = meaningQuestion(mixed[0], "a1", mixed)
  assert.ok(!q.choices.includes("table"))
})
test("lượt luyện đủ số câu, không trùng từ", () => {
  const r = pickVocabRound(pool, "a1", 5)
  assert.equal(r.length, 5)
  assert.equal(new Set(r.map((q) => q.id.slice(5))).size, 5)
})

test("câu nghĩa Việt cần có vi; cặp ghép bỏ từ thiếu vi hoặc trùng nghĩa", () => {
  assert.equal(viQuestion(pool[0], "a1", pool), null)
  const vp = pool.map((x, i) => ({ ...x, vi: `nghĩa ${i}` }))
  const q = viQuestion(vp[0], "a1", vp)!
  assert.equal(q.choices[q.correctIndex], "cat")
  assert.match(q.prompt, /nghĩa 0/)
  const pairs = pickVocabMatchPairs(vp, "a1", () => 0.3, 5)
  assert.equal(pairs.length, 5)
  assert.equal(new Set(pairs.map((p) => p.right)).size, 5)
  assert.deepEqual(pickVocabMatchPairs(pool, "a1"), [])
})
