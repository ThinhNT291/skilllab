import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import { buildItemMeta } from "../scripts/build-item-meta.mjs"
import { bacFromRating, estimateAbility, expectedCorrect, itemRating, startPositionFor, START_RATING, targetItemRating, type AnswerForAbility, type ItemMeta } from "../src/lib/progress/ability.ts"

const meta: ItemMeta = { "en-x-1": [2, 2], "en-x-2": [3, 2], "en-x-3": [5, 3] }
const ans = (id: string, correct: boolean, t: number, topic = "present-simple"): AnswerForAbility => ({ exerciseId: id, topic, correct, created_at: `2026-01-01T00:${String(t).padStart(2, "0")}:00Z` })

test("tệp meta câu bài tập khớp nội dung hiện có (chạy `node scripts/build-item-meta.mjs` nếu báo lệch)", () => {
  const onDisk = JSON.parse(fs.readFileSync("src/content/meta/items.json", "utf8"))
  assert.deepEqual(onDisk, buildItemMeta())
})

test("xác suất đúng: bằng nhau thì 0,625 (có đoán mò); câu dễ hơn nhiều thì gần 1; khó hơn nhiều thì gần 0,25", () => {
  assert.ok(Math.abs(expectedCorrect(1200, 1200) - 0.625) < 1e-9)
  assert.ok(expectedCorrect(1600, 1000) > 0.95)
  assert.ok(expectedCorrect(800, 1600) < 0.3)
  assert.equal(itemRating(3, 2), 1400)
  assert.equal(itemRating(3, 3) - itemRating(3, 1), 80)
})

test("đúng liên tục các câu khó thì bậc tăng; sai liên tục các câu dễ thì bậc giảm; chưa có dữ liệu giữ mức khởi điểm", () => {
  assert.equal(estimateAbility([], meta, "grammar").rating, START_RATING)
  const up = estimateAbility(Array.from({ length: 30 }, (_, i) => ans(i % 2 ? "en-x-2" : "en-x-3", true, i)), meta, "grammar")
  const down = estimateAbility(Array.from({ length: 30 }, (_, i) => ans("en-x-1", false, i)), meta, "grammar")
  assert.ok(up.rating > START_RATING + 150, `lên: ${up.rating}`)
  assert.ok(up.bac >= 3)
  assert.ok(down.rating < START_RATING - 100, `xuống: ${down.rating}`)
  assert.equal(up.confidence, "mid")
  assert.equal(estimateAbility(Array.from({ length: 5 }, (_, i) => ans("en-x-1", true, i)), meta, "grammar").confidence, "low")
})

test("biến thể (~hậu tố) tính theo câu gốc; kỹ năng khác dùng bậc của chuyên đề; chuyên đề lạ bị bỏ qua", () => {
  const g = estimateAbility([ans("en-x-3~spot", true, 1)], meta, "grammar")
  assert.equal(g.n, 1)
  const v = estimateAbility([ans("vq-m-v-a", true, 1, "vocab-b2")], meta, "vocab")
  assert.equal(v.n, 1)
  const r = estimateAbility([ans("rq-1", true, 1, "reading-b3"), ans("rq-2", true, 2, "reading-zzz")], meta, "reading")
  assert.equal(r.n, 1)
  assert.equal(estimateAbility([ans("en-x-1", true, 1, "vocab-a1")], meta, "grammar").n, 0)
})

test("vị trí bắt đầu: người giỏi bắt đầu cao hơn người yếu; mục tiêu vừa sức (câu dễ hơn mức năng lực)", () => {
  const ladder = [1000, 1100, 1200, 1300, 1400, 1500, 1600, 1800]
  assert.ok(startPositionFor(ladder, 1700) > startPositionFor(ladder, 1100))
  assert.ok(targetItemRating(1400) < 1400)
  assert.equal(startPositionFor([1000], 1400), 0)
  assert.ok(Math.abs(bacFromRating(1200) - 2) < 1e-9)
})
