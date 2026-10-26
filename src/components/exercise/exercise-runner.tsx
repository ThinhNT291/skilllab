"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import confetti from "canvas-confetti"
import type { AnswerRecord, Exercise } from "@/lib/content/types"
import { sfx } from "@/lib/audio/sfx"
import { useSettings } from "@/lib/settings"
import { bacLabel } from "@/lib/content/bac"
import { nextPosition, pickAtPosition, START_POSITION } from "@/lib/content/adaptive"
import { getAnswerCounts, getOwnedItems } from "@/lib/db"
import { recordRoundDone } from "@/lib/game/bonus"
import { levelFromXp, xpFor, XP_PER_COIN } from "@/lib/game/xp"
import { Mascot, type Mood } from "@/components/game/mascot"
import { ProgressBar } from "./progress-bar"
import { injectSpeak, scaffoldFor } from "@/lib/content/derive"
import { useSttSupported } from "@/lib/audio/stt"
import type { RuleHints } from "@/lib/content/rule-hints"
import { RetryHint, ReviewNext, WrongFeedback } from "./wrong-feedback"
import { DictationView, FixView, McqView, ReorderView, SpeakView, SpotView, TypedView, type Result } from "./views"

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
  fix: "Sửa lỗi: gõ lại câu đúng",
  speak: "Đọc to",
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
  if (ex.kind === "fix") return ex.answers[0]
  if (ex.kind === "speak") return ex.text
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
  rules,
  practiceBase,
  afterResult,
  speak,
}: {
  exercises: Exercise[]
  /** Cho phép chèn một câu đọc to ở nửa sau lượt (chỉ khi trình duyệt nghe được giọng nói và người học không tắt). Không dùng cho bài đo trình độ hay bài thích ứng. */
  speak?: boolean
  /** Bài thích ứng: câu kế tiếp chọn theo kết quả câu vừa làm (đúng thì khó hơn, sai thì dễ hơn). `exercises` chỉ cần câu đầu. */
  adaptive?: { ladder: Exercise[]; count: number; /** vị trí bắt đầu trên thang (0–1) */ start?: number; /** bước lên/xuống sau mỗi câu */ steps?: { up: number; down: number } }
  onAnswer?: (record: AnswerRecord, exercise: Exercise) => void
  /** Gọi một lần khi người học bấm "Xem kết quả" ở câu cuối. */
  onFinish?: () => void
  /** Đường dẫn về đúng mục lý thuyết của câu (hiện khi trả lời sai). Trả null nếu không có. */
  theoryHref?: (exercise: Exercise) => string | null
  /** Đường dẫn game thưởng. Có thì cứ vài lượt xong lại mời chơi ở màn kết quả. */
  bonusHref?: string
  /** Quy tắc lý thuyết theo mã mục, để phân tích khi trả lời sai. */
  rules?: RuleHints
  /** Đường dẫn gốc của chuyên đề (vd /hoc/present-simple) để gợi ý luyện riêng mục vừa sai. */
  practiceBase?: string
  /** Nội dung thêm hiện trong khung kết quả của mỗi câu (vd lời thoại kèm căn cứ ở bài nghe). */
  afterResult?: (exercise: Exercise, result: Result) => React.ReactNode
}) {
  const { sound, showBac, feedbackMode, speakQuestions } = useSettings()
  const sttOk = useSttSupported()
  const [list, setList] = useState(exercises)
  const positionRef = useRef(adaptive?.start ?? START_POSITION)
  const [index, setIndex] = useState(0)
  const [result, setResult] = useState<Result | null>(null)
  const [correctCount, setCorrectCount] = useState(0)
  const [streak, setStreak] = useState(0)
  const [wrongIds, setWrongIds] = useState<string[]>([])
  const [worn, setWorn] = useState<string[]>([])
  const [offerBonus, setOfferBonus] = useState(false)
  const [levelUp, setLevelUp] = useState<number | null>(null)
  const [retry, setRetry] = useState<"none" | "offered" | "retried">("none")
  const [attempt, setAttempt] = useState(0)
  const [wrongUsages, setWrongUsages] = useState<string[]>([])

  useEffect(() => {
    getOwnedItems().then((r) => r.ok && setWorn(r.equipped))
  }, [])

  // Câu đọc to chỉ chèn ở nửa sau lượt và chỉ khi micro dùng được; chèn một lần ngay đầu lượt (câu chưa tới thì mới đổi).
  const speakInjected = useRef(false)
  useEffect(() => {
    if (!speak || adaptive || !sttOk || !speakQuestions || speakInjected.current) return
    speakInjected.current = true
    setList((l) => injectSpeak(l, index + 1))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speak, adaptive, sttOk, speakQuestions])

  const total = adaptive ? adaptive.count : list.length
  const done = index >= total
  const gainedXp = xpFor(correctCount, total - correctCount)

  // Cuối lượt: tiếng xu nếu có xu thưởng; hỏi tổng XP để biết có vừa lên cấp không (tiếng lên cấp + pháo giấy).
  useEffect(() => {
    if (!done) return
    let cancelled = false
    const timers: ReturnType<typeof setTimeout>[] = []
    if (sound && Math.floor(gainedXp / XP_PER_COIN) > 0) timers.push(setTimeout(() => sfx.coin(), 500))
    timers.push(
      setTimeout(() => {
        getAnswerCounts().then((r) => {
          if (cancelled || !r.ok) return
          const now = xpFor(r.correct, r.total - r.correct)
          const before = Math.max(0, now - gainedXp)
          const after = levelFromXp(now).level
          if (after > levelFromXp(before).level) {
            setLevelUp(after)
            if (sound) sfx.levelUp()
            if (!reducedMotion()) confetti({ particleCount: 160, spread: 100, origin: { y: 0.5 } })
          }
        })
      }, 700),
    )
    return () => {
      cancelled = true
      timers.forEach(clearTimeout)
    }
  }, [done, sound, gainedXp])
  const ex = done ? null : list[index]

  /** Ghi nhận kết quả LẦN ĐẦU của một câu: điểm, chuỗi đúng, âm thanh, lưu và bước thích ứng. */
  function record(r: Result, cur: Exercise) {
    if (r.correct) {
      setCorrectCount((c) => c + 1)
      setStreak((s) => s + 1)
    } else {
      setStreak(0)
      setWrongIds((w) => [...w, cur.id])
      if (cur.usageId) setWrongUsages((w) => [...w, cur.usageId!])
    }
    if (sound) (r.correct ? sfx.correct : sfx.wrong)()
    onAnswer?.({ exerciseId: cur.id, correct: r.correct, choiceIndex: r.choiceIndex, response: r.response }, cur)
    if (adaptive && list.length < adaptive.count) {
      positionRef.current = nextPosition(positionRef.current, r.correct, adaptive.steps)
      const nxt = pickAtPosition(adaptive.ladder, new Set(list.map((x) => x.id)), positionRef.current)
      if (nxt) setList((l) => [...l, nxt])
    }
  }

  function resolve(r: Result) {
    if (!ex || result) return
    // Lần thử lại sau gợi ý: chỉ hiện kết quả, KHÔNG ghi thêm (lần đầu đã được ghi là sai).
    if (retry !== "none") {
      setRetry("retried")
      setResult(r)
      return
    }
    record(r, ex)
    const retryable = feedbackMode === "hint-first" && (ex.kind === "typed" || ex.kind === "fix" || ex.kind === "reorder")
    if (retryable && !r.correct) {
      setRetry("offered")
      setAttempt((a) => a + 1)
      return
    }
    setResult(r)
  }

  /** Bỏ qua một câu (câu đọc to): không tính đúng cũng không tính sai, bài ngắn đi một câu. */
  function skip() {
    if (!ex || result) return
    const wasLast = index + 1 >= list.length
    setList((l) => l.filter((x) => x.id !== ex.id))
    if (wasLast) {
      onFinish?.()
      if (bonusHref) setOfferBonus(recordRoundDone())
    }
  }

  function next() {
    if (sound) sfx.click()
    setRetry("none")
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
    setLevelUp(null)
    setRetry("none")
    setWrongUsages([])
    if (adaptive) {
      positionRef.current = adaptive.start ?? START_POSITION
      const first = pickAtPosition(adaptive.ladder, new Set(), positionRef.current)
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
    const gained = gainedXp
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
        {levelUp !== null && (
          <p className="anim-pop mt-2 rounded-game border-2 border-accent bg-background px-3 py-2 text-xl font-extrabold" role="status">
            🎉 Lên cấp {levelUp}!
          </p>
        )}
        {wrongIds.length > 0 && <p className="mt-1 text-muted-foreground">{wrongIds.length} câu cần ôn lại</p>}
        {rules && practiceBase && wrongUsages.length > 0 && <ReviewNext usages={wrongUsages} rules={rules} practiceBase={practiceBase} />}
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
        {current.kind === "reorder" && <ReorderView key={attempt} ex={current} result={result} onResolve={resolve} />}
        {current.kind === "typed" && <TypedView key={attempt} ex={current} result={result} onResolve={resolve} scaffold={scaffoldFor(index, total)} />}
        {current.kind === "fix" && <FixView key={attempt} ex={current} result={result} onResolve={resolve} scaffold={scaffoldFor(index, total)} />}
        {current.kind === "spot" && <SpotView ex={current} result={result} onResolve={resolve} />}
        {current.kind === "dictation" && <DictationView ex={current} result={result} onResolve={resolve} />}
        {current.kind === "speak" && <SpeakView ex={current} result={result} onResolve={resolve} onSkip={skip} />}

        {retry === "offered" && !result && <RetryHint ex={current} rule={current.usageId ? rules?.[current.usageId] : undefined} />}

        {result && (
          <div className="mt-4 rounded-game bg-background p-3 font-semibold leading-relaxed" role="status">
            <p>{result.correct ? (retry === "retried" ? "✅ Đúng khi thử lại! Lần đầu chưa đúng nên câu này vẫn được ghi để ôn." : "✅ Chính xác!") : retry === "retried" ? "💡 Vẫn chưa đúng, không sao: xem đáp án bên dưới nhé." : "💡 Chưa đúng, cùng xem nhé."}</p>
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
            {wrong && rules && current.usageId && rules[current.usageId] ? (
              <WrongFeedback ex={current} choiceIndex={result.choiceIndex} rules={rules} theoryHref={theoryHref?.(current)} practiceBase={practiceBase} repeat={wrongUsages.filter((u) => u === current.usageId).length} />
            ) : (
              wrong &&
              theoryHref?.(current) && (
                <Link href={theoryHref(current)!} target="_blank" className="mt-2 inline-block text-primary underline underline-offset-4">
                  Xem lại lý thuyết
                </Link>
              )
            )}
            {afterResult?.(current, result)}
            <button type="button" onClick={next} className="mt-3 w-full rounded-game border-b-[5px] border-primary-deep bg-primary py-3 text-lg font-extrabold text-primary-foreground active:translate-y-[3px] active:border-b-2">
              {index + 1 < total ? "Tiếp tục" : "Xem kết quả"}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
