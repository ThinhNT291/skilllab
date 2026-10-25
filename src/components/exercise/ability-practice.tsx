"use client"

import { useEffect, useState } from "react"
import type { Exercise } from "@/lib/content/types"
import type { RuleHints } from "@/lib/content/rule-hints"
import { pickWarmup, usagesInRound } from "@/lib/content/rule-hints"
import { mixVariants } from "@/lib/content/derive"
import { pickRound, pickRoundByAbility } from "@/lib/content/rounds"
import { getRecentTopicRows } from "@/lib/db"
import { estimateAbility, type ItemMeta } from "@/lib/progress/ability"
import itemMeta from "@/content/meta/items.json"
import { PreLesson } from "./pre-lesson"
import { PracticeSession } from "./practice-session"

/**
 * Lượt luyện thường chọn câu quanh trình độ ước lượng của bạn (tăng dần trong lượt; làm tốt thì lượt sau khó hơn).
 * Chưa có dữ liệu thì dùng lượt chuẩn 4 dễ / 3 vừa / 3 khó. Mọi câu vẫn lấy trong chuyên đề này.
 */
export function AbilityPractice({ all, topic, rules, bonusHref }: { all: Exercise[]; topic: string; rules: RuleHints; bonusHref?: string }) {
  const [round, setRound] = useState<{ exercises: Exercise[]; note: string } | null>(null)

  useEffect(() => {
    let cancelled = false
    getRecentTopicRows(1000).then((res) => {
      if (cancelled) return
      const a = res.ok ? estimateAbility(res.rows.map((r) => ({ exerciseId: r.exercise_id, topic: r.topic, correct: r.correct, created_at: r.created_at })), itemMeta as unknown as ItemMeta, "grammar") : null
      const personal = a !== null && a.n > 0
      const base = personal ? pickRoundByAbility(all, a.rating) : pickRound(all)
      setRound({
        exercises: mixVariants(base),
        note: personal ? "Câu hỏi được chọn quanh trình độ của bạn: bắt đầu nhẹ nhàng rồi khó dần." : "Lượt chuẩn: từ dễ đến khó. Làm vài lượt, hệ thống sẽ chọn câu vừa sức hơn cho bạn.",
      })
    })
    return () => {
      cancelled = true
    }
  }, [all])

  if (!round) return <p className="text-muted-foreground">Đang chọn câu vừa sức với bạn…</p>
  return (
    <>
      <p className="mb-3 text-sm text-muted-foreground">{round.note}</p>
      <PreLesson rules={usagesInRound(round.exercises).map((id) => rules[id]).filter(Boolean)} warmup={pickWarmup(all, round.exercises)} topicHref={`/hoc/${topic}`}>
        <PracticeSession exercises={round.exercises} theoryBase={`/hoc/${topic}`} rules={rules} bonusHref={bonusHref} />
      </PreLesson>
    </>
  )
}
