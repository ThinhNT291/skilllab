/**
 * Điểm bắt đầu của Lộ trình (chốt với chủ dự án): theo kết quả bài xếp trình độ tổng hợp (chặng 1 của bậc xếp được),
 * hoặc bài vượt cấp (đúng hết thì bắt đầu từ chặng vượt). Không có gì thì chặng 1 của Bậc 1. Điểm bắt đầu chỉ tăng, không tự hạ. Hàm thuần.
 */
import { STEPS_PER_BAC, type PathStep } from "./catalog.ts"

export type StartSource = "placement" | "leap"
export interface StartPoint {
  bac: number
  step: number
  source: StartSource
}

/** Thứ tự của (bậc, chặng) trong toàn Lộ trình, dùng được cả khi nội dung chưa đầy đủ (0-based). */
export const startOrder = (bac: number, step: number): number => (bac - 1) * STEPS_PER_BAC + (step - 1)

export const validStart = (bac: number, step: number): boolean => Number.isInteger(bac) && Number.isInteger(step) && bac >= 1 && bac <= 6 && step >= 1 && step <= STEPS_PER_BAC

/** Chỉ số nấc trong `path` của một điểm bắt đầu; 0 nếu không có. */
export function startIndexOf(path: PathStep[], start: Pick<StartPoint, "bac" | "step"> | null): number {
  if (!start) return 0
  const i = path.findIndex((s) => s.bac === start.bac && s.stepInBac === start.step)
  return i < 0 ? 0 : i
}

/** Điểm bắt đầu từ bài xếp trình độ: chặng 1 của bậc tổng (bậc 0 = dưới Bậc 1 → Bậc 1). */
export const startFromPlacement = (overallBac: number): StartPoint | null => {
  if (!Number.isFinite(overallBac)) return null
  const bac = Math.min(6, Math.max(1, Math.floor(overallBac)))
  return { bac, step: 1, source: "placement" }
}

/** Lấy điểm cao nhất trong số điểm đã lưu và các ứng viên mới; hòa thì giữ điểm đã lưu. Trả về kèm cờ `changed`. */
export function bestStart(saved: StartPoint | null, candidates: (StartPoint | null)[]): { start: StartPoint | null; changed: boolean } {
  let best = saved
  for (const c of candidates) {
    if (!c || !validStart(c.bac, c.step)) continue
    if (!best || startOrder(c.bac, c.step) > startOrder(best.bac, best.step)) best = c
  }
  return { start: best, changed: best !== saved }
}
