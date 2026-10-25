"use client"

import { useEffect, useState } from "react"
import { countDueCards, getAttempts, getRecentTopicRows } from "@/lib/db"
import { buildProfile, type SkillProfile } from "@/lib/progress/profile"
import { estimateAll, type Ability, type ItemMeta } from "@/lib/progress/ability"
import itemMeta from "@/content/meta/items.json"

export interface ProfileData {
  profile: SkillProfile[]
  /** Ước lượng trình độ liên tục theo kỹ năng (tham khảo) */
  abilities: Ability[]
  due: number
  now: Date
}

/** Tải dữ liệu một lần và dựng hồ sơ năng lực; null khi đang tải hoặc chưa kết nối cơ sở dữ liệu. */
export function useProfile(): ProfileData | null {
  const [data, setData] = useState<ProfileData | null>(null)
  useEffect(() => {
    let cancelled = false
    Promise.all([getRecentTopicRows(1000), getAttempts(60), countDueCards()]).then(([rows, attempts, due]) => {
      if (cancelled || !rows.ok) return
      setData({ profile: buildProfile(rows.rows, attempts.ok ? attempts.rows : []), abilities: estimateAll(rows.rows.map((r) => ({ exerciseId: r.exercise_id, topic: r.topic, correct: r.correct, created_at: r.created_at })), itemMeta as unknown as ItemMeta), due: due.ok ? due.value : 0, now: new Date() })
    })
    return () => {
      cancelled = true
    }
  }, [])
  return data
}
