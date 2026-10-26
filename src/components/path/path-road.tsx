"use client"

import { useEffect, useRef, useState } from "react"
import { levelLabel } from "@/lib/content/bac"
import { STEPS_PER_BAC } from "@/lib/path/catalog"
import type { JumpReadiness } from "@/lib/path/jump"
import type { LessonResult, PathState, StepState } from "@/lib/path/progress"
import { NO_EVENTS, type CelebrationEvents } from "@/lib/path/celebrate"
import { getOwnedItems } from "@/lib/db"
import { Mascot } from "@/components/game/mascot"
import { LeapLink, LessonList } from "./step-parts"

const ROW = 104
const XS = [20, 56, 80, 50, 22]

interface Look {
  icon: string
  ring: string
  label: string
}

/** Dáng của một điểm dừng theo trạng thái chặng. Chỉ dùng màu của giao diện (đã đạt độ tương phản ở cả 3 skin). */
function look(s: StepState): Look {
  if (s.step.lessons.length === 0) return { icon: "…", ring: "border-dashed border-border bg-card text-muted-foreground", label: "Sắp có" }
  switch (s.status) {
    case "done":
      return { icon: "✓", ring: "border-success bg-success-soft", label: s.viaTrial ? "Xong (thử sức)" : "Xong" }
    case "current":
      return { icon: String(s.step.stepInBac), ring: "border-primary bg-primary text-primary-foreground node-pulse", label: "Đang học" }
    case "trial":
      return { icon: s.skipped ? "↺" : "⚡", ring: "border-dashed border-primary bg-card", label: s.skipped ? "Bỏ qua" : "Thử sức" }
    case "review":
      return { icon: "↺", ring: "border-border bg-card", label: "Ôn lại" }
    case "gated":
      return { icon: "🚪", ring: "border-primary bg-card", label: "Chờ lên bậc" }
    default:
      return { icon: "🔒", ring: "border-dashed border-border bg-card text-muted-foreground", label: "Chưa mở" }
  }
}

function pathD(points: { x: number; y: number }[]): string {
  return points.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`
    const q = points[i - 1]
    const my = (q.y + p.y) / 2
    return `${acc} C ${q.x} ${my}, ${p.x} ${my}, ${p.x} ${p.y}`
  }, "")
}

/**
 * Bản đồ con đường của Lộ trình: mỗi bậc một đoạn đường uốn lượn năm điểm dừng (chặng), linh vật đứng ở chặng hiện tại,
 * cổng nhảy bậc giữa các bậc. Chạm một điểm dừng để xem các bài của chặng ngay dưới đoạn đường đó.
 */
export function PathRoad({ state, map, readiness, startBac, events = NO_EVENTS }: { state: PathState; map: ReadonlyMap<string, LessonResult>; readiness: ReadonlyMap<number, JumpReadiness>; startBac: number; /** Điều vừa thay đổi kể từ lần xem trước, để ăn mừng */ events?: CelebrationEvents }) {
  const [worn, setWorn] = useState<string[]>([])
  const currentId = state.steps[state.frontier]?.step.id ?? null
  const [picked, setPicked] = useState<string | null>(null)
  const selected = picked ?? currentId
  const detailRef = useRef<HTMLDivElement | null>(null)
  const userPicked = useRef(false)

  useEffect(() => {
    getOwnedItems().then((r) => r.ok && setWorn(r.equipped))
  }, [])

  // Sau khi người dùng chạm một điểm dừng, cuộn tới phần chi tiết (không cuộn lúc mới mở trang).
  useEffect(() => {
    if (!userPicked.current) return
    detailRef.current?.scrollIntoView({ block: "nearest", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" })
  }, [picked])

  const bacs = [...new Set(state.steps.map((s) => s.step.bac))]
  return (
    <div>
      {bacs.map((bac) => {
        const steps = state.steps.filter((s) => s.step.bac === bac)
        if (steps.every((s) => s.step.lessons.length === 0)) return null
        const doneCount = steps.filter((s) => s.status === "done" && s.step.lessons.length > 0).length
        const H = steps.length * ROW
        const pts = steps.map((_, i) => ({ x: XS[i % XS.length], y: i * ROW + ROW / 2 }))
        // Đoạn đã đi: đến chặng hiện tại (hoặc chặng xong cuối cùng nếu bậc đã xong).
        const reached = steps.reduce((k, s, i) => (s.status === "done" || s.status === "current" || s.status === "gated" ? i : k), -1)
        const detail = steps.find((s) => s.step.id === selected)
        const g = readiness.get(bac)
        const cleared = bac < startBac || (g?.ready ?? false)
        return (
          <section key={bac} aria-label={levelLabel(bac)} className="mb-8">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2 rounded-game border-2 border-primary bg-card px-4 py-2">
              <h2 className="text-lg font-extrabold">{levelLabel(bac)}</h2>
              <span className="text-sm font-bold text-muted-foreground">
                {doneCount}/{STEPS_PER_BAC} chặng xong
              </span>
            </div>
            <div className="relative" style={{ height: H }}>
              <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 100 ${H}`} preserveAspectRatio="none" aria-hidden="true">
                <path d={pathD(pts)} fill="none" strokeWidth="6" strokeLinecap="round" strokeDasharray="1 14" className="stroke-border" vectorEffect="non-scaling-stroke" />
                {reached > 0 && <path d={pathD(pts.slice(0, reached + 1))} fill="none" strokeWidth="6" strokeLinecap="round" className="stroke-primary" vectorEffect="non-scaling-stroke" />}
              </svg>
              <ol>
                {steps.map((s, i) => {
                  const p = pts[i]
                  const v = look(s)
                  const right = p.x <= 50
                  const here = s.step.id === currentId
                  const sel = s.step.id === selected
                  return (
                    <li key={s.step.id} className="absolute" style={right ? { top: p.y - 28, left: `${p.x}%`, transform: "translateX(-28px)" } : { top: p.y - 28, right: `${100 - p.x}%`, transform: "translateX(28px)" }}>
                      <button
                        type="button"
                        aria-pressed={sel}
                        onClick={() => {
                          userPicked.current = true
                          setPicked(s.step.id)
                        }}
                        className="group flex items-center gap-3"
                      >
                        <span className="relative shrink-0">
                          <span className={`flex h-14 w-14 items-center justify-center rounded-full border-4 text-xl font-extrabold group-hover:border-primary ${v.ring} ${sel ? "ring-4 ring-primary/40" : ""} ${events.newlyDone.includes(s.step.id) ? "node-done-pop" : ""}`} aria-hidden="true">
                            {v.icon}
                          </span>
                          {here && <Mascot mood={events.movedTo === s.step.id || events.newlyDone.length > 0 ? "cheer" : "happy"} size={46} items={worn} className="mascot-float pointer-events-none absolute -top-9 -right-4" />}
                        </span>
                        <span className={`max-w-[9rem] text-sm font-extrabold leading-tight ${right ? "text-left" : "order-first text-right"}`}>
                          Chặng {s.step.stepInBac}
                          <span className="block text-xs font-normal text-muted-foreground">{v.label}</span>
                          {s.total > 0 && (
                            <span className="block text-xs font-normal text-muted-foreground">
                              {s.passed}/{s.total} bài
                            </span>
                          )}
                          <span className="sr-only">, {levelLabel(bac)}</span>
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ol>
            </div>

            {detail && (
              <div ref={detail.step.id === selected ? detailRef : undefined} className="anim-pop mt-1 rounded-game border-2 border-border bg-card p-4" aria-live="polite">
                <p className="mb-2 font-extrabold">
                  Chặng {detail.step.stepInBac} · {look(detail).label}
                </p>
                {detail.step.lessons.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nội dung của chặng này đang được bổ sung.</p>
                ) : (
                  <>
                    {detail.status === "gated" && <p className="mb-2 text-sm text-muted-foreground">Bạn cần luyện đều thêm ở bậc trước để mở chặng này. Xem điều kiện ở cổng bên dưới bậc trước.</p>}
                    {detail.status === "locked" && <p className="mb-2 text-sm text-muted-foreground">Chặng này chưa mở. Bạn có thể vượt cấp nếu đã chắc ở trình độ này.</p>}
                    {detail.step.index > state.frontier && detail.status !== "done" && (
                      <div className="mb-3">
                        <LeapLink s={detail} />
                      </div>
                    )}
                    <LessonList s={detail} map={map} />
                  </>
                )}
              </div>
            )}

            {bac < 6 && g && <Gate bac={bac} readiness={g} cleared={cleared} justOpened={events.gatesOpened.includes(bac)} />}
          </section>
        )
      })}
    </div>
  )
}

/** Cổng giữa hai bậc: hiện điều kiện nhảy bậc và mức đã đạt. */
function Gate({ bac, readiness, cleared, justOpened }: { bac: number; readiness: JumpReadiness; cleared: boolean; justOpened: boolean }) {
  const pct = Math.round(readiness.progress * 100)
  return (
    <details className={`mt-3 rounded-game border-2 border-dashed border-border bg-card px-4 py-3 ${justOpened ? "gate-open" : ""}`}>
      <summary className="cursor-pointer list-none">
        <span className="flex items-center justify-between gap-2 font-extrabold">
          <span>
            <span aria-hidden="true" className="gate-icon">{cleared ? "🚪✅" : "🚪"}</span> Cổng lên {levelLabel(bac + 1)}
          </span>
          <span className="text-sm">{cleared ? "đã mở" : `${pct}%`}</span>
        </span>
        <span className="mt-2 block h-2 overflow-hidden rounded-full bg-muted" aria-hidden="true">
          <span className="block h-full bg-primary" style={{ width: `${cleared ? 100 : pct}%` }} />
        </span>
      </summary>
      <ul className="mt-2 space-y-1 text-sm">
        {readiness.checks.map((c) => (
          <li key={c.id}>
            {c.ok ? "✓" : "○"} {c.label}: <strong>{c.value}</strong>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-muted-foreground">Bậc càng cao càng cần nhiều câu và nhiều ngày hơn. Học đều mỗi ngày là cách nhanh nhất.</p>
    </details>
  )
}
