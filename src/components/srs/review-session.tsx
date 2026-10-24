"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import confetti from "canvas-confetti"
import { getDueCards, reviewCard, type SrsCard } from "@/lib/db"
import { formatInterval, type Grade } from "@/lib/srs/scheduler"
import { isNewCard, limitNewCards } from "@/lib/srs/queue"
import { getSettings } from "@/lib/settings"
import { markNewCardDone, newCardsDoneToday } from "@/lib/srs/daily"
import { Flashcard } from "./flashcard"
import { ProgressBar } from "@/components/exercise/progress-bar"

const GRADES: { grade: Grade; label: string; key: string; style: string }[] = [
  { grade: "again", label: "Lại", key: "1", style: "border-danger bg-danger-soft text-foreground" },
  { grade: "hard", label: "Khó", key: "2", style: "border-border bg-card text-foreground" },
  { grade: "good", label: "Tốt", key: "3", style: "border-primary bg-card text-foreground" },
  { grade: "easy", label: "Dễ", key: "4", style: "border-success bg-success-soft text-foreground" },
]

type Load = { status: "loading" } | { status: "error"; message: string } | { status: "ready" }

export function ReviewSession({ topicTitles }: { topicTitles: Record<string, string> }) {
  const [load, setLoad] = useState<Load>({ status: "loading" })
  const [queue, setQueue] = useState<SrsCard[]>([])
  const [flipped, setFlipped] = useState(false)
  const [leaving, setLeaving] = useState<"left" | "right" | null>(null)
  const [reviewed, setReviewed] = useState(0)
  const [total, setTotal] = useState(0)
  const [saveWarning, setSaveWarning] = useState(false)
  const [deferred, setDeferred] = useState(0)
  const busy = useRef(false)

  useEffect(() => {
    let cancelled = false
    getDueCards().then((res) => {
      if (cancelled) return
      if (!res.ok) {
        const msg = res.reason === "not_configured" ? "Chưa kết nối Supabase nên chưa có thẻ ôn tập." : `Không tải được thẻ (${res.message ?? "lỗi không rõ"}). Nếu đây là lần đầu, hãy chạy tệp supabase/migrations/0002_srs.sql trong Supabase.`
        setLoad({ status: "error", message: msg })
        return
      }
      const limited = limitNewCards(res.value, newCardsDoneToday(), getSettings().newPerDay)
      setDeferred(limited.deferred)
      setQueue(limited.cards)
      setTotal(limited.cards.length)
      setLoad({ status: "ready" })
    })
    return () => {
      cancelled = true
    }
  }, [])

  const current = queue[0]

  const grade = useCallback(
    async (g: Grade) => {
      if (!current || busy.current) return
      busy.current = true
      setLeaving(g === "again" || g === "hard" ? "left" : "right")
      if (isNewCard(current)) markNewCardDone(current.id)
      const res = await reviewCard(current, g)
      if (!res.ok) setSaveWarning(true)
      // Chờ thẻ trượt đi rồi mới sang thẻ kế. "Lại" xếp thẻ về cuối hàng để gặp lại trong lượt này.
      window.setTimeout(() => {
        setQueue((q) => (g === "again" ? [...q.slice(1), { ...current, reps: 0, lapses: current.lapses + 1 }] : q.slice(1)))
        if (g !== "again") setReviewed((n) => n + 1)
        setFlipped(false)
        setLeaving(null)
        busy.current = false
      }, 300)
    },
    [current],
  )

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!current) return
      if (e.key === " " || e.key === "Enter") {
        if ((e.target as HTMLElement)?.getAttribute("role") === "button") return // thẻ tự xử lý phím này
        e.preventDefault()
        setFlipped((f) => !f)
      } else if (flipped) {
        const found = GRADES.find((x) => x.key === e.key)
        if (found) void grade(found.grade)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [current, flipped, grade])

  const finished = load.status === "ready" && !current
  useEffect(() => {
    if (finished && total > 0 && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } })
    }
  }, [finished, total])

  if (load.status === "loading") return <p className="text-muted-foreground">Đang tải thẻ ôn tập…</p>
  if (load.status === "error") return <p className="rounded-game border-2 border-dashed border-border px-4 py-3 text-muted-foreground">{load.message}</p>

  if (finished) {
    return (
      <div className="anim-pop rounded-game border-2 border-border bg-card p-6 text-center">
        {total === 0 ? (
          <>
            <p className="text-4xl">🌿</p>
            <p className="mt-2 text-xl font-extrabold">Chưa có thẻ nào cần ôn</p>
            <p className="mt-1 text-muted-foreground">
              {deferred > 0 ? `Hôm nay bạn đã ôn đủ thẻ mới; còn ${deferred} thẻ để dành cho ngày mai.` : "Thẻ sẽ tự xuất hiện khi bạn trả lời sai một câu trong phần luyện tập."}
            </p>
          </>
        ) : (
          <>
            <p className="text-4xl">🎉</p>
            <p className="mt-2 text-xl font-extrabold">Xong rồi! Đã ôn {reviewed} thẻ</p>
            <p className="mt-1 text-muted-foreground">Thẻ sẽ quay lại đúng lúc bạn sắp quên.</p>
            {deferred > 0 && <p className="mt-1 text-muted-foreground">Còn {deferred} thẻ mới để dành cho ngày mai, để bạn không bị ngợp.</p>}
          </>
        )}
        <div className="mt-4 flex justify-center gap-3">
          <Link href="/hoc" className="rounded-full border-2 border-border px-4 py-2 hover:border-primary">
            Về khu Học
          </Link>
          <Link href="/tien-do" className="rounded-full border-b-4 border-primary-deep bg-primary px-4 py-2 font-extrabold text-primary-foreground">
            Xem tiến độ
          </Link>
        </div>
      </div>
    )
  }

  const state = { intervalDays: current.intervalDays, ease: current.ease, reps: current.reps, lapses: current.lapses }
  const topicLabel = topicTitles[current.topic]?.replace(/\s*\(.*\)\s*$/, "") ?? current.topic

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <ProgressBar value={total ? reviewed / total : 0} label="Tiến độ ôn tập" />
        <span className="min-w-14 text-right font-extrabold text-muted-foreground">
          {reviewed}/{total}
        </span>
      </div>

      <div key={`${current.id}-${current.lapses}`} className={leaving ? (leaving === "left" ? "anim-out-left" : "anim-out-right") : "anim-pop"}>
        <Flashcard
          frontLabel={topicLabel}
          backLabel="Đáp án"
          flipped={flipped}
          onFlip={() => setFlipped((f) => !f)}
          front={<p className="text-2xl font-extrabold leading-relaxed">{current.front}</p>}
          back={
            <>
              <p className="rounded-2xl bg-success-soft px-4 py-2 text-2xl font-extrabold text-success">{current.answer}</p>
              {current.filled && <p className="mt-3 text-lg font-bold leading-relaxed">{current.filled}</p>}
              {current.explanation && <p className="mt-3 text-sm font-semibold leading-relaxed text-muted-foreground">{current.explanation}</p>}
            </>
          }
        />
      </div>

      <div className="mt-5 min-h-24">
        {flipped ? (
          <div className="grid grid-cols-4 gap-2" role="group" aria-label="Bạn nhớ thẻ này thế nào?">
            {GRADES.map((g) => (
              <button
                key={g.grade}
                type="button"
                disabled={leaving !== null}
                onClick={() => void grade(g.grade)}
                className={`rounded-game border-2 border-b-[5px] px-1 py-2 text-center active:translate-y-[3px] active:border-b-2 ${g.style}`}
              >
                <span className="block text-lg font-extrabold">{g.label}</span>
                <span className="block text-xs text-muted-foreground">{formatInterval(state, g.grade)}</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground">Nghĩ đáp án trong đầu rồi lật thẻ (Space) để kiểm tra.</p>
        )}
        {saveWarning && <p className="mt-3 text-center text-sm text-danger">Chưa lưu được kết quả ôn lần trước; kiểm tra kết nối rồi thử lại.</p>}
      </div>
    </div>
  )
}
