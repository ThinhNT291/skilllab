"use client"

import { useEffect, useState } from "react"
import { getRecentTopicRows } from "@/lib/db"
import { computeScale, currentBac, SCALE_SKILLS, type BacProgress, type ScaleSkill, type Totals } from "@/lib/progress/scale"
import type { ItemMeta } from "@/lib/progress/ability"
import { candoFor } from "@/lib/content/cando"
import { bacLabel } from "@/lib/content/bac"
import type { Bac } from "@/lib/content/types"
import itemMeta from "@/content/meta/items.json"

const LABEL: Record<ScaleSkill, string> = { grammar: "Ngữ pháp", vocab: "Từ vựng", reading: "Đọc hiểu", listening: "Nghe hiểu" }
const CANDO_SKILL: Partial<Record<ScaleSkill, "listening" | "reading">> = { reading: "reading", listening: "listening" }
const CEFR = ["A1", "A2", "B1", "B2", "C1", "C2"]

function Segment({ p }: { p: BacProgress }) {
  const empty = p.ratio === null
  const pct = Math.round((p.ratio ?? 0) * 100)
  return (
    <li className="min-w-0 flex-1" aria-label={empty ? `${bacLabel(p.bac as Bac)}: chưa có nội dung` : `${bacLabel(p.bac as Bac)}: đã phủ ${pct} phần trăm (${p.covered}/${p.total})`}>
      <div className={`h-3 overflow-hidden rounded-full ${empty ? "border-2 border-dashed border-border" : "bg-border"}`}>
        {!empty && <div className="h-full rounded-full bg-primary transition-[width] duration-700" style={{ width: `${pct}%` }} />}
      </div>
      <p className="mt-1 text-center text-xs text-muted-foreground">
        <span className="font-extrabold text-foreground">{CEFR[p.bac - 1]}</span>
        <br />
        {empty ? "sắp có" : `${pct}%`}
      </p>
    </li>
  )
}

/** Tiến độ theo thang trình độ: mỗi kỹ năng một hàng sáu đoạn (A1–C2), mỗi đoạn là phần nội dung đã phủ. */
export function ScalePanel({ totals }: { totals: Totals }) {
  const [rows, setRows] = useState<Record<ScaleSkill, BacProgress[]> | null>(null)
  useEffect(() => {
    let cancelled = false
    getRecentTopicRows(1000).then((res) => {
      if (cancelled || !res.ok) return
      setRows(computeScale(res.rows.map((r) => ({ exerciseId: r.exercise_id, topic: r.topic, correct: r.correct, created_at: r.created_at })), itemMeta as unknown as ItemMeta, totals))
    })
    return () => {
      cancelled = true
    }
  }, [totals])
  if (!rows) return null
  return (
    <section aria-labelledby="scale-heading" className="rounded-game border-2 border-border bg-card p-4">
      <h2 id="scale-heading" className="text-xl font-extrabold">
        Đường lên các bậc
      </h2>
      <p className="mb-3 text-sm text-muted-foreground">Phần nội dung của từng bậc (A1–C2) bạn đã làm đúng. Bậc nào ghi “sắp có” là chưa có bài, chứ không phải bạn chưa học.</p>
      <ul className="space-y-4">
        {SCALE_SKILLS.map((skill) => {
          const cur = currentBac(rows[skill])
          const cando = cur && CANDO_SKILL[skill] ? candoFor(cur, CANDO_SKILL[skill]!) : null
          return (
            <li key={skill}>
              <p className="mb-1 flex items-baseline justify-between gap-3 font-extrabold">
                {LABEL[skill]}
                <span className="text-sm font-normal text-muted-foreground">{cur ? `đang ở ${bacLabel(cur as Bac)}` : "đã phủ hết nội dung hiện có"}</span>
              </p>
              <ul className="flex gap-1.5">
                {rows[skill].map((p) => (
                  <Segment key={p.bac} p={p} />
                ))}
              </ul>
              {cando && (
                <details className="mt-1 text-sm text-muted-foreground">
                  <summary className="cursor-pointer">Ở {cando.label} ({cando.cefr}) bạn sẽ làm được…</summary>
                  <p className="mt-1">{cando.text}</p>
                </details>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
