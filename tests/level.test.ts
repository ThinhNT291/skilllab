import test from "node:test"
import assert from "node:assert/strict"
import { levelLabel } from "../src/lib/content/bac.ts"
import { isReliable, levelOfAbility, overallLevel, placementLevel, skillLevel, MIN_SKILLS_FOR_OVERALL } from "../src/lib/progress/level.ts"
import type { Ability, AbilitySkill, AnswerForAbility } from "../src/lib/progress/ability.ts"

let t = 0
const ans = (topic: string, flags: boolean[]): AnswerForAbility[] => flags.map((correct) => ({ exerciseId: "x", topic, correct, created_at: String(t++).padStart(5, "0") }))
const ab = (skill: AbilitySkill, bac: number, confidence: Ability["confidence"] = "mid"): Ability => ({ skill, rating: 1000 + (bac - 1) * 200, bac, n: confidence === "low" ? 5 : 20, confidence })

test("nhãn bậc kèm CEFR, bậc 0 là dưới Bậc 1, ngoài khoảng được kẹp", () => {
  assert.equal(levelLabel(3), "Bậc 3 (B1)")
  assert.equal(levelLabel(0), "dưới Bậc 1 (Pre-A1)")
  assert.equal(levelLabel(9), "Bậc 6 (C2)")
  assert.equal(levelLabel(-2), "dưới Bậc 1 (Pre-A1)")
})

test("bậc một kỹ năng lấy từ Elo; quá ít câu thì null", () => {
  assert.equal(skillLevel(ans("vocab-a1", [true, true]), {}, "vocab"), null)
  const l = skillLevel(ans("vocab-b2", Array(40).fill(true)), {}, "vocab")!
  assert.ok(l.bac >= 3)
  assert.equal(l.confidence, "high")
  assert.equal(levelOfAbility(ab("grammar", 3)).label, "Bậc 3 (B1)")
})

test("bậc tổng = trung vị các kỹ năng đủ tin cậy; kỹ năng ít câu không tính", () => {
  assert.equal(overallLevel([ab("grammar", 2), ab("vocab", 3), ab("reading", 5), ab("listening", 1, "low")])!.bac, 3)
  assert.deepEqual(overallLevel([ab("grammar", 2), ab("vocab", 3), ab("reading", 5), ab("listening", 1, "low")])!.used, ["grammar", "vocab", "reading"])
  // một kỹ năng rất yếu không kéo cả bậc tổng xuống
  assert.equal(overallLevel([ab("grammar", 1), ab("vocab", 4), ab("reading", 4), ab("listening", 4)])!.bac, 4)
})

test("bốn kỹ năng: trung bình hai ở giữa, làm tròn xuống; bốn kỹ năng cùng bậc thì giữ nguyên", () => {
  assert.equal(overallLevel([ab("grammar", 2), ab("vocab", 3), ab("reading", 3), ab("listening", 4)])!.bac, 3)
  assert.equal(overallLevel([ab("grammar", 2), ab("vocab", 2), ab("reading", 3), ab("listening", 3)])!.bac, 2)
  assert.equal(overallLevel([ab("grammar", 3), ab("vocab", 3), ab("reading", 3), ab("listening", 3)])!.bac, 3)
})

test("chưa đủ số kỹ năng tin cậy thì không có bậc tổng", () => {
  assert.equal(MIN_SKILLS_FOR_OVERALL, 3)
  assert.equal(overallLevel([ab("grammar", 2), ab("vocab", 3)]), null)
  assert.equal(overallLevel([ab("grammar", 2), ab("vocab", 3), ab("reading", 3, "low")]), null)
  assert.ok(isReliable(ab("grammar", 2)) && !isReliable(ab("grammar", 2, "low")))
})

const VOCAB = ["a1", "a1", "a1", "a2", "a2", "a2", "b1", "b1", "b1", "b2", "b2", "b2"].map((x) => `vocab-${x}`)
const vocabRun = (flags: boolean[]) => VOCAB.flatMap((topic, i) => ans(topic, [flags[i]]))

test("xếp trình độ từ vựng 12 câu: đúng đến cấp nào thì ra bậc ấy; may rủi không đẩy lên cao", () => {
  const at = (n: number) => placementLevel(vocabRun(VOCAB.map((_, i) => i < n)), {}, "vocab")!.bac
  assert.equal(at(12), 4)
  assert.equal(at(9), 3)
  assert.equal(at(6), 2)
  assert.equal(at(3), 1)
  assert.equal(at(0), 0)
  // một câu sai ở giữa vẫn không vượt quá bậc đạt được khi đúng hết
  assert.ok(placementLevel(vocabRun(VOCAB.map((_, i) => i !== 7)), {}, "vocab")!.bac <= 4)
  // đoán mò (≈25%) ở mức thấp
  assert.ok(placementLevel(vocabRun([true, false, false, true, false, false, true, false, false, false, true, false]), {}, "vocab")!.bac <= 1)
})

test("xếp trình độ đọc/nghe theo bậc thang: đạt Bậc 2, 3, trượt Bậc 4 thì ra Bậc 3", () => {
  const run = [...ans("reading-b2", [true, true, true, false]), ...ans("reading-b3", [true, true, true, true]), ...ans("reading-b4", [true, false, false, false])]
  assert.equal(placementLevel(run, {}, "reading")!.bac, 3)
  assert.equal(placementLevel(ans("reading-b2", [true]), {}, "reading"), null)
})

import { estimateThetaMAP, itemRating, bacOfItemRating } from "../src/lib/progress/ability.ts"
import { levelFromRows, ROUND_UP_FROM } from "../src/lib/progress/level.ts"

const rowsAt = (bac: number, flags: boolean[]) => flags.map((correct) => ({ rating: itemRating(bac, 2), correct }))

test("MAP: không phụ thuộc thứ tự; đúng hết ở câu khó thì cao, sai hết ở câu dễ thì thấp, không chạy ra vô cực", () => {
  const a = [...rowsAt(2, [true, false]), ...rowsAt(4, [true, true])]
  const b = [...rowsAt(4, [true, true]), ...rowsAt(2, [false, true])]
  assert.equal(estimateThetaMAP(a), estimateThetaMAP(b))
  assert.ok(estimateThetaMAP(rowsAt(5, Array(6).fill(true))) > estimateThetaMAP(rowsAt(3, Array(6).fill(true))))
  assert.ok(estimateThetaMAP(rowsAt(1, Array(12).fill(false))) >= 600)
  assert.ok(estimateThetaMAP(rowsAt(6, Array(12).fill(true))) <= 2400)
  assert.equal(bacOfItemRating(itemRating(4, 3)), 4)
})

test("làm tròn lấy bậc dưới khi chưa rõ; đủ bằng chứng mới được bậc cao", () => {
  assert.equal(ROUND_UP_FROM, 0.75)
  // sáu câu đúng ở Bậc 5: đủ bằng chứng (≥2 câu đúng từ Bậc 5 trở lên)
  assert.equal(levelFromRows(rowsAt(5, Array(6).fill(true))).bac, 5)
  // chỉ một câu đúng ở Bậc 6, còn lại sai: không công nhận Bậc 6
  const lucky = [...rowsAt(6, [true]), ...rowsAt(2, [false, false, false]), ...rowsAt(3, [false, false])]
  assert.ok(levelFromRows(lucky).bac < 6)
  // ít câu thì ghi chưa chắc, nhiều câu thì tương đối
  assert.equal(levelFromRows(rowsAt(3, [true, true, true])).confidence, "low")
  assert.equal(levelFromRows(rowsAt(3, Array(12).fill(true))).confidence, "mid")
})
