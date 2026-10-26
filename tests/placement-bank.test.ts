import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import { buildReserved } from "../scripts/build-placement-bank.mjs"
import { filterReserved } from "../src/lib/placement/filter.ts"
import { collectItems } from "../scripts/lib/content-items.mjs"

const reserved = JSON.parse(fs.readFileSync("src/content/placement/reserved.json", "utf8"))

test("tập dành riêng khớp nội dung hiện có (chạy `node scripts/build-placement-bank.mjs` nếu báo lệch)", () => {
  assert.deepEqual(reserved, buildReserved())
})

test("mọi mã dành riêng đều có thật, đủ số lượng mỗi bậc, không trùng", () => {
  const items = collectItems()
  const ids = new Set(items.map((i) => i.id))
  const all = [...reserved.grammar, ...Object.values(reserved.vocab).flat(), ...reserved.reading, ...reserved.listening] as string[]
  assert.ok(all.every((id) => ids.has(id)), "có mã không tồn tại")
  assert.equal(new Set(all).size, all.length)
  const bacOf = new Map(items.map((i) => [i.id, i.data.bac ?? i.bac]))
  for (let bac = 1; bac <= 6; bac++) {
    assert.equal(reserved.grammar.filter((id: string) => bacOf.get(id) === bac).length, 10, `ngữ pháp Bậc ${bac}`)
    assert.equal(reserved.reading.filter((id: string) => bacOf.get(id) === bac).length, 3, `đọc Bậc ${bac}`)
    assert.equal(reserved.listening.filter((id: string) => bacOf.get(id) === bac).length, 3, `nghe Bậc ${bac}`)
  }
  for (const level of ["a1", "a2", "b1", "b2", "c1", "c2"]) assert.equal(reserved.vocab[level].length, 40, `từ vựng ${level}`)
})

test("câu ngữ pháp dành riêng là trắc nghiệm gốc (để câu hỏi và nhãn rõ ràng)", () => {
  const byId = new Map(collectItems().filter((i) => i.collection === "exercise").map((i) => [i.id, i.data]))
  for (const id of reserved.grammar as string[]) {
    const e = byId.get(id)
    assert.ok(e && (e.kind ?? "mcq") === "mcq" && Array.isArray(e.choices) && e.choices.length === 4, id)
  }
})

test("lọc: luyện tập loại tập dành riêng; xếp trình độ chỉ lấy tập đó", () => {
  const items = [{ id: "a" }, { id: "b" }, { id: "c" }]
  const set = new Set(["b"])
  assert.deepEqual(filterReserved(items, set), [{ id: "a" }, { id: "c" }])
  assert.deepEqual(filterReserved(items, set, "exclude"), [{ id: "a" }, { id: "c" }])
  assert.deepEqual(filterReserved(items, set, "only"), [{ id: "b" }])
})
