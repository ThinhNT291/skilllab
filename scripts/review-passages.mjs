// "Giải mù" bài đọc/nghe do gen-passages.mjs sinh: mô hình trả lời câu hỏi CHỈ dựa vào bài, không thấy đáp án, rồi so với đáp án đúng.
//   node scripts/review-passages.mjs tmp/gen/<tệp>.json [--runs 2]   (bài phải qua TẤT CẢ các lần)
// Ghi <tệp>.reviewed.json và <tệp>.passed.json (chỉ bài đạt). KHÔNG ghi vào src/content. Người duyệt mẫu rồi mới gộp.
import fs from "node:fs"
import { callJson, MODEL } from "./lib/gemini-rest.mjs"

const file = process.argv[2]
if (!file || !fs.existsSync(file)) {
  console.error("Cách dùng: node scripts/review-passages.mjs <tệp do gen-passages.mjs ghi> [--runs 2]")
  process.exit(1)
}
const runsIdx = process.argv.indexOf("--runs")
const runs = runsIdx >= 0 ? Math.max(1, Math.min(4, Number(process.argv[runsIdx + 1]) || 2)) : 2

const { buildPassageReviewPrompt, passesPassageReview } = await import("../src/lib/ai/prompts/passages.ts")
const batch = JSON.parse(fs.readFileSync(file, "utf8"))
const textOf = (p) => p.text ?? p.transcript
const reviewItems = batch.items.map((p) => ({ id: p.id, text: textOf(p), questions: p.questions.map((q) => ({ question: q.prompt, choices: q.choices })) }))

const results = batch.items.map((p) => ({ id: p.id, runs: [] }))
for (let r = 0; r < runs; r++) {
  console.log(`Giải mù lần ${r + 1}/${runs} · mô hình ${MODEL}`)
  const out = await callJson(buildPassageReviewPrompt(reviewItems, batch.kind, batch.bac), { temperature: 0.1 })
  const verdicts = new Map(
    (Array.isArray(out) ? out : []).filter((v) => v && typeof v.id === "string").map((v) => [v.id, { id: v.id, answers: Array.isArray(v.answers) ? v.answers.map((a) => ({ q: Number(a.q), acceptableIndexes: Array.isArray(a.acceptableIndexes) ? a.acceptableIndexes.filter(Number.isInteger) : [], issues: Array.isArray(a.issues) ? a.issues.map(String) : [] })) : [], naturalness: Number(v.naturalness) || 0, levelFit: Number(v.levelFit) || 0, overallIssues: Array.isArray(v.overallIssues) ? v.overallIssues.map(String) : [] }]),
  )
  batch.items.forEach((p, i) => results[i].runs.push({ ...passesPassageReview(verdicts.get(p.id), p.questions.map((q) => q.correctIndex)), verdict: verdicts.get(p.id) ?? null }))
}
const reviewed = results.map((r) => ({ id: r.id, pass: r.runs.every((x) => x.pass), why: r.runs.flatMap((x) => x.why), runs: r.runs.map((x) => x.verdict) }))
const passedIds = new Set(reviewed.filter((r) => r.pass).map((r) => r.id))
fs.writeFileSync(file.replace(/\.json$/, ".reviewed.json"), JSON.stringify({ file, runs, model: MODEL, reviewed }, null, 1) + "\n")
fs.writeFileSync(file.replace(/\.json$/, ".passed.json"), JSON.stringify(batch.items.filter((p) => passedIds.has(p.id)), null, 1) + "\n")
console.log(`Đạt ${passedIds.size}/${batch.items.length} bài (phải đạt cả ${runs} lần giải mù).`)
for (const r of reviewed.filter((x) => !x.pass).slice(0, 8)) console.log(`  - ${r.id}: ${[...new Set(r.why)].join("; ")}`)
console.log("Bước tiếp: người duyệt mẫu (đặc biệt số liệu thực tế trong `facts`), rồi tự gộp vào src/content/<reading|listening>/en/bac<N>.json và chạy check:content, test.")
