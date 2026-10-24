"use client"

import { useState } from "react"
import Link from "next/link"
import confetti from "canvas-confetti"
import type { AnswerRecord, Exercise, McqExercise } from "@/lib/content/types"
import { sfx } from "@/lib/audio/sfx"
import { applyAnswer, bossStars, startBoss, BOSS_LIVES } from "@/lib/game/boss"
import { useSettings } from "@/lib/settings"
import { McqView, type Result } from "@/components/exercise/views"
import { ProgressBar } from "@/components/exercise/progress-bar"

/**
 * Game mini "trùm cuối": nhận danh sách câu trắc nghiệm, trả lời đúng để đánh trùm, sai mất mạng.
 * Độc lập với nguồn nội dung; `onAnswer` để nơi dùng ghi kết quả.
 */
export function BossGame({ exercises, onAnswer, theoryHref }: { exercises: McqExercise[]; onAnswer?: (record: AnswerRecord, exercise: Exercise) => void; theoryHref?: (e: McqExercise) => string }) {
  const { sound } = useSettings()
  const [boss, setBoss] = useState(() => startBoss(exercises.length))
  const [index, setIndex] = useState(0)
  const [result, setResult] = useState<Result | null>(null)
  const ex = exercises[index]

  function resolve(r: Result) {
    if (result || boss.status !== "fighting") return
    setResult(r)
    const next = applyAnswer(boss, r.correct)
    setBoss(next)
    if (sound) (r.correct ? sfx.correct : sfx.wrong)()
    onAnswer?.({ exerciseId: ex.id, correct: r.correct, choiceIndex: r.choiceIndex }, ex)
    if (next.status === "won" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) confetti({ particleCount: 140, spread: 90, origin: { y: 0.6 } })
  }

  const ended = boss.status !== "fighting"
  const stars = bossStars(boss)

  return (
    <div>
      <div className="mb-4 flex items-center gap-3 rounded-game border-2 border-border bg-card px-4 py-3">
        <span className={`text-5xl ${result && result.correct ? "anim-shake" : ""}`} aria-hidden>
          {boss.status === "won" ? "💥" : "👾"}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-extrabold">Trùm Lỗi Sai</p>
          <div className="flex">
            <ProgressBar value={boss.hp / boss.maxHp} label="Máu của trùm" />
          </div>
        </div>
        <p className="shrink-0 text-xl" aria-label={`${boss.lives} mạng`}>
          {Array.from({ length: BOSS_LIVES }, (_, i) => (i < boss.lives ? "❤️" : "🖤")).join("")}
        </p>
      </div>

      {ended ? (
        <div className="anim-pop rounded-game border-2 border-border bg-card p-6 text-center">
          <p className="text-5xl">{boss.status === "won" ? "🏆" : "😵"}</p>
          <p className="mt-2 text-2xl font-extrabold">{boss.status === "won" ? "Bạn đã hạ gục trùm!" : "Trùm thắng lần này"}</p>
          {boss.status === "won" && (
            <p className="my-1 text-4xl tracking-[0.3em]" aria-label={`${stars} trên 3 sao`}>
              {[1, 2, 3].map((k) => (k <= stars ? "⭐" : "☆"))}
            </p>
          )}
          <p className="mt-1 text-muted-foreground">{boss.status === "won" ? "Những mục hay sai đang yếu đi rồi." : "Câu sai đã vào thẻ ôn tập. Ôn xong quay lại đánh tiếp nhé."}</p>
          <div className="mt-4 flex flex-col gap-2">
            <button type="button" onClick={() => window.location.reload()} className="rounded-game border-b-[5px] border-primary-deep bg-primary py-3 text-lg font-extrabold text-primary-foreground active:translate-y-[3px] active:border-b-2">
              Đánh trận mới
            </button>
            <Link href="/on-tap" className="py-2 text-primary underline underline-offset-4">
              Ôn các thẻ vừa sai
            </Link>
          </div>
        </div>
      ) : (
        <div key={ex.id} className="anim-pop rounded-game border-2 border-border bg-card p-5">
          <p className="text-sm uppercase tracking-wide text-muted-foreground">
            Đòn {index + 1}/{exercises.length}
          </p>
          <McqView ex={ex} result={result} onResolve={resolve} />
          {result && (
            <div className="mt-4 rounded-game bg-background p-3 font-semibold leading-relaxed" role="status">
              <p>{result.correct ? "✅ Trúng đòn!" : "❌ Trượt rồi, mất 1 mạng."}</p>
              <p className="mt-1 text-base">{ex.choiceExplanations?.[ex.correctIndex]?.replace(/^Đúng — /, "") ?? ex.explanation}</p>
              {!result.correct && theoryHref && (
                <Link href={theoryHref(ex)} target="_blank" className="mt-2 inline-block text-primary underline underline-offset-4">
                  Xem lại lý thuyết
                </Link>
              )}
              {boss.status === "fighting" && (
                <button
                  type="button"
                  onClick={() => {
                    setIndex((n) => n + 1)
                    setResult(null)
                  }}
                  className="mt-3 w-full rounded-game border-b-[5px] border-primary-deep bg-primary py-3 text-lg font-extrabold text-primary-foreground active:translate-y-[3px] active:border-b-2"
                >
                  Đòn tiếp theo
                </button>
              )}
            </div>
          )}
        </div>
      )}
      {/* Trận kết thúc ngay ở câu cuối: để người học còn đọc giải thích câu vừa rồi trước khi xem kết quả. */}
      {ended && result && (
        <p className="mt-3 text-sm text-muted-foreground">
          Câu cuối: {result.correct ? "đúng" : "sai"}. {ex.choiceExplanations?.[ex.correctIndex]?.replace(/^Đúng — /, "")}
        </p>
      )}
    </div>
  )
}
