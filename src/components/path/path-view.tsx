"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { getPathResults, getPathStart, getPlacementOverview, getRecentTopicRows, raisePathStart, type PathStart } from "@/lib/db"
import { levelLabel } from "@/lib/content/bac"
import { vnDayKey } from "@/lib/analytics/activity"
import { parseResult } from "@/lib/placement/full"
import { KIND_LABEL, STEPS_PER_BAC, type PathStep } from "@/lib/path/catalog"
import { pickToday, skillWeights, weakestSkill } from "@/lib/path/focus"
import { rowsByBac, type GateAnswer } from "@/lib/path/gate"
import { jumpReadinessAt, type JumpReadiness } from "@/lib/path/jump"
import { computePath, lessonPassed, nextLesson, skippedSteps, type LessonResult, type StepState } from "@/lib/path/progress"
import { bestStart, startFromPlacement, startIndexOf, startOrder } from "@/lib/path/start"
import type { ItemMeta } from "@/lib/progress/ability"
import { useProfile } from "@/components/progress/use-profile"
import itemMeta from "@/content/meta/items.json"

const BTN = "inline-block rounded-game border-b-[5px] border-primary-deep bg-primary px-5 py-3 text-lg font-extrabold text-primary-foreground active:translate-y-[3px] active:border-b-2"
const TODAY_COUNT = 4

const CHIP: Record<StepState["status"], string> = {
  done: "bg-success-soft text-foreground",
  current: "bg-primary text-primary-foreground",
  trial: "bg-card text-foreground border border-border",
  locked: "bg-card text-muted-foreground border border-dashed border-border",
  review: "bg-card text-muted-foreground border border-border",
  gated: "bg-card text-foreground border-2 border-primary",
}

function chipText(s: StepState): string {
  if (s.step.lessons.length === 0) return "Sắp có nội dung"
  if (s.status === "done") return s.viaTrial ? "✓ Xong (thử sức)" : "✓ Xong"
  if (s.status === "current") return "Đang học"
  if (s.status === "trial") return s.skipped ? "Bỏ qua, quay lại được" : "Thử sức"
  if (s.status === "review") return "Ôn lại (không bắt buộc)"
  if (s.status === "gated") return "Chờ lên bậc"
  return "🔒 Chưa mở"
}

const SOURCE_TEXT = { placement: "theo bài xếp trình độ", leap: "nhờ bài vượt cấp" } as const

/** Bản đồ Lộ trình: nấc hiện tại, bài hôm nay, các nấc theo bậc. Trạng thái tính lại từ kết quả từng bài (`lib/path/progress.ts`). */
export function PathView({ path }: { path: PathStep[] }) {
  const [results, setResults] = useState<Map<string, LessonResult> | null>(null)
  const [start, setStart] = useState<PathStart | null>(null)
  const [answers, setAnswers] = useState<GateAnswer[]>([])
  const [error, setError] = useState<string | null>(null)
  const profile = useProfile()

  useEffect(() => {
    let cancelled = false
    Promise.all([getPathResults(), getPathStart(), getPlacementOverview(), getRecentTopicRows(1000)]).then(([res, saved, placement, rows]) => {
      if (cancelled) return
      if (res.ok) setResults(res.results)
      else {
        setResults(new Map())
        if (res.reason === "error") setError(res.message ?? "lỗi không rõ")
      }
      if (rows.ok) setAnswers(rows.rows)
      // Điểm bắt đầu: cao nhất giữa điểm đã lưu và bài xếp trình độ gần nhất (chỉ tăng, không hạ).
      const placed = placement.ok && placement.completed[0] ? parseResult(placement.completed[0].result) : null
      const { start: best, changed } = bestStart(saved.ok ? saved.start : null, [placed ? startFromPlacement(placed.overall.bac) : null])
      setStart(best)
      if (changed && best) void raisePathStart(best.bac, best.step, best.source)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const map = useMemo(() => results ?? new Map<string, LessonResult>(), [results])
  const byBac = useMemo(() => rowsByBac(answers, itemMeta as unknown as ItemMeta, vnDayKey), [answers])
  const readiness = useMemo(() => {
    const out = new Map<number, JumpReadiness>()
    for (let b = 1; b <= 6; b++) out.set(b, jumpReadinessAt(b, byBac.get(b) ?? [], null))
    return out
  }, [byBac])
  const startIndex = useMemo(() => startIndexOf(path, start), [path, start])
  const state = useMemo(() => computePath(path, map, { startIndex, bacCleared: (b) => b >= 6 || (readiness.get(b)?.ready ?? false) }), [path, map, startIndex, readiness])
  const next = useMemo(() => nextLesson(state, map), [state, map])
  const weakest = useMemo(() => weakestSkill((profile?.abilities ?? []).map((a) => ({ skill: a.skill, rating: a.rating, reliable: a.confidence !== "low" }))), [profile])
  const today = useMemo(() => {
    const cur = state.steps[state.frontier]
    if (!cur || cur.status === "gated") return []
    return pickToday(cur.step.lessons.filter((l) => !lessonPassed(map.get(l.id), l.bac)), TODAY_COUNT, skillWeights(weakest))
  }, [state, map, weakest])

  if (results === null) return <p className="text-muted-foreground">Đang tải Lộ trình…</p>

  const cur = state.steps[state.frontier]
  const skipped = skippedSteps(state)
  const bacOfBar = state.gatedBac ?? cur?.step.bac
  const bar = bacOfBar ? readiness.get(bacOfBar) : undefined
  return (
    <div className="space-y-6">
      {error && <p className="rounded-game border-2 border-dashed border-border p-3 text-sm text-muted-foreground">Chưa đọc được kết quả đã lưu ({error}). Đã chạy các tệp 0014 và 0015 trong Supabase chưa? Lộ trình vẫn xem được nhưng chưa nhớ tiến độ.</p>}

      <section className="rounded-game border-2 border-border bg-card p-5">
        {cur ? (
          <>
            <p className="text-sm text-muted-foreground">
              Bạn đang ở
              {start && startOrder(start.bac, start.step) > 0 ? ` (bắt đầu từ ${levelLabel(start.bac)} · chặng ${start.step}, ${SOURCE_TEXT[start.source]})` : ""}
            </p>
            <p className="text-2xl font-extrabold">
              {levelLabel(cur.step.bac)} · chặng {cur.step.stepInBac}/{STEPS_PER_BAC}
            </p>
            {cur.status === "gated" && state.gatedBac ? (
              <GateBox bac={state.gatedBac} readiness={readiness.get(state.gatedBac)!} />
            ) : (
              <>
                <p className="mt-1 text-muted-foreground">
                  Xong {cur.passed}/{cur.total} bài của chặng này.
                </p>
                {next ? (
                  <Link href={`/lo-trinh/bai/${next.id}`} className={`${BTN} mt-3`}>
                    Học tiếp: {next.title}
                  </Link>
                ) : (
                  <p className="mt-3 font-extrabold">Chặng này chưa có bài để làm. Nội dung đang được bổ sung.</p>
                )}
                {today.length > 1 && (
                  <div className="mt-4">
                    <p className="font-extrabold">Gợi ý cho hôm nay</p>
                    <ul className="mt-1 space-y-1">
                      {today.map((l) => (
                        <li key={l.id}>
                          <Link href={`/lo-trinh/bai/${l.id}`} className="text-primary underline underline-offset-4">
                            {KIND_LABEL[l.kind]} · {l.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                    {weakest && <p className="mt-2 text-sm text-muted-foreground">Mình thêm một chút {KIND_LABEL[weakest]} vì đây đang là phần bạn cần luyện nhất. Chỉ là gợi ý, bạn chọn bài nào cũng được.</p>}
                  </div>
                )}
              </>
            )}
            {bar && bacOfBar && bacOfBar < 6 && cur.status !== "gated" && <JumpBar bac={bacOfBar} readiness={bar} />}
          </>
        ) : (
          <p className="text-xl font-extrabold">🎉 Bạn đã đi hết các nấc có sẵn! Nội dung mới sẽ được thêm dần.</p>
        )}
      </section>

      <p className="text-sm text-muted-foreground">
        Làm hết bài trong một chặng thì chặng kế mở ra. Bạn cũng được thử sức tối đa hai chặng phía trên, hoặc bấm <strong>Vượt cấp</strong> ở một chặng cao hơn: làm đúng hết 20 câu ở chặng đó thì bạn được bắt đầu từ đó (các chặng dưới vẫn mở để ôn). Thử sức không đổi bậc; lên bậc kế cần học đều nhiều ngày, và bậc càng cao càng cần nhiều câu, nhiều ngày hơn. Muốn bắt đầu cao hơn ngay? <Link href="/xep-trinh-do/tong-hop" className="text-primary underline underline-offset-4">Làm bài xếp trình độ</Link>.
      </p>
      {skipped.length > 0 && (
        <p className="rounded-game border-2 border-dashed border-border p-3 text-sm text-muted-foreground">
          Có {skipped.length} chặng đang bị bỏ qua. Không bắt buộc, nhưng quay lại làm sẽ giúp nền vững hơn.
        </p>
      )}

      {[...new Set(path.map((s) => s.bac))].map((bac) => {
        const steps = state.steps.filter((s) => s.step.bac === bac)
        if (steps.every((s) => s.step.lessons.length === 0)) return null
        return (
          <section key={bac}>
            <h2 className="mb-2 text-xl font-extrabold">{levelLabel(bac)}</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {steps.map((s) => (
                <StepCard key={s.step.id} s={s} map={map} canLeap={s.step.index > state.frontier && s.step.lessons.length > 0 && s.status !== "done"} />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function JumpBar({ bac, readiness }: { bac: number; readiness: JumpReadiness }) {
  return (
    <details className="mt-4 text-sm">
      <summary className="cursor-pointer">
        <span className="font-extrabold">Tiến độ lên {levelLabel(bac + 1)}:</span> {Math.round(readiness.progress * 100)}%
        <span className="mt-1 block h-2 overflow-hidden rounded-full bg-muted" aria-hidden>
          <span className="block h-full bg-primary" style={{ width: `${Math.round(readiness.progress * 100)}%` }} />
        </span>
      </summary>
      <Checks readiness={readiness} />
    </details>
  )
}

function Checks({ readiness }: { readiness: JumpReadiness }) {
  return (
    <ul className="mt-2 space-y-1">
      {readiness.checks.map((c) => (
        <li key={c.id}>
          {c.ok ? "✓" : "○"} {c.label}: <strong>{c.value}</strong>
        </li>
      ))}
    </ul>
  )
}

function GateBox({ bac, readiness }: { bac: number; readiness: JumpReadiness }) {
  return (
    <div className="mt-2">
      <p className="font-extrabold">Bạn đã làm hết các chặng của {levelLabel(bac)} 🎉</p>
      <p className="mt-1 text-muted-foreground">Để lên {levelLabel(bac + 1)}, bạn cần luyện đều thêm một chút ở bậc này (làm lại các bài, luyện chủ điểm, ôn thẻ…). Còn thiếu:</p>
      <Checks readiness={readiness} />
      <p className="mt-2 text-sm text-muted-foreground">Tiến độ {Math.round(readiness.progress * 100)}%. Bậc càng cao càng cần nhiều câu và nhiều ngày hơn, để chắc chắn bạn đã vững.</p>
    </div>
  )
}

function StepCard({ s, map, canLeap }: { s: StepState; map: Map<string, LessonResult>; canLeap: boolean }) {
  const open = s.status !== "locked" && s.status !== "gated"
  return (
    <details className={`rounded-game border-2 bg-card p-4 ${s.status === "current" ? "border-primary" : "border-border"}`} open={s.status === "current"}>
      <summary className="cursor-pointer list-none">
        <span className="flex items-center justify-between gap-2">
          <span className="font-extrabold">Chặng {s.step.stepInBac}</span>
          <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${CHIP[s.status]}`}>{chipText(s)}</span>
        </span>
        <span className="mt-1 block text-sm text-muted-foreground">
          {s.passed}/{s.total} bài
        </span>
        <span className="mt-2 block h-2 overflow-hidden rounded-full bg-muted" aria-hidden>
          <span className="block h-full bg-primary" style={{ width: `${s.total ? Math.round((s.passed / s.total) * 100) : 0}%` }} />
        </span>
      </summary>
      {canLeap && (
        <Link href={`/lo-trinh/vuot-cap/b${s.step.bac}-s${s.step.stepInBac}`} className="mt-3 inline-block rounded-game border-2 border-primary px-3 py-1 text-sm font-extrabold text-primary hover:bg-primary hover:text-primary-foreground">
          🚀 Vượt cấp tới đây (20 câu)
        </Link>
      )}
      <ul className="mt-3 space-y-1 text-sm">
        {s.step.lessons.map((l) => {
          const r = map.get(l.id)
          const ok = lessonPassed(r, l.bac)
          return (
            <li key={l.id} className="flex items-center justify-between gap-2">
              {open ? (
                <Link href={`/lo-trinh/bai/${l.id}`} className="text-primary underline underline-offset-4">
                  {KIND_LABEL[l.kind]} · {l.title}
                </Link>
              ) : (
                <span className="text-muted-foreground">
                  {KIND_LABEL[l.kind]} · {l.title}
                </span>
              )}
              <span className={ok ? "font-bold" : "text-muted-foreground"}>{ok ? "✓" : r ? `${Math.round(r.bestRatio * 100)}%` : ""}</span>
            </li>
          )
        })}
      </ul>
    </details>
  )
}
