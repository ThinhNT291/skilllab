"use client"

import { useEffect, useState } from "react"
import type { Exercise } from "@/lib/content/types"
import { getRecentTopicRows } from "@/lib/db"
import { estimateAbility, startPositionFor, START_RATING, type AbilitySkill, type Ability, type ItemMeta } from "@/lib/progress/ability"
import itemMeta from "@/content/meta/items.json"

export interface StartPosition {
  /** 0 = dễ nhất … 1 = khó nhất trên thang */
  position: number
  ability: Ability | null
}

/**
 * Vị trí bắt đầu trên một thang câu đã xếp từ dễ đến khó, theo năng lực ước lượng từ mọi câu đã làm
 * (kể cả bài xếp trình độ). Chưa có dữ liệu thì bắt đầu ở mức khởi điểm (Bậc 1–2). null = đang tải.
 */
export function useStartPosition(ladder: Exercise[], rate: (ex: Exercise) => number, skill: AbilitySkill): StartPosition | null {
  const [state, setState] = useState<StartPosition | null>(null)
  useEffect(() => {
    let cancelled = false
    getRecentTopicRows(1000).then((res) => {
      if (cancelled) return
      const ratings = ladder.map(rate)
      if (!res.ok) return setState({ position: startPositionFor(ratings, START_RATING), ability: null })
      const a = estimateAbility(res.rows.map((r) => ({ exerciseId: r.exercise_id, topic: r.topic, correct: r.correct, created_at: r.created_at })), itemMeta as unknown as ItemMeta, skill)
      setState({ position: startPositionFor(ratings, a.rating), ability: a.n > 0 ? a : null })
    })
    return () => {
      cancelled = true
    }
    // ladder/rate đứng yên trong một lượt chơi
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skill])
  return state
}
