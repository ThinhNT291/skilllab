"use client"

import { useEffect, useState } from "react"
import { buildHeatmap, computeStreaks, countByDay, dayKey, type HeatCell } from "@/lib/analytics/activity"
import { getActivityTimestamps } from "@/lib/db"
import { DAILY_GOALS, updateSettings, useSettings } from "@/lib/settings"

const LEVEL_STYLE: Record<HeatCell["level"], string> = {
  0: "bg-border",
  1: "bg-primary/25",
  2: "bg-primary/50",
  3: "bg-primary/75",
  4: "bg-primary",
}
const DAY_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"]

/** Chuỗi ngày học, mục tiêu hôm nay và bản đồ nhiệt 12 tuần. */
export function ActivityPanel() {
  const [counts, setCounts] = useState<Map<string, number> | null>(null)
  const { dailyGoal: DAILY_GOAL, calmMode } = useSettings()

  useEffect(() => {
    let cancelled = false
    getActivityTimestamps(100).then((res) => {
      if (!cancelled && res.ok) setCounts(countByDay(res.timestamps))
    })
    return () => {
      cancelled = true
    }
  }, [])

  if (!counts) return null

  const today = new Date()
  const streak = computeStreaks(counts, today)
  const todayCount = counts.get(dayKey(today)) ?? 0
  const grid = buildHeatmap(counts, today, 12)
  const pct = Math.min(1, todayCount / DAILY_GOAL)
  const R = 26
  const C = 2 * Math.PI * R

  return (
    <section aria-labelledby="activity-heading" className="space-y-4">
      <h2 id="activity-heading" className="sr-only">
        Chuỗi ngày học
      </h2>
      {!calmMode && <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
        <div className="rounded-game border-2 border-border bg-card px-4 py-3">
          <p className="text-3xl font-extrabold">
            <span aria-hidden="true">🔥 </span>
            {streak.current}
            <span className="ml-1 text-base text-muted-foreground">ngày</span>
          </p>
          <p className="text-sm text-muted-foreground">
            {streak.current === 0 ? "Học hôm nay để bắt đầu một chuỗi mới" : streak.activeToday ? "ngày học đều" : streak.onRestDay ? "hôm qua nghỉ cũng không sao; học hôm nay là chuỗi vẫn tiếp" : "học hôm nay để chuỗi tiếp tục"} · dài nhất {streak.best}. Mỗi tuần được nghỉ 1 ngày.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 rounded-game border-2 border-border bg-card px-4 py-3">
          <svg width="64" height="64" viewBox="0 0 64 64" role="img" aria-label={`Mục tiêu hôm nay: ${Math.min(todayCount, DAILY_GOAL)} trên ${DAILY_GOAL} câu`}>
            <circle cx="32" cy="32" r={R} fill="none" strokeWidth="7" className="stroke-border" />
            <circle
              cx="32"
              cy="32"
              r={R}
              fill="none"
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - pct)}
              transform="rotate(-90 32 32)"
              className={pct >= 1 ? "stroke-success" : "stroke-primary"}
              style={{ transition: "stroke-dashoffset 0.6s ease" }}
            />
            <text x="32" y="37" textAnchor="middle" className="fill-foreground text-[15px] font-extrabold">
              {pct >= 1 ? "✓" : todayCount}
            </text>
          </svg>
          <div>
            <p className="font-extrabold">Hôm nay</p>
            <p className="text-sm text-muted-foreground">
              {todayCount}/{DAILY_GOAL} câu
            </p>
            <div className="mt-1 flex flex-wrap gap-1" role="group" aria-label="Mục tiêu mỗi ngày (số câu)">
              {DAILY_GOALS.map((g) => (
                <button key={g} type="button" aria-pressed={DAILY_GOAL === g} onClick={() => updateSettings({ dailyGoal: g })} className="rounded-full border-2 border-border px-2 text-xs font-extrabold aria-pressed:border-primary aria-pressed:text-primary">
                  {g}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>}

      <div className="rounded-game border-2 border-border bg-card p-4">
        <p className="mb-2 font-extrabold">12 tuần gần nhất</p>
        <div className="flex gap-2">
          <div className="grid grid-rows-7 gap-1 pt-0.5 text-[10px] leading-none text-muted-foreground" aria-hidden="true">
            {DAY_LABELS.map((d) => (
              <span key={d} className="flex h-4 items-center">
                {d}
              </span>
            ))}
          </div>
          <div className="grid flex-1 grid-flow-col grid-rows-7 gap-1" role="img" aria-label={`Bản đồ hoạt động 12 tuần, ${[...counts.values()].filter((n) => n > 0).length} ngày có học`}>
            {grid.flat().map((c) => (
              <span
                key={c.key}
                title={c.future ? "" : `${c.key}: ${c.count} câu`}
                className={`h-4 rounded-[4px] ${c.future ? "opacity-0" : LEVEL_STYLE[c.level]}`}
              />
            ))}
          </div>
        </div>
        <div className="mt-2 flex items-center justify-end gap-1 text-xs text-muted-foreground" aria-hidden="true">
          ít
          {([0, 1, 2, 3, 4] as const).map((l) => (
            <span key={l} className={`h-3 w-3 rounded-[3px] ${LEVEL_STYLE[l]}`} />
          ))}
          nhiều
        </div>
      </div>
    </section>
  )
}
