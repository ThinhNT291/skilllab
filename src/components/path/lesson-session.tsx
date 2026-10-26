"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import confetti from "canvas-confetti"
import type { AnswerRecord, Exercise } from "@/lib/content/types"
import { getPathResults, recordAnswer, recordPathLesson } from "@/lib/db"
import { PASS_RATIO } from "@/lib/path/catalog"
import { lessonPassed } from "@/lib/path/progress"
import type { LessonPayload } from "@/lib/path/data"
import { ExerciseRunner } from "@/components/exercise/exercise-runner"
import { ListeningSession } from "@/components/listening/listening-session"
import { ReadingSession } from "@/components/reading/reading-session"

const BTN = "rounded-game border-b-[5px] border-primary-deep bg-primary px-5 py-3 text-center text-lg font-extrabold text-primary-foreground active:translate-y-[3px] active:border-b-2"
const GHOST = "rounded-game border-2 border-border bg-card px-4 py-3 text-center font-extrabold hover:border-primary"

type Done = { correct: number; total: number; saved: "ok" | "fail"; next: { id: string; title: string } | null }

/** Chạy một bài của Lộ trình bằng đúng bộ làm bài đã có, rồi ghi kết quả và mời bài kế trong cùng nấc. */
export function LessonSession({ payload, stepLessons }: { payload: LessonPayload; /** Các bài của cùng nấc theo thứ tự, để mời bài kế tiếp */ stepLessons: { id: string; title: string }[] }) {
  const [done, setDone] = useState<Done | null>(null)
  const correctRef = useRef(0)

  async function finish(correct: number, total: number) {
    const res = await recordPathLesson(payload.lessonId, correct, total)
    let next: Done["next"] = null
    const results = await getPathResults()
    if (results.ok) {
      const map = new Map(results.results)
      if (correct / total >= PASS_RATIO) map.set(payload.lessonId, { bestRatio: Math.max(correct / total, map.get(payload.lessonId)?.bestRatio ?? 0) })
      next = stepLessons.find((l) => l.id !== payload.lessonId && !lessonPassed(map.get(l.id))) ?? null
    }
    if (correct / total >= PASS_RATIO && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } })
    setDone({ correct, total, saved: res.ok ? "ok" : "fail", next })
  }

  function onAnswer(record: AnswerRecord) {
    if (record.correct) correctRef.current++
    const ex = (payload.exercises as Exercise[]).find((e) => e.id === record.exerciseId)
    if (ex) void recordAnswer(record, ex)
  }

  if (done) return <Result done={done} />

  if (payload.kind === "reading") return <ReadingSession passage={payload.passage} exercises={payload.exercises} gloss={payload.gloss} onComplete={finish} />
  if (payload.kind === "listening") return <ListeningSession item={payload.item} exercises={payload.exercises} onComplete={finish} />
  return (
    <ExerciseRunner
      exercises={payload.exercises}
      onAnswer={onAnswer}
      onFinish={() => void finish(correctRef.current, payload.exercises.length)}
      theoryHref={payload.kind === "grammar" ? (ex) => `${payload.theoryBase}${ex.usageId ? `#${ex.usageId}` : ""}` : undefined}
      practiceBase={payload.kind === "grammar" ? payload.theoryBase : undefined}
    />
  )
}

function Result({ done }: { done: Done }) {
  const passed = done.correct / done.total >= PASS_RATIO
  return (
    <div className="anim-pop rounded-game border-2 border-border bg-card p-6 text-center" role="status">
      <p className="text-5xl">{passed ? "✅" : "💪"}</p>
      <p className="mt-2 text-2xl font-extrabold">{passed ? "Bài này xong rồi!" : "Chưa đạt lần này"}</p>
      <p className="mt-1 text-xl font-extrabold">
        Đúng {done.correct}/{done.total} câu
      </p>
      <p className="mt-1 text-muted-foreground">
        {passed ? "Bài được đánh dấu xong trong Lộ trình." : `Cần đúng từ ${Math.round(PASS_RATIO * 100)}% để xong bài. Câu sai đã thành thẻ ôn; làm lại sẽ có câu khác (bài đọc/nghe thì đọc/nghe kỹ hơn nhé).`}
      </p>
      {done.saved === "fail" && <p className="mt-2 text-sm text-danger">Chưa lưu được kết quả vào Lộ trình (đã chạy tệp 0014_path_lessons.sql trong Supabase và đăng nhập chưa?).</p>}
      <div className="mt-4 flex flex-col gap-2">
        {done.next && (
          <Link href={`/lo-trinh/bai/${done.next.id}`} className={BTN}>
            Bài tiếp theo: {done.next.title}
          </Link>
        )}
        {!passed && (
          <button type="button" onClick={() => window.location.reload()} className={done.next ? GHOST : BTN}>
            Làm lại bài này
          </button>
        )}
        <Link href="/lo-trinh" className={done.next || !passed ? "py-2 text-primary underline underline-offset-4" : BTN}>
          {done.next || !passed ? "Về Lộ trình" : "Về Lộ trình (cả nấc đã xong hoặc còn bài ở nấc khác)"}
        </Link>
      </div>
    </div>
  )
}
