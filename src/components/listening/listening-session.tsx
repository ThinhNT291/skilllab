"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import type { AnswerRecord, Exercise } from "@/lib/content/types"
import { recordAnswer } from "@/lib/db"
import { parseDialogue } from "@/lib/audio/dialogue"
import { cancelSpeech, speakDialogue } from "@/lib/audio/tts"
import { passedReading } from "@/lib/reading/types"
import type { ListeningItem } from "@/lib/listening/types"
import { ExerciseRunner } from "@/components/exercise/exercise-runner"

const BTN = "rounded-game border-b-[5px] border-primary-deep bg-primary px-5 py-3 text-lg font-extrabold text-primary-foreground active:translate-y-[3px] active:border-b-2"
const GHOST = "rounded-game border-2 border-border bg-card px-4 py-3 font-extrabold hover:border-primary"

/** Một bài nghe: bấm nghe (có nghe chậm), trả lời từng câu, chỉ xem lời thoại sau khi xong. */
export function ListeningSession({ item, exercises }: { item: ListeningItem; exercises: Exercise[] }) {
  const parts = useMemo(() => parseDialogue(item.transcript), [item.transcript])
  const [plays, setPlays] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [finished, setFinished] = useState(false)

  useEffect(() => () => cancelSpeech(), [])

  function play(rate: number) {
    setPlays((n) => n + 1)
    void speakDialogue(parts, rate)
  }

  function onAnswer(record: AnswerRecord) {
    const ex = exercises.find((e) => e.id === record.exerciseId)
    if (record.correct) setCorrect((c) => c + 1)
    if (ex) void recordAnswer(record, ex)
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-extrabold">{item.title}</h2>
      <div className="rounded-game border-2 border-border bg-card p-5">
        <div className="flex flex-wrap gap-3">
          <button type="button" className={BTN} onClick={() => play(0.9)}>
            🔊 Nghe
          </button>
          <button type="button" className={GHOST} onClick={() => play(0.65)}>
            🐢 Nghe chậm
          </button>
          <button type="button" className={GHOST} onClick={cancelSpeech}>
            ⏹ Dừng
          </button>
        </div>
        <p className="mt-3 text-sm text-muted-foreground" role="status">
          {plays === 0 ? "Bấm Nghe, rồi trả lời các câu hỏi. Bạn có thể nghe lại bao nhiêu lần cũng được." : `Đã nghe ${plays} lần.`}
        </p>
      </div>
      <ExerciseRunner exercises={exercises} onAnswer={onAnswer} onFinish={() => setFinished(true)} />
      {finished && (
        <div className="anim-pop space-y-3 rounded-game border-2 border-border bg-card p-4" role="status">
          <p className="text-center font-extrabold">
            {passedReading(correct, exercises.length) ? "✅ Đạt bài nghe này!" : "📌 Chưa đạt (cần từ 75% đúng). Nghe lại rồi thử bài khác nhé."}
          </p>
          <details>
            <summary className="cursor-pointer font-extrabold">Xem lời thoại</summary>
            <p lang="en" className="mt-2 whitespace-pre-line text-muted-foreground">
              {item.transcript}
            </p>
          </details>
          <div className="text-center">
            <Link href={`/nghe/${item.bac}`} className="text-primary underline underline-offset-4">
              Nghe bài khác
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
