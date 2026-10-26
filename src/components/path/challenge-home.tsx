"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { getChallengeAttempts, type ChallengeAttemptRow } from "@/lib/db"
import { levelLabel } from "@/lib/content/bac"
import { vnDayKey } from "@/lib/analytics/activity"
import { CHALLENGE_SECONDS, proposalFor } from "@/lib/path/challenge"
import type { PathStep } from "@/lib/path/catalog"
import { usePathState } from "./use-path-state"

const BTN = "inline-block rounded-game border-b-[5px] border-primary-deep bg-primary px-5 py-3 text-lg font-extrabold text-primary-foreground active:translate-y-[3px] active:border-b-2"
const VERDICT_TEXT = { up: "Rất tốt", stay: "Đúng tầm", review: "Nên ôn thêm" } as const

/** Trang giới thiệu Phòng thử thách: chọn bậc, xem các lần thử và đề xuất hiện tại. */
export function ChallengeHome({ path }: { path: PathStep[] }) {
  const { state, start } = usePathState(path)
  const cur = state.steps[state.frontier]?.step.bac ?? state.gatedBac ?? start?.bac ?? 1
  const [chosen, setChosen] = useState<number | null>(null)
  const [rows, setRows] = useState<ChallengeAttemptRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const bac = chosen ?? cur

  useEffect(() => {
    let cancelled = false
    getChallengeAttempts(30).then((r) => {
      if (cancelled) return
      if (r.ok) setRows(r.rows)
      else {
        setRows([])
        if (r.reason === "error") setError(r.message ?? "lỗi không rõ")
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  const proposal = useMemo(() => proposalFor(bac, (rows ?? []).map((r) => ({ bac: r.bac, verdict: r.verdict, day: vnDayKey(r.created_at), at: r.created_at }))), [bac, rows])

  return (
    <div className="space-y-5">
      <section className="rounded-game border-2 border-border bg-card p-5">
        <p className="font-extrabold">Chọn bậc để thử sức</p>
        <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Chọn bậc">
          {[1, 2, 3, 4, 5, 6].map((b) => (
            <button key={b} type="button" aria-pressed={bac === b} onClick={() => setChosen(b)} className={`rounded-full border-2 px-3 py-1.5 text-sm font-bold ${bac === b ? "border-primary text-primary" : "border-border"}`}>
              {levelLabel(b)}
              {b === cur ? " · bậc của bạn" : ""}
            </button>
          ))}
        </div>
        <p className="mt-3 text-muted-foreground">
          20 câu về ngữ pháp, từ vựng, đọc và nghe của {levelLabel(bac)}, trong {Math.round(CHALLENGE_SECONDS / 60)} phút. Không báo đúng/sai giữa chừng và không gợi ý, giống một bài thi thật.
        </p>
        <Link href={`/phong-thu-thach/${bac}`} className={`${BTN} mt-3`}>
          Vào Phòng thử thách · {levelLabel(bac)}
        </Link>
        {proposal.kind === "pending" && <p className="mt-3 text-sm font-bold">👏 Bạn có một bài rất tốt ở bậc này. Một bài tốt nữa vào một ngày khác thì bạn được lên {levelLabel(bac + 1)}.</p>}
        {proposal.kind === "confirmed" && <p className="mt-3 text-sm font-bold">🚀 Bạn đã có hai bài tốt ở bậc này: Lộ trình đã chuyển sang {levelLabel(bac + 1)}.</p>}
      </section>

      <p className="rounded-game border-2 border-dashed border-border p-3 text-sm text-muted-foreground">
        Phòng thử thách chỉ <strong>đề xuất</strong>: một bài tốt chưa đổi gì, hai bài tốt ở hai ngày khác nhau mới đưa bạn lên bậc kế. Một bài chưa cao <strong>không bao giờ hạ bậc</strong> của bạn, vì bài tính giờ có thể làm bạn hồi hộp.
      </p>

      {error && <p className="text-sm text-muted-foreground">Chưa đọc được lịch sử ({error}). Đã chạy tệp 0016_challenge.sql trong Supabase chưa?</p>}
      {rows && rows.length > 0 && (
        <section>
          <h2 className="mb-2 text-lg font-extrabold">Các lần thử gần đây</h2>
          <ul className="divide-y-2 divide-border overflow-hidden rounded-game border-2 border-border bg-card">
            {rows.slice(0, 10).map((r, i) => (
              <li key={i} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-sm">
                <span>
                  {new Date(r.created_at).toLocaleDateString("vi-VN")} · {levelLabel(r.bac)}
                </span>
                <span className="font-bold">
                  {r.correct}/{r.total} · {VERDICT_TEXT[r.verdict]}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
