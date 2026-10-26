"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { getPathResults } from "@/lib/db"
import { levelLabel } from "@/lib/content/bac"
import { KIND_LABEL, STEPS_PER_BAC, type PathStep } from "@/lib/path/catalog"
import { pickToday, skillWeights, weakestSkill } from "@/lib/path/focus"
import { computePath, lessonPassed, nextLesson, skippedSteps, type LessonResult, type StepState } from "@/lib/path/progress"
import { useProfile } from "@/components/progress/use-profile"

const BTN = "inline-block rounded-game border-b-[5px] border-primary-deep bg-primary px-5 py-3 text-lg font-extrabold text-primary-foreground active:translate-y-[3px] active:border-b-2"
const TODAY_COUNT = 4

const CHIP: Record<StepState["status"], string> = {
  done: "bg-success-soft text-foreground",
  current: "bg-primary text-primary-foreground",
  trial: "bg-card text-foreground border border-border",
  locked: "bg-card text-muted-foreground border border-dashed border-border",
}

function chipText(s: StepState): string {
  if (s.step.lessons.length === 0) return "Sắp có nội dung"
  if (s.status === "done") return s.viaTrial ? "✓ Xong (thử sức)" : "✓ Xong"
  if (s.status === "current") return "Đang học"
  if (s.status === "trial") return s.skipped ? "Bỏ qua, quay lại được" : "Thử sức"
  return "🔒 Chưa mở"
}

/** Bản đồ Lộ trình: nấc hiện tại, bài hôm nay, các nấc theo bậc. Trạng thái tính lại từ kết quả từng bài (`lib/path/progress.ts`). */
export function PathView({ path }: { path: PathStep[] }) {
  const [results, setResults] = useState<Map<string, LessonResult> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const profile = useProfile()

  useEffect(() => {
    let cancelled = false
    getPathResults().then((r) => {
      if (cancelled) return
      if (r.ok) setResults(r.results)
      else {
        setResults(new Map())
        if (r.reason === "error") setError(r.message ?? "lỗi không rõ")
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  const map = useMemo(() => results ?? new Map<string, LessonResult>(), [results])
  const state = useMemo(() => computePath(path, map), [path, map])
  const next = useMemo(() => nextLesson(state, map), [state, map])
  const weakest = useMemo(() => weakestSkill((profile?.abilities ?? []).map((a) => ({ skill: a.skill, rating: a.rating, reliable: a.confidence !== "low" }))), [profile])
  const today = useMemo(() => {
    const cur = state.steps[state.frontier]
    if (!cur) return []
    return pickToday(cur.step.lessons.filter((l) => !lessonPassed(map.get(l.id))), TODAY_COUNT, skillWeights(weakest))
  }, [state, map, weakest])

  if (results === null) return <p className="text-muted-foreground">Đang tải Lộ trình…</p>

  const cur = state.steps[state.frontier]
  const skipped = skippedSteps(state)
  return (
    <div className="space-y-6">
      {error && <p className="rounded-game border-2 border-dashed border-border p-3 text-sm text-muted-foreground">Chưa đọc được kết quả đã lưu ({error}). Đã chạy tệp 0014_path_lessons.sql trong Supabase chưa? Lộ trình vẫn xem được nhưng chưa nhớ tiến độ.</p>}

      <section className="rounded-game border-2 border-border bg-card p-5">
        {cur ? (
          <>
            <p className="text-sm text-muted-foreground">Bạn đang ở</p>
            <p className="text-2xl font-extrabold">
              {levelLabel(cur.step.bac)} · chặng {cur.step.stepInBac}/{STEPS_PER_BAC}
            </p>
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
        ) : (
          <p className="text-xl font-extrabold">🎉 Bạn đã đi hết các nấc có sẵn! Nội dung mới sẽ được thêm dần.</p>
        )}
      </section>

      <p className="text-sm text-muted-foreground">
        Làm hết bài trong một chặng thì chặng kế mở ra. Bạn cũng được thử sức tối đa hai chặng phía trên: làm hết bài của chặng đó thì chặng đó xong, nhưng các chặng bị bỏ qua không tự xong và <strong>Bậc của bạn không đổi</strong> vì thử sức. Bậc chỉ tăng chậm khi bạn học đều nhiều ngày.
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
                <StepCard key={s.step.id} s={s} map={map} />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function StepCard({ s, map }: { s: StepState; map: Map<string, LessonResult> }) {
  const open = s.status !== "locked"
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
      <ul className="mt-3 space-y-1 text-sm">
        {s.step.lessons.map((l) => {
          const r = map.get(l.id)
          const ok = lessonPassed(r)
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
