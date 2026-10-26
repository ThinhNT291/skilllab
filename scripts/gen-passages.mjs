// Sinh bài ĐỌC hoặc NGHE (4 câu hỏi mỗi bài) bằng Gemini theo khuôn ở docs/prompt-sinh-noi-dung.md mục 10.4. KHÔNG ghi vào src/content.
//   node scripts/gen-passages.mjs --kind reading|listening --bac 3 [--n 3] [--out tmp/gen]
// Mỗi bài một lần gọi (lô nhỏ giữ chất lượng và tránh lỗi JSON). Mã kiểm tra: độ dài theo bậc, nhãn người nói (bài nghe), bằng chứng trích từ bài
// có thật, đáp án đúng diễn đạt lại, giải thích từng đáp án; đo từ vựng vượt bậc bằng CEFR-J + Octanove (cảnh báo, không tự loại).
// Ghi tmp/gen/<đọc|nghe>-bac<N>-<thời gian>.json. Bước tiếp: node scripts/review-passages.mjs <tệp> → người duyệt → tự gộp vào
// src/content/<reading|listening>/en/bac<N>.json, rồi node scripts/build-item-meta.mjs (không cần với đọc/nghe), npm run check:content, npm test.
import fs from "node:fs"
import path from "node:path"
import { callJson, MODEL } from "./lib/gemini-rest.mjs"
import { loadLevelIndex } from "./lib/level-index.mjs"

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`)
  return i >= 0 ? process.argv[i + 1] : fallback
}
const kind = arg("kind")
const bac = Number(arg("bac"))
const n = Number(arg("n", "3"))
const outDir = arg("out", "tmp/gen")
if (!["reading", "listening"].includes(kind) || !(bac >= 1 && bac <= 6) || !(n >= 1 && n <= 10)) {
  console.error("Cách dùng: node scripts/gen-passages.mjs --kind reading|listening --bac <1-6> [--n 3] [--out tmp/gen]")
  process.exit(1)
}

const { buildPassagePrompt, GRAMMAR_BY_BAC, PASSAGE_PROMPT_VERSION } = await import("../src/lib/ai/prompts/passages.ts")
const { nextPassageIds, toPassageJsons, validateRawPassage } = await import("../src/lib/content/passage-gen.ts")
const { analyzeText, flagsFor, LENGTH_RANGE } = await import("../src/lib/content/text-level.ts")
const index = await loadLevelIndex()

const file = `src/content/${kind}/en/bac${bac}.json`
const existing = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : []
const CEFR = ["", "A1", "A2", "B1", "B2", "C1", "C2"]
const GENRES = {
  reading: ["narrative story", "diary or blog post", "informational article", "email or letter", "notice or advertisement", "dialogue"],
  listening: ["dialogue between two people", "announcement", "voice message", "short personal story told by one person", "interview", "phone call"],
}
const TOPICS = ["a school trip", "a new pet", "a family dinner", "a sports day", "a rainy weekend", "a school project", "a birthday surprise", "learning to cook", "a trip to the zoo", "helping a neighbor", "a lost phone", "a music club", "a science fair", "a camping weekend", "a library visit", "a school garden", "a video game tournament", "recycling at school", "a part-time job idea", "a class election"]
const used = existing.map((p) => p.title)
const [lo, hi] = LENGTH_RANGE[kind][bac]
const g = GRAMMAR_BY_BAC[bac]
const mixes = ["1 detail, 1 main_idea, 1 inference, 1 tfng", "2 detail, 1 inference, 1 vocab", "1 detail, 1 main_idea, 1 attitude, 1 tfng", "1 detail, 1 inference, 1 vocab, 1 tfng"]

console.log(`Sinh ${n} bài ${kind} Bậc ${bac} (${CEFR[bac]}) · mô hình ${MODEL} · lời nhắc ${PASSAGE_PROMPT_VERSION}`)
const valid = []
const rejected = []
for (let i = 0; i < n; i++) {
  const topic = TOPICS[(Math.floor(Math.random() * TOPICS.length) + i * 7) % TOPICS.length]
  const prompt = buildPassagePrompt({
    kind,
    bac,
    cefr: CEFR[bac],
    genre: GENRES[kind][(i + bac) % GENRES[kind].length],
    topic,
    minWords: lo,
    maxWords: hi,
    avgSentence: g.avgSentence,
    allowedGrammar: g.allowed,
    forbiddenGrammar: g.forbidden,
    usedTopics: used,
    questionMix: mixes[i % mixes.length],
  })
  let raw
  try {
    raw = await callJson(prompt, { temperature: 0.8 })
  } catch (e) {
    rejected.push({ reasons: [`lỗi gọi mô hình: ${e.message}`], raw: null })
    continue
  }
  const v = validateRawPassage(raw, kind, bac)
  if (!v.ok) {
    rejected.push({ reasons: v.reasons, raw })
    continue
  }
  const report = analyzeText(v.passage.text, index, bac)
  valid.push({ passage: v.passage, level: { words: report.words, avgSentence: Number(report.avgSentence.toFixed(1)), aboveRatio: Number(report.aboveRatio.toFixed(3)), above: report.above.slice(0, 8), flags: flagsFor(kind, bac, report) }, topic })
  used.push(v.passage.title)
}

const ids = nextPassageIds(kind, bac, existing.map((p) => p.id), valid.length)
const items = toPassageJsons(valid.map((v) => v.passage), kind, bac, ids)
const meta = valid.map((v, i) => ({ id: ids[i], topic: v.topic, genre: v.passage.genre, facts: v.passage.facts, evidence: v.passage.questions.map((q) => q.evidence), types: v.passage.questions.map((q) => q.type), level: v.level }))
fs.mkdirSync(outDir, { recursive: true })
const out = path.join(outDir, `${kind}-bac${bac}-${new Date().toISOString().replace(/[:.]/g, "-")}.json`)
fs.writeFileSync(out, JSON.stringify({ promptVersion: PASSAGE_PROMPT_VERSION, model: MODEL, kind, bac, createdAt: new Date().toISOString(), items, meta, rejected }, null, 1) + "\n")
console.log(`Hợp lệ ${items.length}/${n}, bị loại ${rejected.length}.`)
for (const r of rejected.slice(0, 5)) console.log(`  - loại: ${r.reasons.slice(0, 3).join("; ")}`)
for (const m of meta) if (m.level.flags.length) console.log(`  - cảnh báo ${m.id}: ${m.level.flags.map((f) => `${f.kind} (${f.detail})`).join("; ")}${m.level.above.length ? ` · từ vượt bậc: ${m.level.above.map((a) => `${a.word}(B${a.bac})`).join(", ")}` : ""}`)
console.log(`Đã ghi ${out}\nBước tiếp: node scripts/review-passages.mjs ${out}`)
