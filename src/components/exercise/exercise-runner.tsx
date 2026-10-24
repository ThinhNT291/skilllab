"use client"

import { useState } from "react"
import Link from "next/link"
import confetti from "canvas-confetti"
import type { AnswerRecord, Exercise } from "@/lib/content/types"
import { sfx } from "@/lib/audio/sfx"
import { useSettings } from "@/lib/settings"
import { ChoiceButton } from "./choice-button"
import { ProgressBar } from "./progress-bar"

/** Sao theo số câu đúng, tính từ tỷ lệ nhưng làm tròn theo số câu thực tế để cả bài 3 câu lẫn 10 câu đều có đủ mức. */
function starsFor(correct: number, total: number): 0 | 1 | 2 | 3 {
  if (total === 0 || correct === 0) return 0
  const ratio = correct / total
  if (ratio === 1) return 3
  if (ratio >= 0.7) return 2
  return 1
}

function reducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

/**
 * Chạy một lượt bài tập: một câu mỗi lần, chấm tức thì, combo, sao cuối bài.
 * `onAnswer` sau này nối với lớp ghi dữ liệu (SRS, phân tích lỗi); hiện chỉ báo ra ngoài.
 */
export function ExerciseRunner({
  exercises,
  onAnswer,
  theoryHref,
}: {
  exercises: Exercise[]
  onAnswer?: (record: AnswerRecord) => void
  /** Đường dẫn về đúng mục lý thuyết của câu (hiện khi trả lời sai). Trả null nếu không có. */
  theoryHref?: (exercise: Exercise) => string | null
}) {
  const { sound } = useSettings()
  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [correctCount, setCorrectCount] = useState(0)
  const [streak, setStreak] = useState(0)
  const [wrongIds, setWrongIds] = useState<string[]>([])

  const total = exercises.length
  const done = index >= total
  const ex = done ? null : exercises[index]
  const answered = picked !== null

  function choose(i: number) {
    if (!ex || answered) return
    const ok = i === ex.correctIndex
    setPicked(i)
    if (ok) {
      setCorrectCount((c) => c + 1)
      setStreak((s) => s + 1)
    } else {
      setStreak(0)
      setWrongIds((w) => [...w, ex.id])
    }
    if (sound) (ok ? sfx.correct : sfx.wrong)()
    onAnswer?.({ exerciseId: ex.id, correct: ok, choiceIndex: i })
  }

  function next() {
    const last = index + 1 >= total
    setIndex((n) => n + 1)
    setPicked(null)
    if (last && correctCount === total && !reducedMotion()) {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } })
    }
  }

  function restart() {
    setIndex(0)
    setPicked(null)
    setCorrectCount(0)
    setStreak(0)
    setWrongIds([])
  }

  if (done) {
    const stars = starsFor(correctCount, total)
    return (
      <div className="anim-pop rounded-game border-2 border-border bg-card p-6 text-center">
        <p className="text-sm uppercase tracking-wide text-muted-foreground">Kết quả</p>
        <p className="my-2 text-5xl tracking-[0.3em]" aria-label={`${stars} trên 3 sao`}>
          {[0, 1, 2].map((k) => (k < stars ? "⭐" : "☆"))}
        </p>
        <p className="text-2xl font-extrabold">
          Đúng {correctCount}/{total} câu
        </p>
        {wrongIds.length > 0 && <p className="mt-1 text-muted-foreground">{wrongIds.length} câu cần ôn lại</p>}
        <button type="button" onClick={restart} className="mt-4 w-full rounded-game border-b-[5px] border-primary-deep bg-primary py-3 text-lg font-extrabold text-primary-foreground active:translate-y-[3px] active:border-b-2">
          Làm lại
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <ProgressBar value={index / total} label="Tiến độ bài tập" />
        <div className={`min-w-20 text-right font-extrabold text-accent-deep ${streak >= 2 ? "opacity-100" : "opacity-0"}`} aria-live="polite">
          🔥 x{streak}
        </div>
      </div>

      <div key={ex!.id} className="anim-pop rounded-game border-2 border-border bg-card p-5">
        <p className="text-sm uppercase tracking-wide text-muted-foreground">
          Câu {index + 1}/{total}{ex!.title ? ` · ${ex!.title}` : ""}
        </p>
        <p className="my-2 mb-4 text-2xl font-extrabold leading-relaxed">{ex!.prompt}</p>

        <div className="grid gap-2.5 sm:grid-cols-2">
          {ex!.choices.map((c, i) => (
            <ChoiceButton
              key={i}
              label={"ABCD"[i]}
              text={c}
              disabled={answered}
              state={!answered ? "idle" : i === ex!.correctIndex ? "correct" : i === picked ? "wrong" : "idle"}
              onClick={() => choose(i)}
            />
          ))}
        </div>

        {answered && (
          <div className="mt-4 rounded-game bg-background p-3 font-semibold leading-relaxed" role="status">
            <p>{picked === ex!.correctIndex ? "✅ Chính xác!" : "❌ Chưa đúng."}</p>
            {ex!.choiceExplanations && ex!.choiceExplanations.length === ex!.choices.length ? (
              <ul className="mt-2 space-y-1.5 text-base">
                {ex!.choiceExplanations.map((text, i) => (
                  <li key={i} className={i === ex!.correctIndex ? "text-success" : ""}>
                    <span className="text-muted-foreground">{"ABCD"[i]}.</span> {text}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1">{ex!.explanation}</p>
            )}
            {picked !== ex!.correctIndex && theoryHref?.(ex!) && (
              <Link href={theoryHref(ex!)!} target="_blank" className="mt-2 inline-block text-primary underline underline-offset-4">
                Xem lại lý thuyết
              </Link>
            )}
            <button type="button" onClick={next} className="mt-3 w-full rounded-game border-b-[5px] border-primary-deep bg-primary py-3 text-lg font-extrabold text-primary-foreground active:translate-y-[3px] active:border-b-2">
              {index + 1 < total ? "Tiếp tục" : "Xem kết quả"}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
