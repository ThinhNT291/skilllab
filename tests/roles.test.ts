import test from "node:test"
import assert from "node:assert/strict"
import { accountEmail, canManageAccounts, canViewStaffArea, normalizeUsername } from "../src/lib/auth/roles.ts"

test("quyền theo vai trò", () => {
  assert.equal(canViewStaffArea("student"), false)
  assert.equal(canViewStaffArea("teacher"), true)
  assert.equal(canManageAccounts("teacher"), false)
  assert.equal(canManageAccounts("admin"), true)
})

test("tên đăng nhập: chuẩn hóa và từ chối giá trị sai", () => {
  assert.equal(normalizeUsername("  HS.Minh01 "), "hs.minh01")
  assert.equal(normalizeUsername("ab"), null)
  assert.equal(normalizeUsername("có dấu"), null)
  assert.equal(normalizeUsername(".bắt_đầu"), null)
  assert.equal(accountEmail("hs.minh01"), "hs.minh01@accounts.skilllab.invalid")
})

import { generatePassword, MIN_PASSWORD, passwordProblem } from "../src/lib/auth/password.ts"

test("mật khẩu tự sinh: đúng độ dài, không có ký tự dễ nhầm, dùng đủ bảng chữ", () => {
  let n = 0
  const p = generatePassword(10, (max) => n++ % max)
  assert.equal(p.length, 10)
  assert.ok(!/[01OIl]/.test(generatePassword(200)))
  assert.notEqual(generatePassword(), generatePassword())
})

test("độ dài tối thiểu theo vai trò", () => {
  assert.equal(passwordProblem("12345", "student"), "too_short")
  assert.equal(passwordProblem("123456", "student"), null)
  assert.equal(passwordProblem("1234567", "teacher"), "too_short")
  assert.equal(passwordProblem("x".repeat(73), "admin"), "too_long")
  assert.equal(MIN_PASSWORD.admin, 8)
})
