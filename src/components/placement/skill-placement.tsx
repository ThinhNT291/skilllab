"use client"

import { useState } from "react"
import Link from "next/link"
import type { AnswerRecord, Exercise } from "@/lib/content/types"
import { recordAnswer } from "@/lib/db"
import { placementLevel, type Level } from "@/lib/progress/level"
import type { AbilitySkill, AnswerForAbility, ItemMeta } from "@/lib/progress/ability"
import itemMeta from "@/content/meta/items.json"
import { nextStairBac, type StairStep } from "@/lib/placement-skill"
import { passedReading, passageToExercises, type ReadingPassage } from "@/lib/reading/types"
import { itemToExercises, type ListeningItem } from "@/lib/listening/types"
import { ExerciseRunner } from "@/components/exercise/exercise-runner"
import { ReadingSession } from "@/components/reading/reading-session"
import { ListeningSession } from "@/components/listening/listening-session"

const BTN = "rounded-game border-b-[5px] border-primary-deep bg-primary px-6 py-3 text-lg font-extrabold text-primary-foreground active:translate-y-[3px] active:border-b-2"

/** Bậc sau bài xếp trình độ: cùng công thức Elo với mọi nơi khác (`progress/level.ts`); thứ tự câu chỉ cần ổn định. */
const withOrder = (rows: Omit<AnswerForAbility, "created_at">[]): AnswerForAbility[] => rows.map((r, i) => ({ ...r, created_at: String(i).padStart(4, "0") }))

function Result({ title, level, backHref, backLabel }: { title: string; level: Level | null; backHref: string; backLabel: string }) {
  return (
    <div className="anim-pop space-y-3 rounded-game border-2 border-border bg-card p-5">
      <p className="text-sm uppercase tracking-wide text-muted-foreground">{title}</p>
      <p className="text-2xl font-extrabold">
        {level === null ? "Chưa đủ dữ liệu để ước lượng." : level.bac === 0 ? "Bạn nên bắt đầu từ Bậc 1." : `Mức ước lượng: ${level.label}`}
      </p>
      <p className="text-muted-foreground">Chỉ để tham khảo, không phải điểm xếp hạng hay chứng chỉ. Kết quả đã được ghi nhận: các bài luyện sau sẽ bắt đầu vừa sức với bạn hơn.</p>
      <Link href={backHref} className="inline-block text-primary underline underline-offset-4">
        {backLabel}
      </Link>
    </div>
  )
}

/** Xếp trình độ từ vựng: 12 câu, mỗi cấp A1–B2 ba câu, từ dễ đến khó. Lưu từng câu như bài luyện thường. */
export function VocabPlacement({ exercises }: { exercises: Exercise[] }) {
  const [answers, setAnswers] = useState<{ exerciseId: string; topic: string; correct: boolean }[]>([])
  const [finished, setFinished] = useState(false)
  function onAnswer(record: AnswerRecord) {
    const ex = exercises.find((e) => e.id === record.exerciseId)
    setAnswers((a) => [...a, { exerciseId: record.exerciseId, topic: ex?.topic ?? "", correct: record.correct }])
    if (ex) void recordAnswer(record, ex)
  }
  if (!finished) return <ExerciseRunner exercises={exercises} onAnswer={onAnswer} onFinish={() => setFinished(true)} />
  return <Result title="Kết quả xếp trình độ từ vựng" level={placementLevel(withOrder(answers), itemMeta as unknown as ItemMeta, "vocab")} backHref="/tu-vung" backLabel="Đến khu Từ vựng" />
}

type Stage = { kind: "reading"; passage: ReadingPassage; gloss: Record<string, string> } | { kind: "listening"; item: ListeningItem }

/**
 * Xếp trình độ Đọc hoặc Nghe theo bậc thang: bắt đầu Bậc 2; đạt (từ 75% đúng) thì lên, chưa đạt thì xuống; tối đa 3 bài.
 * `stages` là các bài đã chọn sẵn, mỗi bậc một bài.
 */
export function PassagePlacement({ stages }: { stages: Record<number, Stage> }) {
  const [history, setHistory] = useState<StairStep[]>([])
  const [scores, setScores] = useState<{ bac: number; correct: number; total: number }[]>([])
  const [current, setCurrent] = useState<number | null>(2)
  const [last, setLast] = useState<StairStep | null>(null)

  function complete(bac: number, correct: number, total: number) {
    setLast({ bac, passed: passedReading(correct, total) })
    setScores((s) => [...s.filter((x) => x.bac !== bac), { bac, correct, total }])
  }
  function advance() {
    if (!last) return
    const h = [...history, last]
    setHistory(h)
    setLast(null)
    setCurrent(nextStairBac(h))
  }

  if (current === null) {
    const skill: AbilitySkill = Object.values(stages)[0]?.kind === "listening" ? "listening" : "reading"
    const rows = scores.flatMap((s) => Array.from({ length: s.total }, (_, i) => ({ exerciseId: `${skill}-b${s.bac}`, topic: `${skill}-b${s.bac}`, correct: i < s.correct })))
    return <Result title="Kết quả xếp trình độ" level={placementLevel(withOrder(rows), itemMeta as unknown as ItemMeta, skill)} backHref="/" backLabel="Về trang chủ" />
  }
  const stage = stages[current]
  if (!stage) return <p className="text-muted-foreground">Chưa đủ bài cho phần này.</p>
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Bài {history.length + 1}/3 · làm xong sẽ chọn bài vừa sức tiếp theo.</p>
      {stage.kind === "reading" ? (
        <ReadingSession key={current} passage={stage.passage} exercises={passageToExercises(stage.passage)} gloss={stage.gloss} onComplete={(c, t) => complete(current, c, t)} />
      ) : (
        <ListeningSession key={current} item={stage.item} exercises={itemToExercises(stage.item)} onComplete={(c, t) => complete(current, c, t)} />
      )}
      {last && (
        <div className="anim-pop text-center">
          <button type="button" className={BTN} onClick={advance}>
            {nextStairBac([...history, last]) === null ? "Xem kết quả" : "Bài tiếp theo"}
          </button>
        </div>
      )}
    </div>
  )
}
