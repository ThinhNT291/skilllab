"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import type { AnswerRecord, Exercise } from "@/lib/content/types"
import { sfx } from "@/lib/audio/sfx"
import { applySprint, initialSprint, sprintTitle, SPRINT_SECONDS, type SprintState } from "@/lib/game/sprint"
import { useSettings } from "@/lib/settings"
import { ExerciseView, type Result } from "@/components/exercise/views"
import { ProgressBar } from "@/components/exercise/progress-bar"

const NEXT_DELAY_MS = 700

function loadBest(key: string): number {
  try {
    return Number(localStorage.getItem(key)) || 0
  } catch {
    return 0
  }
}

/**
 * Game mini bấm giờ 60 giây (thử thách từ vựng, xếp từ chạy đua, nghe-gõ): nhận danh sách câu bất kỳ, trả điểm.
 * Độc lập với nguồn nội dung; `onAnswer` để nơi dùng ghi kết quả. `bestKey` là khóa lưu điểm cao nhất theo máy.
 */
export function SprintGame({ exercises, onAnswer, bestKey, backHref, intro }: { exercises: Exercise[]; onAnswer?: (record: AnswerRecord, exercise: Exercise) => void; bestKey: string; backHref: string; intro?: string }) {
  const { sound } = useSettings()
  const [phase, setPhase] = useState<"ready" | "run" | "done">("ready")
  const [left, setLeft] = useState(SPRINT_SECONDS)
  const [index, setIndex] = useState(0)
  const [result, setResult] = useState<Result | null>(null)
  const [stats, setStats] = useState<SprintState>(initialSprint)
  const [best, setBest] = useState({ value: 0, isNew: false })
  const statsRef = useRef(stats)

  function finish(final: SprintState) {
    const prev = loadBest(bestKey)
    const isNew = final.score > prev
    if (isNew) {
      try {
        localStorage.setItem(bestKey, String(final.score))
      } catch {
        // Bỏ qua: điểm cao nhất chỉ giữ trong phiên này
      }
    }
    setBest({ value: Math.max(prev, final.score), isNew })
    setPhase("done")
  }

  useEffect(() => {
    if (phase !== "run") return
    const id = setInterval(() => {
      setLeft((l) => {
        if (l <= 1) {
          clearInterval(id)
          queueMicrotask(() => finish(statsRef.current))
          return 0
        }
        return l - 1
      })
    }, 1000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  function start() {
    statsRef.current = initialSprint
    setStats(initialSprint)
    setLeft(SPRINT_SECONDS)
    setIndex(0)
    setResult(null)
    setPhase("run")
  }

  function resolve(r: Result) {
    if (result || phase !== "run") return
    const ex = exercises[index]
    const next = applySprint(statsRef.current, r.correct)
    statsRef.current = next
    setStats(next)
    setResult(r)
    if (sound) (r.correct ? sfx.correct : sfx.wrong)()
    onAnswer?.({ exerciseId: ex.id, correct: r.correct, choiceIndex: r.choiceIndex }, ex)
    setTimeout(() => {
      if (index + 1 >= exercises.length) {
        finish(statsRef.current)
        return
      }
      setIndex((i) => i + 1)
      setResult(null)
    }, NEXT_DELAY_MS)
  }

  if (phase === "ready") {
    return (
      <div className="rounded-game border-2 border-border bg-card p-6 text-center">
        <p className="text-5xl" aria-hidden="true">
          ⚡
        </p>
        <p className="mt-2 text-xl font-extrabold">{intro ?? `Trả lời thật nhiều câu trong ${SPRINT_SECONDS} giây`}</p>
        <p className="text-muted-foreground">Mỗi câu đúng 10 điểm, đúng liên tiếp 5 câu được thưởng thêm. Sai không bị trừ điểm.</p>
        <button
          type="button"
          onClick={start}
          className="mt-4 rounded-game border-b-[5px] border-primary-deep bg-primary px-8 py-3 text-xl font-extrabold text-primary-foreground active:translate-y-[3px] active:border-b-2"
        >
          Bắt đầu
        </button>
      </div>
    )
  }

  if (phase === "done") {
    return (
      <div className="anim-pop rounded-game border-2 border-border bg-card p-6 text-center">
        <p className="text-5xl" aria-hidden="true">
          🏁
        </p>
        <p className="mt-2 text-2xl font-extrabold">{sprintTitle(stats.score)}</p>
        <p className="my-2 text-4xl font-extrabold text-primary">{stats.score} điểm</p>
        <p className="text-muted-foreground">
          Đúng {stats.correct} · sai {stats.wrong} · chuỗi đúng dài nhất {stats.bestStreak}
        </p>
        <p className="mt-1 font-extrabold" role="status">
          {best.isNew ? "🎉 Kỷ lục mới!" : `Kỷ lục của bạn: ${best.value} điểm`}
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={start} className="rounded-game border-b-[5px] border-primary-deep bg-primary px-5 py-2.5 text-lg font-extrabold text-primary-foreground active:translate-y-[3px] active:border-b-2">
            Chơi lại
          </button>
          <Link href={backHref} className="rounded-game border-2 border-border bg-card px-4 py-2.5 font-extrabold hover:border-primary">
            Quay lại
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-3 rounded-game border-2 border-border bg-card px-4 py-3">
        <p className="shrink-0 text-2xl font-extrabold" aria-label={`Còn ${left} giây`}>
          ⏱ {left}
        </p>
        <div className="flex min-w-0 flex-1">
          <ProgressBar value={left / SPRINT_SECONDS} label="Thời gian còn lại" />
        </div>
        <p className="shrink-0 font-extrabold">
          {stats.score} <span className="text-sm text-muted-foreground">điểm</span>
        </p>
      </div>
      <ExerciseView key={exercises[index].id} ex={exercises[index]} result={result} onResolve={resolve} />
    </div>
  )
}
