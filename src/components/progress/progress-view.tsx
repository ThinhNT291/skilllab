"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { summarize, type ProgressSummary, type TagInfo } from "@/lib/analytics/progress"
import { countDueCards, getAnswerHistory } from "@/lib/db"
import { ProgressBar } from "@/components/exercise/progress-bar"
import { PlayerCard } from "@/components/game/player-card"
import { ActivityPanel } from "./activity-panel"

type State = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; summary: ProgressSummary }

export function ProgressView({ catalog, topicTitles }: { catalog: Record<string, TagInfo>; topicTitles: Record<string, string> }) {
  const [state, setState] = useState<State>({ status: "loading" })
  const [due, setDue] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    getAnswerHistory().then((res) => {
      if (cancelled) return
      if (!res.ok) {
        setState({ status: "error", message: res.reason === "not_configured" ? "Chưa kết nối Supabase nên chưa có dữ liệu tiến độ." : `Không tải được dữ liệu (${res.message ?? "lỗi không rõ"}).` })
        return
      }
      setState({ status: "ready", summary: summarize(res.rows, catalog, topicTitles) })
    })
    countDueCards().then((res) => {
      if (!cancelled && res.ok) setDue(res.value)
    })
    return () => {
      cancelled = true
    }
  }, [catalog, topicTitles])

  if (state.status === "loading") return <p className="text-muted-foreground">Đang tải tiến độ…</p>
  if (state.status === "error") return <p className="rounded-game border-2 border-dashed border-border px-4 py-3 text-muted-foreground">{state.message}</p>

  const s = state.summary
  if (s.total === 0) {
    return (
      <div className="rounded-game border-2 border-dashed border-border px-4 py-6 text-center">
        <p className="text-lg font-extrabold">Chưa có dữ liệu</p>
        <p className="mt-1 text-muted-foreground">Làm vài câu luyện tập rồi quay lại đây nhé.</p>
        <Link href="/hoc" className="mt-3 inline-block text-primary underline underline-offset-4">
          Đến khu Học
        </Link>
      </div>
    )
  }

  const accuracy = Math.round((s.correct / s.total) * 100)
  return (
    <div className="space-y-8">
      {due !== null && due > 0 && (
        <Link href="/on-tap" className="flex items-center justify-between gap-3 rounded-game border-2 border-accent bg-card px-4 py-3 hover:border-primary">
          <span className="font-extrabold">🃏 Có {due >= 100 ? "100+" : due} thẻ cần ôn hôm nay</span>
          <span className="text-primary underline underline-offset-4">Ôn ngay</span>
        </Link>
      )}
      <PlayerCard />
      <ActivityPanel />
      <section className="grid grid-cols-3 gap-3 text-center" aria-label="Tổng quan">
        <Stat value={String(s.total)} label="câu đã làm" />
        <Stat value={`${accuracy}%`} label="trả lời đúng" />
        <Stat value={String(s.topicsTried)} label="chuyên đề" />
      </section>

      <section aria-labelledby="weak-heading">
        <h2 id="weak-heading" className="mb-2 text-xl font-extrabold">
          Cần ôn lại
        </h2>
        {s.weakTags.length === 0 ? (
          <p className="rounded-game border-2 border-border bg-card px-4 py-3">Chưa có điểm yếu nào, làm tốt lắm! 🎉</p>
        ) : (
          <ul className="space-y-3">
            {s.weakTags.map((w) => (
              <li key={w.tag} className="rounded-game border-2 border-border bg-card p-4">
                <p className="font-extrabold">{w.label}</p>
                <p className="text-sm text-muted-foreground">
                  {w.topicTitle} · sai {w.wrong}/{w.attempts} lần
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link href={`/hoc/${w.topicId}#${w.tag}`} className="rounded-full border-2 border-border px-3 py-1.5 text-sm hover:border-primary">
                    Xem lại lý thuyết
                  </Link>
                  <Link
                    href={`/hoc/${w.topicId}/luyen-tap?tag=${encodeURIComponent(w.tag)}`}
                    className="rounded-full border-b-4 border-primary-deep bg-primary px-3 py-1.5 text-sm font-extrabold text-primary-foreground"
                  >
                    Luyện lại mục này
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="topics-heading">
        <h2 id="topics-heading" className="mb-2 text-xl font-extrabold">
          Theo chuyên đề
        </h2>
        <ul className="space-y-3">
          {s.byTopic.map((t) => (
            <li key={t.topicId}>
              <Link href={`/hoc/${t.topicId}`} className="block rounded-game border-2 border-border bg-card p-4 hover:border-primary">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-extrabold">{t.topicTitle}</span>
                  <span className="shrink-0 text-sm text-muted-foreground">
                    {t.correct}/{t.total} đúng
                  </span>
                </div>
                <div className="mt-2 flex">
                  <ProgressBar value={t.correct / t.total} label={`Tỷ lệ đúng: ${t.topicTitle}`} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-game border-2 border-border bg-card px-2 py-3">
      <p className="text-3xl font-extrabold text-primary">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}
