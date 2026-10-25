"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Mascot } from "@/components/game/mascot"
import { computeStreaks, countByDay, dayKey } from "@/lib/analytics/activity"
import { countDueCards, getActivityTimestamps } from "@/lib/db"
import { useSettings } from "@/lib/settings"

/** Dải "hôm nay" ở trang chủ: lời chào, chuỗi ngày, mục tiêu và nút học tiếp. */
export function TodayPanel() {
  const { dailyGoal } = useSettings()
  const [data, setData] = useState<{ today: number; streak: number; due: number; hour: number } | null>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([getActivityTimestamps(100), countDueCards()]).then(([act, due]) => {
      if (cancelled) return
      const counts = act.ok ? countByDay(act.timestamps) : new Map<string, number>()
      const now = new Date()
      setData({
        today: counts.get(dayKey(now)) ?? 0,
        streak: computeStreaks(counts, now).current,
        due: due.ok ? due.value : 0,
        hour: now.getHours(),
      })
    })
    return () => {
      cancelled = true
    }
  }, [])

  const done = data ? data.today >= dailyGoal : false
  const pct = data ? Math.min(100, Math.round((data.today / dailyGoal) * 100)) : 0
  const hour = data?.hour
  const greeting = hour === undefined ? "Chào bạn!" : hour < 11 ? "Chào buổi sáng!" : hour < 18 ? "Chào bạn!" : "Chào buổi tối!"

  return (
    <section aria-labelledby="today-heading" className="home-hero rounded-game border-2 border-border bg-card p-5 sm:p-6">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-5">
        <Mascot mood={done ? "cheer" : "happy"} size={88} className="mascot-float shrink-0" />
        <div className="w-full min-w-0 flex-1 space-y-2">
          <h2 id="today-heading" className="text-2xl font-extrabold sm:text-3xl">
            {greeting}
          </h2>
          <p className="text-muted-foreground">
            {data === null
              ? "Đang tải…"
              : done
                ? "Bạn đã đạt mục tiêu hôm nay. Học thêm cho vui nhé!"
                : `Mục tiêu hôm nay: ${data.today}/${dailyGoal} câu`}
          </p>
          <div className="h-3 w-full max-w-sm overflow-hidden rounded-full bg-border" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="Tiến độ mục tiêu hôm nay">
            <div className={`h-full rounded-full transition-[width] duration-700 ${done ? "bg-success" : "bg-primary"}`} style={{ width: `${pct}%` }} />
          </div>
          {data && (
            <p className="text-sm text-muted-foreground">
              <span aria-hidden="true">🔥 </span>
              {data.streak} ngày liên tiếp
              {data.due > 0 && (
                <>
                  {" · "}
                  <Link href="/on-tap" className="font-extrabold text-primary underline underline-offset-2">
                    {data.due} thẻ cần ôn
                  </Link>
                </>
              )}
            </p>
          )}
        </div>
        <Link
          href="/hoc"
          className="w-full rounded-game border-b-[5px] text-center sm:w-auto border-primary-deep bg-primary px-6 py-3 text-lg font-extrabold text-primary-foreground active:translate-y-[3px] active:border-b-2"
        >
          Học tiếp
        </Link>
      </div>
    </section>
  )
}
