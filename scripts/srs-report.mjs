// Báo cáo so sánh SM-2 và FSRS từ nhật ký lượt ôn (bảng srs_reviews). Chạy trên MÁY CỦA BẠN, chỉ đọc.
//   node scripts/srs-report.mjs
// Cần NEXT_PUBLIC_SUPABASE_URL và SUPABASE_SERVICE_ROLE_KEY trong .env.local và đã chạy migration 0010. Chỉ in số liệu tổng hợp, không in dữ liệu cá nhân.
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
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
const { evaluateReviews } = await import("../src/lib/srs/evaluate.ts")

const logs = []
for (let from = 0; ; from += 1000) {
  const { data, error } = await db.from("srs_reviews").select("rating, retrievability, elapsed_days, fsrs_days, sm2_days").range(from, from + 999)
  if (error) {
    console.error(error.message, "(đã chạy migration 0010 chưa?)")
    process.exit(1)
  }
  logs.push(...data.map((r) => ({ rating: r.rating, retrievability: r.retrievability, elapsedDays: r.elapsed_days, fsrsDays: r.fsrs_days, sm2Days: r.sm2_days })))
  if (data.length < 1000) break
}
const r = evaluateReviews(logs)
const pct = (x) => (x === null ? "—" : `${(x * 100).toFixed(1)}%`)
console.log(`Tổng lượt ôn: ${r.reviews} (có dự đoán FSRS: ${r.withPrediction})`)
console.log(`Tỷ lệ nhớ thật: ${pct(r.recallRate)} · Dự đoán trung bình: ${pct(r.meanPredicted)} · Log loss: ${r.logLoss === null ? "—" : r.logLoss.toFixed(3)}`)
console.log(`FSRS hẹn so với SM-2: ${r.intervalRatio === null ? "—" : `${r.intervalRatio.toFixed(2)} lần khoảng cách (>1 = ít phải ôn hơn)`}`)
console.log("Hiệu chỉnh (dự đoán → nhớ thật):")
for (const b of r.calibration) console.log(`  ${pct(b.from)}–${pct(b.to)}: ${b.count} lượt, dự đoán ${pct(b.predicted)}, thật ${pct(b.actual)}`)
if (r.reviews < 200) console.log("\nLưu ý: dưới 200 lượt ôn thì số liệu chưa đáng tin; cần thêm dữ liệu trước khi kết luận.")
