/**
 * Bậc hiển thị cho người học: MỘT nơi duy nhất đổi ước lượng năng lực (Elo, `ability.ts`) thành Bậc kèm CEFR.
 * Placement, gợi ý bậc ở các trang kỹ năng, hồ sơ năng lực đều dùng chung, không có công thức bậc riêng.
 * Chỉ là ước lượng tham khảo của máy, không phải kết quả thi (docs/lo-trinh-va-xep-bac.md mục 3).
 * Hàm thuần.
 */
import { levelLabel } from "../content/bac.ts"
import { estimateAbility, type Ability, type AbilitySkill, type AnswerForAbility, type Confidence, type ItemMeta } from "./ability.ts"

/** Bài xếp trình độ ngắn (12–20 câu): nhân K để hội tụ nhanh hơn luyện thường. Giá trị khởi điểm, xem lại khi có dữ liệu thật. */
export const PLACEMENT_K_SCALE = 2
/** Cần ít nhất bấy nhiêu kỹ năng đủ tin cậy mới tính bậc tổng. */
export const MIN_SKILLS_FOR_OVERALL = 3
/** Số câu tối thiểu để hiện bậc ở gợi ý trang kỹ năng. */
export const MIN_ANSWERS_FOR_HINT = 3

export interface Level {
  /** Bậc nguyên 0–6 (0 = dưới Bậc 1) */
  bac: number
  /** Ví dụ "Bậc 3 (B1)" hoặc "dưới Bậc 1 (Pre-A1)" */
  label: string
  confidence: Confidence
  /** Số câu đã dùng để ước lượng */
  n: number
}

/** Độ tin cậy "thấp" (ít câu) thì chưa dùng để tính bậc tổng hay chọn kỹ năng yếu. */
export const isReliable = (a: Pick<Ability, "confidence">): boolean => a.confidence !== "low"

export function levelOfAbility(a: Ability): Level {
  const bac = Math.min(6, Math.max(0, a.bac))
  return { bac, label: levelLabel(bac), confidence: a.confidence, n: a.n }
}

/** Bậc của một kỹ năng từ các câu đã làm; null nếu quá ít câu. */
export function skillLevel(answers: AnswerForAbility[], meta: ItemMeta, skill: AbilitySkill, minAnswers = MIN_ANSWERS_FOR_HINT): Level | null {
  const a = estimateAbility(answers, meta, skill)
  return a.n >= minAnswers ? levelOfAbility(a) : null
}

/** Bậc sau bài xếp trình độ: cùng công thức Elo, chỉ khác hệ số K. Chỉ truyền các câu của bài xếp trình độ. */
export function placementLevel(answers: AnswerForAbility[], meta: ItemMeta, skill: AbilitySkill): Level | null {
  const a = estimateAbility(answers, meta, skill, { kScale: PLACEMENT_K_SCALE })
  return a.n >= MIN_ANSWERS_FOR_HINT ? levelOfAbility(a) : null
}

export interface OverallLevel {
  bac: number
  label: string
  /** Các kỹ năng được dùng để tính (đủ tin cậy) */
  used: AbilitySkill[]
}

/**
 * Bậc tổng = trung vị bậc của các kỹ năng đủ tin cậy (số chẵn thì lấy trung bình hai kỹ năng ở giữa, làm tròn xuống).
 * Null nếu chưa đủ `MIN_SKILLS_FOR_OVERALL` kỹ năng.
 */
export function overallLevel(abilities: Ability[]): OverallLevel | null {
  const ok = abilities.filter(isReliable)
  if (ok.length < MIN_SKILLS_FOR_OVERALL) return null
  const bacs = ok.map((a) => a.bac).sort((x, y) => x - y)
  const mid = bacs.length / 2
  const median = bacs.length % 2 ? bacs[(bacs.length - 1) / 2] : (bacs[mid - 1] + bacs[mid]) / 2
  const bac = Math.min(6, Math.max(0, Math.floor(median)))
  return { bac, label: levelLabel(bac), used: ok.map((a) => a.skill) }
}
