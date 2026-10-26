import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import { allLessons, buildPath, splitEven, stepId, BACS, STEPS_PER_BAC, MIN_GRAMMAR_ITEMS, type PathInput, type PathLesson } from "../src/lib/path/catalog.ts"
import { canOpenStep, computePath, nextLesson, skippedSteps, type LessonResult } from "../src/lib/path/progress.ts"
import { JUMP, jumpReadiness, type JumpRow } from "../src/lib/path/jump.ts"
import { pickToday, skillWeights, weakestSkill } from "../src/lib/path/focus.ts"

const small: PathInput = {
  grammar: [
    { topic: "a", title: "A", bac: 1, order: 1, count: 20 },
    { topic: "b", title: "B", bac: 1, order: 2, count: 20 },
    { topic: "tiny", title: "Tiny", bac: 1, order: 3, count: MIN_GRAMMAR_ITEMS - 1 },
  ],
  vocabWords: { 1: 180 },
  reading: [1, 2, 3].map((i) => ({ id: `rd${i}`, title: `R${i}`, bac: 1 })),
  listening: [1, 2].map((i) => ({ id: `ls${i}`, title: `L${i}`, bac: 1 })),
}

test("splitEven chia đều, khúc đầu nhận phần dư, không mất phần tử", () => {
  assert.deepEqual(splitEven([1, 2, 3, 4, 5, 6, 7], 5).map((x) => x.length), [2, 2, 1, 1, 1])
  assert.deepEqual(splitEven([], 3), [[], [], []])
  assert.deepEqual(splitEven([1, 2], 4).map((x) => x.length), [1, 1, 0, 0])
})

test("danh mục: 6 bậc × 5 chặng, mã bài ổn định và không trùng, bài ngữ pháp quá ít câu bị bỏ", () => {
  const path = buildPath(small)
  assert.equal(path.length, BACS.length * STEPS_PER_BAC)
  assert.deepEqual(path.map((s) => s.index), path.map((_, i) => i))
  assert.equal(path[0].id, stepId(1, 1))
  const ids = allLessons(path).map((l) => l.id)
  assert.equal(new Set(ids).size, ids.length)
  assert.ok(!ids.some((i) => i.includes(".tiny.")))
  assert.ok(ids.includes("g.a.b1") && ids.includes("v.b1.p10") && ids.includes("r.rd3") && ids.includes("l.ls2"))
  // 10 phần từ vựng chia cho 5 chặng = 2 bài mỗi chặng; bậc không có nội dung thì nấc rỗng
  for (const s of path.filter((p) => p.bac === 1)) assert.equal(s.lessons.filter((l) => l.kind === "vocab").length, 2)
  assert.equal(path.filter((p) => p.bac === 2).every((s) => s.lessons.length === 0), true)
  // mọi bài mang đúng chặng và bậc của nấc chứa nó
  for (const s of path) for (const l of s.lessons) assert.ok(l.bac === s.bac && l.stepInBac === s.stepInBac)
  // xen kẽ loại bài: hai bài liền nhau không cùng loại khi nấc còn loại khác
  const first = path[0].lessons.map((l) => l.kind)
  assert.notEqual(first[0], first[1])
})

test("từ vựng ít từ quá thì không sinh bài (không đủ 10 từ mỗi phần)", () => {
  const p = buildPath({ ...small, vocabWords: { 1: 99 } })
  assert.equal(allLessons(p).filter((l) => l.kind === "vocab").length, 0)
})

const R = (ids: string[], ratio = 1) => new Map<string, LessonResult>(ids.map((i) => [i, { bestRatio: ratio }]))
// nội dung đủ ở mọi bậc để thử nấc không rỗng
const real = (): PathInput => ({
  grammar: BACS.flatMap((bac) => ["a", "b", "c", "d", "e"].map((t, i) => ({ topic: t, title: t, bac, order: i, count: 20 }))),
  vocabWords: Object.fromEntries(BACS.map((b) => [b, 300])),
  reading: BACS.flatMap((bac) => [1, 2, 3, 4, 5].map((i) => ({ id: `r${bac}${i}`, title: "r", bac }))),
  listening: BACS.flatMap((bac) => [1, 2, 3, 4, 5].map((i) => ({ id: `l${bac}${i}`, title: "l", bac }))),
})
const idsOfStep = (path: ReturnType<typeof buildPath>, i: number) => path[i].lessons.map((l) => l.id)

test("tiến độ: chưa làm gì thì nấc 0 hiện tại, kế 2 nấc thử sức, còn lại khóa", () => {
  const path = buildPath(small)
  const st = computePath(path, new Map())
  assert.equal(st.frontier, 0)
  assert.deepEqual(st.steps.slice(0, 5).map((s) => s.status), ["current", "trial", "trial", "locked", "locked"])
  assert.ok(canOpenStep(st, 2) && !canOpenStep(st, 3))
  assert.equal(nextLesson(st, new Map())?.id, path[0].lessons[0].id)
})

test("làm tuần tự: xong nấc thì nấc kế thành hiện tại; bài dưới ngưỡng của bậc (60% ở Bậc 1) chưa tính", () => {
  const path = buildPath(small)
  const half = new Map(idsOfStep(path, 0).map((id) => [id, { bestRatio: 0.59 }]))
  assert.equal(computePath(path, half).frontier, 0)
  const st = computePath(path, R(idsOfStep(path, 0), 0.6))
  assert.equal(st.frontier, 1)
  assert.equal(st.steps[0].status, "done")
  assert.equal(st.steps[0].viaTrial, false)
  assert.equal(st.steps[1].status, "current")
})

test("thử sức: làm hết nấc cao thì nấc đó xong, nấc cũ KHÔNG tự mở và bị đánh dấu bỏ qua", () => {
  const path = buildPath(small)
  const st = computePath(path, R(idsOfStep(path, 2)))
  assert.equal(st.frontier, 0, "nấc hiện tại vẫn là nấc 0")
  assert.equal(st.steps[2].status, "done")
  assert.equal(st.steps[2].viaTrial, true)
  assert.equal(st.highestDone, 2)
  assert.deepEqual(skippedSteps(st).map((s) => s.step.index), [0, 1])
  // thử sức tối đa 2 nấc phía trên nấc cao nhất đang mở (nấc 2): nấc 3, 4 mở; nấc 5 khóa
  assert.deepEqual(st.steps.slice(3, 5).map((s) => s.status), ["trial", "trial"])
  const wide = computePath(buildPath(real()), R(idsOfStep(buildPath(real()), 2)))
  assert.deepEqual(wide.steps.slice(3, 6).map((s) => s.status), ["trial", "trial", "locked"])
  // quay lại làm nấc cũ thì hết bỏ qua
  const back = computePath(path, R([...idsOfStep(path, 0), ...idsOfStep(path, 1), ...idsOfStep(path, 2)]))
  assert.equal(skippedSteps(back).length, 0)
  assert.equal(back.frontier, 3)
  assert.equal(back.steps[2].viaTrial, false)
})

test("thử sức dở dang (chưa làm hết bài) không mở khóa gì", () => {
  const path = buildPath(small)
  const ids = idsOfStep(path, 2)
  const st = computePath(path, R(ids.slice(0, ids.length - 1)))
  assert.equal(st.steps[2].status, "trial")
  assert.equal(st.highestDone, -1)
  assert.equal(st.steps[3].status, "locked")
})

test("nấc rỗng không chặn đường và không làm 'nấc cao nhất đã xong'; xong hết thì complete", () => {
  const path = buildPath(small)
  // bậc 2–6 rỗng: làm hết bậc 1 thì frontier nhảy qua toàn bộ nấc rỗng
  const all = R(path.slice(0, 5).flatMap((s) => s.lessons.map((l) => l.id)))
  const st = computePath(path, all)
  assert.equal(st.complete, true)
  assert.equal(nextLesson(st, all), null)
  assert.equal(st.highestDone, 4)
})

test("điều kiện nhảy bậc: đủ cả bốn điều kiện mới sẵn sàng; tiến độ không chạm 1 khi chưa đủ", () => {
  const day = (n: number) => `2026-11-${String(n).padStart(2, "0")}`
  const mk = (days: number, perDay: number, okPerDay: number): JumpRow[] =>
    Array.from({ length: days }, (_, d) => Array.from({ length: perDay }, (_, i) => ({ correct: i < okPerDay, day: day(d + 1) }))).flat()
  const ok = jumpReadiness(mk(5, 12, 10), 0.9) // 60 câu, 83%, 5 ngày
  assert.equal(ok.ready, true)
  assert.equal(ok.progress, 1)
  // thiếu câu
  const few = jumpReadiness(mk(3, 10, 9), 0.9)
  assert.equal(few.ready, false)
  assert.equal(few.checks.find((c) => c.id === "answers")!.ok, false)
  assert.ok(few.progress < 1)
  // đủ câu và đúng nhưng chỉ một ngày (một lượt may mắn)
  const oneDay = jumpReadiness(mk(1, 60, 54), 0.9)
  assert.equal(oneDay.checks.find((c) => c.id === "days")!.ok, false)
  assert.equal(oneDay.ready, false)
  // ngày ít hơn minPerDay câu không được tính
  assert.equal(jumpReadiness([...mk(2, 30, 27), ...mk(1, JUMP.minPerDay - 1, JUMP.minPerDay - 1).map((r) => ({ ...r, day: "2026-12-01" }))], 0.9).checks.find((c) => c.id === "days")!.value, "2/3 ngày")
  // thẻ ôn quên nhiều thì chưa nhảy; không có thẻ thì bỏ qua điều kiện này
  assert.equal(jumpReadiness(mk(5, 12, 10), 0.5).ready, false)
  assert.equal(jumpReadiness(mk(5, 12, 10), null).ready, true)
  // tỷ lệ đúng thấp
  assert.equal(jumpReadiness(mk(5, 12, 8), 0.9).checks.find((c) => c.id === "accuracy")!.ok, false)
  // không có dữ liệu
  const none = jumpReadiness([], null)
  assert.equal(none.ready, false)
  assert.ok(none.progress >= 0 && none.progress < 1)
})

test("kỹ năng yếu nhất: chỉ tính kỹ năng đủ tin cậy, cần ≥2 kỹ năng để so sánh", () => {
  const s = (skill: "grammar" | "vocab" | "reading" | "listening", rating: number, reliable = true) => ({ skill, rating, reliable })
  assert.equal(weakestSkill([s("grammar", 1500), s("vocab", 1200), s("reading", 900, false), s("listening", 1400)]), "vocab")
  assert.equal(weakestSkill([s("grammar", 1500), s("vocab", 1200, false)]), null)
  assert.equal(weakestSkill([]), null)
  assert.deepEqual(skillWeights("vocab"), { grammar: 1, vocab: 1.5, listening: 1, reading: 1 })
  assert.equal(skillWeights(null).vocab, 1)
})

const L = (kind: PathLesson["kind"], n: number): PathLesson[] => Array.from({ length: n }, (_, i) => ({ id: `${kind}${i}`, kind, bac: 1, stepInBac: 1, title: `${kind}${i}`, ref: {} }))

test("bài hôm nay: kỹ năng yếu nhiều hơn một chút, không quá 40%, giữ thứ tự trong từng loại", () => {
  const cands = [...L("grammar", 10), ...L("vocab", 10), ...L("reading", 10), ...L("listening", 10)]
  const out = pickToday(cands, 10, skillWeights("vocab"))
  assert.equal(out.length, 10)
  const by = (k: string) => out.filter((l) => l.kind === k).length
  assert.ok(by("vocab") > by("grammar") || by("vocab") >= 3, `vocab ${by("vocab")}`)
  assert.ok(by("vocab") <= 4, "trần 40%")
  for (const k of ["grammar", "vocab", "reading", "listening"]) {
    const ids = out.filter((l) => l.kind === k).map((l) => l.id)
    assert.deepEqual(ids, ids.slice().sort((a, b) => Number(a.slice(k.length)) - Number(b.slice(k.length))))
  }
  assert.equal(new Set(out.map((l) => l.id)).size, 10)
  // không có kỹ năng yếu: chia đều
  const even = pickToday(cands, 8, skillWeights(null))
  assert.deepEqual(["grammar", "vocab", "reading", "listening"].map((k) => even.filter((l) => l.kind === k).length), [2, 2, 2, 2])
})

test("bài hôm nay: chỉ còn bài của kỹ năng yếu thì vẫn chọn (vượt trần); ít ứng viên hơn yêu cầu thì trả hết", () => {
  assert.equal(pickToday(L("vocab", 6), 5, skillWeights("vocab")).length, 5)
  assert.equal(pickToday([...L("grammar", 1), ...L("vocab", 1)], 5, skillWeights("vocab")).length, 2)
  assert.deepEqual(pickToday([], 5, skillWeights(null)), [])
  assert.equal(pickToday(L("grammar", 3), 1, skillWeights(null)).length, 1)
})

test("danh mục từ nội dung thật: nấc nào cũng có bài, số bài mỗi nấc trong khoảng dễ làm", () => {
  const rd = (dir: string) => BACS.flatMap((b) => (JSON.parse(fs.readFileSync(`src/content/${dir}/en/bac${b}.json`, "utf8")) as { id: string; title: string }[]).map((p) => ({ id: p.id, title: p.title ?? p.id, bac: b })))
  const idx = JSON.parse(fs.readFileSync("src/content/grammar/en/index.json", "utf8")) as { id: string; title: string; order: number }[]
  const ex = fs.readdirSync("src/content/exercises/en").flatMap((f) => JSON.parse(fs.readFileSync(`src/content/exercises/en/${f}`, "utf8")) as { topic: string; bac: number }[])
  const counts = new Map<string, number>()
  for (const e of ex) counts.set(`${e.topic}|${e.bac}`, (counts.get(`${e.topic}|${e.bac}`) ?? 0) + 1)
  const grammar = idx.flatMap((t) => BACS.map((b) => ({ topic: t.id, title: t.title, bac: b, order: t.order, count: counts.get(`${t.id}|${b}`) ?? 0 })))
  const vocabWords = Object.fromEntries([180, 345, 572, 844, 532, 706].map((n, i) => [i + 1, n]))
  const path = buildPath({ grammar, vocabWords, reading: rd("reading"), listening: rd("listening") })
  assert.equal(path.length, 30)
  for (const s of path) {
    assert.ok(s.lessons.length >= 4 && s.lessons.length <= 16, `${s.id}: ${s.lessons.length} bài`)
    for (const k of ["vocab", "reading", "listening"]) assert.ok(s.lessons.some((l) => l.kind === k), `${s.id} thiếu ${k}`)
  }
  const ids = allLessons(path).map((l) => l.id)
  assert.equal(new Set(ids).size, ids.length)
})

// ---- điểm bắt đầu, cổng bậc, ngưỡng theo bậc, vượt cấp ----
import { PASS_BY_BAC, passRatioFor } from "../src/lib/path/rules.ts"
import { JUMP_BY_BAC, jumpConfigFor, jumpReadinessAt } from "../src/lib/path/jump.ts"
import { bestStart, startFromPlacement, startIndexOf, startOrder, validStart } from "../src/lib/path/start.ts"
import { LEAP_TOTAL, leapPassed, leapQuestionCount, planLeap } from "../src/lib/path/leap.ts"
import { answerBac, rowsByBac } from "../src/lib/path/gate.ts"

test("ngưỡng theo bậc tăng dần (kiểu game), không dưới 60%", () => {
  const vals = [1, 2, 3, 4, 5, 6].map(passRatioFor)
  assert.deepEqual(vals, vals.slice().sort((a, b) => a - b))
  assert.ok(Math.min(...vals) >= 0.6 && PASS_BY_BAC[1] < PASS_BY_BAC[6])
  assert.equal(passRatioFor(0), PASS_BY_BAC[1], "ngoài khoảng thì kẹp về biên")
  assert.equal(passRatioFor(9), PASS_BY_BAC[6])
})

test("điều kiện nhảy bậc nghiêm dần: câu, ngày, tỷ lệ đúng và mức nhớ đều không giảm khi lên bậc", () => {
  for (const key of ["minAnswers", "minAccuracy", "minDays", "minPerDay", "minRetention"] as const) {
    const v = [1, 2, 3, 4, 5, 6].map((b) => JUMP_BY_BAC[b][key])
    assert.deepEqual(v, v.slice().sort((a, b) => a - b), key)
    assert.ok(v[5] > v[0], `${key} phải tăng từ bậc 1 đến bậc 6`)
  }
  assert.equal(jumpConfigFor(2.4), JUMP_BY_BAC[2])
  // cùng một dữ liệu: đủ để lên từ Bậc 1 nhưng chưa đủ để lên từ Bậc 5
  const rows = Array.from({ length: 3 }, (_, d) => Array.from({ length: 10 }, (_, i) => ({ correct: i < 9, day: `2026-11-0${d + 1}` }))).flat()
  assert.equal(jumpReadinessAt(1, rows, null).ready, true)
  assert.equal(jumpReadinessAt(5, rows, null).ready, false)
})

test("ngưỡng xong bài theo bậc: 62% đủ ở Bậc 1 nhưng chưa đủ ở Bậc 5", () => {
  const mk = (bac: number): PathInput => ({ ...real(), grammar: [], vocabWords: {}, reading: [{ id: `x${bac}`, title: "x", bac }], listening: [] })
  for (const [bac, expectDone] of [[1, true], [5, false]] as const) {
    const path = buildPath(mk(bac))
    const st = computePath(path, new Map([[`r.x${bac}`, { bestRatio: 0.62 }]]))
    const step = st.steps.find((s) => s.step.lessons.length > 0)!
    assert.equal(step.status === "done", expectDone, `bậc ${bac}`)
  }
})

test("điểm bắt đầu: nấc dưới là 'ôn lại' không bắt buộc, nấc hiện tại tính từ điểm bắt đầu, nấc dưới vẫn mở được", () => {
  const path = buildPath(real())
  const startIdx = startIndexOf(path, { bac: 3, step: 1 })
  assert.equal(startIdx, 10)
  const st = computePath(path, new Map(), { startIndex: startIdx })
  assert.equal(st.frontier, 10)
  assert.equal(st.steps[0].status, "review")
  assert.equal(st.steps[9].status, "review")
  assert.equal(st.steps[10].status, "current")
  assert.deepEqual(st.steps.slice(11, 14).map((s) => s.status), ["trial", "trial", "locked"])
  assert.ok(canOpenStep(st, 0), "nấc ôn lại vẫn mở")
  assert.equal(skippedSteps(st).length, 0, "nấc dưới điểm bắt đầu không bị coi là bỏ qua")
  assert.equal(nextLesson(st, new Map())?.bac, 3)
})

test("cổng bậc: làm hết các chặng của bậc mà chưa đủ điều kiện nhảy bậc thì chờ, bậc sau khóa, thử sức không vượt cổng", () => {
  const path = buildPath(real())
  const bac1 = path.slice(0, 5).flatMap((s) => s.lessons.map((l) => l.id))
  const closed = (b: number) => b !== 1
  const st = computePath(path, R(bac1), { bacCleared: closed })
  assert.equal(st.frontier, 5)
  assert.equal(st.gatedBac, 1)
  assert.equal(st.steps[5].status, "gated")
  assert.ok(st.steps.slice(6).every((s) => s.status === "locked"), "các nấc sau cổng khóa hẳn")
  assert.equal(nextLesson(st, R(bac1)), null)
  assert.equal(canOpenStep(st, 5), false)
  // qua cổng thì đi tiếp bình thường
  const open = computePath(path, R(bac1), { bacCleared: () => true })
  assert.equal(open.gatedBac, null)
  assert.equal(open.steps[5].status, "current")
  // cổng chưa mở nhưng vẫn còn chặng trong bậc: chưa "chờ", học bình thường
  const mid = computePath(path, R(idsOfStep(path, 0)), { bacCleared: closed })
  assert.equal(mid.gatedBac, null)
  assert.equal(mid.steps[1].status, "current")
  // bắt đầu từ bậc cao hơn thì cổng của các bậc dưới không còn chặn
  const high = computePath(path, new Map(), { startIndex: 10, bacCleared: closed })
  assert.equal(high.steps[10].status, "current")
  assert.equal(high.gatedBac, null)
})

test("điểm bắt đầu từ bài xếp trình độ và bài vượt cấp: chỉ tăng, dữ liệu xấu bị bỏ", () => {
  assert.deepEqual(startFromPlacement(3), { bac: 3, step: 1, source: "placement" })
  assert.equal(startFromPlacement(0)!.bac, 1, "dưới Bậc 1 → Bậc 1")
  assert.equal(startFromPlacement(9)!.bac, 6)
  assert.equal(startFromPlacement(NaN), null)
  const placed = startFromPlacement(2)!
  // chưa có gì → nhận ứng viên
  assert.deepEqual(bestStart(null, [placed]), { start: placed, changed: true })
  // thấp hơn hoặc bằng điểm đã lưu → giữ nguyên
  const saved = { bac: 3, step: 2, source: "leap" as const }
  assert.deepEqual(bestStart(saved, [placed, startFromPlacement(3), null]), { start: saved, changed: false })
  // cao hơn → lên
  const better = bestStart(saved, [startFromPlacement(4)])
  assert.equal(better.changed, true)
  assert.equal(better.start!.bac, 4)
  // giá trị không hợp lệ không được nhận
  assert.equal(bestStart(null, [{ bac: 7, step: 1, source: "leap" }, { bac: 1, step: 9, source: "leap" }]).start, null)
  assert.equal(validStart(6, 5), true)
  assert.equal(validStart(0, 1), false)
  assert.equal(startOrder(1, 1), 0)
  assert.equal(startOrder(2, 1), 5)
  assert.equal(startIndexOf(buildPath(real()), null), 0)
})

test("bài vượt cấp: luôn đủ 20 câu; thiếu kỹ năng thì chuyển phần câu sang ngữ pháp/từ vựng; chỉ đạt khi đúng hết", () => {
  const step = (kinds: PathLesson["kind"][]) => ({ lessons: kinds.map((kind, i) => ({ id: `${kind}${i}`, kind, bac: 3, stepInBac: 1, title: "t", ref: {} })) })
  const full = planLeap(step(["grammar", "vocab", "reading", "listening"]))
  assert.deepEqual(full, { grammar: 8, vocab: 4, reading: 1, listening: 1 })
  assert.equal(leapQuestionCount(full), LEAP_TOTAL)
  for (const kinds of [["grammar", "vocab"], ["grammar", "reading", "listening"], ["vocab", "listening"], ["grammar"], ["vocab"]] as PathLesson["kind"][][]) {
    const p = planLeap(step(kinds))
    assert.equal(leapQuestionCount(p), LEAP_TOTAL, kinds.join())
    assert.equal(p.reading, kinds.includes("reading") ? 1 : 0)
    assert.equal(p.listening, kinds.includes("listening") ? 1 : 0)
    assert.equal(p.grammar > 0, kinds.includes("grammar"))
    assert.equal(p.vocab > 0, kinds.includes("vocab"))
  }
  assert.equal(leapPassed(20, 20), true)
  assert.equal(leapPassed(19, 20), false)
  assert.equal(leapPassed(0, 0), false)
})

test("dữ liệu cổng: bậc của câu theo loại, gom theo bậc và ngày", () => {
  const meta = { "en-x-001": [3, 2] } as Record<string, [number, number]>
  assert.equal(answerBac({ exercise_id: "en-x-001~2", topic: "x" }, meta), 3)
  assert.equal(answerBac({ exercise_id: "zzz", topic: "x" }, meta), null)
  assert.equal(answerBac({ exercise_id: "vq-m-1", topic: "vocab-b2" }, meta), 4)
  assert.equal(answerBac({ exercise_id: "rq-1", topic: "reading-b5" }, meta), 5)
  assert.equal(answerBac({ exercise_id: "lq-1", topic: "listening-b1" }, meta), 1)
  assert.equal(answerBac({ exercise_id: "c", topic: "colloc-make-do" }, meta), null)
  const by = rowsByBac(
    [
      { exercise_id: "en-x-001", topic: "x", correct: true, created_at: "2026-11-01T10:00:00Z" },
      { exercise_id: "rq-1", topic: "reading-b3", correct: false, created_at: "2026-11-02T10:00:00Z" },
      { exercise_id: "zzz", topic: "x", correct: true, created_at: "2026-11-02T10:00:00Z" },
    ],
    meta,
    (iso) => iso.slice(0, 10),
  )
  assert.deepEqual(by.get(3), [{ correct: true, day: "2026-11-01" }, { correct: false, day: "2026-11-02" }])
  assert.equal(by.size, 1)
})
