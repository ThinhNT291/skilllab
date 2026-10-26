// Rà độ khó từ vựng và độ dài của bài đọc/nghe so với bậc ghi trên bài, bằng danh sách từ vựng đã có (EVP A1–C2).
//   node scripts/check-text-level.mjs [reading|listening|all] [--all] [--json]
// Chỉ đọc tệp trong src/content, không cần mạng hay khóa. Mặc định chỉ in bài bị đánh dấu; --all in mọi bài; --json xuất JSON.
// Đây là CHỈ BÁO cho người duyệt, không tự sửa gì (xem docs/prompt-sinh-noi-dung.md mục 10.5).
import fs from "node:fs"
import path from "node:path"

const { analyzeText, flagsFor } = await import("../src/lib/content/text-level.ts")
const { loadLevelIndex } = await import("./lib/level-index.mjs")
const args = process.argv.slice(2)
const which = args.find((a) => !a.startsWith("--")) ?? "all"
const showAll = args.includes("--all")
const asJson = args.includes("--json")

// Danh sách cấp độ đầy đủ: CEFR-J (A1–B2) và Octanove (C1–C2), đã có trong reference/.
let index
try {
  index = await loadLevelIndex()
} catch (e) {
  console.error(e.message)
  process.exit(1)
}
console.log(`Danh sách cấp độ: ${index.size} từ khóa (CEFR-J + Octanove)`)

const rows = []
for (const kind of ["reading", "listening"]) {
  if (which !== "all" && which !== kind) continue
  const dir = `src/content/${kind}/en`
  for (const file of fs.readdirSync(dir).filter((f) => /^bac\d\.json$/.test(f)).sort()) {
    for (const item of JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"))) {
      const text = item.text ?? item.transcript ?? ""
      const bac = item.bac ?? Number(file.match(/\d/)[0])
      const r = analyzeText(text, index, bac)
      rows.push({ kind, bac, id: item.id, title: item.title, ...r, flags: flagsFor(kind, bac, r) })
    }
  }
}

if (asJson) {
  console.log(JSON.stringify(rows.map(({ above, unknown, ...r }) => ({ ...r, above: above.slice(0, 8), unknown: unknown.slice(0, 8) })), null, 1))
  process.exit(0)
}

const pct = (x) => `${(x * 100).toFixed(1)}%`
for (const kind of ["reading", "listening"]) {
  const mine = rows.filter((r) => r.kind === kind)
  if (!mine.length) continue
  console.log(`\n== ${kind === "reading" ? "Đọc" : "Nghe"}: ${mine.length} bài`)
  console.log("Bậc | bài | từ (trung vị) | từ/câu | % từ vượt bậc (trung vị) | % không có trong danh sách | bị đánh dấu")
  for (let bac = 1; bac <= 6; bac++) {
    const b = mine.filter((r) => r.bac === bac)
    if (!b.length) continue
    const med = (f) => [...b].map(f).sort((x, y) => x - y)[Math.floor(b.length / 2)]
    console.log(`${bac} | ${b.length} | ${med((r) => r.words)} | ${med((r) => r.avgSentence).toFixed(1)} | ${pct(med((r) => r.aboveRatio))} | ${pct(med((r) => r.unknownRatio))} | ${b.filter((r) => r.flags.length).length}`)
  }
}
const flagged = rows.filter((r) => r.flags.length)
console.log(`\nBài bị đánh dấu: ${flagged.length}/${rows.length}`)
for (const r of showAll ? rows : flagged) {
  console.log(`- [${r.kind} Bậc ${r.bac}] ${r.id} "${r.title}": ${r.words} từ, ${r.avgSentence.toFixed(1)} từ/câu, vượt bậc ${pct(r.aboveRatio)}${r.flags.length ? " → " + r.flags.map((f) => `${f.kind} (${f.detail})`).join("; ") : ""}`)
  if (r.flags.some((f) => f.kind === "above-level")) console.log(`    từ vượt bậc: ${r.above.slice(0, 8).map((a) => `${a.word}(B${a.bac})`).join(", ")}`)
}
console.log("\nLưu ý: danh sách từ chỉ gồm danh/động/tính/trạng từ đơn; tên riêng bỏ qua; đây là chỉ báo cho người duyệt, không phải kết luận.")
