/**
 * Bậc hiển thị cho người học: MỘT nơi duy nhất đổi ước lượng năng lực (Elo, `ability.ts`) thành Bậc kèm CEFR.
 * Placement, gợi ý bậc ở các trang kỹ năng, hồ sơ năng lực đều dùng chung, không có công thức bậc riêng.
 * Chỉ là ước lượng tham khảo của máy, không phải kết quả thi (docs/lo-trinh-va-xep-bac.md mục 3).
 * Hàm thuần.
 */
import { levelLabel } from "../content/bac.ts"
import { bacFromRating, bacOfItemRating, estimateAbility, estimateThetaMAP, itemOfAnswer, type Ability, type AbilitySkill, type AnswerForAbility, type Confidence, type ItemMeta, type PlacementRow } from "./ability.ts"
import { skillOfTopic as skillOfAnswerTopic } from "./profile.ts"

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

/** Cần ít nhất bấy nhiêu câu ĐÚNG ở câu có độ khó từ bậc b trở lên thì mới công nhận bậc b (tránh bậc cao nhờ may mắn). */
export const MIN_CORRECT_FOR_BAC = 2
/** Từ ngần này câu trở lên mới coi là "tương đối chắc"; ít hơn thì ghi "chưa chắc". */
export const PLACEMENT_MID_CONFIDENCE_N = 12

/**
 * Muốn được bậc kế tiếp thì ước lượng phải đi được ít nhất bấy nhiêu phần của khoảng giữa hai bậc (0,6 = sáu phần mười).
 * Nằm giữa hai bậc (chưa rõ) thì lấy bậc dưới, theo quyết định của chủ dự án. Giá trị khởi điểm, xem lại khi có dữ liệu thật.
 */
export const ROUND_UP_FROM = 0.6

/**
 * Bậc từ các dòng đã chấm của bài xếp trình độ: ước lượng MAP, rồi **lấy bậc dưới** khi chưa rõ (`ROUND_UP_FROM`),
 * và không vượt quá bậc cao nhất có đủ bằng chứng (`MIN_CORRECT_FOR_BAC` câu đúng ở độ khó từ bậc đó trở lên).
 */
/** Bậc số thực → bậc nguyên theo quy tắc "chưa rõ thì lấy bậc dưới" (`ROUND_UP_FROM`). */
export function roundBac(real: number): number {
  return Math.min(6, Math.max(0, Math.floor(real + (1 - ROUND_UP_FROM))))
}

export function levelFromRows(rows: PlacementRow[]): Level {
  const theta = estimateThetaMAP(rows)
  let bac = roundBac(bacFromRating(theta))
  while (bac > 1 && rows.filter((r) => r.correct && bacOfItemRating(r.rating) >= bac).length < MIN_CORRECT_FOR_BAC) bac--
  const confidence: Confidence = rows.length >= PLACEMENT_MID_CONFIDENCE_N ? "mid" : "low"
  return { bac, label: levelLabel(bac), confidence, n: rows.length }
}

/** Bậc sau bài xếp trình độ một kỹ năng, từ các câu của bài đó (cùng mô hình xác suất với Elo). Null nếu quá ít câu. */
export function placementLevel(answers: AnswerForAbility[], meta: ItemMeta, skill: AbilitySkill): Level | null {
  const rows = answers.flatMap((a) => {
    if (skillOfAnswerTopic(a.topic) !== skill) return []
    const rating = itemOfAnswer(a, meta)
    return rating === null ? [] : [{ rating, correct: a.correct }]
  })
  return rows.length >= MIN_ANSWERS_FOR_HINT ? levelFromRows(rows) : null
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
