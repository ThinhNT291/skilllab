// Kiểm tra và dựng lại bảng đếm theo ngày `daily_activity` từ toàn bộ dòng thô `answers` (xem docs/tong-hop-tien-do.md, tầng C).
//   node scripts/rebuild-progress.mjs            kiểm tra, chỉ báo lệch
//   node scripts/rebuild-progress.mjs --fix      sửa cho khớp dữ liệu thô (thêm/sửa/xóa dòng của daily_activity)
// Chạy trên MÁY CỦA BẠN. Cần NEXT_PUBLIC_SUPABASE_URL và SUPABASE_SERVICE_ROLE_KEY trong .env.local và đã chạy migration 0011.
// Đọc HẾT dòng `answers` theo trang 1.000 dòng (đây là công cụ "đọc hết" khi nghi sai lệch hoặc sau khi nhập dữ liệu). Chỉ in số liệu tổng hợp.
import { createClient } from "@supabase/supabase-js"

try {
  process.loadEnvFile(".env.local")
} catch {
  // dùng biến môi trường hiện có
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error("Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY trong .env.local.")
  process.exit(1)
}
const fix = process.argv.includes("--fix")
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
const { vnDayKey } = await import("../src/lib/analytics/activity.ts")
const { diffDaily } = await import("../src/lib/analytics/rebuild.ts")

async function readAll(table, columns, order) {
  const rows = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from(table).select(columns).order(order).range(from, from + 999)
    if (error) {
      console.error(`${table}: ${error.message}${table === "daily_activity" ? " (đã chạy migration 0011 chưa?)" : ""}`)
      process.exit(1)
    }
    rows.push(...data)
    if (data.length < 1000) return rows
  }
}

const answers = await readAll("answers", "id, profile_id, correct, created_at", "id")
const stored = await readAll("daily_activity", "profile_id, day, answers, correct", "profile_id")
const truth = new Map()
for (const a of answers) {
  const k = `${a.profile_id}|${vnDayKey(a.created_at)}`
  const cur = truth.get(k) ?? { profile_id: a.profile_id, day: vnDayKey(a.created_at), answers: 0, correct: 0 }
  cur.answers++
  if (a.correct) cur.correct++
  truth.set(k, cur)
}
const d = diffDaily([...truth.values()], stored)
console.log(`Dòng thô: ${answers.length} · ngày-học sinh đúng theo dữ liệu thô: ${truth.size} · đang lưu: ${stored.length}`)
console.log(`Lệch: thiếu ${d.missing.length}, sai số ${d.wrong.length}, thừa ${d.extra.length}`)
const profiles = new Set([...d.missing, ...d.wrong, ...d.extra].map((r) => r.profile_id))
if (profiles.size) console.log(`Học sinh bị lệch: ${profiles.size} (ví dụ: ${[...profiles].slice(0, 3).map((p) => p.slice(0, 8)).join(", ")})`)
if (!profiles.size) console.log("Khớp hoàn toàn.")
if (fix && profiles.size) {
  const upserts = [...d.missing, ...d.wrong].map((r) => truth.get(`${r.profile_id}|${r.day}`))
  for (let i = 0; i < upserts.length; i += 500) {
    const { error } = await db.from("daily_activity").upsert(upserts.slice(i, i + 500), { onConflict: "profile_id,day" })
    if (error) {
      console.error(error.message)
      process.exit(1)
    }
  }
  for (const r of d.extra) await db.from("daily_activity").delete().eq("profile_id", r.profile_id).eq("day", r.day)
  console.log("Đã sửa cho khớp. Chạy lại không có --fix để kiểm tra.")
} else if (profiles.size) console.log("Chạy lại với --fix để sửa.")
