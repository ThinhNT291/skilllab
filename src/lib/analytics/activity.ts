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
  /** Số ngày học trong chuỗi hiện tại. Một ngày nghỉ (tối đa 1 ngày nghỉ mỗi 7 ngày) không làm đứt chuỗi và không được cộng. */
  current: number
  /** Chuỗi dài nhất trong khoảng dữ liệu đã có (cùng luật ngày nghỉ). */
  best: number
  /** Hôm nay đã có hoạt động chưa. */
  activeToday: boolean
  /** Chuỗi đang giữ nhờ một ngày nghỉ (hôm qua nghỉ): hôm nay học là chuỗi vẫn tiếp. */
  onRestDay: boolean
}

const REST_COOLDOWN_DAYS = 7

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(`${b}T00:00:00`).getTime() - new Date(`${a}T00:00:00`).getTime()) / 86400000)
}

/**
 * Luật "ngày nghỉ": bỏ đúng 1 ngày giữa hai ngày học thì chuỗi vẫn giữ, nhưng chỉ được 1 lần như vậy trong mỗi 7 ngày.
 * Mục đích: học đều quan trọng hơn học không nghỉ; một hôm bận không nên xóa công sức nhiều tuần (xem docs/hoc-thuat-dong-luc.md).
 */
export function computeStreaks(counts: Map<string, number>, today: Date = new Date()): Streaks {
  const todayKey = dayKey(today)
  const activeToday = (counts.get(todayKey) ?? 0) > 0
  const days = [...counts.entries()].filter(([, n]) => n > 0).map(([k]) => k).filter((k) => k <= todayKey).sort()

  let best = 0
  let run = 0
  let lastRest: string | null = null
  let prev: string | null = null
  for (const k of days) {
    if (!prev) run = 1
    else {
      const gap = daysBetween(prev, k) - 1 // số ngày bỏ trống ở giữa
      const restOk = lastRest === null || daysBetween(lastRest, k) >= REST_COOLDOWN_DAYS
      if (gap === 0) run++
      else if (gap === 1 && restOk) {
        run++
        lastRest = dayKey(addDays(new Date(`${prev}T00:00:00`), 1))
      } else {
        run = 1
        lastRest = null
      }
    }
    best = Math.max(best, run)
    prev = k
  }

  let current = 0
  let onRestDay = false
  if (prev) {
    const missed = daysBetween(prev, todayKey) - (activeToday ? 0 : 1) // ngày trống đã qua hẳn (không tính hôm nay chưa kết thúc)
    const restOk = lastRest === null || daysBetween(lastRest, todayKey) >= REST_COOLDOWN_DAYS
    if (activeToday ? missed <= 0 : missed === 0) current = run
    else if (!activeToday && missed === 1 && restOk) {
      current = run
      onRestDay = true
    }
  }
  return { current, best: Math.max(best, current), activeToday, onRestDay }
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

export interface WeekBucket {
  /** Ngày đầu tuần (thứ Hai), dạng YYYY-MM-DD */
  start: string
  attempts: number
  correct: number
}

/** Số câu và số câu đúng theo tuần (thứ Hai đến Chủ nhật), `weeks` tuần gần nhất, cũ nhất trước, tuần cuối chứa hôm nay. */
export function weeklyAccuracy(rows: { correct: boolean; created_at: string }[], today: Date = new Date(), weeks = 8): WeekBucket[] {
  const dow = (today.getDay() + 6) % 7
  const firstStart = addDays(today, -dow - (weeks - 1) * 7)
  const buckets: WeekBucket[] = Array.from({ length: weeks }, (_, i) => ({ start: dayKey(addDays(firstStart, i * 7)), attempts: 0, correct: 0 }))
  for (const r of rows) {
    const key = dayKey(new Date(r.created_at))
    // Tuần của dòng: bucket cuối cùng có start <= ngày của dòng
    let idx = -1
    for (let i = 0; i < weeks; i++) if (buckets[i].start <= key) idx = i
    if (idx < 0) continue
    buckets[idx].attempts++
    if (r.correct) buckets[idx].correct++
  }
  return buckets
}
