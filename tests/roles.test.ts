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
