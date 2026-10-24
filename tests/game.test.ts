import test from "node:test"
import assert from "node:assert/strict"
import { coinsAvailable, levelFromXp, xpFor, xpForLevel } from "../src/lib/game/xp.ts"
import { earnedBadges } from "../src/lib/game/badges.ts"
import { spentOn, toggleEquip } from "../src/lib/game/shop.ts"

test("XP: đúng 10, sai 2", () => assert.equal(xpFor(3, 5), 40))

test("cấp độ: mốc 0, 100, 300, 600", () => {
  assert.deepEqual([1, 2, 3, 4].map(xpForLevel), [0, 100, 300, 600])
  assert.deepEqual(levelFromXp(0), { level: 1, into: 0, span: 100 })
  assert.deepEqual(levelFromXp(99), { level: 1, into: 99, span: 100 })
  assert.deepEqual(levelFromXp(100), { level: 2, into: 0, span: 200 })
  assert.equal(levelFromXp(599).level, 3)
})

test("xu = XP/10 trừ đã tiêu, không âm", () => {
  assert.equal(coinsAvailable(250, 0), 25)
  assert.equal(coinsAvailable(250, 20), 5)
  assert.equal(coinsAvailable(10, 50), 0)
})

test("huy hiệu mở theo số liệu", () => {
  const none = earnedBadges({ answers: 0, correct: 0, topics: 0, bestStreak: 0, activeDays: 0 }).map((b) => b.id)
  assert.deepEqual(none, [])
  const some = earnedBadges({ answers: 60, correct: 54, topics: 5, bestStreak: 3, activeDays: 4 }).map((b) => b.id)
  assert.ok(["first-step", "answers-50", "sharp", "streak-3", "explorer-5"].every((id) => some.includes(id)))
  assert.ok(!some.includes("answers-200"))
  // chính xác cần đủ 50 câu
  assert.ok(!earnedBadges({ answers: 10, correct: 10, topics: 1, bestStreak: 1, activeDays: 1 }).some((b) => b.id === "sharp"))
})

test("đeo vật phẩm: một vật mỗi vị trí, bấm lại để tháo", () => {
  assert.deepEqual(toggleEquip([], "cap"), ["cap"])
  assert.deepEqual(toggleEquip(["cap"], "crown"), ["crown"])
  assert.deepEqual(toggleEquip(["crown", "scarf"], "cap"), ["scarf", "cap"])
  assert.deepEqual(toggleEquip(["cap"], "cap"), [])
  assert.deepEqual(toggleEquip(["cap"], "nope"), ["cap"])
})

test("tổng xu đã tiêu", () => assert.equal(spentOn(["bow", "cap", "nope"]), 45))

test("game thưởng: mời sau mỗi 3 lượt rồi đếm lại", async () => {
  const { advanceRounds } = await import("../src/lib/game/bonus.ts")
  assert.deepEqual(advanceRounds(0), { count: 1, offer: false })
  assert.deepEqual(advanceRounds(1), { count: 2, offer: false })
  assert.deepEqual(advanceRounds(2), { count: 0, offer: true })
})

test("trùm cuối: thắng khi hết máu, thua khi hết mạng, sao theo mạng còn lại", async () => {
  const { applyAnswer, bossStars, startBoss } = await import("../src/lib/game/boss.ts")
  let s = startBoss(2)
  s = applyAnswer(s, false)
  assert.equal(s.lives, 2)
  s = applyAnswer(s, true)
  s = applyAnswer(s, true)
  assert.equal(s.status, "won")
  assert.equal(bossStars(s), 2)
  assert.equal(applyAnswer(s, false).lives, 2) // đã kết thúc thì không đổi nữa
  let t = startBoss(10)
  for (let i = 0; i < 3; i++) t = applyAnswer(t, false)
  assert.equal(t.status, "lost")
  assert.equal(bossStars(t), 0)
  assert.equal(bossStars(applyAnswer(startBoss(1), true)), 3)
})
