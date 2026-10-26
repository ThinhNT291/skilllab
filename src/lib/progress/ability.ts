/**
 * Ước lượng trình độ liên tục từ lịch sử trả lời (kiểu Elo có xác suất đoán mò), tính lại từ bảng `answers`, không lưu thêm gì.
 * Mỗi câu có "độ khó" b theo bậc (và mức khó trong chuyên đề); mỗi kỹ năng có một mức năng lực θ. Trả lời đúng câu khó hơn dự đoán
 * thì θ tăng nhiều, sai câu dễ thì giảm nhiều. Chỉ là ƯỚC LƯỢNG THAM KHẢO của máy, không phải kết quả thi và không quy ra điểm chứng chỉ.
 * Hàm thuần.
 */
import { skillOfTopic } from "./profile.ts"

export type AbilitySkill = "grammar" | "vocab" | "reading" | "listening"
export const ABILITY_SKILLS: AbilitySkill[] = ["grammar", "vocab", "listening", "reading"]

export const BASE = 1000
export const BAC_STEP = 200
export const DIFF_STEP = 40
/** Học sinh mới bắt đầu ở Bậc 2 (đối tượng của dự án là A2 trở lên). */
export const START_RATING = BASE + BAC_STEP
/** Xác suất đoán đúng ngẫu nhiên của câu 4 đáp án. */
export const GUESS = 0.25
/** Tỷ lệ đúng mục tiêu khi chọn câu: vừa sức, vẫn đủ thử thách (xem docs/hoc-thuat-dong-luc.md). */
export const TARGET_SUCCESS = 0.8

export type ItemMeta = Record<string, [number, number]>

export function itemRating(bac: number, difficulty = 2): number {
  return BASE + (Math.max(1, bac) - 1) * BAC_STEP + (difficulty - 2) * DIFF_STEP
}

export function expectedCorrect(theta: number, itemRatingValue: number): number {
  return GUESS + (1 - GUESS) / (1 + 10 ** ((itemRatingValue - theta) / 400))
}

/** Bậc (số thực) ứng với một mức năng lực, tại câu độ khó trung bình. */
export function bacFromRating(rating: number): number {
  return Math.min(6, Math.max(0, (rating - BASE) / BAC_STEP + 1))
}

/** Độ khó câu mà học sinh có khả năng làm đúng khoảng `TARGET_SUCCESS`. */
export function targetItemRating(theta: number, target = TARGET_SUCCESS): number {
  const logistic = Math.min(0.99, Math.max(0.3, (target - GUESS) / (1 - GUESS)))
  return theta + 400 * Math.log10((1 - logistic) / logistic)
}

export interface AnswerForAbility {
  exerciseId: string
  topic: string
  correct: boolean
  created_at: string
}

const VOCAB_BAC: Record<string, number> = { "vocab-a1": 1, "vocab-a2": 2, "vocab-b1": 3, "vocab-b2": 4, "vocab-c1": 5, "vocab-c2": 6 }

/** Độ khó của một câu đã trả lời; null nếu không xác định (bỏ qua). */
export function itemOfAnswer(a: AnswerForAbility, meta: ItemMeta): number | null {
  const skill = skillOfTopic(a.topic)
  if (skill === "grammar") {
    const m = meta[a.exerciseId.split("~")[0]]
    return m ? itemRating(m[0], m[1]) : null
  }
  if (skill === "vocab") {
    const bac = VOCAB_BAC[a.topic]
    return bac ? itemRating(bac) : null
  }
  const n = Number(a.topic.slice(-1))
  return n >= 1 && n <= 6 ? itemRating(n) : null
}

export function kFactor(n: number): number {
  return n < 15 ? 40 : n < 40 ? 24 : 14
}

export type Confidence = "low" | "mid" | "high"

export interface Ability {
  skill: AbilitySkill
  rating: number
  /** Bậc ước lượng làm tròn (0 = dưới Bậc 1) */
  bac: number
  /** Số câu đã dùng để ước lượng */
  n: number
  confidence: Confidence
}

export interface EstimateOptions {
  /** Nhân hệ số K: >1 cho bài xếp trình độ ngắn, để ước lượng hội tụ nhanh hơn luyện thường. */
  kScale?: number
}

export function estimateAbility(answers: AnswerForAbility[], meta: ItemMeta, skill: AbilitySkill, { kScale = 1 }: EstimateOptions = {}): Ability {
  const mine = answers.filter((a) => skillOfTopic(a.topic) === skill).sort((x, y) => (x.created_at < y.created_at ? -1 : 1)).slice(-400)
  let theta = START_RATING
  let n = 0
  for (const a of mine) {
    const b = itemOfAnswer(a, meta)
    if (b === null) continue
    theta += kScale * kFactor(n) * ((a.correct ? 1 : 0) - expectedCorrect(theta, b))
    n++
  }
  return { skill, rating: Math.round(theta), bac: Math.round(bacFromRating(theta)), n, confidence: n < 12 ? "low" : n < 35 ? "mid" : "high" }
}

export function estimateAll(answers: AnswerForAbility[], meta: ItemMeta): Ability[] {
  return ABILITY_SKILLS.map((s) => estimateAbility(answers, meta, s))
}

/** Vị trí (0 = dễ nhất … 1 = khó nhất) trên một thang câu đã xếp theo độ khó, nơi độ khó gần nhất mức mục tiêu. */
export function startPositionFor(ladderRatings: number[], theta: number): number {
  if (ladderRatings.length < 2) return 0
  const target = targetItemRating(theta)
  let best = 0
  let bestD = Infinity
  ladderRatings.forEach((r, i) => {
    const d = Math.abs(r - target)
    if (d < bestD) {
      bestD = d
      best = i
    }
  })
  return best / (ladderRatings.length - 1)
}

export const CONFIDENCE_LABEL: Record<Confidence, string> = { low: "chưa chắc (cần thêm câu)", mid: "tương đối", high: "khá ổn định" }
