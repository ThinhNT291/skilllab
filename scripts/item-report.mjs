// Báo cáo chất lượng nhãn độ khó từng câu từ bảng answers. Chạy trên MÁY CỦA BẠN, chỉ đọc.
//   node scripts/item-report.mjs [số dòng tối đa mỗi bảng, mặc định 20]
// Cần NEXT_PUBLIC_SUPABASE_URL và SUPABASE_SERVICE_ROLE_KEY trong .env.local. Chỉ in mã câu và số liệu tổng hợp, không in mã học sinh.
// Chạy được cả khi ít dữ liệu (báo rõ chưa đủ để kết luận). Chỉ đánh dấu, KHÔNG sửa nhãn.
import { createClient } from "@supabase/supabase-js"
import fs from "node:fs"

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
const limit = Number(process.argv[2]) || 20
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
const { itemQuality, familyQuality, MIN_ATTEMPTS, MIN_LEARNERS, FLAG_GAP } = await import("../src/lib/analytics/item-quality.ts")
const meta = JSON.parse(fs.readFileSync("src/content/meta/items.json", "utf8"))

const answers = []
for (let from = 0; ; from += 1000) {
  const { data, error } = await db.from("answers").select("profile_id, exercise_id, topic, correct, created_at").order("id").range(from, from + 999)
  if (error) {
    console.error(error.message)
    process.exit(1)
  }
  answers.push(...data.map((r) => ({ profileId: r.profile_id, exerciseId: r.exercise_id, topic: r.topic, correct: r.correct, created_at: r.created_at })))
  if (data.length < 1000) break
}

const pct = (x) => `${(x * 100).toFixed(0)}%`
const sgn = (x) => `${x >= 0 ? "+" : ""}${(x * 100).toFixed(0)}`
const learners = new Set(answers.map((a) => a.profileId)).size
console.log(`Tổng lượt trả lời: ${answers.length} · học sinh: ${learners}`)

const items = itemQuality(answers, meta)
const flagged = items.filter((i) => i.flags.length)
console.log(`Câu có số liệu: ${items.length} · đủ mẫu (≥${MIN_ATTEMPTS} lượt, ≥${MIN_LEARNERS} học sinh): ${items.filter((i) => i.attempts >= MIN_ATTEMPTS && i.learners >= MIN_LEARNERS).length} · bị đánh dấu: ${flagged.length}`)
const LABEL = { "easier-than-label": "dễ hơn nhãn", "harder-than-label": "khó hơn nhãn", "below-guess": "dưới mức đoán mò (kiểm tra đáp án)" }
console.log(`\nCâu bị đánh dấu (lệch > ${FLAG_GAP * 100} điểm %; cột lệch = đúng thật − dự kiến):`)
for (const i of flagged.slice(0, limit)) console.log(`  ${i.exerciseId} [${i.topic}] ${i.attempts} lượt/${i.learners} hs: thật ${pct(i.observed)}, dự kiến ${pct(i.expected)}, lệch ${sgn(i.gap)} → ${i.flags.map((f) => LABEL[f]).join(", ")}`)
if (!flagged.length) console.log("  (chưa có)")

console.log("\nLệch theo nhóm (chủ đề · dạng câu), cần ≥ 3 câu và ≥ 100 lượt:")
const fams = familyQuality(answers, meta).filter((f) => f.items >= 3 && f.attempts >= 100)
for (const f of fams.slice(0, limit)) console.log(`  ${f.topic} · ${f.family}: ${f.items} câu, ${f.attempts} lượt, thật ${pct(f.observed)}, dự kiến ${pct(f.expected)}, lệch ${sgn(f.gap)}`)
if (!fams.length) console.log("  (chưa đủ dữ liệu)")

if (answers.length < 1000) console.log("\nLưu ý: dưới 1.000 lượt trả lời thì phần lớn câu chưa đủ mẫu; chỉ để làm quen với báo cáo, chưa nên sửa nhãn.")
console.log("Bước tiếp: người duyệt từng câu bị đánh dấu → sửa JSON nội dung → node scripts/build-item-meta.mjs.")
