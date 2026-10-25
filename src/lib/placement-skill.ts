/**
 * Xếp trình độ cho Đọc, Nghe (bậc thang) và Từ vựng (cố định theo cấp). Hàm thuần.
 * Đọc/Nghe: mỗi bước là một bài ở một bậc; đạt (từ 75% đúng) thì lên bậc kế, chưa đạt thì xuống; tối đa 3 bài.
 * Kết quả là bậc cao nhất đã đạt (0 = chưa đạt bài nào, tức dưới Bậc 1). Chỉ là ước lượng tham khảo, không phải xếp loại.
 */
export const STAIR_START_BAC = 2
export const STAIR_MAX_STEPS = 3
export const STAIR_MIN_BAC = 1
export const STAIR_MAX_BAC = 4

export interface StairStep {
  bac: number
  passed: boolean
}

/** Bậc của bài kế tiếp; null nếu dừng (đủ số bài, ra ngoài thang, hoặc bậc đó đã làm rồi). */
export function nextStairBac(history: StairStep[]): number | null {
  if (history.length === 0) return STAIR_START_BAC
  if (history.length >= STAIR_MAX_STEPS) return null
  const last = history[history.length - 1]
  const next = last.bac + (last.passed ? 1 : -1)
  if (next < STAIR_MIN_BAC || next > STAIR_MAX_BAC) return null
  if (history.some((h) => h.bac === next)) return null
  return next
}

/** Bậc cao nhất đã đạt (0 nếu chưa đạt bài nào). */
export function stairResult(history: StairStep[]): number {
  return history.filter((h) => h.passed).reduce((m, h) => Math.max(m, h.bac), 0)
}
