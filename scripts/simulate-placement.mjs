// Mô phỏng bài xếp trình độ tổng hợp với "học sinh giả" có năng lực thật đã biết, để xem bài đo có ra bậc gần đúng không
// và chỉnh các con số khởi điểm (ROUND_UP_FROM, PLACEMENT_STEPS, MIN_CORRECT_FOR_BAC...) trước khi có dữ liệu thật.
//   node scripts/simulate-placement.mjs [số lần mô phỏng mỗi mức năng lực, mặc định 300]
// Dùng đúng các hàm thuần của ứng dụng (chọn thang câu, chọn bài, MAP, chấm). Học sinh giả trả lời theo mô hình xác suất của chính
// ứng dụng (có sàn đoán mò 25%), nên kết quả chỉ nói về độ ổn định của THUẬT TOÁN, không chứng minh độ đúng với học sinh thật.
import { expectedCorrect, itemRating } from "../src/lib/progress/ability.ts"
import { nextPosition, pickAtPosition } from "../src/lib/content/adaptive.ts"
import { initialState, ladderFor, passageAnswers, pickPassageId, PLAN, PLACEMENT_STEPS, scoreSession } from "../src/lib/placement/full.ts"

const RUNS = Number(process.argv[2]) || 300
let seed = 12345
const rng = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32)

// Ngân hàng giả theo đúng quy mô thật: mỗi bậc 10 câu ngữ pháp (độ khó ±1 mức), 40 từ, 3 bài đọc, 3 bài nghe.
const gram = []
const vocab = []
for (let bac = 1; bac <= 6; bac++) {
  for (let i = 0; i < 10; i++) gram.push({ id: `g${bac}-${i}`, rating: itemRating(bac, 1 + (i % 3)) })
  for (let i = 0; i < 40; i++) vocab.push({ id: `v${bac}-${i}`, rating: itemRating(bac) })
}
const reading = [1, 2, 3, 4, 5, 6].flatMap((bac) => [0, 1, 2].map((i) => ({ id: `r${bac}-${i}`, bac })))
const listening = [1, 2, 3, 4, 5, 6].flatMap((bac) => [0, 1, 2].map((i) => ({ id: `l${bac}-${i}`, bac })))

function runOne(theta) {
  let s = initialState()
  const seen = new Set()
  const wrong = new Set()
  for (const block of PLAN) {
    if (block.kind === "items") {
      const pool = block.skill === "grammar" ? gram : vocab
      const { ladder, start } = ladderFor(pool, s, block.skill, seen, wrong, block.n)
      const exercises = ladder.map((l) => ({ id: l.id, rating: l.rating }))
      let pos = start
      let first = pickAtPosition(exercises, new Set(), pos, rng)
      const used = new Set()
      const answers = []
      for (let i = 0; i < Math.min(block.n, exercises.length); i++) {
        const ex = i === 0 ? first : pickAtPosition(exercises, used, pos, rng)
        if (!ex) break
        used.add(ex.id)
        const correct = rng() < expectedCorrect(theta, ex.rating)
        answers.push({ id: ex.id, skill: block.skill, rating: ex.rating, correct })
        pos = nextPosition(pos, correct, PLACEMENT_STEPS)
      }
      s = { ...s, block: s.block + 1, answers: [...s.answers, ...answers], used: [...s.used, ...answers.map((a) => a.id)] }
    } else {
      const pool = block.skill === "reading" ? reading : listening
      const id = pickPassageId(pool, s, block.skill, seen, wrong, rng)
      if (!id) {
        s = { ...s, block: s.block + 1 }
        continue
      }
      const bac = pool.find((p) => p.id === id).bac
      const correct = Array.from({ length: block.n }, () => rng() < expectedCorrect(theta, itemRating(bac, 2))).filter(Boolean).length
      s = { ...s, block: s.block + 1, answers: [...s.answers, ...passageAnswers(id, block.skill, bac, correct, block.n)], used: [...s.used, id] }
    }
  }
  return scoreSession(s)
}

console.log(`Mô phỏng ${RUNS} lần mỗi mức năng lực thật (Bậc thật = (θ−1000)/200+1; bậc tổng báo ra là số nguyên, lấy bậc dưới khi chưa rõ)\n`)
console.log("Bậc thật | tổng: trung bình | đúng bậc nguyên | lệch ≤1 | thấp hơn thật | cao hơn thật | từng kỹ năng (trung bình)")
for (let trueBac = 1; trueBac <= 6; trueBac += 0.5) {
  const theta = 1000 + (trueBac - 1) * 200
  const target = Math.floor(trueBac)
  const res = Array.from({ length: RUNS }, () => runOne(theta))
  const overall = res.map((r) => r.overall.bac)
  const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length
  const pct = (f) => `${Math.round((overall.filter(f).length / RUNS) * 100)}%`
  const per = ["grammar", "vocab", "reading", "listening"].map((k) => `${k[0].toUpperCase()}${mean(res.map((r) => r.skills[k].bac)).toFixed(1)}`).join(" ")
  console.log(`${trueBac.toFixed(1)} | ${mean(overall).toFixed(2)} | ${pct((b) => b === target)} | ${pct((b) => Math.abs(b - trueBac) <= 1)} | ${pct((b) => b < target)} | ${pct((b) => b > Math.ceil(trueBac))} | ${per}`)
}
