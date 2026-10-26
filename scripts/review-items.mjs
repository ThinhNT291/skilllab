// "Giải mù" câu ngữ pháp do gen-items.mjs sinh: một lượt gọi Gemini độc lập, KHÔNG cho thấy đáp án, rồi so với đáp án đúng
// (docs/prompt-sinh-noi-dung.md mục 5). Giữ câu khi giải mù chọn đúng đáp án đúng và chỉ đáp án đó, câu tự nhiên, vừa bậc.
//   node scripts/review-items.mjs tmp/gen/<tệp>.json [--runs 2]   (--runs: số lần giải mù độc lập; câu phải qua TẤT CẢ các lần)
// Ghi <tệp>.reviewed.json (kết quả từng câu) và <tệp>.passed.json (chỉ câu đạt, dạng sẵn sàng đưa người duyệt mẫu). KHÔNG ghi vào src/content.
import fs from "node:fs"
import { callJson, MODEL } from "./lib/gemini-rest.mjs"

const file = process.argv[2]
if (!file || !fs.existsSync(file)) {
  console.error("Cách dùng: node scripts/review-items.mjs <tệp do gen-items.mjs ghi> [--runs 2]")
  process.exit(1)
}
const runsIdx = process.argv.indexOf("--runs")
const runs = runsIdx >= 0 ? Math.max(1, Math.min(4, Number(process.argv[runsIdx + 1]) || 2)) : 2

const { buildReviewPrompt, passesReview } = await import("../src/lib/ai/prompts/grammar-items.ts")
const batch = JSON.parse(fs.readFileSync(file, "utf8"))
const reviewItems = batch.items.map((e) => ({ id: e.id, prompt: e.prompt, choices: e.choices }))

const results = batch.items.map((e) => ({ id: e.id, runs: [] }))
for (let r = 0; r < runs; r++) {
  console.log(`Giải mù lần ${r + 1}/${runs} · mô hình ${MODEL}`)
  const out = await callJson(buildReviewPrompt(reviewItems, batch.bac), { temperature: 0.1 })
  const verdicts = new Map((Array.isArray(out) ? out : []).filter((v) => v && typeof v.id === "string").map((v) => [v.id, { id: v.id, acceptableIndexes: Array.isArray(v.acceptableIndexes) ? v.acceptableIndexes.filter(Number.isInteger) : [], naturalness: Number(v.naturalness) || 0, levelFit: Number(v.levelFit) || 0, issues: Array.isArray(v.issues) ? v.issues.map(String) : [], note: String(v.note ?? "") }]))
  batch.items.forEach((e, i) => results[i].runs.push({ ...passesReview(verdicts.get(e.id), e.correctIndex), verdict: verdicts.get(e.id) ?? null }))
}
const reviewed = results.map((r) => ({ id: r.id, pass: r.runs.every((x) => x.pass), why: r.runs.flatMap((x) => x.why), runs: r.runs.map((x) => x.verdict) }))
const passedIds = new Set(reviewed.filter((r) => r.pass).map((r) => r.id))

fs.writeFileSync(file.replace(/\.json$/, ".reviewed.json"), JSON.stringify({ file, runs, model: MODEL, reviewed }, null, 1) + "\n")
fs.writeFileSync(file.replace(/\.json$/, ".passed.json"), JSON.stringify(batch.items.filter((e) => passedIds.has(e.id)), null, 1) + "\n")
console.log(`Đạt ${passedIds.size}/${batch.items.length} câu (phải đạt cả ${runs} lần giải mù).`)
for (const r of reviewed.filter((x) => !x.pass).slice(0, 8)) console.log(`  - ${r.id}: ${[...new Set(r.why)].join("; ")}`)
console.log("Bước tiếp: người duyệt mẫu 10–20% câu đạt, rồi tự gộp vào src/content/exercises/en/<chuyên đề>.json (chạy build-item-meta, check:content, test).")
