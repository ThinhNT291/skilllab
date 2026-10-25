/** Thống kê các bài Viết/Nói đã chấm. Hàm thuần. */
export interface AttemptRow {
  skill: "writing" | "speaking"
  task_id: string
  target_bac: number
  total: number
  estimated_bac: number
  scores: Record<string, number>
  note: string | null
  /** Chi tiết lần chấm (cần migration 0009); null với bài cũ */
  detail?: import("../grading/detail.ts").AttemptDetail | null
  created_at: string
}

export interface SkillSummary {
  skill: "writing" | "speaking"
  count: number
  /** Điểm theo thứ tự thời gian (cũ → mới), tối đa `max` bài gần nhất */
  series: number[]
  latest: AttemptRow | null
  /** Điểm trung bình các bài gần nhất trừ trung bình các bài trước đó; null nếu chưa đủ dữ liệu */
  trend: number | null
  best: number
}

const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length

/** Nhóm theo kỹ năng; xu hướng = trung bình 3 bài mới nhất − trung bình 3 bài ngay trước (cần ≥ 4 bài). */
export function summarizeAttempts(rows: AttemptRow[], max = 12): SkillSummary[] {
  return (["writing", "speaking"] as const).map((skill) => {
    const mine = rows.filter((r) => r.skill === skill).sort((a, b) => a.created_at.localeCompare(b.created_at))
    const totals = mine.map((r) => Number(r.total))
    const recent = totals.slice(-3)
    const before = totals.slice(-6, -3)
    return {
      skill,
      count: mine.length,
      series: totals.slice(-max),
      latest: mine.at(-1) ?? null,
      trend: mine.length >= 4 && before.length > 0 ? Math.round((avg(recent) - avg(before)) * 10) / 10 : null,
      best: totals.length ? Math.max(...totals) : 0,
    }
  })
}
