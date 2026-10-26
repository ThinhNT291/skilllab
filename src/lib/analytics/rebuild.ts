/** So bộ đếm theo ngày đang lưu với số đếm đúng tính lại từ dữ liệu thô (scripts/rebuild-progress.mjs). Hàm thuần. */
export interface DailyKeyed {
  profile_id: string
  day: string
  answers: number
  correct: number
}

const key = (r: DailyKeyed) => `${r.profile_id}|${r.day}`

export function diffDaily(truth: DailyKeyed[], stored: DailyKeyed[]): { missing: DailyKeyed[]; wrong: DailyKeyed[]; extra: DailyKeyed[] } {
  const have = new Map(stored.map((r) => [key(r), r]))
  const want = new Set(truth.map(key))
  const missing: DailyKeyed[] = []
  const wrong: DailyKeyed[] = []
  for (const t of truth) {
    const s = have.get(key(t))
    if (!s) missing.push(t)
    else if (s.answers !== t.answers || s.correct !== t.correct) wrong.push(t)
  }
  const extra = stored.filter((s) => !want.has(key(s)))
  return { missing, wrong, extra }
}
