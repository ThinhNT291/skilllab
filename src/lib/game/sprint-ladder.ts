/**
 * Thang độ khó cho game 60 giây: câu dài hơn thì khó hơn, cộng với bậc/mức khó của câu gốc.
 * Dùng chung thang với ước lượng năng lực (lib/progress/ability.ts) để bắt đầu đúng tầm người chơi. Hàm thuần.
 */
import type { Exercise } from "@/lib/content/types"
import { itemRating, type ItemMeta } from "@/lib/progress/ability"

/** Mỗi từ thêm hoặc bớt so với câu 6 từ đổi độ khó 25 điểm (4 từ ≈ −50, 12 từ ≈ +150; một bậc = 200 điểm). */
const WORD_STEP = 25

export function lengthOf(ex: Exercise): number {
  if (ex.kind === "reorder") return ex.answerWords.length
  if (ex.kind === "dictation") return ex.text.trim().split(/\s+/).length
  return 6
}

export function sprintRating(ex: Exercise, meta: ItemMeta): number {
  const m = meta[ex.id.split("~")[0]]
  const base = m ? itemRating(m[0], m[1]) : itemRating(ex.bac ?? 2, ex.difficulty)
  return base + WORD_STEP * (lengthOf(ex) - 6)
}

/** Xếp thang từ dễ đến khó. */
export function buildSprintLadder(pool: Exercise[], meta: ItemMeta): Exercise[] {
  return pool.map((ex) => ({ ex, r: sprintRating(ex, meta) })).sort((a, b) => a.r - b.r).map((x) => x.ex)
}
