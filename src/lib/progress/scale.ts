/**
 * Tiến độ theo thang trình độ: với mỗi kỹ năng và mỗi Bậc (1–6 ↔ A1–C2), đã "phủ" được bao nhiêu phần nội dung hiện có. Hàm thuần.
 * Khác với bậc ước lượng (ability.ts, đo năng lực): đây đo MỨC BAO PHỦ nội dung, nên bậc nào chưa có nội dung thì báo thẳng "chưa có".
 *  - Ngữ pháp: một câu (mã gốc) được tính khi lần trả lời gần nhất đúng; bậc lấy từ meta câu.
 *  - Từ vựng: một từ được tính khi lần gần nhất đúng ở bất kỳ dạng câu nào; bậc theo cấp (a1…b2).
 *  - Đọc/Nghe: một bài được tính khi có ít nhất 3 câu của bài (lần gần nhất) đúng; bậc theo mã chuyên đề.
 * Chỉ để học sinh thấy mình đi đến đâu, không phải xếp loại.
 */
import type { ItemMeta } from "./ability.ts"

export type ScaleSkill = "grammar" | "vocab" | "reading" | "listening"
export const SCALE_SKILLS: ScaleSkill[] = ["grammar", "vocab", "reading", "listening"]
export const SCALE_BACS = [1, 2, 3, 4, 5, 6] as const
export const PASSAGE_MIN_CORRECT = 3

/** Tổng số đơn vị nội dung theo kỹ năng và Bậc (đơn vị: câu ngữ pháp, từ vựng, bài đọc, bài nghe). */
export type Totals = Record<ScaleSkill, Record<number, number>>

export interface ScaleAnswer {
  exerciseId: string
  topic: string
  correct: boolean
  created_at: string
}

export interface BacProgress {
  bac: number
  total: number
  covered: number
  /** 0–1; null khi chưa có nội dung ở bậc này */
  ratio: number | null
}

const VOCAB_BAC: Record<string, number> = { "vocab-a1": 1, "vocab-a2": 2, "vocab-b1": 3, "vocab-b2": 4 }

/** Tổng đơn vị ngữ pháp theo Bậc, đếm từ meta câu. */
export function grammarTotals(meta: ItemMeta): Record<number, number> {
  const out: Record<number, number> = {}
  for (const [, [bac]] of Object.entries(meta)) out[bac] = (out[bac] ?? 0) + 1
  return out
}

function unitOf(a: ScaleAnswer): { skill: ScaleSkill; bacKey: number | null; unit: string } | null {
  const t = a.topic
  if (t.startsWith("vocab-")) return { skill: "vocab", bacKey: VOCAB_BAC[t] ?? null, unit: a.exerciseId.replace(/^vq-[a-z]-/, "") }
  if (t.startsWith("reading-b") || t.startsWith("listening-b")) {
    const m = /^(?:rq|lq)-(.+)-\d+$/.exec(a.exerciseId)
    const bac = Number(t.slice(-1))
    return m && bac >= 1 ? { skill: t.startsWith("reading") ? "reading" : "listening", bacKey: bac, unit: m[1] } : null
  }
  if (t.startsWith("colloc-")) return null
  return { skill: "grammar", bacKey: null, unit: a.exerciseId.split("~")[0] }
}

export function computeScale(answers: ScaleAnswer[], meta: ItemMeta, totals: Totals): Record<ScaleSkill, BacProgress[]> {
  // Lần trả lời gần nhất: theo đơn vị với ngữ pháp/từ vựng (mọi dạng câu của cùng một mục tính chung), theo từng câu với bài đọc/nghe.
  const latest = new Map<string, ScaleAnswer>()
  for (const a of [...answers].sort((x, y) => (x.created_at < y.created_at ? -1 : 1))) {
    const u = unitOf(a)
    if (u) latest.set(u.skill === "reading" || u.skill === "listening" ? a.exerciseId : `${u.skill}|${u.unit}`, a)
  }

  const covered: Record<ScaleSkill, Record<number, Set<string>>> = { grammar: {}, vocab: {}, reading: {}, listening: {} }
  const passageCorrect = new Map<string, number>() // `${skill}|${bac}|${passage}` → số câu đúng
  const add = (skill: ScaleSkill, bac: number, unit: string) => ((covered[skill][bac] ??= new Set()).add(unit))

  for (const a of latest.values()) {
    const u = unitOf(a)
    if (!u || !a.correct) continue
    if (u.skill === "grammar") {
      const bac = meta[u.unit]?.[0]
      if (bac) add("grammar", bac, u.unit)
    } else if (u.skill === "vocab") {
      if (u.bacKey) add("vocab", u.bacKey, u.unit)
    } else if (u.bacKey) {
      const key = `${u.skill}|${u.bacKey}|${u.unit}`
      const n = (passageCorrect.get(key) ?? 0) + 1
      passageCorrect.set(key, n)
      if (n >= PASSAGE_MIN_CORRECT) add(u.skill, u.bacKey, u.unit)
    }
  }

  const out = {} as Record<ScaleSkill, BacProgress[]>
  for (const skill of SCALE_SKILLS) {
    out[skill] = SCALE_BACS.map((bac) => {
      const total = totals[skill][bac] ?? 0
      const c = Math.min(total, covered[skill][bac]?.size ?? 0)
      return { bac, total, covered: c, ratio: total > 0 ? c / total : null }
    })
  }
  return out
}

/** Bậc đang học: bậc thấp nhất có nội dung mà chưa phủ được 70%; null nếu đã phủ hết mọi bậc có nội dung. */
export function currentBac(rows: BacProgress[], threshold = 0.7): number | null {
  return rows.find((r) => r.ratio !== null && r.ratio < threshold)?.bac ?? null
}
