import test from "node:test"
import assert from "node:assert/strict"
import { applySprint, initialSprint, sprintTitle } from "../src/lib/game/sprint.ts"

test("đúng cộng 10 điểm, đủ 5 câu liên tiếp thưởng thêm 15", () => {
  let s = initialSprint
  for (let i = 0; i < 5; i++) s = applySprint(s, true)
  assert.equal(s.score, 50 + 15)
  assert.equal(s.streak, 5)
  assert.equal(s.bestStreak, 5)
})

test("sai không trừ điểm nhưng ngắt chuỗi", () => {
  let s = applySprint(applySprint(initialSprint, true), true)
  s = applySprint(s, false)
  assert.equal(s.score, 20)
  assert.equal(s.streak, 0)
  assert.equal(s.bestStreak, 2)
  assert.equal(s.wrong, 1)
})

test("lời khen theo điểm", () => {
  assert.equal(sprintTitle(0), "Lần sau sẽ nhanh hơn!")
  assert.equal(sprintTitle(300), "Tốc độ ánh sáng!")
})
