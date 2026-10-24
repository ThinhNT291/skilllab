"use client"

import { useCallback, useEffect, useState } from "react"
import { computeStreaks, countByDay } from "@/lib/analytics/activity"
import { getActivityTimestamps, getAnswerCounts, getAnswerHistory, getOwnedItems } from "@/lib/db"
import { earnedBadges, type Badge, type GameStats } from "@/lib/game/badges"
import { spentOn } from "@/lib/game/shop"
import { coinsAvailable, levelFromXp, xpFor, type LevelInfo } from "@/lib/game/xp"

export interface Player {
  xp: number
  level: LevelInfo
  coins: number
  stats: GameStats
  badges: Badge[]
  owned: string[]
  equipped: string[]
}

export type PlayerState = { status: "loading" } | { status: "unavailable"; message: string } | { status: "ready"; player: Player }

/** Gom số liệu game của học sinh hiện tại. `reload` dùng sau khi mua hoặc đổi đồ. */
export function usePlayer(): { state: PlayerState; reload: () => void } {
  const [state, setState] = useState<PlayerState>({ status: "loading" })
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let cancelled = false
    Promise.all([getAnswerCounts(), getAnswerHistory(), getActivityTimestamps(), getOwnedItems()]).then(([counts, history, activity, items]) => {
      if (cancelled) return
      if (!counts.ok) {
        setState({ status: "unavailable", message: counts.reason === "not_configured" ? "Chưa kết nối Supabase nên chưa có điểm kinh nghiệm." : `Không tải được dữ liệu (${counts.message ?? "lỗi không rõ"}).` })
        return
      }
      const byDay = activity.ok ? countByDay(activity.timestamps) : new Map<string, number>()
      const topics = history.ok ? new Set(history.rows.map((r) => r.topic)).size : 0
      const stats: GameStats = {
        answers: counts.total,
        correct: counts.correct,
        topics,
        bestStreak: computeStreaks(byDay).best,
        activeDays: byDay.size,
      }
      const owned = items.ok ? items.owned : []
      const equipped = items.ok ? items.equipped : []
      const xp = xpFor(counts.correct, counts.total - counts.correct)
      setState({ status: "ready", player: { xp, level: levelFromXp(xp), coins: coinsAvailable(xp, spentOn(owned)), stats, badges: earnedBadges(stats), owned, equipped } })
    })
    return () => {
      cancelled = true
    }
  }, [tick])

  const reload = useCallback(() => setTick((t) => t + 1), [])
  return { state, reload }
}
