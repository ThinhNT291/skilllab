"use client"

import { useState } from "react"
import Link from "next/link"
import type { AnswerRecord, Exercise } from "@/lib/content/types"
import { recordAnswer } from "@/lib/db"
import { scorePlacement, type PlacementTopic } from "@/lib/placement"
import { ExerciseRunner } from "@/components/exercise/exercise-runner"
import { ProgressBar } from "@/components/exercise/progress-bar"

const START_MESSAGE = [
  "Bạn nên bắt đầu từ những chuyên đề nền tảng nhất.",
  "Bạn nên bắt đầu từ các chuyên đề cơ bản.",
  "Bạn nắm vững phần cơ bản rồi. Hãy học các chuyên đề tiến bộ.",
] as const

/** Làm bài xếp trình độ, lưu từng câu như bài luyện thường (sai sẽ thành thẻ ôn tập), rồi hiện gợi ý học. */
export function PlacementSession({ exercises, topics }: { exercises: Exercise[]; topics: PlacementTopic[] }) {
  const [answers, setAnswers] = useState<{ exerciseId: string; correct: boolean }[]>([])
  const [finished, setFinished] = useState(false)

  function onAnswer(record: AnswerRecord) {
    setAnswers((a) => [...a, { exerciseId: record.exerciseId, correct: record.correct }])
    const ex = exercises.find((e) => e.id === record.exerciseId)
    if (ex) void recordAnswer(record, ex)
  }

  if (!finished) {
    return <ExerciseRunner exercises={exercises} onAnswer={onAnswer} onFinish={() => setFinished(true)} theoryHref={(ex) => `/hoc/${ex.topic}${ex.usageId ? `#${ex.usageId}` : ""}`} />
  }

  const r = scorePlacement(answers, exercises, topics)
  const titleOf = (id: string) => topics.find((t) => t.id === id)?.title ?? id
  return (
    <div className="space-y-6">
      <div className="rounded-game border-2 border-border bg-card p-5">
        <p className="text-sm uppercase tracking-wide text-muted-foreground">Gợi ý của bài xếp trình độ</p>
        <p className="mt-1 text-2xl font-extrabold">
          {r.startBand === null ? "Bạn làm rất tốt ở cả ba nhóm! 🎉 Hãy thử chế độ Nhức đầu ở các chuyên đề." : START_MESSAGE[r.startBand]}
        </p>
        <ul className="mt-4 space-y-3">
          {r.bands.map((b) => (
            <li key={b.band}>
              <div className="mb-1 flex items-baseline justify-between gap-3">
                <span className="font-extrabold">
                  {b.passed ? "✅" : "📌"} {b.name}
                </span>
                <span className="text-sm text-muted-foreground">
                  {b.correct}/{b.total} đúng
                </span>
              </div>
              <div className="flex">
                <ProgressBar value={b.total ? b.correct / b.total : 0} label={`Kết quả nhóm ${b.name}`} />
              </div>
            </li>
          ))}
        </ul>
      </div>

      {r.recommended.length > 0 && (
        <section aria-label="Chuyên đề nên học trước">
          <h2 className="mb-2 text-xl font-extrabold">Nên học trước</h2>
          <ul className="space-y-2">
            {r.recommended.map((t) => (
              <li key={t.id}>
                <Link href={`/hoc/${t.id}`} className="block rounded-game border-2 border-border bg-card px-4 py-3 font-extrabold hover:border-primary">
                  {titleOf(t.id)}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-sm text-muted-foreground">
        Đây chỉ là gợi ý từ 20 câu, không phải điểm xếp hạng hay chứng chỉ. Câu sai đã được thêm vào thẻ <Link href="/on-tap" className="text-primary underline underline-offset-4">ôn tập</Link>.
      </p>
      <button type="button" onClick={() => window.location.reload()} className="w-full rounded-game border-2 border-border bg-card py-3 font-extrabold hover:border-primary">
        Làm lại bài mới
      </button>
    </div>
  )
}
