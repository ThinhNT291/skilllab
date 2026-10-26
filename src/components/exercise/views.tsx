"use client"

import { useState } from "react"
import type { Exercise, DictationExercise, McqExercise, ReorderExercise, SpeakExercise, SpotExercise, FixExercise, TypedExercise } from "@/lib/content/types"
import { gradeReorder, gradeSpot, gradeTyped } from "@/lib/grading"
import { speak, stopSpeaking, useTtsSupported } from "@/lib/audio/tts"
import { listenOnce, useSttSupported, type Listening, type ListenError } from "@/lib/audio/stt"
import { bestOf, type SpeakScore } from "@/lib/speech/score"
import { sfx } from "@/lib/audio/sfx"
import { getSettings } from "@/lib/settings"
import { cn } from "@/lib/utils"

/** Tiếng "bấm" nhẹ khi chạm các nút phụ (không phải nộp đáp án, vì đúng/sai đã có âm riêng). */
function tap() {
  if (getSettings().sound) sfx.click()
}
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
            onClick={() => {
              tap()
              setPicked((p) => p.filter((_, k) => k !== pos))
            }}
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
            onClick={() => {
              tap()
              setPicked((p) => [...p, i])
            }}
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
          <button type="button" className={GHOST_BTN} disabled={picked.length === 0} onClick={() => {
              tap()
              setPicked([])
            }}>
            Xóa hết
          </button>
        </div>
      )}
    </>
  )
}

function TextAnswer({ placeholder, result, accepted, onResolve, multiline = false, hint }: { placeholder: string; result: Result | null; accepted: string[]; onResolve: (r: Result) => void; multiline?: boolean; hint?: string | null }) {
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
      {hint && !done && <p className="mb-2 text-sm font-extrabold text-muted-foreground">💡 {hint}</p>}
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

/** Gợi ý giảm dần theo màn (xem scaffoldFor): 2 = chữ cái đầu và số từ, 1 = chỉ số từ, 0 = không gợi ý. */
function hintFor(answer: string, scaffold: 0 | 1 | 2): string | null {
  const words = answer.trim().split(/\s+/).length
  if (scaffold === 2) return `Đáp án có ${words} từ, bắt đầu bằng “${answer.trim()[0]}”.`
  if (scaffold === 1) return `Đáp án có ${words} từ.`
  return null
}

export function TypedView({ ex, result, onResolve, scaffold = 0 }: { ex: TypedExercise; result: Result | null; onResolve: (r: Result) => void; scaffold?: 0 | 1 | 2 }) {
  return (
    <>
      <p className="my-2 mb-4 text-2xl font-extrabold leading-relaxed">{ex.prompt}</p>
      <TextAnswer placeholder="Gõ đáp án cho chỗ trống" result={result} accepted={ex.answers} onResolve={onResolve} hint={hintFor(ex.answers[0], scaffold)} />
    </>
  )
}

export function FixView({ ex, result, onResolve, scaffold = 0 }: { ex: FixExercise; result: Result | null; onResolve: (r: Result) => void; scaffold?: 0 | 1 | 2 }) {
  return (
    <>
      <p className="my-2 text-muted-foreground">{ex.prompt}</p>
      <p className="mb-3 rounded-game border-2 border-danger bg-danger-soft px-4 py-3 text-2xl font-extrabold leading-relaxed" lang="en">
        {ex.wrongSentence}
      </p>
      <TextAnswer placeholder="Gõ lại cả câu đã sửa" result={result} accepted={ex.answers} onResolve={onResolve} multiline hint={scaffold === 2 ? "Chỉ sai một chỗ (một từ hoặc một cụm). Giữ nguyên phần còn lại." : null} />
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

const LISTEN_ERROR: Record<ListenError, string> = {
  denied: "Trình duyệt chưa cho dùng micro. Bấm vào biểu tượng khóa cạnh địa chỉ trang để cho phép, hoặc bỏ qua câu này.",
  "no-speech": "Chưa nghe thấy giọng bạn. Thử đọc to hơn, gần micro hơn nhé.",
  unavailable: "Trình duyệt này chưa hỗ trợ nhận dạng giọng nói. Hãy thử Chrome hoặc Edge, hoặc bỏ qua câu này.",
  other: "Không nghe được lần này (micro hoặc mạng có vấn đề). Thử lại hoặc bỏ qua câu này.",
}

const MAX_TRIES = 2

/**
 * Đọc to một câu: nghe mẫu, bấm mic đọc, thấy ngay từ nào đã nghe rõ. Đạt khi nghe được từ 80% số từ.
 * Được thử tối đa 2 lần; có nút bỏ qua (câu bị bỏ qua không tính đúng cũng không tính sai).
 */
export function SpeakView({ ex, result, onResolve, onSkip }: { ex: SpeakExercise; result: Result | null; onResolve: (r: Result) => void; onSkip?: () => void }) {
  const stt = useSttSupported()
  const tts = useTtsSupported()
  const [listening, setListening] = useState<Listening | null>(null)
  const [tries, setTries] = useState(0)
  const [score, setScore] = useState<SpeakScore | null>(null)
  const [heardText, setHeardText] = useState("")
  const [error, setError] = useState<ListenError | null>(null)
  const done = result !== null

  function start() {
    tap()
    stopSpeaking()
    setError(null)
    const l = listenOnce({
      onDone: (alts) => {
        setListening(null)
        const best = bestOf(ex.text, alts)
        setScore(best.score)
        setHeardText(best.text)
        const used = tries + 1
        setTries(used)
        // Đúng thì xong ngay; chưa đúng thì cho thử thêm một lần rồi mới tính.
        if (best.score.passed || used >= MAX_TRIES) onResolve({ correct: best.score.passed })
      },
      onError: (e) => {
        setListening(null)
        setError(e)
      },
    })
    setListening(l)
  }

  const canTry = !done && !listening && stt
  return (
    <>
      <p className="my-2 text-2xl font-extrabold leading-relaxed">Đọc to câu này</p>
      <p lang="en" className="mb-3 flex flex-wrap gap-x-2 text-2xl leading-relaxed">
        {(score?.words ?? ex.text.split(/\s+/).map((word) => ({ word, heard: null as boolean | null }))).map((w, i) => (
          <span key={i} className={cn("rounded px-1", w.heard === true && "bg-success-soft", w.heard === false && "bg-danger-soft underline decoration-wavy decoration-danger")}>
            {w.word}
          </span>
        ))}
      </p>
      <div className="mb-3 flex flex-wrap gap-2">
        {tts && (
          <>
            <button type="button" className={GHOST_BTN} disabled={!!listening} onClick={() => speak(ex.text, 0.9)}>
              🔊 Nghe mẫu
            </button>
            <button type="button" className={GHOST_BTN} disabled={!!listening} onClick={() => speak(ex.text, 0.6)}>
              🐢 Chậm
            </button>
          </>
        )}
        {canTry && (
          <button type="button" className={PRIMARY_BTN} onClick={start}>
            🎤 {tries === 0 ? "Bấm để đọc" : "Đọc lại"}
          </button>
        )}
        {listening && (
          <button type="button" className={PRIMARY_BTN} onClick={() => listening.stop()} aria-live="polite">
            ⏺ Đang nghe… bấm khi đọc xong
          </button>
        )}
        {!done && onSkip && !listening && (
          <button type="button" className={GHOST_BTN} onClick={onSkip}>
            Bỏ qua câu này
          </button>
        )}
      </div>
      {!stt && !done && <p className="mb-2 rounded-game border-2 border-dashed border-border px-3 py-2 text-muted-foreground">{LISTEN_ERROR.unavailable}</p>}
      {error && !done && <p className="mb-2 rounded-game border-2 border-dashed border-border px-3 py-2 text-muted-foreground">{LISTEN_ERROR[error]}</p>}
      {score && (
        <p className="text-muted-foreground" role="status">
          Máy nghe được: <span lang="en">“{heardText}”</span> · rõ {score.words.filter((w) => w.heard).length}/{score.words.length} từ
          {!done && !score.passed && tries < MAX_TRIES ? ". Chưa đủ, thử đọc lại nhé (từ màu đỏ là từ chưa rõ)." : ""}
        </p>
      )}
      <p className="mt-2 text-xs text-muted-foreground">Máy chỉ kiểm tra từng từ có nghe rõ không, chưa phải điểm phát âm. Ứng dụng không lưu giọng nói; trình duyệt có thể gửi giọng nói tới nhà cung cấp của nó để nhận dạng.</p>
    </>
  )
}

export function SpotView({ ex, result, onResolve }: { ex: SpotExercise; result: Result | null; onResolve: (r: Result) => void }) {
  const [tapped, setTapped] = useState<number | null>(null)
  const done = result !== null
  return (
    <>
      <p className="my-2 text-2xl font-extrabold leading-relaxed">{ex.prompt}</p>
      <p className="mb-2 text-muted-foreground">Câu này có một chỗ sai. Chạm vào từ sai.</p>
      <div className="flex flex-wrap gap-2" aria-label="Các từ trong câu">
        {ex.words.map((w, i) => {
          const isError = i >= ex.errorFrom && i <= ex.errorTo
          return (
            <button
              key={i}
              type="button"
              disabled={done}
              onClick={() => {
                setTapped(i)
                onResolve({ correct: gradeSpot(i, ex.errorFrom, ex.errorTo), response: w })
              }}
              className={cn(
                "rounded-xl border-2 border-b-4 bg-card px-3 py-1.5 text-lg font-extrabold enabled:hover:border-primary enabled:active:translate-y-[2px] enabled:active:border-b-2",
                !done && "border-border",
                done && isError && "border-success bg-success-soft",
                done && !isError && i === tapped && "border-danger bg-danger-soft",
                done && !isError && i !== tapped && "border-border opacity-60",
              )}
            >
              {w}
            </button>
          )
        })}
      </div>
    </>
  )
}

/** Hiện đúng view cho một câu bất kỳ (dùng cho các game bấm giờ nhận danh sách câu hỗn hợp). */
export function ExerciseView({ ex, result, onResolve, scaffold = 0 }: { ex: Exercise; result: Result | null; onResolve: (r: Result) => void; scaffold?: 0 | 1 | 2 }) {
  switch (ex.kind) {
    case "mcq":
      return <McqView ex={ex} result={result} onResolve={onResolve} />
    case "reorder":
      return <ReorderView ex={ex} result={result} onResolve={onResolve} />
    case "typed":
      return <TypedView ex={ex} result={result} onResolve={onResolve} scaffold={scaffold} />
    case "fix":
      return <FixView ex={ex} result={result} onResolve={onResolve} scaffold={scaffold} />
    case "spot":
      return <SpotView ex={ex} result={result} onResolve={onResolve} />
    case "dictation":
      return <DictationView ex={ex} result={result} onResolve={onResolve} />
    case "speak":
      return <SpeakView ex={ex} result={result} onResolve={onResolve} />
  }
}
