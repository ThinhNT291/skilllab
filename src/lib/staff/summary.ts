/** Tóm tắt hoạt động học sinh cho trang quản lý. Hàm thuần. */
export interface AnswerLite {
  profile_id: string
  correct: boolean
  created_at: string
}

export interface StudentActivity {
  answers: number
  correct: number
  /** Tỷ lệ đúng 0–1; null nếu chưa có lượt nào */
  accuracy: number | null
  lastAt: string | null
  /** Số ngày khác nhau có học trong khoảng dữ liệu */
  activeDays: number
}

export function summarizeActivity(rows: AnswerLite[]): Map<string, StudentActivity> {
  const days = new Map<string, Set<string>>()
  const out = new Map<string, StudentActivity>()
  for (const r of rows) {
    const cur = out.get(r.profile_id) ?? { answers: 0, correct: 0, accuracy: null, lastAt: null, activeDays: 0 }
    cur.answers++
    if (r.correct) cur.correct++
    if (!cur.lastAt || r.created_at > cur.lastAt) cur.lastAt = r.created_at
    out.set(r.profile_id, cur)
    const set = days.get(r.profile_id) ?? new Set<string>()
    set.add(r.created_at.slice(0, 10))
    days.set(r.profile_id, set)
  }
  for (const [id, a] of out) {
    a.accuracy = a.answers ? a.correct / a.answers : null
    a.activeDays = days.get(id)?.size ?? 0
  }
  return out
}

/** Học sinh cần chú ý: chưa học trong `quietDays` ngày hoặc tỷ lệ đúng thấp với đủ dữ liệu. */
export function attentionReasons(a: StudentActivity | undefined, now: Date, quietDays = 3, lowAccuracy = 0.5, minAnswers = 10): string[] {
  const out: string[] = []
  if (!a || !a.lastAt) return ["chưa học trong tuần"]
  const gap = Math.floor((now.getTime() - new Date(a.lastAt).getTime()) / 86_400_000)
  if (gap >= quietDays) out.push(`${gap} ngày chưa học`)
  if (a.answers >= minAnswers && a.accuracy !== null && a.accuracy < lowAccuracy) out.push(`tỷ lệ đúng thấp (${Math.round(a.accuracy * 100)}%)`)
  return out
}
