import test from "node:test"
import assert from "node:assert/strict"
import { confirmMatches, expandScopes, tablesFor } from "../src/lib/auth/reset.ts"

test("phạm vi đặt lại: chỉ nhận giá trị hợp lệ, không trùng, giữ thứ tự chuẩn; all là tất cả", () => {
  assert.deepEqual(expandScopes(["srs", "answers", "srs", "zzz"]), ["answers", "srs"])
  assert.equal(expandScopes(["all"]).length, 7)
  assert.deepEqual(expandScopes("answers"), [])
  assert.deepEqual(expandScopes(undefined), [])
  assert.deepEqual(expandScopes(["drop table"]), [])
})

test("bảng cần xóa: bộ đếm theo ngày trước dòng thô; không có bảng ngoài danh sách", () => {
  assert.deepEqual(tablesFor(["answers"]), ["daily_activity", "answers"])
  assert.deepEqual(tablesFor(["srs", "items"]), ["srs_cards", "player_items"])
  assert.deepEqual(tablesFor(["path"]), ["path_lessons", "path_state", "challenge_attempts"])
  assert.deepEqual(tablesFor([]), [])
})

test("xác nhận bằng tên đăng nhập: không phân biệt hoa thường, thiếu hoặc sai thì từ chối", () => {
  assert.equal(confirmMatches("  Minh.6A ", "minh.6a"), true)
  assert.equal(confirmMatches("minh", "minh.6a"), false)
  assert.equal(confirmMatches("", ""), false)
  assert.equal(confirmMatches("x", null), false)
  assert.equal(confirmMatches(5, "5"), false)
})
