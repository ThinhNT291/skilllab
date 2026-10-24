"use client"

import { useState } from "react"
import type { DictationExercise, McqExercise, ReorderExercise, TypedExercise } from "@/lib/content/types"
import { gradeReorder, gradeTyped } from "@/lib/grading"
import { speak, stopSpeaking, useTtsSupported } from "@/lib/audio/tts"
import { cn } from "@/lib/utils"
import { ChoiceButton } from "./choice-button"

/** Kết quả một lần trả lời, dùng chung cho mọi kiểu câu. */
export interface Result {
  correct: boolean
  choiceIndex?: number
  response?: string
}

const PRIMARY_BTN =
  "rounded-game border-b-[5px] border-primary-deep bg-primary px-5 py-2.5 text-lg font-extrabold text-primary-foreground enabled:active:translate-y-[3px] enabled:active:border-b-2 disabled:opacity-50"
const GHOST_BTN = "rounded-game border-2 border-border bg-card px-4 py-2.5 font-extrabold enabled:hover:border-primary disabled:opacity-50"

export function McqView({ ex, result, onResolve }: { ex: McqExercise; result: Result | null; onResolve: (r: Result) => void }) {
  return (
    <>
      <p className="my-2 mb-4 text-2xl font-extrabold leading-relaxed">{ex.prompt}</p>
      <div className="grid gap-2.5 sm:grid-cols-2">
        {ex.choices.map((c, i) => (
          <ChoiceButton
            key={i}
            label={"ABCD"[i]}
            text={c}
            disabled={result !== null}
            state={!result ? "idle" : i === ex.correctIndex ? "correct" : i === result.choiceIndex ? "wrong" : "idle"}
            onClick={() => onResolve({ correct: i === ex.correctIndex, choiceIndex: i })}
          />
        ))}
      </div>
    </>
  )
}

export function ReorderView({ ex, result, onResolve }: { ex: ReorderExercise; result: Result | null; onResolve: (r: Result) => void }) {
  const [picked, setPicked] = useState<number[]>([]) // chỉ số trong ex.pool theo thứ tự đã chọn
  const done = result !== null
  const sentence = picked.map((i) => ex.pool[i])

  function check() {
    onResolve({ correct: gradeReorder(sentence, ex.answerWords), response: sentence.join(" ") })
  }

  return (
    <>
      <p className="my-2 text-2xl font-extrabold leading-relaxed">{ex.prompt}</p>
      <div
        className={cn(
          "mb-3 flex min-h-[3.5rem] flex-wrap gap-2 rounded-game border-2 border-dashed p-2",
          !done && "border-border",
          done && result.correct && "border-success bg-success-soft",
          done && !result.correct && "border-danger bg-danger-soft",
        )}
        aria-label="Câu của bạn"
      >
        {picked.length === 0 && <span className="px-2 py-1 text-muted-foreground">Chạm vào các từ bên dưới để xếp câu</span>}
        {picked.map((poolIndex, pos) => (
          <button
            key={`${poolIndex}-${pos}`}
            type="button"
            disabled={done}
            onClick={() => setPicked((p) => p.filter((_, k) => k !== pos))}
            className="rounded-xl border-2 border-b-4 border-primary bg-card px-3 py-1.5 text-lg font-extrabold enabled:active:translate-y-[2px] enabled:active:border-b-2"
          >
            {ex.pool[poolIndex]}
          </button>
        ))}
      </div>
      <div className="mb-4 flex flex-wrap gap-2" aria-label="Các từ cần xếp">
        {ex.pool.map((w, i) => (
          <button
            key={i}
            type="button"
            disabled={done || picked.includes(i)}
            onClick={() => setPicked((p) => [...p, i])}
            className="rounded-xl border-2 border-b-4 border-border bg-card px-3 py-1.5 text-lg font-extrabold enabled:hover:border-primary enabled:active:translate-y-[2px] enabled:active:border-b-2 disabled:opacity-30"
          >
            {w}
          </button>
        ))}
      </div>
      {!done && (
        <div className="flex gap-2">
          <button type="button" className={PRIMARY_BTN} disabled={picked.length !== ex.pool.length} onClick={check}>
            Kiểm tra
          </button>
          <button type="button" className={GHOST_BTN} disabled={picked.length === 0} onClick={() => setPicked([])}>
            Xóa hết
          </button>
        </div>
      )}
    </>
  )
}

function TextAnswer({ placeholder, result, accepted, onResolve, multiline = false }: { placeholder: string; result: Result | null; accepted: string[]; onResolve: (r: Result) => void; multiline?: boolean }) {
  const [text, setText] = useState("")
  const done = result !== null
  const tone = done ? (result.correct ? "border-success bg-success-soft" : "border-danger bg-danger-soft") : "border-border"

  function check() {
    if (!text.trim()) return
    onResolve({ correct: gradeTyped(text, accepted), response: text.trim() })
  }
  const common = {
    value: text,
    disabled: done,
    placeholder,
    autoCapitalize: "off" as const,
    autoCorrect: "off",
    spellCheck: false,
    onChange: (e: { target: { value: string } }) => setText(e.target.value),
    className: cn("w-full rounded-game border-2 px-4 py-3 text-xl font-bold outline-none focus:border-primary", tone),
  }
  return (
    <>
      {multiline ? (
        <textarea {...common} rows={2} aria-label="Câu bạn nghe được" />
      ) : (
        <input
          {...common}
          type="text"
          aria-label="Đáp án của bạn"
          onKeyDown={(e) => {
            if (e.key === "Enter") check()
          }}
        />
      )}
      {!done && (
        <button type="button" className={cn(PRIMARY_BTN, "mt-3")} disabled={!text.trim()} onClick={check}>
          Kiểm tra
        </button>
      )}
    </>
  )
}

export function TypedView({ ex, result, onResolve }: { ex: TypedExercise; result: Result | null; onResolve: (r: Result) => void }) {
  return (
    <>
      <p className="my-2 mb-4 text-2xl font-extrabold leading-relaxed">{ex.prompt}</p>
      <TextAnswer placeholder="Gõ đáp án cho chỗ trống" result={result} accepted={ex.answers} onResolve={onResolve} />
    </>
  )
}

export function DictationView({ ex, result, onResolve }: { ex: DictationExercise; result: Result | null; onResolve: (r: Result) => void }) {
  const supported = useTtsSupported()
  return (
    <>
      <p className="my-2 mb-3 text-2xl font-extrabold leading-relaxed">Nghe và gõ lại câu</p>
      {supported ? (
        <div className="mb-3 flex flex-wrap gap-2">
          <button type="button" className={PRIMARY_BTN} onClick={() => speak(ex.text, 0.9)}>
            🔊 Nghe
          </button>
          <button type="button" className={GHOST_BTN} onClick={() => speak(ex.text, 0.6)}>
            🐢 Nghe chậm
          </button>
          <button type="button" className={GHOST_BTN} onClick={stopSpeaking}>
            ⏹
          </button>
        </div>
      ) : (
        <p className="mb-3 rounded-game border-2 border-dashed border-border px-3 py-2 text-muted-foreground">Trình duyệt này chưa hỗ trợ đọc to. Hãy thử Chrome, Edge hoặc Safari.</p>
      )}
      <TextAnswer placeholder="Gõ câu bạn nghe được" result={result} accepted={ex.answers} onResolve={onResolve} multiline />
    </>
  )
}
