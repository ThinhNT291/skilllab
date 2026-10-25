// Gom toàn bộ nội dung học tập trong src/content thành danh sách "mục" phẳng (mỗi mục một dòng trong bảng content_items).
// Dùng chung cho content-sync.mjs và bài kiểm tra. Không phụ thuộc Supabase.
import fs from "node:fs"
import path from "node:path"
import crypto from "node:crypto"

const read = (f) => JSON.parse(fs.readFileSync(f, "utf8"))
const files = (dir) => (fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort() : [])

/** JSON ổn định (khóa theo thứ tự chữ cái) để băm cho cùng nội dung ra cùng mã. */
export function stableStringify(v) {
  if (Array.isArray(v)) return `[${v.map(stableStringify).join(",")}]`
  if (v && typeof v === "object") return `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${stableStringify(v[k])}`).join(",")}}`
  return JSON.stringify(v)
}
export const hashOf = (data) => crypto.createHash("sha256").update(stableStringify(data)).digest("hex").slice(0, 16)

/**
 * @returns {{id:string, collection:string, language_code:string, topic:string|null, bac:number|null, sort:number, data:any, content_hash:string}[]}
 */
export function collectItems(root = "src/content") {
  const out = []
  const add = (id, collection, language_code, topic, bac, sort, data) => out.push({ id, collection, language_code, topic, bac: bac ?? null, sort, data, content_hash: hashOf(data) })

  for (const lang of ["en"]) {
    const exDir = path.join(root, "exercises", lang)
    for (const f of files(exDir)) {
      read(path.join(exDir, f)).forEach((ex, i) => add(ex.id, "exercise", lang, ex.topic ?? f.replace(/\.json$/, ""), ex.bac, i, ex))
    }
    const thDir = path.join(root, "grammar", lang)
    for (const f of files(thDir)) {
      const d = read(path.join(thDir, f))
      if (f === "index.json") add(`theory-index:${lang}`, "theory_index", lang, null, null, 0, d)
      else add(`theory:${lang}:${d.id}`, "theory", lang, d.id, null, d.order ?? 0, d)
    }
    for (const kind of ["reading", "listening"]) {
      const dir = path.join(root, kind, lang)
      for (const f of files(dir)) read(path.join(dir, f)).forEach((p, i) => add(p.id, kind, lang, `${kind}-b${p.bac}`, p.bac, i, p))
    }
    const vDir = path.join(root, "vocab", lang)
    for (const f of files(vDir)) {
      const level = f.replace(/\.json$/, "")
      read(path.join(vDir, f)).forEach((w, i) => add(w.id, "vocab", lang, `vocab-${level}`, null, i, w))
    }
    const colloc = path.join(root, "collocations", lang, "sets.json")
    if (fs.existsSync(colloc)) read(colloc).forEach((s, i) => add(s.id, "collocation", lang, s.id, s.bac, i, s))
  }
  const topics = path.join(root, "vocab", "topics.json")
  if (fs.existsSync(topics)) add("vocab-topics:en", "vocab_topics", "en", null, null, 0, read(topics))
  return out
}

export function summarize(items) {
  const by = {}
  for (const it of items) by[it.collection] = (by[it.collection] ?? 0) + 1
  return by
}
