"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { bacLabel } from "@/lib/content/bac"
import type { Bac } from "@/lib/content/types"
import { summarizeAttempts, type AttemptRow, type SkillSummary } from "@/lib/analytics/attempts"
import { getAttempts } from "@/lib/db"
import { CRITERIA, MAX_PER_CRITERION } from "@/lib/rubric"

const LABEL = { writing: "✍️ Viết", speaking: "🎙 Nói" } as const
const HREF = { writing: "/viet", speaking: "/noi" } as const

function Spark({ values }: { values: number[] }) {
  if (values.length < 2) return null
  const w = 160
  const h = 40
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - (v / 10) * h}`).join(" ")
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-10 w-40" role="img" aria-label={`Điểm các bài gần đây: ${values.join(", ")}`}>
      <polyline points={pts} fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

/** Điểm Viết/Nói: bài gần nhất theo từng tiêu chí và xu hướng. Ẩn nếu chưa có bài nào hoặc chưa chạy migration 0006. */
export function AttemptsPanel() {
  const [rows, setRows] = useState<AttemptRow[] | null>(null)

  useEffect(() => {
    let cancelled = false
    getAttempts().then((r) => {
      if (!cancelled && r.ok) setRows(r.rows)
    })
    return () => {
      cancelled = true
    }
  }, [])

  if (!rows || rows.length === 0) return null
  const skills = summarizeAttempts(rows).filter((s) => s.count > 0)
  return (
    <section aria-labelledby="attempts-heading">
      <h2 id="attempts-heading" className="mb-3 text-xl font-extrabold">
        Viết và Nói
      </h2>
      <div className="grid gap-3 md:grid-cols-2">
        {skills.map((s) => (
          <SkillCard key={s.skill} s={s} />
        ))}
      </div>
      <p className="mt-2 text-sm text-muted-foreground">Điểm do máy chấm, chỉ để tham khảo. Hệ thống chỉ lưu điểm, không lưu bài làm hay bản ghi âm.</p>
    </section>
  )
}

function SkillCard({ s }: { s: SkillSummary }) {
  const last = s.latest!
  return (
    <div className="rounded-game border-2 border-border bg-card p-4">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-extrabold">{LABEL[s.skill]}</span>
        <span className="text-sm text-muted-foreground">{s.count} bài</span>
      </div>
      <div className="mt-1 flex items-center justify-between gap-3">
        <div>
          <p className="text-3xl font-extrabold">{Number(last.total)}/10</p>
          <p className="text-sm text-muted-foreground">
            Bài gần nhất · tốt nhất {s.best}/10
            {s.trend !== null && <span className={s.trend >= 0 ? "text-success" : "text-danger"}> · {s.trend >= 0 ? "▲" : "▼"} {Math.abs(s.trend)}</span>}
          </p>
        </div>
        <Spark values={s.series} />
      </div>
      <ul className="mt-3 space-y-1 text-sm">
        {CRITERIA[s.skill].map((c) => (
          <li key={c.key} className="flex justify-between gap-3">
            <span>{c.label}</span>
            <strong>
              {last.scores[c.key] ?? 0}/{MAX_PER_CRITERION}
            </strong>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-sm text-muted-foreground">Mức thể hiện (ước lượng): {last.estimated_bac === 0 ? "dưới Bậc 1" : bacLabel(last.estimated_bac as Bac)}</p>
      {last.note && <p className="mt-1 text-sm">🎯 {last.note}</p>}
      <Link href={HREF[s.skill]} className="mt-2 inline-block text-primary underline underline-offset-4">
        Làm bài mới
      </Link>
    </div>
  )
}
