"use client"

import { useState } from "react"
import Link from "next/link"
import type { AnswerRecord, Exercise } from "@/lib/content/types"
import { recordAnswer } from "@/lib/db"
import { passedReading, type ReadingPassage } from "@/lib/reading/types"
import { ExerciseRunner } from "@/components/exercise/exercise-runner"

/** Đoạn văn với từ có nghĩa trong từ điển mini: chạm vào để xem nghĩa tiếng Việt. */
function sentenceOf(para: string, word: string): string {
  const parts = para.split(/(?<=[.!?])\s+/)
  return parts.find((p) => p.includes(word)) ?? para
}

function Passage({ text, gloss }: { text: string; gloss: Record<string, string> }) {
  const [picked, setPicked] = useState<{ word: string; vi: string | null; sentence: string; extra?: string; busy?: boolean } | null>(null)
  const [cache] = useState(() => new Map<string, string>())

  async function explain() {
    if (!picked) return
    const key = `${picked.word.toLowerCase()}|${picked.sentence}`
    const hit = cache.get(key)
    if (hit) return setPicked({ ...picked, extra: hit })
    setPicked({ ...picked, busy: true })
    try {
      const res = await fetch("/api/gloss", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ word: picked.word, sentence: picked.sentence }) })
      const json = (await res.json()) as { gloss?: { vi: string; pos: string; note: string }; error?: string }
      const msg = json.gloss ? `${json.gloss.vi}${json.gloss.pos ? ` (${json.gloss.pos})` : ""}${json.gloss.note ? ` — ${json.gloss.note}` : ""}` : (json.error ?? "Chưa giải nghĩa được.")
      if (json.gloss) cache.set(key, msg)
      setPicked({ ...picked, extra: msg, busy: false })
    } catch {
      setPicked({ ...picked, extra: "Không kết nối được.", busy: false })
    }
  }
  return (
    <div className="rounded-game border-2 border-border bg-card p-5">
      <div className="space-y-3 text-lg leading-relaxed" lang="en">
        {text.split(/\n\s*\n/).map((para, i) => (
          <p key={i}>
            {para.split(/([A-Za-z']+)/).map((tok, j) => {
              if (!/^[A-Za-z']+$/.test(tok)) return tok
              const vi = gloss[tok.toLowerCase()]
              return (
                <button
                  key={j}
                  type="button"
                  onClick={() => setPicked({ word: tok, vi: vi ?? null, sentence: sentenceOf(para, tok) })}
                  className={`hover:text-primary focus-visible:text-primary ${vi ? "underline decoration-dotted decoration-2 underline-offset-4" : ""}`}
                >
                  {tok}
                </button>
              )
            })}
          </p>
        ))}
      </div>
      <p className="mt-3 min-h-6 text-sm text-muted-foreground" role="status">
        {picked ? (
          <>
            <strong lang="en">{picked.word}</strong>: {picked.vi ?? "chưa có trong từ điển mini"}{" "}
            <button type="button" onClick={explain} disabled={picked.busy} className="text-primary underline underline-offset-4">
              {picked.busy ? "Đang tra…" : "Giải thích theo câu này"}
            </button>
            {picked.extra && <span className="block text-foreground">✨ {picked.extra}</span>}
          </>
        ) : (
          "Chạm vào một từ để xem nghĩa (từ gạch chân chấm có sẵn nghĩa)."
        )}
      </p>
    </div>
  )
}

/** Một bài đọc: đoạn văn luôn hiện ở trên, trả lời từng câu bên dưới; xong thì báo đạt (từ 75% đúng). */
export function ReadingSession({ passage, exercises, gloss }: { passage: ReadingPassage; exercises: Exercise[]; gloss: Record<string, string> }) {
  const [correct, setCorrect] = useState(0)
  const [finished, setFinished] = useState(false)

  function onAnswer(record: AnswerRecord) {
    const ex = exercises.find((e) => e.id === record.exerciseId)
    if (record.correct) setCorrect((c) => c + 1)
    if (ex) void recordAnswer(record, ex)
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-extrabold" lang="en">
        {passage.title}
      </h2>
      <Passage text={passage.text} gloss={gloss} />
      <ExerciseRunner exercises={exercises} onAnswer={onAnswer} onFinish={() => setFinished(true)} />
      {finished && (
        <div className="anim-pop rounded-game border-2 border-border bg-card p-4 text-center" role="status">
          <p className="font-extrabold">
            {passedReading(correct, exercises.length) ? "✅ Đạt bài đọc này!" : "📌 Chưa đạt (cần từ 75% đúng). Đọc lại bài rồi thử bài khác nhé."}
          </p>
          <Link href={`/doc/${passage.bac}`} className="mt-2 inline-block text-primary underline underline-offset-4">
            Đọc bài khác
          </Link>
        </div>
      )}
    </div>
  )
}
