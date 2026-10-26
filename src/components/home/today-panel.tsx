"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Mascot } from "@/components/game/mascot"
import { computeStreaks, dayKey } from "@/lib/analytics/activity"
import { countDueCards, getActivityCounts } from "@/lib/db"
import { usePlayer } from "@/components/game/use-player"
import { useSettings } from "@/lib/settings"

/** Dải "hôm nay" ở trang chủ: lời chào, chuỗi ngày, mục tiêu và nút học tiếp. */
export function TodayPanel() {
  const { dailyGoal, ageSet, calmMode } = useSettings()
  const { state: player } = usePlayer()
  const [data, setData] = useState<{ today: number; streak: number; onRestDay: boolean; due: number; hour: number } | null>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([getActivityCounts(100), countDueCards()]).then(([act, due]) => {
      if (cancelled) return
      const counts = act.ok ? act.counts : new Map<string, number>()
      const now = new Date()
      setData({
        today: counts.get(dayKey(now)) ?? 0,
        streak: computeStreaks(counts, now).current,
        onRestDay: computeStreaks(counts, now).onRestDay,
        due: due.ok ? due.value : 0,
        hour: now.getHours(),
      })
    })
    return () => {
      cancelled = true
    }
  }, [])

  const done = data ? data.today >= dailyGoal : false
  const showGoal = !calmMode
  const pct = data ? Math.min(100, Math.round((data.today / dailyGoal) * 100)) : 0
  const hour = data?.hour
  const greeting = hour === undefined ? "Chào bạn!" : hour < 11 ? "Chào buổi sáng!" : hour < 18 ? "Chào bạn!" : "Chào buổi tối!"

  return (
    <section aria-labelledby="today-heading" className="home-hero rounded-game border-2 border-border bg-card p-5 sm:p-6">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-5">
        <Mascot mood={done ? "cheer" : "happy"} size={ageSet === "kids" ? 96 : 64} items={player.status === "ready" ? player.player.equipped : []} className="mascot-float shrink-0" />
        <div className="w-full min-w-0 flex-1 space-y-2">
          <h2 id="today-heading" className="text-2xl font-extrabold sm:text-3xl">
            {greeting}
          </h2>
          <p className="text-muted-foreground">
            {data === null
              ? "Đang tải…"
              : !showGoal
                ? "Học một chút cũng tốt. Bạn muốn học gì hôm nay?"
                : done
                  ? "Bạn đã đạt mục tiêu hôm nay. Học thêm cho vui nhé!"
                  : data.today === 0
                    ? `Gợi ý hôm nay: ${dailyGoal} câu. Chỉ cần bắt đầu là tốt rồi.`
                    : `Hôm nay bạn đã làm ${data.today}/${dailyGoal} câu`}
          </p>
          {showGoal && <div className="h-3 w-full max-w-sm overflow-hidden rounded-full bg-border" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="Tiến độ mục tiêu hôm nay">
            <div className={`h-full rounded-full transition-[width] duration-700 ${done ? "bg-success" : "bg-primary"}`} style={{ width: `${pct}%` }} />
          </div>}
          {data && data.today >= Math.max(30, dailyGoal * 3) && (
            <p className="text-sm font-extrabold text-foreground">Hôm nay bạn đã học rất nhiều rồi. Nghỉ mắt, uống nước, mai học tiếp nhé!</p>
          )}
          {data && (
            <p className="text-sm text-muted-foreground">
              {showGoal && (
                <>
                  <span aria-hidden="true">🔥 </span>
                  {data.streak} ngày học
                  {data.onRestDay ? " (hôm qua nghỉ, học hôm nay là chuỗi vẫn tiếp)" : ""}
                </>
              )}
              {player.status === "ready" && (
                <>
                  {showGoal && " · "}
                  {ageSet === "kids" ? `🪙 ${player.player.coins} xu` : `Cấp ${player.player.level.level} · ${player.player.xp} XP`}
                </>
              )}
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
