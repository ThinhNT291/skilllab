import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import { highlightSegments, quotedFragments } from "../src/lib/listening/evidence.ts"
import type { ListeningItem } from "../src/lib/listening/types.ts"

test("trích đoạn trong lời giải thích; bỏ đoạn quá ngắn", () => {
  assert.deepEqual(quotedFragments("Người khách nói 'I would like a table for two' (hai người). Còn 'no' thì không."), ["I would like a table for two"])
  assert.deepEqual(quotedFragments('Bài nói "We have a free table near the window".'), ["We have a free table near the window"])
  assert.deepEqual(quotedFragments("Không có trích dẫn"), [])
})

test("tô sáng: chỉ đoạn có trong lời thoại, không phân biệt hoa thường, ghép đoạn chồng nhau", () => {
  const t = "A: Hi. I would like a table for two, please.\nB: We have a free table near the window."
  const seg = highlightSegments(t, ["i would like a table for two", "table for two, please", "không có trong bài"])
  assert.equal(seg.map((s) => s.text).join(""), t)
  assert.deepEqual(seg.filter((s) => s.hit).map((s) => s.text), ["I would like a table for two, please"])
  assert.deepEqual(highlightSegments(t, []), [{ text: t, hit: false }])
})

test("trên kho nghe thật: phần lớn câu có ít nhất một đoạn căn cứ tìm thấy trong lời thoại", () => {
  let total = 0
  let found = 0
  for (const n of [1, 2, 3, 4]) {
    const items = JSON.parse(fs.readFileSync(`src/content/listening/en/bac${n}.json`, "utf8")) as ListeningItem[]
    for (const it of items) {
      for (const q of it.questions) {
        total++
        const frags = quotedFragments(q.choiceExplanations[q.correctIndex], q.explanation)
        if (highlightSegments(it.transcript, frags).some((s) => s.hit)) found++
      }
    }
  }
  console.log(`căn cứ tìm thấy: ${found}/${total}`)
  assert.ok(found / total >= 0.5, `chỉ ${found}/${total} câu tô sáng được căn cứ`)
})
