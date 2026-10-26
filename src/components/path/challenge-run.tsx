"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import type { Exercise, McqExercise } from "@/lib/content/types"
import { getChallengeAttempts, raisePathStart, recordAnswer, recordChallengeAttempt } from "@/lib/db"
import { levelLabel } from "@/lib/content/bac"
import { vnDayKey } from "@/lib/analytics/activity"
import { parseDialogue } from "@/lib/audio/dialogue"
import { cancelSpeech, speakDialogue } from "@/lib/audio/tts"
import { KIND_LABEL, type LessonKind } from "@/lib/path/catalog"
import { CHALLENGE_LISTEN_PLAYS, CHALLENGE_SECONDS, proposalFor, skillBreakdown, verdictOf, type ChallengeAnswer, type Proposal, type Verdict } from "@/lib/path/challenge"
import type { MixedPayload } from "@/lib/path/data"
import { skillOfTopic } from "@/lib/progress/profile"

const BTN = "rounded-game border-b-[5px] border-primary-deep bg-primary px-5 py-3 text-center text-lg font-extrabold text-primary-foreground enabled:active:translate-y-[3px] enabled:active:border-b-2 disabled:opacity-50"
const GHOST = "rounded-game border-2 border-border bg-card px-4 py-2.5 font-extrabold enabled:hover:border-primary disabled:opacity-50"

type Context = { kind: "passage"; title: string; text: string } | { kind: "audio"; title: string; transcript: string }
interface Unit {
  ex: McqExercise
  skill: LessonKind
  context?: Context
}

interface Taken extends Unit {
  chosen: number | null
}

/** Lời giải thích bắt buộc kèm kết quả Phòng thử thách (chốt với chủ dự án): tránh đánh giá sai do căng thẳng. */
export const PRESSURE_NOTE = "Bài này tính giờ và không có gợi ý, nên kết quả có thể thấp hơn lúc bạn học bình thường vì hồi hộp. Đây là một lần đo, chưa phải kết luận. Bậc của bạn trong Lộ trình sẽ không bị hạ chỉ vì một bài."

function buildUnits(p: MixedPayload): Unit[] {
  const units: Unit[] = []
  for (const ex of p.items) if (ex.kind === "mcq") units.push({ ex, skill: skillOfTopic(ex.topic) as LessonKind })
  if (p.reading) for (const ex of p.reading.exercises) if (ex.kind === "mcq") units.push({ ex, skill: "reading", context: { kind: "passage", title: p.reading.passage.title, text: p.reading.passage.text } })
  if (p.listening) for (const ex of p.listening.exercises) if (ex.kind === "mcq") units.push({ ex, skill: "listening", context: { kind: "audio", title: p.listening.item.title, transcript: p.listening.item.transcript } })
  return units
}

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`

/**
 * Phòng thử thách: 20 câu đủ kỹ năng của một bậc, tính giờ, KHÔNG hiện đáp án đúng/sai giữa chừng, không gợi ý, không quay lại câu trước.
 * Kết quả chỉ đề xuất (xem lib/path/challenge.ts): một bài tệ không hạ bậc; hai bài tốt ở hai ngày khác nhau mới nâng điểm bắt đầu.
 */
export function ChallengeRun({ payload }: { payload: MixedPayload }) {
  const units = useMemo(() => buildUnits(payload), [payload])
  const [phase, setPhase] = useState<"intro" | "run" | "result">("intro")
  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [left, setLeft] = useState(CHALLENGE_SECONDS)
  const taken = useRef<Taken[]>([])
  const startedAt = useRef(0)
  const finished = useRef(false)
  const [outcome, setOutcome] = useState<{ taken: Taken[]; seconds: number; verdict: Verdict; weak: LessonKind[]; proposal: Proposal; saved: boolean; raised: boolean } | null>(null)

  async function finish() {
    if (finished.current) return
    finished.current = true
    cancelSpeech()
    const seconds = Math.min(CHALLENGE_SECONDS, Math.round((Date.now() - startedAt.current) / 1000))
    // Câu chưa kịp làm tính là chưa đúng.
    const all: Taken[] = [...taken.current, ...units.slice(taken.current.length).map((u) => ({ ...u, chosen: null }))]
    const answers: ChallengeAnswer[] = all.map((t) => ({ skill: t.skill, correct: t.chosen === t.ex.correctIndex }))
    const { verdict, weak } = verdictOf(answers)
    const correct = answers.filter((a) => a.correct).length
    const saved = (await recordChallengeAttempt({ bac: payload.bac, correct, total: answers.length, seconds, skills: skillBreakdown(answers), verdict })).ok
    let proposal: Proposal = verdict === "up" ? { kind: "pending", bac: payload.bac } : { kind: "none" }
    let raised = false
    const history = await getChallengeAttempts(20)
    if (history.ok) {
      proposal = proposalFor(payload.bac, history.rows.map((r) => ({ bac: r.bac, verdict: r.verdict, day: vnDayKey(r.created_at), at: r.created_at })))
      // Lần vừa rồi có thể chưa kịp vào danh sách (mạng chậm): nếu chưa có thì tính thêm lần này.
      if (verdict === "up" && proposal.kind === "none") proposal = { kind: "pending", bac: payload.bac }
    }
    if (proposal.kind === "confirmed") raised = (await raisePathStart(payload.bac + 1, 1, "challenge")).ok
    setOutcome({ taken: all, seconds, verdict, weak, proposal, saved, raised })
    setPhase("result")
  }

  // Đếm ngược theo giờ thật (không trôi khi tab chạy nền); hết giờ thì nộp bài.
  useEffect(() => {
    if (phase !== "run") return
    const tick = () => {
      const remaining = CHALLENGE_SECONDS - Math.floor((Date.now() - startedAt.current) / 1000)
      setLeft(Math.max(0, remaining))
      if (remaining <= 0) void finish()
    }
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  useEffect(() => () => cancelSpeech(), [])

  if (!units.length) return <p className="text-muted-foreground">Bậc này chưa có đủ nội dung cho Phòng thử thách.</p>

  if (phase === "intro") {
    return (
      <div className="rounded-game border-2 border-border bg-card p-6">
        <p className="text-xl font-extrabold">Phòng thử thách · {levelLabel(payload.bac)}</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
          <li>
            {units.length} câu về ngữ pháp, từ vựng, đọc và nghe, trong <strong>{Math.round(CHALLENGE_SECONDS / 60)} phút</strong>.
          </li>
          <li>Không báo đúng/sai giữa chừng, không gợi ý, không quay lại câu trước. Bài nghe được nghe {CHALLENGE_LISTEN_PLAYS} lần.</li>
          <li>Hết giờ thì câu chưa làm tính là chưa đúng.</li>
        </ul>
        <p className="mt-3 rounded-game border-2 border-dashed border-border p-3 text-sm text-muted-foreground">{PRESSURE_NOTE}</p>
        <button
          type="button"
          className={`${BTN} mt-4 w-full`}
          onClick={() => {
            startedAt.current = Date.now()
            setPhase("run")
          }}
        >
          Bắt đầu tính giờ
        </button>
      </div>
    )
  }

  if (phase === "result" && outcome) return <Result bac={payload.bac} o={outcome} />

  const unit = units[index]
  function submit() {
    if (picked === null) return
    const t: Taken = { ...unit, chosen: picked }
    taken.current = [...taken.current, t]
    void recordAnswer({ exerciseId: unit.ex.id, correct: picked === unit.ex.correctIndex, choiceIndex: picked }, unit.ex as Exercise)
    setPicked(null)
    if (index + 1 >= units.length) void finish()
    else setIndex(index + 1)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm font-bold">
        <span>
          Câu {index + 1}/{units.length} · {KIND_LABEL[unit.skill]}
        </span>
        <span role="timer" aria-label="Thời gian còn lại" className={left <= 120 ? "text-danger" : ""}>
          ⏱ {mmss(left)}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted" aria-hidden>
        <div className="h-full bg-primary" style={{ width: `${Math.round((index / units.length) * 100)}%` }} />
      </div>
      {unit.context && <ContextBox key={unit.context.title} ctx={unit.context} />}
      <div className="rounded-game border-2 border-border bg-card p-5">
        <p className="mb-3 whitespace-pre-line text-xl font-extrabold leading-relaxed">{unit.ex.prompt}</p>
        <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Các đáp án">
          {unit.ex.choices.map((c, i) => (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={picked === i}
              onClick={() => setPicked(i)}
              className={`rounded-game border-2 border-b-4 px-4 py-3 text-left text-lg font-bold ${picked === i ? "border-primary bg-background" : "border-border bg-card hover:border-primary"}`}
            >
              <span className="text-muted-foreground">{"ABCD"[i]}.</span> {c}
            </button>
          ))}
        </div>
        <button type="button" className={`${BTN} mt-4 w-full`} disabled={picked === null} onClick={submit}>
          {index + 1 >= units.length ? "Chốt và nộp bài" : "Chốt đáp án"}
        </button>
      </div>
    </div>
  )
}

function ContextBox({ ctx }: { ctx: Context }) {
  const [plays, setPlays] = useState(0)
  const parts = useMemo(() => (ctx.kind === "audio" ? parseDialogue(ctx.transcript) : []), [ctx])
  if (ctx.kind === "passage") {
    return (
      <div className="rounded-game border-2 border-border bg-card p-4">
        <p className="mb-2 font-extrabold" lang="en">
          {ctx.title}
        </p>
        <div className="space-y-2 leading-relaxed" lang="en">
          {ctx.text.split(/\n\s*\n/).map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      </div>
    )
  }
  return (
    <div className="rounded-game border-2 border-border bg-card p-4">
      <p className="mb-2 font-extrabold">{ctx.title}</p>
      <button
        type="button"
        className={GHOST}
        disabled={plays >= CHALLENGE_LISTEN_PLAYS}
        onClick={() => {
          setPlays((n) => n + 1)
          void speakDialogue(parts, 0.9)
        }}
      >
        🔊 Nghe (còn {CHALLENGE_LISTEN_PLAYS - plays} lần)
      </button>
    </div>
  )
}

function Result({ bac, o }: { bac: number; o: { taken: Taken[]; seconds: number; verdict: Verdict; weak: LessonKind[]; proposal: Proposal; saved: boolean; raised: boolean } }) {
  const total = o.taken.length
  const correct = o.taken.filter((t) => t.chosen === t.ex.correctIndex).length
  const per = skillBreakdown(o.taken.map((t) => ({ skill: t.skill, correct: t.chosen === t.ex.correctIndex })))
  const wrong = o.taken.filter((t) => t.chosen !== t.ex.correctIndex)
  return (
    <div className="space-y-4">
      <div className="rounded-game border-2 border-border bg-card p-6" role="status">
        <p className="text-sm text-muted-foreground">Phòng thử thách · {levelLabel(bac)}</p>
        <p className="text-3xl font-extrabold">
          Đúng {correct}/{total} câu
        </p>
        <p className="text-muted-foreground">Thời gian: {mmss(o.seconds)}</p>
        <ul className="mt-3 space-y-1">
          {per.map((s) => (
            <li key={s.skill} className="flex items-center gap-2 text-sm">
              <span className="w-24 shrink-0">{KIND_LABEL[s.skill]}</span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted" aria-hidden>
                <span className="block h-full bg-primary" style={{ width: `${Math.round((s.correct / s.total) * 100)}%` }} />
              </span>
              <span className="w-10 text-right font-bold">
                {s.correct}/{s.total}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-4 font-semibold leading-relaxed">
          {o.proposal.kind === "confirmed" ? (
            <p>🚀 Hai bài thử thách tốt ở hai ngày khác nhau! {o.raised ? `Lộ trình của bạn giờ bắt đầu từ ${levelLabel(bac + 1)} · chặng 1 (các chặng dưới vẫn mở để ôn).` : "Mình chưa lưu được điểm bắt đầu mới (đã chạy tệp 0015 và 0016 trong Supabase và đăng nhập chưa?)."}</p>
          ) : o.verdict === "up" ? (
            <p>👏 Kết quả rất tốt! Mình chưa đổi gì ngay: làm thêm một bài thử thách khác vào một ngày khác, nếu vẫn tốt thì bạn được lên {levelLabel(bac + 1)}.</p>
          ) : o.verdict === "stay" ? (
            <p>👍 Bạn đang ở đúng tầm của bậc này. Cứ tiếp tục học đều trong Lộ trình nhé.{o.weak.length ? ` Nên luyện thêm: ${o.weak.map((k) => KIND_LABEL[k]).join(", ")}.` : ""}</p>
          ) : (
            <p>💪 Lần này chưa cao, và không sao cả. Nên ôn lại các chặng của bậc này trong Lộ trình rồi thử lại sau. Bậc của bạn không bị hạ.</p>
          )}
        </div>
        <p className="mt-3 rounded-game border-2 border-dashed border-border p-3 text-sm text-muted-foreground">{PRESSURE_NOTE}</p>
        {!o.saved && <p className="mt-2 text-sm text-danger">Chưa lưu được lần thử này (đã chạy tệp 0016_challenge.sql trong Supabase và đăng nhập chưa?).</p>}
        <div className="mt-4 flex flex-col gap-2">
          <Link href="/lo-trinh" className={BTN}>
            Về Lộ trình
          </Link>
          <Link href="/phong-thu-thach" className="py-2 text-center text-primary underline underline-offset-4">
            Phòng thử thách
          </Link>
        </div>
      </div>

      {wrong.length > 0 && (
        <details className="rounded-game border-2 border-border bg-card p-4">
          <summary className="cursor-pointer font-extrabold">Xem lại {wrong.length} câu chưa đúng</summary>
          <ul className="mt-3 space-y-4">
            {wrong.map((t) => (
              <li key={t.ex.id} className="text-sm">
                <p className="whitespace-pre-line font-extrabold">{t.ex.prompt}</p>
                <p className="mt-1">
                  Bạn chọn: <span className="text-danger">{t.chosen === null ? "(chưa làm)" : t.ex.choices[t.chosen]}</span> · Đáp án đúng: <span className="text-success">{t.ex.choices[t.ex.correctIndex]}</span>
                </p>
                <p className="mt-1 text-muted-foreground">{t.ex.choiceExplanations?.[t.ex.correctIndex] ?? t.ex.explanation}</p>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}
