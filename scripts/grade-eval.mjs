// Đo độ khớp giữa điểm máy chấm (lời nhắc ở src/lib/rubric.ts) và điểm người chấm trên một bộ bài viết mẫu.
//   node scripts/grade-eval.mjs eval/grade-samples.json [--runs 1] [--out tmp/eval]
// Bộ mẫu do CHỦ DỰ ÁN/giáo viên soạn và chấm (khoảng 30 bài, trải đều các bậc; định dạng ở eval/grade-samples.example.json).
// Mỗi lần sửa lời nhắc chấm: chạy lại và so các chỉ số với lần trước (khớp hoàn toàn, lệch ≤1, kappa, độ lệch trung bình) để biết tốt lên hay xấu đi.
// Chỉ gọi Gemini bằng khóa của bạn ở máy bạn. Chưa hỗ trợ bài nói (cần tệp ghi âm).
import fs from "node:fs"
import path from "node:path"
import { callJson, MODEL } from "./lib/gemini-rest.mjs"

const file = process.argv[2]
if (!file || !fs.existsSync(file)) {
  console.error("Cách dùng: node scripts/grade-eval.mjs <tệp mẫu .json> [--runs 1] [--out tmp/eval]\nĐịnh dạng mẫu: eval/grade-samples.example.json")
  process.exit(1)
}
const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`)
  return i >= 0 ? process.argv[i + 1] : fallback
}
const runs = Math.max(1, Math.min(5, Number(arg("runs", "1")) || 1))
const outDir = arg("out", "tmp/eval")

const { buildGradingPrompt, CRITERIA, parseFeedback, GRADING_PROMPT_VERSION, totalFromScores } = await import("../src/lib/rubric.ts")
const { agreement, errors, quadraticKappa, validateSamples } = await import("../src/lib/grading/eval.ts")

const samples = JSON.parse(fs.readFileSync(file, "utf8"))
const keys = CRITERIA.writing.map((c) => c.key)
const problems = validateSamples(samples, keys)
if (problems.length) {
  console.error(`Tệp mẫu chưa hợp lệ:\n- ${problems.slice(0, 10).join("\n- ")}`)
  process.exit(1)
}
if (samples.some((s) => s.example) && !process.argv.includes("--allow-example")) {
  console.error('Tệp chứa mẫu minh họa ("example": true), điểm KHÔNG phải do người chấm. Thay bằng bài thật hoặc thêm --allow-example để chạy thử luồng.')
  process.exit(1)
}

const clean = (s) => s.replace(/[<>]/g, "")
const rows = []
for (const s of samples) {
  for (let r = 0; r < runs; r++) {
    const prompt = buildGradingPrompt("writing", clean(s.task), s.targetBac, "").split("__ANSWER__").join(clean(s.text))
    let fb = null
    try {
      fb = parseFeedback(await callJson(prompt, { temperature: 0.2 }), "writing", null)
    } catch (e) {
      console.error(`${s.id}: lỗi gọi mô hình (${e.message})`)
    }
    if (fb) rows.push({ id: s.id, run: r + 1, machine: fb, human: s.human })
  }
}
if (!rows.length) {
  console.error("Không chấm được bài nào.")
  process.exit(1)
}

const pairsOf = (f) => rows.map((r) => f(r))
console.log(`\nBộ mẫu: ${samples.length} bài × ${runs} lần = ${rows.length} kết quả · mô hình ${MODEL} · lời nhắc ${GRADING_PROMPT_VERSION}`)
const pct = (x) => `${Math.round(x * 100)}%`
console.log("Tiêu chí | khớp hoàn toàn | lệch ≤1 | độ lệch TB (máy − người) | kappa")
const per = {}
for (const k of keys) {
  const pairs = pairsOf((r) => ({ human: r.human.scores[k], machine: r.machine.scores[k] }))
  const a = agreement(pairs)
  const e = errors(pairs)
  const kappa = quadraticKappa(pairs, 0, 4)
  per[k] = { ...a, ...e, kappa }
  console.log(`${k} | ${pct(a.exact)} | ${pct(a.within)} | ${e.bias >= 0 ? "+" : ""}${e.bias.toFixed(2)} | ${kappa === null ? "—" : kappa.toFixed(2)}`)
}
const totalPairs = pairsOf((r) => ({ human: totalFromScores(r.human.scores, "writing"), machine: r.machine.total }))
const ta = agreement(totalPairs, 1)
console.log(`Tổng /10 | khớp ≤1 điểm: ${pct(ta.within)} | độ lệch TB ${errors(totalPairs).bias >= 0 ? "+" : ""}${errors(totalPairs).bias.toFixed(2)} | sai số TB ${errors(totalPairs).mae.toFixed(2)}`)
const bacPairs = pairsOf((r) => ({ human: r.human.bac, machine: r.machine.estimatedBac }))
const ba = agreement(bacPairs, 1)
console.log(`Bậc ước lượng | khớp hoàn toàn ${pct(ba.exact)} | lệch ≤1 bậc ${pct(ba.within)} | độ lệch TB ${errors(bacPairs).bias >= 0 ? "+" : ""}${errors(bacPairs).bias.toFixed(2)} | kappa ${quadraticKappa(bacPairs, 0, 6)?.toFixed(2) ?? "—"}`)

fs.mkdirSync(outDir, { recursive: true })
const out = path.join(outDir, `grade-eval-${new Date().toISOString().replace(/[:.]/g, "-")}.json`)
fs.writeFileSync(out, JSON.stringify({ promptVersion: GRADING_PROMPT_VERSION, model: MODEL, runs, createdAt: new Date().toISOString(), perCriterion: per, rows: rows.map((r) => ({ id: r.id, run: r.run, human: r.human, machine: { scores: r.machine.scores, total: r.machine.total, estimatedBac: r.machine.estimatedBac } })) }, null, 1) + "\n")
console.log(`\nĐã ghi ${out}`)
