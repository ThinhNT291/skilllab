import test from "node:test"
import assert from "node:assert/strict"
import { parseBatch } from "../src/lib/contentdraft/parse.ts"
import { draftStats, type StatBatch, type StatDraft } from "../src/lib/contentdraft/stats.ts"
import { buildExport } from "../src/lib/contentdraft/export.ts"

const gItem = (id: string, correctIndex = 0, extra: Record<string, unknown> = {}) => ({
  id, kind: "mcq", language: "en", topic: "questions", usageId: "q-u1", tags: ["q-u1"], difficulty: 2, title: "t", prompt: `Prompt ${id} ______`,
  choices: ["a", "b", "c", "d"], correctIndex, explanation: "x", choiceExplanations: ["1", "2", "3", "4"], bac: 3, ...extra,
})
const batch = (over: Record<string, unknown> = {}) => ({ promptVersion: "grammar-items-v1", model: "m-1", topic: "questions", bac: 3, createdAt: "2026-11-01T00:00:00Z", items: [gItem("en-questions-051", 0), gItem("en-questions-052", 1)], meta: [{ id: "en-questions-051", intendedBac: 3, distractorTypes: ["wrong_form"] }], rejected: [{}, {}], duplicates: [{}], ...over })

test("đọc lô ngữ pháp: nháp đủ trường, trạng thái 'chưa giải mù', meta gắn theo mã", () => {
  const r = parseBatch(batch())
  assert.ok(r.ok)
  if (!r.ok) return
  assert.equal(r.drafts.length, 2)
  assert.equal(r.drafts[0].status, "generated")
  assert.equal(r.drafts[0].topic, "questions")
  assert.equal(r.drafts[0].kind, "grammar")
  assert.deepEqual(r.drafts[0].meta, { id: "en-questions-051", intendedBac: 3, distractorTypes: ["wrong_form"] })
  assert.equal(r.drafts[1].meta, null)
  assert.deepEqual(r.batch.counts, { kept: 2, rejectedByCode: 2, duplicates: 1 })
  assert.equal(r.batch.blindRuns, null)
})

test("kèm tệp giải mù: qua/trượt đặt đúng trạng thái; mã lạ trong tệp giải mù bị từ chối", () => {
  const reviewed = { runs: 2, reviewed: [{ id: "en-questions-051", pass: true, why: [], runs: [] }, { id: "en-questions-052", pass: false, why: ["hai đáp án đúng"], runs: [] }] }
  const r = parseBatch(batch(), reviewed)
  assert.ok(r.ok)
  if (!r.ok) return
  assert.deepEqual(r.drafts.map((d) => d.status), ["review_passed", "review_failed"])
  assert.deepEqual(r.drafts[1].blind?.why, ["hai đáp án đúng"])
  assert.equal(r.batch.blindRuns, 2)
  const bad = parseBatch(batch(), { reviewed: [{ id: "zzz", pass: true }] })
  assert.ok(!bad.ok && /không có trong lô/.test(bad.error))
})

test("đọc lô bài đọc/nghe: chủ điểm là reading-bN / listening-bN", () => {
  const passage = { id: "rd-b3-020", bac: 3, title: "T", text: "Some text here.", questions: [{ prompt: "Q?", choices: ["a", "b", "c"], correctIndex: 1, explanation: "x", choiceExplanations: ["", "", ""] }] }
  const r = parseBatch({ promptVersion: "passages-v1", model: "m", kind: "reading", bac: 3, items: [passage] })
  assert.ok(r.ok)
  if (r.ok) {
    assert.equal(r.drafts[0].topic, "reading-b3")
    assert.equal(r.batch.topic, null)
  }
  const l = parseBatch({ promptVersion: "passages-v1", model: "m", kind: "listening", bac: 2, items: [{ ...passage, id: "ls-b2-001", text: undefined, transcript: "A: Hi. B: Hello." }] })
  assert.ok(l.ok && l.drafts[0].topic === "listening-b2")
})

test("lô sai khuôn bị từ chối với thông báo rõ", () => {
  const errors = [
    parseBatch(null),
    parseBatch({}),
    parseBatch(batch({ items: [] })),
    parseBatch(batch({ bac: 9 })),
    parseBatch(batch({ model: undefined })),
    parseBatch(batch({ topic: undefined })),
    parseBatch(batch({ items: [gItem("a"), gItem("a")] })),
    parseBatch(batch({ items: [gItem("a", 7)] })),
    parseBatch(batch({ items: [gItem("a", 0, { choices: ["x", "x", "y", "z"] })] })),
    parseBatch(batch({ items: [gItem("a", 0, { choiceExplanations: ["1"] })] })),
    parseBatch(batch({ items: Array.from({ length: 101 }, (_, i) => gItem(`i${i}`)) })),
  ]
  for (const e of errors) assert.ok(!e.ok && e.error.length > 10)
})

const D = (over: Partial<StatDraft>): StatDraft => ({ batchId: "b1", kind: "grammar", topic: "questions", bac: 3, status: "generated", rejectReason: null, blindPass: null, data: { correctIndex: 0, difficulty: 2 }, ...over })
const B: StatBatch[] = [
  { id: "b1", model: "m-1", promptVersion: "v1", counts: { kept: 6, rejectedByCode: 3, duplicates: 1 } },
  { id: "b2", model: "m-2", promptVersion: "v2", counts: { kept: 4, rejectedByCode: 0, duplicates: 0 } },
]

test("thống kê: các tỷ lệ, độ tin cậy của giải mù, phân bố và lý do loại", () => {
  const drafts: StatDraft[] = [
    D({ status: "approved", blindPass: true, data: { correctIndex: 0, difficulty: 1 } }),
    D({ status: "approved", blindPass: true, data: { correctIndex: 1, difficulty: 2 } }),
    D({ status: "rejected", blindPass: true, rejectReason: "Sai ngữ pháp", data: { correctIndex: 1, difficulty: 3 } }),
    D({ status: "rejected", blindPass: false, rejectReason: "Sai ngữ pháp", data: { correctIndex: 2, difficulty: 2 } }),
    D({ status: "review_failed", blindPass: false, data: { correctIndex: 3, difficulty: 2 } }),
    D({ batchId: "b2", status: "review_passed", blindPass: true, bac: 4, data: { correctIndex: 0, difficulty: 2 } }),
    D({ batchId: "b2", status: "approved", blindPass: false, bac: 4, data: { correctIndex: 0, difficulty: 2 } }),
    D({ batchId: "b2", kind: "reading", status: "generated", topic: "reading-b4", bac: 4, data: {} }),
  ]
  const s = draftStats(drafts, B)
  assert.equal(s.total, 8)
  assert.equal(s.byStatus.approved, 3)
  assert.equal(s.codePass.num, 10)
  assert.equal(s.codePass.den, 14) // 10 giữ / (10 + 3 + 1)
  assert.equal(s.blindPass.den, 7)
  assert.equal(s.blindPass.num, 4)
  assert.equal(s.humanApprove.den, 5)
  assert.equal(s.humanApprove.num, 3)
  assert.deepEqual(s.calibration, { passApproved: 2, passRejected: 1, failApproved: 1, failRejected: 1 })
  assert.deepEqual(s.positions, [3, 2, 1, 1])
  assert.deepEqual(s.difficulty, { 1: 1, 2: 5, 3: 1 })
  assert.deepEqual(s.bac, { 3: 5, 4: 3 })
  assert.deepEqual(s.rejectReasons, [{ reason: "Sai ngữ pháp", count: 2 }])
  const v1 = s.byPromptVersion.find((g) => g.key === "v1")!
  assert.equal(v1.total, 5)
  assert.equal(v1.humanApprove.value, 2 / 4)
  assert.equal(s.byModel.length, 2)
  assert.equal(s.byBac.length, 2)
})

test("thống kê khi chưa có mẫu: tỷ lệ null, không chia cho 0", () => {
  const s = draftStats([], [])
  assert.equal(s.total, 0)
  assert.equal(s.blindPass.value, null)
  assert.equal(s.humanApprove.value, null)
  assert.equal(s.codePass.value, null)
  assert.deepEqual(s.rejectReasons, [])
})

test("xuất: gom theo tệp đích, bỏ mã trùng, cảnh báo đáp án dồn một vị trí", () => {
  const g = (id: string, ci: number) => ({ itemId: id, kind: "grammar" as const, topic: "questions", bac: 3, data: gItem(id, ci) })
  const many = Array.from({ length: 10 }, (_, i) => g(`en-questions-${100 + i}`, 0))
  const r = buildExport([...many, g("en-questions-100", 1), { itemId: "rd-b3-020", kind: "reading", topic: "reading-b3", bac: 3, data: { id: "rd-b3-020" } }])
  assert.deepEqual(r.files.map((f) => f.path), ["src/content/exercises/en/questions.json", "src/content/reading/en/bac3.json"])
  assert.equal(r.files[0].items.length, 10)
  assert.ok(r.warnings.some((w) => w.includes("hai lần")))
  assert.ok(r.warnings.some((w) => w.includes("dồn vào một vị trí")))
  const ok = buildExport([g("a1", 0), g("a2", 1), g("a3", 2), g("a4", 3)])
  assert.ok(!ok.warnings.some((w) => w.includes("dồn")))
})
