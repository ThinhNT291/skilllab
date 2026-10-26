// Sinh câu ngữ pháp trắc nghiệm bằng Gemini theo khuôn ở docs/prompt-sinh-noi-dung.md (mục 3–4). KHÔNG ghi vào src/content.
//   node scripts/gen-items.mjs --topic present-simple --bac 3 [--n 10] [--difficulty "3 easy / 4 medium / 3 hard"] [--out tmp/gen]
// Kết quả ghi ở tmp/gen/<chuyên đề>-bac<N>-<thời gian>.json (đã kiểm bằng mã, loại câu trùng, rải đều vị trí đáp án, gắn mã câu).
// Bước tiếp: node scripts/review-items.mjs <tệp>  (giải mù) → người duyệt mẫu → tự gộp vào src/content/exercises/en/<chuyên đề>.json
// rồi node scripts/build-item-meta.mjs, npm run check:content, npm test (xem CLAUDE.md "Quy trình nội dung").
import fs from "node:fs"
import path from "node:path"
import { callJson, MODEL } from "./lib/gemini-rest.mjs"

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`)
  return i >= 0 ? process.argv[i + 1] : fallback
}
const topic = arg("topic")
const bac = Number(arg("bac"))
const n = Number(arg("n", "10"))
const outDir = arg("out", "tmp/gen")
if (!topic || !(bac >= 1 && bac <= 6) || !(n >= 1 && n <= 20)) {
  console.error('Cách dùng: node scripts/gen-items.mjs --topic <mã chuyên đề> --bac <1-6> [--n 10] [--difficulty "…"] [--out tmp/gen]')
  process.exit(1)
}
if (!/^[a-z0-9-]+$/.test(topic)) {
  console.error("Mã chuyên đề chỉ gồm chữ thường, số và gạch ngang.")
  process.exit(1)
}

const { buildGenerationPrompt, GRAMMAR_ITEMS_PROMPT_VERSION } = await import("../src/lib/ai/prompts/grammar-items.ts")
const { balancedPositions, dropDuplicates, nextIds, toExercise, validateRawItem } = await import("../src/lib/content/item-gen.ts")

const theory = JSON.parse(fs.readFileSync(`src/content/grammar/en/${topic}.json`, "utf8"))
const exFile = `src/content/exercises/en/${topic}.json`
const existing = fs.existsSync(exFile) ? JSON.parse(fs.readFileSync(exFile, "utf8")) : []
const usages = theory.theory.usages.map((u) => ({ id: u.id, label: u.label, explanationVi: u.explanationVi, examples: u.examples ?? [] }))
const mistakes = (theory.theory.commonMistakes ?? []).map((m) => (typeof m === "string" ? m : `${m.description} (sai: ${m.examples?.[0]?.wrong ?? ""} → đúng: ${m.examples?.[0]?.correct ?? ""})`))
const CEFR = ["", "A1", "A2", "B1", "B2", "C1", "C2"]
const plan = arg("difficulty", `${Math.round(n * 0.3)} easy / ${Math.round(n * 0.4)} medium / ${n - Math.round(n * 0.3) - Math.round(n * 0.4)} hard`)

const prompt = buildGenerationPrompt({ topicTitle: theory.title, bac, cefr: CEFR[bac], usages, commonMistakes: mistakes, existingPrompts: existing.map((e) => e.prompt), count: n, difficultyPlan: plan })
console.log(`Sinh ${n} câu · ${topic} · Bậc ${bac} (${CEFR[bac]}) · mô hình ${MODEL} · lời nhắc ${GRAMMAR_ITEMS_PROMPT_VERSION}`)
const out = await callJson(prompt, { temperature: 0.7 })
const raw = Array.isArray(out?.items) ? out.items : []

const allowed = new Set(usages.map((u) => u.id))
const valid = []
const rejected = []
for (const r of raw) {
  const v = validateRawItem(r, allowed)
  if (v.ok) valid.push({ ...v.item, distractorTypes: r.distractorTypes })
  else rejected.push({ reasons: v.reasons, raw: r })
}
const { kept, dropped } = dropDuplicates(valid, existing.map((e) => e.prompt))
const positions = balancedPositions(kept.length)
const ids = nextIds(topic, existing.map((e) => e.id), kept.length)
const items = kept.map((it, i) => toExercise(it, { id: ids[i], topic, position: positions[i], bac }))
const meta = kept.map((it, i) => ({ id: ids[i], intendedBac: it.intendedBac, difficultyHint: it.difficultyHint, distractorTypes: it.distractorTypes }))

fs.mkdirSync(outDir, { recursive: true })
const file = path.join(outDir, `${topic}-bac${bac}-${new Date().toISOString().replace(/[:.]/g, "-")}.json`)
fs.writeFileSync(file, JSON.stringify({ promptVersion: GRAMMAR_ITEMS_PROMPT_VERSION, model: MODEL, topic, bac, createdAt: new Date().toISOString(), items, meta, rejected, duplicates: dropped.map((d) => ({ prompt: d.item.prompt, like: d.like })) }, null, 1) + "\n")
console.log(`Nhận ${raw.length}: hợp lệ ${valid.length} (giữ ${items.length} sau khi loại ${dropped.length} câu trùng), bị loại ${rejected.length}.`)
for (const r of rejected.slice(0, 5)) console.log(`  - loại: ${r.reasons.join("; ")}`)
console.log(`Đã ghi ${file}\nBước tiếp: node scripts/review-items.mjs ${file}`)
