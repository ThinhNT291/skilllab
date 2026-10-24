import { weeklyAccuracy } from "@/lib/analytics/activity"

/** Tỷ lệ đúng theo tuần trong 8 tuần gần nhất: cột cao = đúng nhiều; tuần không học để trống. */
export function TrendPanel({ rows }: { rows: { correct: boolean; created_at: string }[] }) {
  const weeks = weeklyAccuracy(rows, new Date(), 8)
  if (weeks.every((w) => w.attempts === 0)) return null
  const last = [...weeks].reverse().find((w) => w.attempts > 0)
  const prev = [...weeks].reverse().filter((w) => w.attempts > 0)[1]
  const pct = (w: { attempts: number; correct: number }) => Math.round((w.correct / w.attempts) * 100)
  const trend = last && prev ? pct(last) - pct(prev) : null

  return (
    <section aria-labelledby="trend-heading" className="rounded-game border-2 border-border bg-card p-4">
      <h2 id="trend-heading" className="font-extrabold">
        Tỷ lệ đúng theo tuần
      </h2>
      {trend !== null && (
        <p className="text-sm text-muted-foreground">
          {trend > 0 ? `📈 Tuần gần nhất tăng ${trend} điểm so với tuần học trước.` : trend < 0 ? `Tuần gần nhất giảm ${-trend} điểm so với tuần học trước. Ôn lại các mục hay sai nhé.` : "Tuần gần nhất giữ nguyên so với tuần học trước."}
        </p>
      )}
      <ol className="mt-3 grid grid-cols-8 items-end gap-1.5" aria-label="Tỷ lệ đúng 8 tuần gần nhất">
        {weeks.map((w) => {
          const has = w.attempts > 0
          const p = has ? pct(w) : 0
          const [, m, d] = w.start.split("-")
          return (
            <li key={w.start} className="flex flex-col items-center gap-1" title={has ? `Tuần ${d}/${m}: ${w.correct}/${w.attempts} đúng` : `Tuần ${d}/${m}: không học`}>
              <span className="text-[11px] font-extrabold text-muted-foreground">{has ? `${p}%` : ""}</span>
              <div className="flex h-20 w-full items-end rounded-md bg-border/50">
                <div className="w-full rounded-md bg-primary" style={{ height: has ? `${Math.max(p, 6)}%` : 0 }} />
              </div>
              <span className="text-[10px] text-muted-foreground">
                {d}/{m}
              </span>
            </li>
          )
        })}
      </ol>
      <p className="mt-2 text-xs text-muted-foreground">Mốc dưới mỗi cột là ngày đầu tuần. Số câu mỗi tuần: {weeks.map((w) => w.attempts).join(", ")}.</p>
    </section>
  )
}
