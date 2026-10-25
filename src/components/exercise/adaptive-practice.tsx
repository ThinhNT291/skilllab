"use client"

import { useEffect, useState } from "react"
import type { Exercise } from "@/lib/content/types"
import type { RuleHints } from "@/lib/content/rule-hints"
import { MCQ_STEPS, pickAtPosition } from "@/lib/content/adaptive"
import { getRecentTopicRows } from "@/lib/db"
import { CONFIDENCE_LABEL, estimateAbility, itemRating, startPositionFor, START_RATING, type ItemMeta } from "@/lib/progress/ability"
import itemMeta from "@/content/meta/items.json"
import { PracticeSession } from "./practice-session"

const COUNT = 10

/**
 * Luyện thích ứng: câu xếp theo độ khó; bắt đầu ở mức vừa sức với trình độ ước lượng của bạn (tỷ lệ đúng mục tiêu khoảng 80%),
 * đúng thì khó dần chậm, sai thì dễ lại nhanh hơn. Chưa có dữ liệu thì bắt đầu ở mức khởi điểm.
 */
export function AdaptivePractice({ ladder, theoryBase, rules }: { ladder: Exercise[]; theoryBase: string; rules: RuleHints }) {
  const [start, setStart] = useState<{ position: number; note: string } | null>(null)

  useEffect(() => {
    let cancelled = false
    getRecentTopicRows(1000).then((res) => {
      if (cancelled) return
      const ratings = ladder.map((e) => itemRating(e.bac ?? 2, e.difficulty))
      if (!res.ok) return setStart({ position: startPositionFor(ratings, START_RATING), note: "Chưa có dữ liệu của bạn nên bắt đầu ở mức khởi điểm." })
      const a = estimateAbility(res.rows.map((r) => ({ exerciseId: r.exercise_id, topic: r.topic, correct: r.correct, created_at: r.created_at })), itemMeta as unknown as ItemMeta, "grammar")
      setStart({
        position: startPositionFor(ratings, a.rating),
        note: a.n === 0 ? "Chưa có dữ liệu của bạn nên bắt đầu ở mức khởi điểm." : `Bắt đầu theo mức ước lượng của bạn (Ngữ pháp ≈ Bậc ${Math.max(1, a.bac)}, độ tin cậy ${CONFIDENCE_LABEL[a.confidence]}).`,
      })
    })
    return () => {
      cancelled = true
    }
  }, [ladder])

  if (!start) return <p className="text-muted-foreground">Đang chọn câu vừa sức với bạn…</p>
  const first = pickAtPosition(ladder, new Set(), start.position)
  if (!first) return <p className="text-muted-foreground">Chưa đủ câu cho chế độ này.</p>
  return (
    <>
      <p className="mb-3 text-sm text-muted-foreground">{start.note}</p>
      <PracticeSession exercises={[first]} adaptive={{ ladder, count: COUNT, start: start.position, steps: MCQ_STEPS }} theoryBase={theoryBase} rules={rules} />
    </>
  )
}
