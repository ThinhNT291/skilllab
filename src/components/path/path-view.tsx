"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import confetti from "canvas-confetti"
import { updateSettings, useSettings } from "@/lib/settings"
import Link from "next/link"
import { levelLabel } from "@/lib/content/bac"
import { KIND_LABEL, STEPS_PER_BAC, type PathStep } from "@/lib/path/catalog"
import { pickToday, skillWeights, weakestSkill } from "@/lib/path/focus"
import type { JumpReadiness } from "@/lib/path/jump"
import { lessonPassed, skippedSteps, type LessonResult, type StepState } from "@/lib/path/progress"
import { startOrder } from "@/lib/path/start"
import { useProfile } from "@/components/progress/use-profile"
import { usePathState } from "./use-path-state"
import { PathRoad } from "./path-road"
import { describeEvents, diffSnapshot, hasEvents, NO_EVENTS, parseSnapshot, snapshotOf } from "@/lib/path/celebrate"
import { LeapLink, LessonList } from "./step-parts"

const BTN = "inline-block rounded-game border-b-[5px] border-primary-deep bg-primary px-5 py-3 text-lg font-extrabold text-primary-foreground active:translate-y-[3px] active:border-b-2"
const TODAY_COUNT = 4
const SEEN_KEY = "skilllab.pathSeen"

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

const SOURCE_TEXT = { placement: "theo bài xếp trình độ", leap: "nhờ bài vượt cấp", challenge: "nhờ Phòng thử thách" } as const

/** Bản đồ Lộ trình: nấc hiện tại, bài hôm nay, các nấc theo bậc. Trạng thái tính lại từ kết quả từng bài (`lib/path/progress.ts`). */
export function PathView({ path }: { path: PathStep[] }) {
  const { loading, error, results: map, start, readiness, state, next } = usePathState(path)
  const profile = useProfile()
  const { pathView: view } = useSettings()
  // Ảnh chụp trạng thái lần xem trước (lưu ở trình duyệt): đọc một lần lúc mở trang, để so với trạng thái hiện tại.
  const [prevSeen] = useState(() => {
    try {
      return parseSnapshot(JSON.parse(localStorage.getItem(SEEN_KEY) ?? "null"))
    } catch {
      return null
    }
  })
  const snapshot = useMemo(() => snapshotOf(state, [1, 2, 3, 4, 5].filter((b) => readiness.get(b)?.ready)), [state, readiness])
  // Chặng vừa xong, cổng vừa mở so với lần xem trước thì ăn mừng. Lần đầu xem (chưa có ảnh chụp) chỉ ghi lại, không ăn mừng.
  const events = useMemo(() => (loading ? NO_EVENTS : diffSnapshot(prevSeen, snapshot)), [loading, prevSeen, snapshot])
  const celebrated = useRef(false)
  useEffect(() => {
    if (loading || celebrated.current) return
    celebrated.current = true
    try {
      localStorage.setItem(SEEN_KEY, JSON.stringify(snapshot))
    } catch {
      // Trình duyệt chặn lưu trữ: bỏ qua, chỉ mất việc ăn mừng lần sau
    }
    if (hasEvents(events) && (events.newlyDone.length > 0 || events.gatesOpened.length > 0) && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) confetti({ particleCount: events.gatesOpened.length ? 160 : 90, spread: 80, origin: { y: 0.4 } })
  }, [loading, snapshot, events])
  const celebration = useMemo(() => describeEvents(events, (id) => { const st = state.steps.find((x) => x.step.id === id); return st ? `${levelLabel(st.step.bac)} · chặng ${st.step.stepInBac}` : "chặng mới" }, levelLabel), [events, state])

  const weakest = useMemo(() => weakestSkill((profile?.abilities ?? []).map((a) => ({ skill: a.skill, rating: a.rating, reliable: a.confidence !== "low" }))), [profile])
  const today = useMemo(() => {
    const cur = state.steps[state.frontier]
    if (!cur || cur.status === "gated") return []
    return pickToday(cur.step.lessons.filter((l) => !lessonPassed(map.get(l.id), l.bac)), TODAY_COUNT, skillWeights(weakest))
  }, [state, map, weakest])

  if (loading) return <p className="text-muted-foreground">Đang tải Lộ trình…</p>

  const cur = state.steps[state.frontier]
  const skipped = skippedSteps(state)
  const bacOfBar = state.gatedBac ?? cur?.step.bac
  const bar = bacOfBar ? readiness.get(bacOfBar) : undefined
  return (
    <div className="space-y-6">
      {error && <p className="rounded-game border-2 border-dashed border-border p-3 text-sm text-muted-foreground">Chưa đọc được kết quả đã lưu ({error}). Đã chạy các tệp 0014 và 0015 trong Supabase chưa? Lộ trình vẫn xem được nhưng chưa nhớ tiến độ.</p>}

      {celebration && (
        <p className="anim-pop rounded-game border-2 border-success bg-success-soft px-4 py-3 font-extrabold" role="status">
          <span aria-hidden="true">🎉 </span>
          {celebration}
        </p>
      )}

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
                          <Link href={`/lo-trinh/bai/${l.id}`} className="inline-block py-1 text-primary underline underline-offset-4">
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
        Làm hết bài trong một chặng thì chặng kế mở ra. Bạn cũng được thử sức tối đa hai chặng phía trên, hoặc bấm <strong>Vượt cấp</strong> ở một chặng cao hơn: làm đúng hết 20 câu ở chặng đó thì bạn được bắt đầu từ đó (các chặng dưới vẫn mở để ôn). Thử sức không đổi bậc; lên bậc kế cần học đều nhiều ngày, và bậc càng cao càng cần nhiều câu, nhiều ngày hơn. Muốn bắt đầu cao hơn ngay? <Link href="/xep-trinh-do/tong-hop" className="text-primary underline underline-offset-4">Làm bài xếp trình độ</Link>, hoặc thử sức ở <Link href="/phong-thu-thach" className="text-primary underline underline-offset-4">Phòng thử thách</Link> (bài tính giờ, chỉ đề xuất, không bao giờ hạ bậc).
      </p>
      {skipped.length > 0 && (
        <p className="rounded-game border-2 border-dashed border-border p-3 text-sm text-muted-foreground">
          Có {skipped.length} chặng đang bị bỏ qua. Không bắt buộc, nhưng quay lại làm sẽ giúp nền vững hơn.
        </p>
      )}

      <div className="flex gap-2" role="group" aria-label="Cách xem Lộ trình">
        {(["road", "list"] as const).map((v) => (
          <button key={v} type="button" aria-pressed={view === v} onClick={() => updateSettings({ pathView: v })} className={`rounded-full border-2 px-3 py-1.5 text-sm font-bold ${view === v ? "border-primary text-primary" : "border-border bg-card"}`}>
            {v === "road" ? "🗺️ Bản đồ" : "☰ Danh sách"}
          </button>
        ))}
      </div>

      {view === "road" ? (
        <PathRoad state={state} map={map} readiness={readiness} startBac={start?.bac ?? 1} events={events} />
      ) : (
        <>
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
        </>
      )}
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
        <div className="mt-3">
          <LeapLink s={s} />
        </div>
      )}
      <div className="mt-3">
        <LessonList s={s} map={map} />
      </div>
    </details>
  )
}
