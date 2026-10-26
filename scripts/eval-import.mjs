// Nhập phiếu chấm đã điền thành bộ mẫu để đo máy chấm:
//   node scripts/eval-import.mjs eval/phieu-cham.csv [nhiều phiếu của các giáo viên khác nhau: lấy điểm trung bình, làm tròn]
// Ghi eval/grade-samples.json (không đẩy lên git). Rồi: node scripts/grade-eval.mjs eval/grade-samples.json
import fs from "node:fs"

const files = process.argv.slice(2).filter((a) => !a.startsWith("--"))
if (!files.length) {
  console.error("Cách dùng: node scripts/eval-import.mjs <phiếu 1.csv> [phiếu 2.csv …]")
  process.exit(1)
}
const { importSheet, SCORE_COLUMNS } = await import("../src/lib/grading/eval-sheet.ts")
const cands = JSON.parse(fs.readFileSync("eval/grade-samples.candidates.json", "utf8"))
const sheets = files.map((f) => ({ f, r: importSheet(fs.readFileSync(f, "utf8"), cands) }))
for (const { f, r } of sheets) {
  console.log(`${f}: chấm đủ ${r.samples.length}/${cands.length}, chưa chấm đủ ${r.incomplete.length}${r.errors.length ? `, lỗi ${r.errors.length}` : ""}`)
  for (const e of r.errors.slice(0, 8)) console.log(`  - ${e}`)
}
if (sheets.some(({ r }) => r.errors.length)) process.exit(1)

// Gộp nhiều giáo viên: chỉ giữ bài mà TẤT CẢ đã chấm; điểm = trung bình làm tròn; báo bài lệch từ 2 điểm trở lên.
const byId = new Map()
for (const { r } of sheets) for (const s of r.samples) byId.set(s.id, [...(byId.get(s.id) ?? []), s])
const samples = []
const disputes = []
for (const [id, list] of byId) {
  if (list.length < sheets.length) continue
  const first = list[0]
  const avg = (get) => Math.round(list.reduce((n, s) => n + get(s), 0) / list.length)
  const spread = (get) => Math.max(...list.map(get)) - Math.min(...list.map(get))
  if (SCORE_COLUMNS.some((k) => spread((s) => s.human.scores[k]) >= 2) || spread((s) => s.human.bac) >= 2) disputes.push(id)
  samples.push({ ...first, human: { scores: Object.fromEntries(SCORE_COLUMNS.map((k) => [k, avg((s) => s.human.scores[k])])), bac: avg((s) => s.human.bac) } })
}
samples.sort((a, b) => (a.id < b.id ? -1 : 1))
fs.writeFileSync("eval/grade-samples.json", JSON.stringify(samples, null, 1) + "\n")
console.log(`Đã ghi eval/grade-samples.json (${samples.length} bài).`)
if (disputes.length) console.log(`Bài giáo viên chấm lệch ≥ 2 điểm (nên bàn lại trước khi dùng làm chuẩn): ${disputes.join(", ")}`)
if (samples.length < 20) console.log("Lưu ý: dưới 20 bài thì chỉ số dao động nhiều, chưa nên dùng để kết luận.")
