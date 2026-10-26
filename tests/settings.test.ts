import test from "node:test"
import assert from "node:assert/strict"
import { sanitizeSettings } from "../src/lib/settings.ts"

test("làm sạch cài đặt: giá trị lạ về mặc định, giữ giá trị hợp lệ", () => {
  const d = sanitizeSettings(null)
  assert.equal(d.skin, "explore")
  assert.equal(d.onboarded, false)
  assert.equal(d.updatedAt, 0)
  const s = sanitizeSettings({ skin: "space", dailyGoal: 20, character: "fox", sound: false, onboarded: true, updatedAt: 1700000000000, fontSize: "huge", dailyGoal2: 1 })
  assert.equal(s.skin, "space")
  assert.equal(s.dailyGoal, 20)
  assert.equal(s.character, "fox")
  assert.equal(s.sound, false)
  assert.equal(s.onboarded, true)
  assert.equal(s.fontSize, "md")
  assert.equal(s.updatedAt, 1700000000000)
})

test("kỷ lục: chỉ nhận số hợp lệ, giới hạn độ dài khóa và số mục", () => {
  const s = sanitizeSettings({ records: { "best.a": 12, bad: "x", neg: -1, nan: Number.NaN, ["k".repeat(81)]: 5 } })
  assert.deepEqual(s.records, { "best.a": 12 })
  const many = Object.fromEntries(Array.from({ length: 150 }, (_, i) => [`k${i}`, i]))
  assert.equal(Object.keys(sanitizeSettings({ records: many }).records).length, 100)
  assert.deepEqual(sanitizeSettings({ updatedAt: -5 }).updatedAt, 0)
})

import { skillOfTopic } from "../src/lib/progress/profile.ts"
import { answerBac } from "../src/lib/path/gate.ts"

test("câu đọc to: mặc định bật, tắt được; chủ điểm 'speak' không thuộc kỹ năng nhận biết nào", () => {
  assert.equal(sanitizeSettings(null).speakQuestions, true)
  assert.equal(sanitizeSettings({ speakQuestions: false }).speakQuestions, false)
  assert.equal(sanitizeSettings({ speakQuestions: "no" }).speakQuestions, true)
  assert.equal(skillOfTopic("speak"), "speaking")
  assert.equal(answerBac({ exercise_id: "en-x-001~speak", topic: "speak" }, { "en-x-001": [3, 2] }), null, "không tính vào cổng nhảy bậc")
})
