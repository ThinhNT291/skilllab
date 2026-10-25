/** Nhãn xem trước khoảng cách ôn lại cho bốn nút chấm, theo thuật toán đang chọn. Hàm thuần. */
import { fsrsFromSm2, previewFsrs, type FsrsState } from "./fsrs.ts"
import { formatInterval, type Grade, type SchedState } from "./scheduler.ts"

export function formatDays(d: number): string {
  if (d <= 0) return "hôm nay"
  if (d < 30) return d === 1 ? "1 ngày" : `${d} ngày`
  if (d < 365) return `${Math.round(d / 30)} tháng`
  const y = Math.round((d / 365) * 10) / 10
  return `${y} năm`
}

export interface PreviewCard {
  sm2: SchedState
  fsrs: FsrsState | null
  lastReviewedAt: Date | null
}

const GRADES: Grade[] = ["again", "hard", "good", "easy"]

export function previewLabels(card: PreviewCard, algorithm: "fsrs" | "sm2", retention: number, now: Date = new Date()): Record<Grade, string> {
  if (algorithm === "sm2") return Object.fromEntries(GRADES.map((g) => [g, formatInterval(card.sm2, g)])) as Record<Grade, string>
  const state = card.fsrs && card.fsrs.state > 0 ? card.fsrs : fsrsFromSm2(card.sm2, card.lastReviewedAt, now)
  const days = previewFsrs(state, now, retention)
  return Object.fromEntries(GRADES.map((g) => [g, formatDays(days[g])])) as Record<Grade, string>
}
