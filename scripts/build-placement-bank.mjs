// Chọn tập câu/bài DÀNH RIÊNG cho bài xếp trình độ tổng hợp và ghi src/content/placement/reserved.json.
//   node scripts/build-placement-bank.mjs          (ghi tệp)
//   node scripts/build-placement-bank.mjs --check  (chỉ kiểm tệp hiện có còn khớp nội dung; thoát mã 1 nếu lệch)
// Tập này bị LOẠI khỏi mọi bài luyện (getExercises, getVocab, getReadingPassages, getListeningItems), để học sinh không gặp câu xếp trình độ
// khi luyện. Chọn xác định theo băm của mã (cùng nội dung → cùng kết quả), rải đều chuyên đề. Chạy lại khi thêm/bớt nội dung rồi xem
// `git diff`: đổi tập dành riêng nghĩa là câu đã làm trong bài xếp trình độ cũ có thể quay lại luyện tập.
import fs from "node:fs"
import path from "node:path"

const OUT = "src/content/placement/reserved.json"
const SALT = "placement-v1"
const PER_BAC = { grammar: 10, reading: 3, listening: 3 }
const VOCAB_PER_LEVEL = 40

const read = (f) => JSON.parse(fs.readFileSync(f, "utf8"))
const files = (dir) => fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort()

function fnv(str) {
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h
}
const hashOf = (id) => fnv(`${id}|${SALT}`)

/** Lấy `n` mục theo băm, luân phiên giữa các nhóm (vd chuyên đề) để rải đều. */
function spread(items, groupOf, n) {
  const groups = new Map()
  for (const it of [...items].sort((a, b) => hashOf(a.id) - hashOf(b.id))) {
    const g = groupOf(it)
    groups.set(g, [...(groups.get(g) ?? []), it])
  }
  const order = [...groups.keys()].sort((a, b) => hashOf(a) - hashOf(b))
  const out = []
  for (let round = 0; out.length < n; round++) {
    let any = false
    for (const g of order) {
      const it = groups.get(g)[round]
      if (it && out.length < n) {
        out.push(it)
        any = true
      }
    }
    if (!any) break
  }
  return out.map((x) => x.id).sort()
}

export function buildReserved(root = "src/content") {
  const reserved = { version: 1, salt: SALT, grammar: [], vocab: {}, reading: [], listening: [] }

  const exDir = path.join(root, "exercises/en")
  const all = files(exDir).flatMap((f) => read(path.join(exDir, f)))
  for (let bac = 1; bac <= 6; bac++) {
    const cands = all.filter((e) => e.bac === bac && (e.kind ?? "mcq") === "mcq" && Array.isArray(e.choices))
    reserved.grammar.push(...spread(cands, (e) => e.topic, PER_BAC.grammar))
  }
  reserved.grammar.sort()

  for (const level of ["a1", "a2", "b1", "b2", "c1", "c2"]) {
    const words = read(path.join(root, "vocab/en", `${level}.json`)).filter((w) => Array.isArray(w.ex) && w.ex.length > 0)
    reserved.vocab[level] = spread(words, (w) => w.pos, VOCAB_PER_LEVEL)
  }

  for (const kind of ["reading", "listening"]) {
    for (let bac = 1; bac <= 6; bac++) {
      const f = path.join(root, kind, "en", `bac${bac}.json`)
      if (!fs.existsSync(f)) continue
      reserved[kind].push(...spread(read(f), () => "x", PER_BAC[kind]))
    }
    reserved[kind].sort()
  }
  return reserved
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const next = buildReserved()
  const text = JSON.stringify(next, null, 1) + "\n"
  if (process.argv.includes("--check")) {
    const same = fs.existsSync(OUT) && fs.readFileSync(OUT, "utf8") === text
    console.log(same ? "reserved.json khớp nội dung hiện có." : "reserved.json LỆCH so với nội dung hiện có: chạy node scripts/build-placement-bank.mjs")
    process.exit(same ? 0 : 1)
  }
  fs.mkdirSync(path.dirname(OUT), { recursive: true })
  fs.writeFileSync(OUT, text)
  const v = Object.values(next.vocab).reduce((n, a) => n + a.length, 0)
  console.log(`Đã ghi ${OUT}: ngữ pháp ${next.grammar.length}, từ vựng ${v}, đọc ${next.reading.length}, nghe ${next.listening.length}`)
}
