/**
 * Bài nghe chép thích ứng: bắt đầu từ câu dễ, đúng thì lên câu khó hơn, sai thì lùi về câu dễ hơn.
 * Hàm thuần, không đọc dữ liệu.
 */
import type { Exercise } from "./types.ts"
import type { Rng } from "./derive.ts"

/** Điểm khó của một câu nghe: câu dài hơn và mức khó nguồn cao hơn thì khó hơn. */
export function dictationScore(ex: Exercise): number {
  const words = ex.kind === "dictation" ? ex.text.trim().split(/\s+/).length : 0
  return words + (ex.difficulty - 1) * 3
}

/** Xếp thang từ dễ đến khó (điểm bằng nhau thì giữ thứ tự ngẫu nhiên đã trộn trước). */
export function buildLadder(pool: Exercise[]): Exercise[] {
  return [...pool].sort((a, b) => dictationScore(a) - dictationScore(b))
}

export const START_POSITION = 0.1
const STEP_UP = 0.14
const STEP_DOWN = 0.18

/**
 * Bước nhảy cho bài trắc nghiệm thích ứng: lên ít, xuống nhiều để vị trí ổn định quanh tỷ lệ đúng khoảng 80%
 * (cân bằng khi lên × tỷ lệ đúng = xuống × tỷ lệ sai: 0,05 × 0,8 = 0,2 × 0,2).
 */
export const MCQ_STEPS = { up: 0.05, down: 0.2 }

/** Vị trí mới trên thang (0 = dễ nhất, 1 = khó nhất) sau một câu trả lời. */
export function nextPosition(position: number, correct: boolean, steps: { up: number; down: number } = { up: STEP_UP, down: STEP_DOWN }): number {
  return Math.min(1, Math.max(0, position + (correct ? steps.up : -steps.down)))
}

/** Chọn câu chưa dùng gần vị trí mục tiêu nhất trên thang; gần bằng nhau thì chọn ngẫu nhiên. */
export function pickAtPosition(ladder: Exercise[], usedIds: ReadonlySet<string>, position: number, rng: Rng = Math.random): Exercise | null {
  const target = position * (ladder.length - 1)
  const free = ladder.map((ex, i) => ({ ex, d: Math.abs(i - target) })).filter((x) => !usedIds.has(x.ex.id))
  if (!free.length) return null
  const best = Math.min(...free.map((x) => x.d))
  const near = free.filter((x) => x.d <= best + 1)
  return near[Math.floor(rng() * near.length)].ex
}
