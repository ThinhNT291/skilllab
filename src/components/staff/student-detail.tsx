"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { getStudentData } from "@/lib/db"
import { buildProfile, SKILL_INFO, MIN_SAMPLE, type SkillProfile } from "@/lib/progress/profile"
import { summarizeAttempts } from "@/lib/analytics/attempts"
import { computeStreaks, countByDay, countsFromDaily } from "@/lib/analytics/activity"

type State = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; name: string; username: string | null; profile: SkillProfile[]; streak: number; best: number; total: number; accuracy: number | null; writing: ReturnType<typeof summarizeAttempts> }

export function StudentDetail({ id }: { id: string }) {
  const [state, setState] = useState<State>({ status: "loading" })
  useEffect(() => {
    let cancelled = false
    getStudentData(id).then((r) => {
      if (cancelled) return
      if (!r.ok) return setState({ status: "error", message: r.message === "not_found" ? "Không tìm thấy học sinh này (hoặc bạn không có quyền xem)." : "Không tải được dữ liệu." })
      // Chuỗi ngày và tổng số câu lấy từ bộ đếm theo ngày (đủ cả năm, không bị cắt ở 1.000 dòng); chưa có thì dùng các dòng đã tải.
      const streaks = computeStreaks(r.daily ? countsFromDaily(r.daily) : countByDay(r.answers.map((a) => a.created_at)))
      const total = r.daily ? r.daily.reduce((n, d) => n + d.answers, 0) : r.answers.length
      const correct = r.daily ? r.daily.reduce((n, d) => n + d.correct, 0) : r.answers.filter((a) => a.correct).length
      setState({
        status: "ready",
        name: r.profile.nickname ?? r.profile.username ?? "Học sinh",
        username: r.profile.username,
        profile: buildProfile(r.answers, r.attempts),
        streak: streaks.current,
        best: streaks.best,
        total,
        accuracy: total ? correct / total : null,
        writing: summarizeAttempts(r.attempts),
      })
    })
    return () => {
      cancelled = true
    }
  }, [id])

  if (state.status === "loading") return <p className="text-muted-foreground">Đang tải…</p>
  if (state.status === "error") return <p role="alert" className="rounded-game border-2 border-dashed border-border px-4 py-3 text-muted-foreground">{state.message}</p>

  return (
    <div className="space-y-5">
      <Link href="/quan-ly" className="text-sm text-primary underline underline-offset-4">
        ← Danh sách học sinh
      </Link>
      <div>
        <h2 className="text-2xl font-extrabold">{state.name}</h2>
        {state.username && <p className="text-muted-foreground">Tên đăng nhập: {state.username}</p>}
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Chuỗi ngày học" value={`🔥 ${state.streak}`} sub={`dài nhất ${state.best}`} />
        <Stat label="Tổng lượt làm" value={String(state.total)} sub="trong 1.000 lượt gần nhất" />
        <Stat label="Tỷ lệ đúng" value={state.accuracy === null ? "—" : `${Math.round(state.accuracy * 100)}%`} sub="trong các lượt trên" />
      </div>
      <section aria-labelledby="sk" className="rounded-game border-2 border-border bg-card p-4">
        <h3 id="sk" className="mb-3 text-xl font-extrabold">
          Năng lực theo kỹ năng
        </h3>
        <ul className="space-y-3">
          {state.profile.map((p) => {
            const pct = p.score === null ? 0 : Math.round(p.score * 100)
            return (
              <li key={p.skill}>
                <div className="flex justify-between">
                  <span className="font-extrabold">{SKILL_INFO[p.skill].label}</span>
                  <span className="text-sm text-muted-foreground">{p.score === null ? (p.samples === 0 ? "chưa luyện" : `cần thêm ${Math.max(1, MIN_SAMPLE - p.samples)} lượt`) : `${pct}%`}</span>
                </div>
                <div className="mt-1 h-3 overflow-hidden rounded-full bg-border" role="img" aria-label={`${SKILL_INFO[p.skill].label}: ${p.score === null ? "chưa đủ dữ liệu" : `${pct} phần trăm`}`}>
                  <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                </div>
              </li>
            )
          })}
        </ul>
      </section>
      <section aria-labelledby="wr" className="rounded-game border-2 border-border bg-card p-4">
        <h3 id="wr" className="mb-2 text-xl font-extrabold">
          Điểm Viết và Nói
        </h3>
        <ul className="space-y-1">
          {state.writing.map((w) => (
            <li key={w.skill}>
              <strong>{w.skill === "writing" ? "Viết" : "Nói"}:</strong> {w.count === 0 ? "chưa có bài" : `${w.count} bài, gần nhất ${w.latest?.total}/10, cao nhất ${w.best}/10${w.trend === null ? "" : `, xu hướng ${w.trend >= 0 ? "+" : ""}${w.trend}`}`}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-game border-2 border-border bg-card px-4 py-3">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-3xl font-extrabold">{value}</p>
      <p className="text-sm text-muted-foreground">{sub}</p>
    </div>
  )
}
