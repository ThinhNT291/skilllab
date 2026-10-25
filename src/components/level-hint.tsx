"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { getRecentTopicRows } from "@/lib/db"
import { bacLabel } from "@/lib/content/bac"
import type { Bac } from "@/lib/content/types"
import { estimateAbility, type AbilitySkill, type ItemMeta } from "@/lib/progress/ability"
import itemMeta from "@/content/meta/items.json"

const LABEL: Record<AbilitySkill, string> = { grammar: "Ngữ pháp", vocab: "Từ vựng", reading: "Đọc hiểu", listening: "Nghe hiểu" }

/** Gợi ý bậc nên bắt đầu của một kỹ năng, từ các câu đã làm; chưa có dữ liệu thì mời làm bài xếp trình độ. */
export function LevelHint({ skill, placementHref }: { skill: AbilitySkill; placementHref: string }) {
  const [state, setState] = useState<{ bac: number; n: number } | null | "none">(null)
  useEffect(() => {
    let cancelled = false
    getRecentTopicRows(1000).then((res) => {
      if (cancelled) return
      if (!res.ok) return setState("none")
      const a = estimateAbility(res.rows.map((r) => ({ exerciseId: r.exercise_id, topic: r.topic, correct: r.correct, created_at: r.created_at })), itemMeta as unknown as ItemMeta, skill)
      setState(a.n >= 3 ? { bac: Math.max(1, a.bac), n: a.n } : "none")
    })
    return () => {
      cancelled = true
    }
  }, [skill])

  if (state === null) return null
  return (
    <p className="mb-4 rounded-game border-2 border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
      {state === "none" ? (
        <>
          Chưa biết nên bắt đầu ở bậc nào? <Link href={placementHref} className="font-extrabold text-primary underline underline-offset-4">Làm bài xếp trình độ {LABEL[skill]}</Link> (vài phút).
        </>
      ) : (
        <>
          Theo các câu bạn đã làm, {LABEL[skill]} của bạn khoảng <strong className="text-foreground">{bacLabel(state.bac as Bac)}</strong> (ước lượng tham khảo). Bắt đầu ở bậc này hoặc thấp hơn một chút là vừa sức.{" "}
          <Link href={placementHref} className="text-primary underline underline-offset-4">Làm lại bài xếp trình độ</Link>
        </>
      )}
    </p>
  )
}
