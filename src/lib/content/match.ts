import { normalize } from "../grading.ts"
import { deriveTyped, shuffle, type Rng } from "./derive.ts"
import type { Exercise, TypedExercise } from "./types.ts"

export const MATCH_PAIRS = 5

export interface MatchPair {
  id: string
  /** Câu còn chỗ trống */
  left: string
  /** Đáp án điền vào chỗ trống */
  right: string
  /** Câu gõ dùng để ghi kết quả và tạo thẻ ôn tập */
  exercise: TypedExercise
}

/**
 * Chọn các cặp "câu có chỗ trống ↔ từ cần điền" cho game ghép cặp. Chỉ lấy câu gõ đáp án có đáp án duy nhất,
 * và đáp án của các cặp phải khác nhau để mỗi từ chỉ có một chỗ đúng theo khóa chấm. Trả mảng rỗng nếu chưa đủ cặp.
 */
export function pickMatchPairs(all: Exercise[], rng: Rng = Math.random, size = MATCH_PAIRS): MatchPair[] {
  const seen = new Set<string>()
  const pairs: MatchPair[] = []
  for (const ex of shuffle(all, rng)) {
    if (ex.kind !== "mcq") continue
    const typed = deriveTyped(ex)
    if (!typed) continue
    const right = ex.choices[ex.correctIndex]
    const key = normalize(right)
    if (seen.has(key)) continue
    seen.add(key)
    pairs.push({ id: typed.id, left: typed.prompt.replace(/\s*\((?:[a-z]+\/)*[a-z]+\)/gi, ""), right, exercise: typed })
    if (pairs.length === size) return pairs
  }
  return []
}
