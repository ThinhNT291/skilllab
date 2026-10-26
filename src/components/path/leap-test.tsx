"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import confetti from "canvas-confetti"
import type { AnswerRecord, Exercise } from "@/lib/content/types"
import { raisePathStart, recordAnswer } from "@/lib/db"
import { levelLabel } from "@/lib/content/bac"
import type { LeapPayload } from "@/lib/path/data"
import { leapPassed } from "@/lib/path/leap"
import { ExerciseRunner } from "@/components/exercise/exercise-runner"
import { ListeningSession } from "@/components/listening/listening-session"
import { ReadingSession } from "@/components/reading/reading-session"

const BTN = "rounded-game border-b-[5px] border-primary-deep bg-primary px-5 py-3 text-center text-lg font-extrabold text-primary-foreground active:translate-y-[3px] active:border-b-2"

type Phase = "items" | "reading" | "listening"

/**
 * Bài vượt cấp: 20 câu đủ kỹ năng của một chặng, chia thành các phần (ngữ pháp + từ vựng, bài đọc, bài nghe).
 * Phải đúng HẾT mới được bắt đầu Lộ trình từ chặng này; không thì tiếp tục ở chặng hiện tại, không mất gì.
 */
export function LeapTest({ payload }: { payload: LeapPayload }) {
  const phases: Phase[] = [...(payload.items.length ? (["items"] as const) : []), ...(payload.reading ? (["reading"] as const) : []), ...(payload.listening ? (["listening"] as const) : [])]
  const [at, setAt] = useState(0)
  const [started, setStarted] = useState(false)
  const [outcome, setOutcome] = useState<{ correct: number; total: number; saved: boolean } | null>(null)
  const tally = useRef({ correct: 0, total: 0 })
  const itemsCorrect = useRef(0)

  async function addPhase(correct: number, total: number) {
    tally.current = { correct: tally.current.correct + correct, total: tally.current.total + total }
    if (at + 1 < phases.length) return setAt(at + 1)
    const { correct: c, total: t } = tally.current
    const passed = leapPassed(c, t)
    const saved = passed ? (await raisePathStart(payload.bac, payload.stepInBac, "leap")).ok : true
    if (passed && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) confetti({ particleCount: 140, spread: 90, origin: { y: 0.6 } })
    setOutcome({ correct: c, total: t, saved })
  }

  function onItemAnswer(record: AnswerRecord) {
    if (record.correct) itemsCorrect.current++
    const ex = payload.items.find((e) => e.id === record.exerciseId)
    if (ex) void recordAnswer(record, ex as Exercise)
  }

  if (!phases.length) return <p className="text-muted-foreground">Chặng này chưa có đủ nội dung để làm bài vượt cấp.</p>
  const totalQuestions = payload.items.length + (payload.reading?.exercises.length ?? 0) + (payload.listening?.exercises.length ?? 0)
  const where = `${levelLabel(payload.bac)} · chặng ${payload.stepInBac}`

  if (outcome) {
    const passed = leapPassed(outcome.correct, outcome.total)
    return (
      <div className="anim-pop rounded-game border-2 border-border bg-card p-6 text-center" role="status">
        <p className="text-5xl">{passed ? "🚀" : "💪"}</p>
        <p className="mt-2 text-2xl font-extrabold">{passed ? "Vượt cấp thành công!" : "Chưa đúng hết lần này"}</p>
        <p className="mt-1 text-xl font-extrabold">
          Đúng {outcome.correct}/{outcome.total} câu
        </p>
        <p className="mt-1 text-muted-foreground">
          {passed ? `Bạn được bắt đầu Lộ trình từ ${where}. Các chặng phía dưới vẫn mở để bạn quay lại ôn.` : "Bài vượt cấp cần đúng hết. Không sao: bạn vẫn tiếp tục từ chặng hiện tại, và có thể thử lại sau (bài sẽ có câu khác)."}
        </p>
        {!outcome.saved && <p className="mt-2 text-sm text-danger">Chưa lưu được điểm bắt đầu (đã chạy tệp 0015_path_state.sql trong Supabase và đăng nhập chưa?).</p>}
        <div className="mt-4 flex flex-col gap-2">
          <Link href="/lo-trinh" className={BTN}>
            Về Lộ trình
          </Link>
        </div>
      </div>
    )
  }

  if (!started) {
    return (
      <div className="rounded-game border-2 border-border bg-card p-6">
        <p className="text-xl font-extrabold">Vượt cấp tới {where}</p>
        <p className="mt-2 text-muted-foreground">
          {totalQuestions} câu về đủ các kỹ năng của chặng này ({phases.length} phần). Phải <strong>đúng hết</strong> thì bạn được bắt đầu Lộ trình từ chặng này. Nếu chưa được, bạn vẫn tiếp tục ở chặng hiện tại, không mất gì.
        </p>
        <button type="button" className={`${BTN} mt-4 w-full`} onClick={() => setStarted(true)}>
          Bắt đầu
        </button>
      </div>
    )
  }

  const phase = phases[at]
  return (
    <div className="space-y-3">
      <p className="text-sm font-bold text-muted-foreground">
        Phần {at + 1}/{phases.length}: {phase === "items" ? "ngữ pháp và từ vựng" : phase === "reading" ? "đọc hiểu" : "nghe hiểu"}
      </p>
      {phase === "items" && <ExerciseRunner key="items" exercises={payload.items} onAnswer={onItemAnswer} onFinish={() => void addPhase(itemsCorrect.current, payload.items.length)} />}
      {phase === "reading" && payload.reading && <ReadingSession key="reading" passage={payload.reading.passage} exercises={payload.reading.exercises} gloss={payload.reading.gloss} onComplete={(c, t) => void addPhase(c, t)} />}
      {phase === "listening" && payload.listening && <ListeningSession key="listening" item={payload.listening.item} exercises={payload.listening.exercises} onComplete={(c, t) => void addPhase(c, t)} />}
    </div>
  )
}
