"use client"

import { useEffect, useState } from "react"
import { countDueCards, getAttempts, getRecentTopicRows } from "@/lib/db"
import { buildProfile, type SkillProfile } from "@/lib/progress/profile"

export interface ProfileData {
  profile: SkillProfile[]
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
      setData({ profile: buildProfile(rows.rows, attempts.ok ? attempts.rows : []), due: due.ok ? due.value : 0, now: new Date() })
    })
    return () => {
      cancelled = true
    }
  }, [])
  return data
}
