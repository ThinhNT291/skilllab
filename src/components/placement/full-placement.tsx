"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import type { AnswerRecord, Exercise } from "@/lib/content/types"
import { pickAtPosition } from "@/lib/content/adaptive"
import { passageToExercises, type ReadingPassage } from "@/lib/reading/types"
import { itemToExercises, type ListeningItem } from "@/lib/listening/types"
import { abandonPlacementSession, finishPlacementSession, getAccountInfo, getPlacementOverview, recordAnswer, savePlacementState, startPlacementSession, type PlacementRow } from "@/lib/db"
import {
  answeredInBlock,
  initialState,
  ladderFor,
  parseResult,
  parseState,
  passageAnswers,
  pickPassageId,
  PLACEMENT_SKILLS,
  PLACEMENT_STEPS,
  PLAN,
  RETAKE_GAP_DAYS,
  retakeStatus,
  scoreSession,
  seenFromResults,
  TOTAL_ITEMS,
  type Block,
  type PlacementResult,
  type PlacementSkill,
  type SessionState,
} from "@/lib/placement/full"
import { ExerciseRunner } from "@/components/exercise/exercise-runner"
import { ProgressBar } from "@/components/exercise/progress-bar"
import { ReadingSession } from "@/components/reading/reading-session"
import { ListeningSession } from "@/components/listening/listening-session"

export interface PlacementPoolsData {
  grammar: { exercise: Exercise; rating: number }[]
  vocab: { exercise: Exercise; rating: number }[]
  reading: { passage: ReadingPassage; gloss: Record<string, string> }[]
  listening: { item: ListeningItem }[]
}

const BTN = "rounded-game border-b-[5px] border-primary-deep bg-primary px-6 py-3 text-lg font-extrabold text-primary-foreground active:translate-y-[3px] active:border-b-2 disabled:opacity-50"
const BTN2 = "rounded-game border-2 border-border bg-card px-5 py-2.5 font-extrabold hover:border-primary disabled:opacity-50"
const SKILL_LABEL: Record<PlacementSkill, string> = { grammar: "Ngữ pháp", vocab: "Từ vựng", reading: "Đọc hiểu", listening: "Nghe hiểu" }
const SKILL_ICON: Record<PlacementSkill, string> = { grammar: "✏️", vocab: "🔤", reading: "📖", listening: "🎧" }

type Phase = "loading" | "intro" | "run" | "result"
type Prev = { seen: Set<string>; wrong: Set<string>; last: PlacementRow | null; active: PlacementRow | null }

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("vi-VN")

/**
 * Bài xếp trình độ tổng hợp: 36 câu (ngữ pháp, từ vựng, đọc, nghe) chia 8 khối, khối sau chọn theo kết quả khối trước.
 * Tài khoản thật: lưu dở dang sau mỗi câu/bài (làm tiếp lần sau), lưu kết quả, làm lại sau 14 ngày với câu mới (trừ câu từng sai).
 * Khách học thử (ẩn danh): làm một mạch, không lưu. Logic chọn và chấm ở `src/lib/placement/full.ts`.
 */
export function FullPlacement({ pools }: { pools: PlacementPoolsData }) {
  const [phase, setPhase] = useState<Phase>("loading")
  const [st, setSt] = useState<SessionState>(initialState)
  const [persist, setPersist] = useState(false)
  const [prev, setPrev] = useState<Prev>({ seen: new Set(), wrong: new Set(), last: null, active: null })
  const [shown, setShown] = useState<{ result: PlacementResult; at: string | null } | null>(null)
  const [note, setNote] = useState("")
  const [lastDoneAt, setLastDoneAt] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const stRef = useRef(st)
  const persistRef = useRef(false)
  const sessionId = useRef<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const [account, overview] = await Promise.all([getAccountInfo(), getPlacementOverview()])
      if (cancelled) return
      const real = !!account && !account.anonymous
      persistRef.current = real
      setPersist(real)
      if (real && overview.ok) {
        const parsed = overview.completed.map((r) => parseResult(r.result)).filter((r): r is PlacementResult => r !== null)
        const { seen, wrong } = seenFromResults(parsed)
        const last = overview.completed[0] ?? null
        setPrev({ seen, wrong, last, active: overview.active })
        setLastDoneAt(last?.completed_at ?? null)
        const gap = retakeStatus(last?.completed_at ?? null)
        const lastResult = last ? parseResult(last.result) : null
        if (!overview.active && !gap.allowed && lastResult) {
          setShown({ result: lastResult, at: last!.completed_at })
          return setPhase("result")
        }
      }
      setPhase("intro")
    })()
    return () => {
      cancelled = true
    }
  }, [])

  function commit(next: SessionState) {
    stRef.current = next
    setSt(next)
    if (persistRef.current && sessionId.current) void savePlacementState(sessionId.current, next)
  }

  async function begin() {
    setBusy(true)
    setNote("")
    if (persistRef.current) {
      if (prev.active) await abandonPlacementSession(prev.active.id)
      const r = await startPlacementSession(initialState())
      if (!r.ok) {
        setBusy(false)
        return setNote(r.reason === "too_soon" ? `Bạn vừa làm xong gần đây. Mỗi lần làm cách nhau ít nhất ${RETAKE_GAP_DAYS} ngày để kết quả có ý nghĩa.` : "Chưa bắt đầu được, thử lại nhé.")
      }
      sessionId.current = r.id
    }
    const fresh = initialState()
    stRef.current = fresh
    setSt(fresh)
    setBusy(false)
    setPhase("run")
  }

  function resume() {
    const state = prev.active ? parseState(prev.active.state) : null
    if (!prev.active || !state) return void begin()
    sessionId.current = prev.active.id
    stRef.current = state
    setSt(state)
    setPhase("run")
  }

  function finish(final: SessionState) {
    const result = scoreSession(final)
    stRef.current = final
    setSt(final)
    if (persistRef.current && sessionId.current) void finishPlacementSession(sessionId.current, final, result)
    const now = new Date().toISOString()
    setShown({ result, at: now })
    setLastDoneAt(now)
    setPhase("result")
  }

  function advance(next: SessionState) {
    const moved = { ...next, block: next.block + 1 }
    if (moved.block >= PLAN.length) finish(moved)
    else commit(moved)
  }

  function onItemAnswer(block: Extract<Block, { kind: "items" }>, ex: Exercise, rating: number, record: AnswerRecord) {
    const cur = stRef.current
    commit({ ...cur, answers: [...cur.answers, { id: ex.id, skill: block.skill, rating, correct: record.correct }], used: [...cur.used, ex.id] })
    void recordAnswer(record, ex)
  }

  if (phase === "loading") return <p className="text-muted-foreground">Đang tải…</p>

  if (phase === "intro") {
    const answered = prev.active ? (parseState(prev.active.state)?.answers.length ?? 0) : 0
    return (
      <div className="space-y-4 rounded-game border-2 border-border bg-card p-5">
        <h2 className="text-2xl font-extrabold">Bài xếp trình độ tổng hợp</h2>
        <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
          <li>{TOTAL_ITEMS} câu: 12 ngữ pháp, 12 từ vựng, 6 đọc hiểu, 6 nghe hiểu (khoảng 25–35 phút). Cần bật loa cho phần nghe.</li>
          <li>Câu sau chọn theo cách bạn làm câu trước, nên sẽ có câu khá khó. Chưa biết thì cứ chọn đáp án bạn nghĩ đúng nhất, không sao cả.</li>
          <li>Kết quả là ước lượng của máy cho từng kỹ năng. Khi chưa rõ nằm ở hai bậc nào, hệ thống lấy bậc thấp hơn để bạn học chắc nền.</li>
          <li>Không phải điểm thi hay chứng chỉ; làm lại được sau {RETAKE_GAP_DAYS} ngày với câu hỏi mới (câu bạn từng sai có thể xuất hiện lại).</li>
        </ul>
        {!persist && <p className="rounded-game border-2 border-dashed border-border px-4 py-3">Bạn đang học thử (chưa đăng nhập): hãy làm một mạch, kết quả không được lưu. <Link href="/dang-nhap?redirect=/xep-trinh-do/tong-hop" className="font-extrabold text-primary underline underline-offset-4">Đăng nhập</Link> để lưu dở dang, làm tiếp lần sau và giữ kết quả.</p>}
        {persist && prev.active && <p className="font-bold">Bạn đang làm dở ({answered}/{TOTAL_ITEMS} câu). Làm tiếp được ngay.</p>}
        {note && <p role="alert" className="font-bold text-danger">{note}</p>}
        <div className="flex flex-wrap gap-3">
          {persist && prev.active ? (
            <>
              <button type="button" className={BTN} onClick={resume} disabled={busy}>Làm tiếp</button>
              <button type="button" className={BTN2} onClick={() => confirm("Bỏ phần đã làm và bắt đầu lại từ đầu?") && void begin()} disabled={busy}>Bắt đầu lại từ đầu</button>
            </>
          ) : (
            <button type="button" className={BTN} onClick={() => void begin()} disabled={busy}>{busy ? "Đang bắt đầu…" : "Bắt đầu"}</button>
          )}
        </div>
      </div>
    )
  }

  if (phase === "result" && shown) {
    const gap = retakeStatus(persist ? lastDoneAt : null)
    return <Result result={shown.result} at={shown.at} nextAt={persist && !gap.allowed ? gap.nextAt : null} persisted={persist} onRetake={persist && gap.allowed ? () => { setPhase("intro"); setShown(null) } : null} />
  }

  const block = PLAN[st.block]
  if (!block) return null
  const done = st.answers.length
  const remaining = block.n - answeredInBlock(st)
  return (
    <div className="space-y-4">
      <div>
        <p className="mb-1 flex items-baseline justify-between text-sm text-muted-foreground">
          <span>
            Phần {st.block + 1}/{PLAN.length} · {SKILL_ICON[block.skill]} {SKILL_LABEL[block.skill]}
          </span>
          <span>
            {done}/{TOTAL_ITEMS} câu
          </span>
        </p>
        <ProgressBar value={done / TOTAL_ITEMS} label="Tiến độ bài xếp trình độ" />
      </div>
      {block.kind === "items" ? (
        <ItemsBlock
          key={`${st.block}`}
          pool={block.skill === "grammar" ? pools.grammar : pools.vocab}
          block={block}
          state0={st}
          remaining={remaining}
          prev={prev}
          onAnswer={(ex, rating, record) => onItemAnswer(block, ex, rating, record)}
          onDone={() => advance(stRef.current)}
        />
      ) : (
        <PassageBlock
          key={`${st.block}`}
          block={block}
          pools={pools}
          state0={st}
          prev={prev}
          onDone={(id, bac, correct, total) => {
            const cur = stRef.current
            advance({ ...cur, answers: [...cur.answers, ...passageAnswers(id, block.skill, bac, correct, total)], used: [...cur.used, id] })
          }}
        />
      )}
    </div>
  )
}

/** Khối câu lẻ: dựng thang câu một lần ở đầu khối; trình chạy bài tập tự lên/xuống độ khó theo từng câu. */
function ItemsBlock({ pool, block, state0, remaining, prev, onAnswer, onDone }: { pool: { exercise: Exercise; rating: number }[]; block: Extract<Block, { kind: "items" }>; state0: SessionState; remaining: number; prev: Prev; onAnswer: (ex: Exercise, rating: number, record: AnswerRecord) => void; onDone: () => void }) {
  const plan = useMemo(() => {
    const { ladder, start } = ladderFor(pool.map((p) => ({ id: p.exercise.id, rating: p.rating })), state0, block.skill, prev.seen, prev.wrong, remaining)
    const byId = new Map(pool.map((p) => [p.exercise.id, p]))
    const exercises = ladder.flatMap((l) => (byId.get(l.id) ? [byId.get(l.id)!.exercise] : []))
    // Số câu của khối cũng chốt ngay từ đầu: `remaining` giảm theo từng câu trả lời, mà trình chạy bài tập tính tổng theo `count`.
    return { exercises, start, byId, count: Math.min(remaining, exercises.length), first: pickAtPosition(exercises, new Set(), start) }
    // Cố ý chỉ dựng một lần ở đầu khối: các câu trả lời trong khối không được làm đổi thang giữa chừng.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!plan.first || plan.count <= 0) onDone()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!plan.first || plan.count <= 0) return <p className="text-muted-foreground">Đang chuyển phần…</p>
  return (
    <ExerciseRunner
      exercises={[plan.first]}
      adaptive={{ ladder: plan.exercises, count: plan.count, start: plan.start, steps: PLACEMENT_STEPS }}
      onAnswer={(record) => {
        const p = plan.byId.get(record.exerciseId)
        if (p) onAnswer(p.exercise, p.rating, record)
      }}
      onFinish={onDone}
    />
  )
}

/** Khối bài đọc/nghe: chọn bài theo mức ước lượng một lần ở đầu khối, làm hết 3 câu rồi bấm tiếp. */
function PassageBlock({ block, pools, state0, prev, onDone }: { block: Extract<Block, { kind: "passage" }>; pools: PlacementPoolsData; state0: SessionState; prev: Prev; onDone: (id: string, bac: number, correct: number, total: number) => void }) {
  const [score, setScore] = useState<{ correct: number; total: number } | null>(null)
  const chosen = useMemo(() => {
    const list = block.skill === "reading" ? pools.reading.map((p) => ({ id: p.passage.id, bac: p.passage.bac })) : pools.listening.map((p) => ({ id: p.item.id, bac: p.item.bac }))
    const id = pickPassageId(list, state0, block.skill, prev.seen, prev.wrong)
    return id ? { id, bac: list.find((p) => p.id === id)!.bac } : null
    // Cố ý chỉ chọn một lần ở đầu khối.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!chosen) return <p className="text-muted-foreground">Chưa đủ bài cho phần này; bỏ qua.</p>
  const next = (
    <div className="anim-pop text-center">
      <button type="button" className={BTN} onClick={() => score && onDone(chosen.id, chosen.bac, score.correct, score.total)}>
        Tiếp tục
      </button>
    </div>
  )
  if (block.skill === "reading") {
    const p = pools.reading.find((x) => x.passage.id === chosen.id)!
    return (
      <div className="space-y-4">
        <ReadingSession passage={p.passage} gloss={p.gloss} exercises={passageToExercises(p.passage).slice(0, block.n)} onComplete={(correct, total) => setScore({ correct, total })} />
        {score && next}
      </div>
    )
  }
  const l = pools.listening.find((x) => x.item.id === chosen.id)!
  return (
    <div className="space-y-4">
      <ListeningSession item={l.item} exercises={itemToExercises(l.item).slice(0, block.n)} onComplete={(correct, total) => setScore({ correct, total })} />
      {score && next}
    </div>
  )
}

function Result({ result, at, nextAt, persisted, onRetake }: { result: PlacementResult; at: string | null; nextAt: string | null; persisted: boolean; onRetake: (() => void) | null }) {
  return (
    <div className="anim-pop space-y-4 rounded-game border-2 border-border bg-card p-5">
      <p className="text-sm uppercase tracking-wide text-muted-foreground">Kết quả xếp trình độ tổng hợp{at ? ` · ${fmtDate(at)}` : ""}</p>
      <p className="text-3xl font-extrabold" data-testid="overall">
        Bậc tổng: {result.overall.bac === 0 ? "dưới Bậc 1 (Pre-A1)" : result.overall.label}
      </p>
      <ul className="grid gap-2 sm:grid-cols-2">
        {PLACEMENT_SKILLS.map((k) => {
          const l = result.skills[k]
          return (
            <li key={k} className="rounded-game border-2 border-border px-4 py-3">
              <p className="text-sm text-muted-foreground">
                {SKILL_ICON[k]} {SKILL_LABEL[k]}
              </p>
              <p className="text-xl font-extrabold">{l.bac === 0 ? "dưới Bậc 1 (Pre-A1)" : l.label}</p>
              {l.confidence === "low" && <p className="text-sm text-muted-foreground">Ít câu nên chưa chắc lắm.</p>}
            </li>
          )
        })}
      </ul>
      <div className="space-y-2 rounded-game border-2 border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
        <p>
          <strong className="text-foreground">Đọc kết quả thế nào?</strong> Đây là ước lượng của máy từ {TOTAL_ITEMS} câu, không phải điểm thi hay chứng chỉ. Bậc tổng là trung vị của bốn kỹ năng, nên một kỹ năng yếu không kéo tụt cả bậc, nhưng đó là kỹ năng nên luyện thêm.
        </p>
        <p>
          Khi kết quả chưa rõ nằm ở hai bậc nào, hệ thống lấy bậc thấp hơn để bạn học chắc nền. Nếu hôm đó bạn mệt, hồi hộp hoặc vội, kết quả có thể thấp hơn khả năng thật: không sao cả, bạn vẫn học bình thường và có thể làm lại sau {RETAKE_GAP_DAYS} ngày.
        </p>
      </div>
      {!persisted && <p className="text-sm text-muted-foreground">Bạn đang học thử nên kết quả này không được lưu. Đăng nhập để lưu.</p>}
      {nextAt && <p className="text-sm">Bạn có thể làm lại từ ngày {fmtDate(nextAt)}.</p>}
      <div className="flex flex-wrap gap-3">
        <Link href="/" className={BTN2}>
          Về trang chủ
        </Link>
        <Link href="/tien-do" className={BTN2}>
          Xem hồ sơ năng lực
        </Link>
        {onRetake && (
          <button type="button" className={BTN2} onClick={onRetake}>
            Làm lại
          </button>
        )}
      </div>
    </div>
  )
}
