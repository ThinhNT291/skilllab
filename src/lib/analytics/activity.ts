/**
 * Chuỗi ngày học và bản đồ nhiệt từ lịch sử trả lời. Hàm thuần.
 * Mọi lượt trả lời (đúng lẫn sai) đều tính là "có học trong ngày" (theo thiết kế bản cũ).
 * Ngày tính theo giờ địa phương của trình duyệt.
 */
export const DAILY_GOAL = 10

/** Khóa ngày dạng YYYY-MM-DD theo giờ địa phương. */
export function dayKey(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${d.getFullYear()}-${m}-${day}`
}

export function countByDay(timestamps: string[]): Map<string, number> {
  const map = new Map<string, number>()
  for (const t of timestamps) {
    const k = dayKey(new Date(t))
    map.set(k, (map.get(k) ?? 0) + 1)
  }
  return map
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

export interface Streaks {
  /** Số ngày liên tiếp đến hôm nay (hôm nay chưa học thì tính đến hôm qua, để chuỗi chưa đứt giữa ngày). */
  current: number
  /** Chuỗi dài nhất trong khoảng dữ liệu đã có. */
  best: number
  /** Hôm nay đã có hoạt động chưa. */
  activeToday: boolean
}

export function computeStreaks(counts: Map<string, number>, today: Date = new Date()): Streaks {
  const activeToday = (counts.get(dayKey(today)) ?? 0) > 0
  let cursor = activeToday ? today : addDays(today, -1)
  let current = 0
  while ((counts.get(dayKey(cursor)) ?? 0) > 0) {
    current++
    cursor = addDays(cursor, -1)
  }

  const days = [...counts.keys()].sort()
  let best = 0
  let run = 0
  let prev: Date | null = null
  for (const k of days) {
    const d = new Date(`${k}T00:00:00`)
    run = prev && dayKey(addDays(prev, 1)) === k ? run + 1 : 1
    best = Math.max(best, run)
    prev = d
  }
  return { current, best: Math.max(best, current), activeToday }
}

export interface HeatCell {
  key: string
  count: number
  /** 0 = không học, 1–4 = càng nhiều càng đậm */
  level: 0 | 1 | 2 | 3 | 4
  future: boolean
}

export function levelFor(count: number): HeatCell["level"] {
  if (count <= 0) return 0
  if (count < 5) return 1
  if (count < 10) return 2
  if (count < 20) return 3
  return 4
}

/** Lưới các tuần (cột) x 7 ngày (hàng, thứ Hai đến Chủ nhật), tuần cuối chứa hôm nay. */
export function buildHeatmap(counts: Map<string, number>, today: Date = new Date(), weeks = 12): HeatCell[][] {
  const dow = (today.getDay() + 6) % 7 // 0 = thứ Hai
  const start = addDays(today, -dow - (weeks - 1) * 7)
  const todayKey = dayKey(today)
  const columns: HeatCell[][] = []
  for (let w = 0; w < weeks; w++) {
    const col: HeatCell[] = []
    for (let d = 0; d < 7; d++) {
      const date = addDays(start, w * 7 + d)
      const key = dayKey(date)
      const count = counts.get(key) ?? 0
      col.push({ key, count, level: levelFor(count), future: key > todayKey })
    }
    columns.push(col)
  }
  return columns
}
