import test from "node:test"
import assert from "node:assert/strict"
import { nextStairBac } from "../src/lib/placement-skill.ts"

test("bậc thang: bắt đầu Bậc 2, đạt thì lên, chưa đạt thì xuống", () => {
  assert.equal(nextStairBac([]), 2)
  assert.equal(nextStairBac([{ bac: 2, passed: true }]), 3)
  assert.equal(nextStairBac([{ bac: 2, passed: false }]), 1)
})

test("bậc thang: dừng khi ra ngoài thang, trùng bậc đã làm hoặc đủ 3 bài", () => {
  assert.equal(nextStairBac([{ bac: 2, passed: false }, { bac: 1, passed: false }]), null)
  assert.equal(nextStairBac([{ bac: 2, passed: true }, { bac: 3, passed: false }]), null)
  assert.equal(nextStairBac([{ bac: 2, passed: true }, { bac: 3, passed: true }, { bac: 4, passed: true }]), null)
})
