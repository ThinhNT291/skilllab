"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import confetti from "canvas-confetti"
import type { AnswerRecord, Exercise } from "@/lib/content/types"
import { sfx } from "@/lib/audio/sfx"
import { useSettings } from "@/lib/settings"
import { bacLabel } from "@/lib/content/bac"
import { nextPosition, pickAtPosition, START_POSITION } from "@/lib/content/adaptive"
import { getOwnedItems } from "@/lib/db"
import { recordRoundDone } from "@/lib/game/bonus"
import { xpFor, XP_PER_COIN } from "@/lib/game/xp"
import { Mascot, type Mood } from "@/components/game/mascot"
import { ProgressBar } from "./progress-bar"
import { DictationView, McqView, ReorderView, SpotView, TypedView, type Result } from "./views"

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

const KIND_TITLE: Record<Exercise["kind"], string> = {
  mcq: "",
  reorder: "Sắp xếp từ thành câu",
  typed: "Gõ đáp án",
  dictation: "Nghe và gõ lại",
  spot: "Tìm lỗi sai",
}

function titleOf(ex: Exercise): string {
  return ex.kind === "mcq" ? (ex.title ?? "") : KIND_TITLE[ex.kind]
}

/** Đáp án đúng để hiện khi người học trả lời sai (mcq đã hiện qua nút nên không cần). */
function correctText(ex: Exercise): string | null {
  if (ex.kind === "reorder") return ex.answerWords.join(" ")
  if (ex.kind === "typed") return ex.answers[0]
  if (ex.kind === "dictation") return ex.text
  if (ex.kind === "spot") return ex.correctSentence
  return null
}

/**
 * Chạy một lượt bài tập: một câu mỗi lần, chấm tức thì, combo, sao cuối bài.
 * Hỗ trợ nhiều kiểu câu (trắc nghiệm, sắp xếp từ, gõ đáp án, nghe chép); mỗi kiểu là một view riêng trong views.tsx.
 */
export function ExerciseRunner({
  exercises,
  onAnswer,
  onFinish,
  theoryHref,
  bonusHref,
  adaptive,
}: {
  exercises: Exercise[]
  /** Bài thích ứng: câu kế tiếp chọn theo kết quả câu vừa làm (đúng thì khó hơn, sai thì dễ hơn). `exercises` chỉ cần câu đầu. */
  adaptive?: { ladder: Exercise[]; count: number }
  onAnswer?: (record: AnswerRecord) => void
  /** Gọi một lần khi người học bấm "Xem kết quả" ở câu cuối. */
  onFinish?: () => void
  /** Đường dẫn về đúng mục lý thuyết của câu (hiện khi trả lời sai). Trả null nếu không có. */
  theoryHref?: (exercise: Exercise) => string | null
  /** Đường dẫn game thưởng. Có thì cứ vài lượt xong lại mời chơi ở màn kết quả. */
  bonusHref?: string
}) {
  const { sound, showBac } = useSettings()
  const [list, setList] = useState(exercises)
  const positionRef = useRef(START_POSITION)
  const [index, setIndex] = useState(0)
  const [result, setResult] = useState<Result | null>(null)
  const [correctCount, setCorrectCount] = useState(0)
  const [streak, setStreak] = useState(0)
  const [wrongIds, setWrongIds] = useState<string[]>([])
  const [worn, setWorn] = useState<string[]>([])
  const [offerBonus, setOfferBonus] = useState(false)

  useEffect(() => {
    getOwnedItems().then((r) => r.ok && setWorn(r.equipped))
  }, [])

  const total = adaptive ? adaptive.count : list.length
  const done = index >= total
  const ex = done ? null : list[index]

  function resolve(r: Result) {
    if (!ex || result) return
    setResult(r)
    if (r.correct) {
      setCorrectCount((c) => c + 1)
      setStreak((s) => s + 1)
    } else {
      setStreak(0)
      setWrongIds((w) => [...w, ex.id])
    }
    if (sound) (r.correct ? sfx.correct : sfx.wrong)()
    onAnswer?.({ exerciseId: ex.id, correct: r.correct, choiceIndex: r.choiceIndex, response: r.response })
    if (adaptive && list.length < adaptive.count) {
      positionRef.current = nextPosition(positionRef.current, r.correct)
      const nxt = pickAtPosition(adaptive.ladder, new Set(list.map((x) => x.id)), positionRef.current)
      if (nxt) setList((l) => [...l, nxt])
    }
  }

  function next() {
    const last = index + 1 >= total
    setIndex((n) => n + 1)
    setResult(null)
    if (last) {
      onFinish?.()
      // Mỗi lượt xong (kể cả làm lại) tính một vòng; đủ vòng thì mời chơi game thưởng.
      if (bonusHref) setOfferBonus(recordRoundDone())
    }
    if (last && correctCount === total && !reducedMotion()) {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } })
    }
  }

  function restart() {
    if (adaptive) {
      positionRef.current = START_POSITION
      const first = pickAtPosition(adaptive.ladder, new Set(), START_POSITION)
      if (first) setList([first])
    }
    setIndex(0)
    setResult(null)
    setCorrectCount(0)
    setStreak(0)
    setWrongIds([])
    setOfferBonus(false)
  }

  if (done) {
    const stars = starsFor(correctCount, total)
    const gained = xpFor(correctCount, total - correctCount)
    return (
      <div className="anim-pop rounded-game border-2 border-border bg-card p-6 text-center">
        <div className="flex justify-center">
          <Mascot mood={stars === 3 ? "cheer" : stars >= 2 ? "happy" : stars === 1 ? "idle" : "sad"} items={worn} size={104} />
        </div>
        <p className="text-sm uppercase tracking-wide text-muted-foreground">Kết quả</p>
        <p className="my-2 text-5xl tracking-[0.3em]" aria-label={`${stars} trên 3 sao`}>
          {[0, 1, 2].map((k) => (k < stars ? "⭐" : "☆"))}
        </p>
        <p className="text-2xl font-extrabold">
          Đúng {correctCount}/{total} câu
        </p>
        <p className="mt-1 font-extrabold text-accent-deep">
          +{gained} XP · +{Math.floor(gained / XP_PER_COIN)} 🪙
        </p>
        {wrongIds.length > 0 && <p className="mt-1 text-muted-foreground">{wrongIds.length} câu cần ôn lại</p>}
        {offerBonus && bonusHref && (
          <Link href={bonusHref} className="anim-pop mt-4 block rounded-game border-2 border-accent bg-background px-4 py-3 font-extrabold hover:border-primary">
            🎮 Bạn đã học xong vài vòng! Chơi ghép cặp thưởng nhé?
          </Link>
        )}
        <button type="button" onClick={restart} className="mt-4 w-full rounded-game border-b-[5px] border-primary-deep bg-primary py-3 text-lg font-extrabold text-primary-foreground active:translate-y-[3px] active:border-b-2">
          Làm lại
        </button>
      </div>
    )
  }

  const current = ex!
  const title = titleOf(current)
  const wrong = result !== null && !result.correct
  const mood: Mood = !result ? "idle" : !result.correct ? "sad" : streak >= 3 ? "cheer" : "happy"
  const correct = correctText(current)

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <Mascot mood={mood} items={worn} size={56} />
        <ProgressBar value={index / total} label="Tiến độ bài tập" />
        <div className={`min-w-20 text-right font-extrabold text-accent-deep ${streak >= 2 ? "opacity-100" : "opacity-0"}`} aria-live="polite">
          🔥 x{streak}
        </div>
      </div>

      <div key={current.id} className="anim-pop rounded-game border-2 border-border bg-card p-5">
        <p className="text-sm uppercase tracking-wide text-muted-foreground">
          Câu {index + 1}/{total}
          {title ? ` · ${title}` : ""}
        </p>
        {showBac && (
          <p className="mt-1 inline-block rounded-full border-2 border-border px-2 py-0.5 text-xs font-extrabold text-muted-foreground">
            {current.bac ? bacLabel(current.bac) : "Chưa gắn bậc"} · Mức khó {current.difficulty}/3
          </p>
        )}

        {current.kind === "mcq" && <McqView ex={current} result={result} onResolve={resolve} />}
        {current.kind === "reorder" && <ReorderView ex={current} result={result} onResolve={resolve} />}
        {current.kind === "typed" && <TypedView ex={current} result={result} onResolve={resolve} />}
        {current.kind === "spot" && <SpotView ex={current} result={result} onResolve={resolve} />}
        {current.kind === "dictation" && <DictationView ex={current} result={result} onResolve={resolve} />}

        {result && (
          <div className="mt-4 rounded-game bg-background p-3 font-semibold leading-relaxed" role="status">
            <p>{result.correct ? "✅ Chính xác!" : "❌ Chưa đúng."}</p>
            {current.kind === "mcq" ? (
              current.choiceExplanations && current.choiceExplanations.length === current.choices.length ? (
                <ul className="mt-2 space-y-1.5 text-base">
                  {current.choiceExplanations.map((text, i) => (
                    <li key={i} className={i === current.correctIndex ? "text-success" : ""}>
                      <span className="text-muted-foreground">{"ABCD"[i]}.</span> {text}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1">{current.explanation}</p>
              )
            ) : (
              <>
                {wrong && correct && (
                  <p className="mt-1">
                    Đáp án đúng: <span className="text-success">{correct}</span>
                  </p>
                )}
                {current.kind !== "dictation" && <p className="mt-1 text-base text-muted-foreground">{current.explanation}</p>}
              </>
            )}
            {wrong && theoryHref?.(current) && (
              <Link href={theoryHref(current)!} target="_blank" className="mt-2 inline-block text-primary underline underline-offset-4">
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
