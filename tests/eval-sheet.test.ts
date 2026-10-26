import test from "node:test"
import assert from "node:assert/strict"
import { buildSheet, csvParse, csvStringify, importSheet, type Candidate } from "../src/lib/grading/eval-sheet.ts"
import cands from "../eval/grade-samples.candidates.json" with { type: "json" }

const C: Candidate[] = [
  { id: "m01", skill: "writing", task: "Write, \"quoted\" task", targetBac: 2, text: "Line one.\nLine two, with comma." },
  { id: "m02", skill: "writing", task: "Task two", targetBac: 3, text: "Text two here is long enough." },
]

test("CSV: dấu phẩy, ngoặc kép và xuống dòng trong ô đi qua được hai chiều", () => {
  const sheet = buildSheet(C)
  assert.equal(sheet[0].length, sheet[1].length)
  const back = csvParse("﻿" + csvStringify(sheet))
  assert.deepEqual(back, sheet)
})

test("nhập phiếu: điểm hợp lệ vào bộ mẫu, văn bài lấy từ bài mẫu, bài chưa chấm đủ bị loại và báo", () => {
  const sheet = buildSheet(C)
  sheet[1].splice(4, 5, "3", "2", "2", "1", "2")
  const r = importSheet(csvStringify(sheet), C)
  assert.equal(r.samples.length, 1)
  assert.deepEqual(r.samples[0].human, { scores: { task: 3, organization: 2, vocabulary: 2, grammar: 1 }, bac: 2 })
  assert.equal(r.samples[0].text, C[0].text)
  assert.deepEqual(r.incomplete, ["m02"])
  assert.deepEqual(r.errors, [])
  // chấm dở dang (thiếu một ô) cũng tính là chưa đủ
  const half = buildSheet(C)
  half[1].splice(4, 5, "3", "2", "", "1", "2")
  assert.deepEqual(importSheet(csvStringify(half), C).incomplete.sort(), ["m01", "m02"])
})

test("nhập phiếu: báo lỗi điểm ngoài khoảng, không phải số nguyên, mã lạ, trùng mã, thiếu cột", () => {
  const sheet = buildSheet(C)
  sheet[1].splice(4, 5, "5", "2", "2", "1", "2")
  sheet[2].splice(4, 5, "3", "x", "2", "1", "9")
  sheet.push(["zzz", "1", "t", "t", "1", "1", "1", "1", "1"], [...sheet[1]])
  const errs = importSheet(csvStringify(sheet), C).errors.join(" | ")
  for (const needle of ["score_task (0–4)", "score_organization", "mã không có trong bài mẫu", "hai lần"]) assert.ok(errs.includes(needle), needle)
  assert.ok(importSheet("id,foo\nm01,1", C).errors[0].includes("thiếu cột"))
  assert.deepEqual(importSheet("", C).errors, ["phiếu rỗng"])
})

test("bộ bài mẫu thật: 30 bài, mã duy nhất, đủ trường, bài đủ dài, trải đều bậc 1–4", () => {
  const list = cands as unknown as Candidate[]
  assert.equal(list.length, 30)
  assert.equal(new Set(list.map((c) => c.id)).size, 30)
  for (const c of list) assert.ok(c.skill === "writing" && c.task && c.text.split(/\s+/).length >= 8 && c.targetBac >= 1 && c.targetBac <= 6, c.id)
  for (const bac of [1, 2, 3, 4]) assert.ok(list.filter((c) => c.targetBac === bac).length >= 6, `bậc ${bac}`)
})
