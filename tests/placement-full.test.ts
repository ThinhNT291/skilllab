import test from "node:test"
import assert from "node:assert/strict"
import { answeredInBlock, initialState, isDone, ladderFor, parseResult, parseState, passageAnswers, pickPassageId, PLAN, retakeStatus, scoreSession, seenFromResults, thetaFor, TOTAL_ITEMS, RETAKE_GAP_DAYS, type PlacementSkill, type SessionState } from "../src/lib/placement/full.ts"
import { itemRating } from "../src/lib/progress/ability.ts"

const rec = (skill: PlacementSkill, bac: number, flags: boolean[], prefix = skill) => flags.map((correct, i) => ({ id: `${prefix}-${bac}-${i}-${Math.random()}`, skill, rating: itemRating(bac, 2), correct }))
const state = (answers: SessionState["answers"], block = 0, used: string[] = []): SessionState => ({ v: 1, block, answers, used })

test("kế hoạch: 36 câu, mỗi kỹ năng chia hai nửa; đọc/nghe là bài 3 câu", () => {
  assert.equal(TOTAL_ITEMS, 36)
  const by = (k: string) => PLAN.filter((b) => b.skill === k).reduce((n, b) => n + b.n, 0)
  assert.deepEqual([by("grammar"), by("vocab"), by("reading"), by("listening")], [12, 12, 6, 6])
  assert.ok(PLAN.filter((b) => b.kind === "passage").every((b) => b.n === 3))
})

test("mức ước lượng: dùng câu của chính kỹ năng; chưa có thì lấy trung bình kỹ năng khác; chưa có gì thì mức khởi điểm", () => {
  assert.equal(thetaFor(initialState(), "reading"), 1200)
  const g = state(rec("grammar", 5, [true, true, true, true, true, true]))
  assert.ok(thetaFor(g, "reading") > 1500)
  assert.ok(thetaFor(g, "grammar") > 1500)
})

test("thang câu: chỉ câu chưa dùng, chưa gặp (trừ câu từng sai), xếp dễ → khó; bắt đầu cao khi giỏi", () => {
  const pool = Array.from({ length: 30 }, (_, i) => ({ id: `q${i}`, rating: 1000 + i * 40 }))
  const seen = new Set(["q0", "q1", "q2"])
  const wrong = new Set(["q1"])
  const s = state([], 0, ["q3"])
  const { ladder, start } = ladderFor(pool, s, "grammar", seen, wrong, 6)
  assert.ok(!ladder.some((p) => p.id === "q0" || p.id === "q2" || p.id === "q3"))
  assert.ok(ladder.some((p) => p.id === "q1"))
  assert.deepEqual(ladder.map((p) => p.rating), [...ladder.map((p) => p.rating)].sort((a, b) => a - b))
  const strong = ladderFor(pool, state(rec("grammar", 6, Array(6).fill(true))), "grammar", new Set(), new Set(), 6).start
  const weak = ladderFor(pool, state(rec("grammar", 1, Array(6).fill(false))), "grammar", new Set(), new Set(), 6).start
  assert.ok(strong > weak)
  assert.ok(start >= 0 && start <= 1)
})

test("thang câu: hết câu mới thì lấy cả câu đã gặp để không bị kẹt", () => {
  const pool = Array.from({ length: 6 }, (_, i) => ({ id: `q${i}`, rating: 1000 + i * 40 }))
  const { ladder } = ladderFor(pool, initialState(), "vocab", new Set(pool.map((p) => p.id)), new Set(), 6)
  assert.equal(ladder.length, 6)
})

test("chọn bài: bậc gần mức ước lượng nhất, hòa thì bậc thấp; ưu tiên bài chưa gặp; bài từng sai được gặp lại", () => {
  const pool = [{ id: "a", bac: 2 }, { id: "b", bac: 3 }, { id: "c", bac: 4 }, { id: "d", bac: 4 }]
  const strong = state(rec("grammar", 4, Array(6).fill(true)))
  const pick = pickPassageId(pool, strong, "reading", new Set(), new Set(), () => 0)
  assert.ok(pick === "c" || pick === "d")
  // đã gặp c, d: chọn bài chưa gặp gần nhất
  assert.equal(pickPassageId(pool, strong, "reading", new Set(["c", "d"]), new Set(), () => 0), "b")
  // c từng sai thì được gặp lại
  assert.equal(pickPassageId(pool, strong, "reading", new Set(["c", "d"]), new Set(["c"]), () => 0), "c")
  // hết bài chưa dùng
  assert.equal(pickPassageId(pool, state([], 0, ["a", "b", "c", "d"]), "reading", new Set(), new Set()), null)
  // hòa khoảng cách: chọn bậc thấp (mức khởi điểm Bậc 2, bài bậc 1 và 3 cách đều)
  assert.equal(pickPassageId([{ id: "x1", bac: 1 }, { id: "x3", bac: 3 }], initialState(), "reading", new Set(), new Set(), () => 0), "x1")
})

test("kết quả: từng kỹ năng lấy bậc dưới khi chưa rõ; bậc tổng là trung vị bốn kỹ năng", () => {
  const all = [
    ...rec("grammar", 4, Array(12).fill(true)),
    ...rec("vocab", 4, Array(12).fill(true)),
    ...passageAnswers("rd1", "reading", 3, 3, 3),
    ...passageAnswers("rd2", "reading", 3, 3, 3),
    ...passageAnswers("ls1", "listening", 2, 3, 3),
    ...passageAnswers("ls2", "listening", 2, 3, 3),
  ]
  const r = scoreSession(state(all, 8))
  assert.equal(r.skills.grammar.bac, 4)
  assert.equal(r.skills.reading.bac, 3)
  assert.equal(r.skills.listening.bac, 2)
  // Bậc tổng làm tròn MỘT lần từ trung vị của bậc số thực (giữa Đọc ≈ 3,x và Ngữ pháp/Từ vựng ≈ 4,x), không vượt bậc cao nhất của một kỹ năng
  assert.ok(r.overall.bac >= 3 && r.overall.bac <= 4)
  assert.ok(r.overall.bac <= Math.max(...Object.values(r.skills).map((l) => l.bac)))
  assert.equal(r.items.length, all.length)
})

test("trạng thái: làm sạch dữ liệu từ DB, đếm câu đã làm trong khối, nhận biết xong", () => {
  assert.equal(parseState(null), null)
  assert.equal(parseState({ v: 2 }), null)
  const ok = parseState({ v: 1, block: 99, answers: [{ id: "a", skill: "grammar", rating: 1200, correct: true }, { id: 5 }, { id: "b", skill: "xxx", rating: 1, correct: true }], used: ["a", 3] })!
  assert.equal(ok.block, PLAN.length)
  assert.equal(ok.answers.length, 1)
  assert.deepEqual(ok.used, ["a"])
  assert.equal(isDone(ok), true)
  const mid = state(rec("grammar", 2, [true, false, true]), 0)
  assert.equal(answeredInBlock(mid), 3)
  assert.equal(answeredInBlock(state(rec("grammar", 2, Array(8).fill(true)), 1)), 2)
})

test("lần trước: nhớ câu đã gặp và câu từng sai; bài đọc/nghe gộp về mã bài", () => {
  const { seen, wrong } = seenFromResults([{ items: [{ id: "g1", correct: true }, { id: "g2", correct: false }, { id: "rd1#1", correct: true }, { id: "rd1#2", correct: false }] }, {}])
  assert.deepEqual([...seen].sort(), ["g1", "g2", "rd1"])
  assert.deepEqual([...wrong].sort(), ["g2", "rd1"])
})

test("làm lại: phải cách 14 ngày kể từ lần xong gần nhất", () => {
  assert.equal(RETAKE_GAP_DAYS, 14)
  assert.deepEqual(retakeStatus(null), { allowed: true, nextAt: null, daysLeft: 0 })
  const now = new Date("2026-10-26T00:00:00Z")
  assert.equal(retakeStatus("2026-10-20T00:00:00Z", now).allowed, false)
  assert.equal(retakeStatus("2026-10-20T00:00:00Z", now).daysLeft, 8)
  assert.equal(retakeStatus("2026-10-12T00:00:00Z", now).allowed, true)
})

test("đọc lại kết quả từ DB: làm sạch, nhãn lấy lại từ bậc, hỏng thì null", () => {
  const good = scoreSession(state([...rec("grammar", 3, Array(12).fill(true)), ...rec("vocab", 3, Array(12).fill(true)), ...passageAnswers("r", "reading", 3, 3, 3), ...passageAnswers("l", "listening", 3, 3, 3)], 8))
  const back = parseResult(JSON.parse(JSON.stringify(good)))!
  assert.equal(back.overall.bac, good.overall.bac)
  assert.equal(back.skills.grammar.label, good.skills.grammar.label)
  assert.equal(parseResult({ skills: {}, overall: { bac: 3 } }), null)
  assert.equal(parseResult(null), null)
  assert.equal(parseResult({ ...JSON.parse(JSON.stringify(good)), overall: { bac: "x" } }), null)
  assert.equal(parseResult({ ...JSON.parse(JSON.stringify(good)), overall: { bac: 99, label: "gian lận" } })!.overall.bac, 6)
})
