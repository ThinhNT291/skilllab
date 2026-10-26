import test from "node:test"
import assert from "node:assert/strict"
import { CHALLENGE_SECONDS, proposalFor, skillBreakdown, verdictOf, type AttemptLite, type ChallengeAnswer } from "../src/lib/path/challenge.ts"

const mk = (skill: ChallengeAnswer["skill"], ok: number, bad: number): ChallengeAnswer[] => [...Array(ok).fill(true), ...Array(bad).fill(false)].map((correct) => ({ skill, correct }))
const full = (g: [number, number], v: [number, number], r: [number, number], l: [number, number]) => [...mk("grammar", ...g), ...mk("vocab", ...v), ...mk("reading", ...r), ...mk("listening", ...l)]

test("thời gian giới hạn hợp lý cho 20 câu", () => {
  assert.ok(CHALLENGE_SECONDS >= 600 && CHALLENGE_SECONDS <= 1800)
})

test("gom theo kỹ năng", () => {
  const by = skillBreakdown(full([7, 1], [4, 0], [3, 1], [2, 2]))
  assert.deepEqual(by.map((s) => [s.skill, s.correct, s.total]), [["grammar", 7, 8], ["vocab", 4, 4], ["reading", 3, 4], ["listening", 2, 4]])
})

test("kết luận một bài: nâng khi đúng nhiều và đều; một kỹ năng dưới sàn thì không nâng; thấp thì chỉ gợi ý ôn", () => {
  assert.equal(verdictOf(full([8, 0], [4, 0], [4, 0], [3, 1])).verdict, "up") // 19/20
  assert.equal(verdictOf(full([8, 0], [4, 0], [3, 1], [3, 1])).verdict, "up") // 18/20 = 90%
  // 17/20 = 85% đủ tổng thể, nghe 2/4 = đúng sàn 50% (không dưới sàn) → vẫn nâng
  assert.equal(verdictOf(full([8, 0], [4, 0], [3, 1], [2, 2])).verdict, "up")
  // 17/20 = 85% nhưng nghe 1/4 = 25% < sàn → giữ nguyên, ghi rõ kỹ năng yếu
  const lopsided = verdictOf(full([8, 0], [4, 0], [4, 0], [1, 3]))
  assert.equal(lopsided.verdict, "stay")
  assert.deepEqual(lopsided.weak, ["listening"])
  // 16/20 = 80% < 85% → giữ nguyên
  assert.equal(verdictOf(full([7, 1], [3, 1], [3, 1], [3, 1])).verdict, "stay")
  // dưới 50% → gợi ý ôn, không có "hạ"
  assert.equal(verdictOf(full([3, 5], [1, 3], [1, 3], [1, 3])).verdict, "review")
  assert.equal(verdictOf([]).verdict, "review")
  assert.equal(verdictOf([]).ratio, 0)
})

const A = (bac: number, verdict: AttemptLite["verdict"], day: string, hour = "10"): AttemptLite => ({ bac, verdict, day, at: `${day}T${hour}:00:00Z` })

test("đề xuất nâng: cần HAI bài tốt ở hai ngày khác nhau; bài tệ ở giữa hủy đề xuất", () => {
  assert.deepEqual(proposalFor(3, []), { kind: "none" })
  assert.deepEqual(proposalFor(3, [A(3, "up", "2026-11-01")]), { kind: "pending", bac: 3 })
  // hai bài tốt cùng một ngày chưa đủ (tránh làm liền hai lần cho chắc ăn)
  assert.deepEqual(proposalFor(3, [A(3, "up", "2026-11-01", "08"), A(3, "up", "2026-11-01", "09")]), { kind: "pending", bac: 3 })
  assert.deepEqual(proposalFor(3, [A(3, "up", "2026-11-01"), A(3, "up", "2026-11-03")]), { kind: "confirmed", bac: 3 })
  // thứ tự đầu vào không quan trọng
  assert.deepEqual(proposalFor(3, [A(3, "up", "2026-11-03"), A(3, "up", "2026-11-01")]), { kind: "confirmed", bac: 3 })
  // bài gần nhất không tốt thì hủy, dù trước đó có hai bài tốt
  assert.deepEqual(proposalFor(3, [A(3, "up", "2026-11-01"), A(3, "up", "2026-11-03"), A(3, "stay", "2026-11-05")]), { kind: "none" })
  // chỉ xét bài của đúng bậc đó
  assert.deepEqual(proposalFor(3, [A(3, "up", "2026-11-01"), A(2, "up", "2026-11-03")]), { kind: "pending", bac: 3 })
  // bậc cuối không có bậc kế
  assert.deepEqual(proposalFor(6, [A(6, "up", "2026-11-01"), A(6, "up", "2026-11-03")]), { kind: "none" })
  // một bài tệ KHÔNG tạo ra đề xuất hạ bậc nào
  assert.equal(proposalFor(3, [A(3, "review", "2026-11-01")]).kind, "none")
})
