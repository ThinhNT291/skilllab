/**
 * Phần chi tiết của một lần chấm được LƯU để theo dõi điểm yếu lặp lại theo thời gian (không lưu bài làm, chỉ số và thẻ).
 * Hàm thuần.
 */
import type { Feedback } from "../rubric.ts"

export interface AttemptDetail {
  /** Bậc ước lượng của từng tiêu chí */
  criteriaBac: Record<string, number | null>
  /** Thẻ lỗi (mã mục lý thuyết) xuất hiện trong lần chấm, không trùng */
  tags: string[]
  /** Số lỗi theo loại */
  categories: Record<string, number>
  /** Số lỗi do dịch từng chữ từ tiếng Việt */
  transfer: number
}

export function detailFromFeedback(f: Feedback): AttemptDetail {
  const categories: Record<string, number> = {}
  for (const c of f.corrections) categories[c.category] = (categories[c.category] ?? 0) + 1
  return {
    criteriaBac: Object.fromEntries(f.criteria.map((c) => [c.key, c.bac])),
    tags: [...new Set(f.corrections.map((c) => c.tag).filter((t): t is string => !!t))],
    categories,
    transfer: f.corrections.filter((c) => c.transfer).length,
  }
}

export interface Recurring {
  /** Thẻ lỗi lặp lại nhiều nhất (≥ 2 lần chấm), nhiều → ít */
  tags: { tag: string; count: number }[]
  /** Loại lỗi nhiều nhất */
  categories: { category: string; count: number }[]
  /** Tiêu chí có điểm trung bình thấp nhất trong các lần chấm cùng kỹ năng; null nếu chưa đủ dữ liệu (< 2 lần) */
  weakest: { key: string; avg: number } | null
  transfer: number
}

/** Tổng hợp điểm yếu lặp lại từ các lần chấm gần đây của MỘT kỹ năng. */
export function recurringWeaknesses(rows: { scores: Record<string, number>; detail?: AttemptDetail | null }[], limit = 8): Recurring {
  const recent = rows.slice(0, limit)
  const tagCount = new Map<string, number>()
  const catCount = new Map<string, number>()
  let transfer = 0
  for (const r of recent) {
    for (const t of r.detail?.tags ?? []) tagCount.set(t, (tagCount.get(t) ?? 0) + 1)
    for (const [c, n] of Object.entries(r.detail?.categories ?? {})) catCount.set(c, (catCount.get(c) ?? 0) + n)
    transfer += r.detail?.transfer ?? 0
  }
  const sums = new Map<string, number[]>()
  for (const r of recent) for (const [k, v] of Object.entries(r.scores)) sums.set(k, [...(sums.get(k) ?? []), Number(v)])
  let weakest: Recurring["weakest"] = null
  if (recent.length >= 2) {
    for (const [key, vs] of sums) {
      const avg = vs.reduce((a, b) => a + b, 0) / vs.length
      if (!weakest || avg < weakest.avg) weakest = { key, avg: Math.round(avg * 10) / 10 }
    }
  }
  return {
    tags: [...tagCount].filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([tag, count]) => ({ tag, count })),
    categories: [...catCount].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([category, count]) => ({ category, count })),
    weakest,
    transfer,
  }
}
