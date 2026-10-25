// Tạo tài khoản quản trị đầu tiên (hoặc đặt lại mật khẩu cho một quản trị đã có). Chạy trên máy của bạn, KHÔNG chạy trong môi trường chia sẻ.
//
//   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... ADMIN_PASSWORD='mật-khẩu-của-bạn' node scripts/create-admin.mjs tenquantri
//
// Khóa service_role lấy ở Supabase > Project Settings > API (mục "service_role", giữ bí mật, không dán vào chat, không commit).
// Cần đã chạy migration 0007. Mật khẩu tối thiểu 8 ký tự.
import { createClient } from "@supabase/supabase-js"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
const password = process.env.ADMIN_PASSWORD
const username = (process.argv[2] ?? "").trim().toLowerCase()

if (!url || !key || !password) {
  console.error("Thiếu NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY hoặc ADMIN_PASSWORD.")
  process.exit(1)
}
if (!/^[a-z0-9][a-z0-9._]{2,29}$/.test(username)) {
  console.error("Tên đăng nhập gồm chữ thường, số, dấu chấm hoặc gạch dưới (3–30 ký tự). Ví dụ: node scripts/create-admin.mjs thinh")
  process.exit(1)
}
if (password.length < 8) {
  console.error("Mật khẩu quản trị tối thiểu 8 ký tự.")
  process.exit(1)
}

const email = `${username}@accounts.skilllab.invalid`
const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })

let userId
const created = await admin.auth.admin.createUser({ email, password, email_confirm: true, app_metadata: { must_change_password: false } })
if (created.error) {
  if (!/already/i.test(created.error.message)) {
    console.error("Không tạo được tài khoản đăng nhập:", created.error.message)
    process.exit(1)
  }
  const list = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  userId = list.data?.users.find((u) => u.email === email)?.id
  if (!userId) {
    console.error("Tài khoản đã có nhưng không tìm thấy mã người dùng.")
    process.exit(1)
  }
  await admin.auth.admin.updateUserById(userId, { password, app_metadata: { must_change_password: false } })
  console.log("Tài khoản đã có: đã cập nhật mật khẩu.")
} else {
  userId = created.data.user.id
}

const { error } = await admin.from("profiles").upsert({ auth_user_id: userId, role: "admin", username, nickname: username }, { onConflict: "auth_user_id" })
if (error) {
  console.error("Không đặt được vai trò quản trị:", error.message, "(đã chạy migration 0007 chưa?)")
  process.exit(1)
}
await admin.from("audit_log").insert({ action: "admin_bootstrap", detail: { username } })
console.log(`Xong. Đăng nhập tại /dang-nhap với tên đăng nhập "${username}" và mật khẩu bạn vừa đặt.`)
