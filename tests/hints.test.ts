import assert from "node:assert/strict"
import { test } from "node:test"
import { buildGlossPrompt, parseGloss, parseHints, parseMindmap } from "../src/lib/hints.ts"

test("sơ đồ tư duy thành cây theo cấp tiêu đề", () => {
  const t = parseMindmap("# Pets\n## Why\n### fun\n### friend\n## Care\nignored line\n### food")
  assert.equal(t.length, 1)
  assert.deepEqual(t[0].children.map((c) => c.text), ["Why", "Care"])
  assert.deepEqual(t[0].children[0].children.map((c) => c.text), ["fun", "friend"])
  assert.deepEqual(parseMindmap(5), [])
})
test("parseHints làm sạch, trả null khi rỗng", () => {
  const h = parseHints({ organization: ["P1: …", 7], mindmap: "# A\n## B", vocabulary: "x" })
  assert.ok(h)
  assert.deepEqual(h.organization, ["P1: …"])
  assert.deepEqual(h.vocabulary, [])
  assert.equal(parseHints({}), null)
})
test("giải nghĩa từ: cần có nghĩa; lời nhắc coi từ và câu là dữ liệu", () => {
  assert.equal(parseGloss({ vi: " " }), null)
  assert.equal(parseGloss({ vi: "đi bộ", pos: "động từ" })?.vi, "đi bộ")
  assert.match(buildGlossPrompt("run", "I run."), /<word>run<\/word>/)
})
