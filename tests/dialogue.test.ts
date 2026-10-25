import assert from "node:assert/strict"
import { test } from "node:test"
import { parseDialogue, voiceFor } from "../src/lib/audio/dialogue.ts"

test("tách lời thoại theo người nói, giữ thứ tự", () => {
  const p = parseDialogue("A: Hello there.\nB: Hi! How are you?\nA: Fine, thanks.")
  assert.deepEqual(p.map((x) => x.speaker), [0, 1, 0])
  assert.equal(p[1].text, "Hi! How are you?")
})
test("đoạn không có nhãn do người dẫn đọc; nhãn là tên riêng cũng được", () => {
  const p = parseDialogue("Attention, please.\nTom: Ready?\nAnna: Yes.")
  assert.deepEqual(p.map((x) => x.speaker), [0, 0, 1])
  assert.equal(voiceFor(0), "Kore")
  assert.equal(voiceFor(1), "Puck")
})
test("câu thông báo có dấu hai chấm giữa câu không bị coi là nhãn", () => {
  const p = parseDialogue("Remember this: bring a jacket.")
  assert.equal(p.length, 1)
  assert.equal(p[0].text, "Remember this: bring a jacket.")
})
