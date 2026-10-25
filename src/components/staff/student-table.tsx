"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { attentionReasons, summarizeActivity } from "@/lib/staff/summary"
import { useStaffData } from "./use-staff-data"

/** Danh sách học sinh: hoạt động 7 ngày, ai cần chú ý hiện lên đầu. */
export function StudentTable() {
  const { state } = useStaffData()
  const [classId, setClassId] = useState("all")

  const view = useMemo(() => {
    if (state.status !== "ready") return null
    const { accounts, classes, answers, now } = state.data
    const activity = summarizeActivity(answers)
    const inClass = classId === "all" ? null : new Set(classes.find((c) => c.id === classId)?.members ?? [])
    const rows = accounts
      .filter((a) => a.role === "student" && (!inClass || inClass.has(a.id)))
      .map((a) => ({ a, act: activity.get(a.id), flags: a.disabled_at ? ["tài khoản đang khóa"] : attentionReasons(activity.get(a.id), now) }))
      .sort((x, y) => y.flags.length - x.flags.length || (y.act?.answers ?? 0) - (x.act?.answers ?? 0))
    return { rows, classes }
  }, [state, classId])

  if (state.status === "loading") return <p className="text-muted-foreground">Đang tải…</p>
  if (state.status === "error") return <p role="alert" className="rounded-game border-2 border-dashed border-border px-4 py-3 text-muted-foreground">{state.message}</p>
  if (!view) return null

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2">
        <span className="font-extrabold">Lớp</span>
        <select value={classId} onChange={(e) => setClassId(e.target.value)} className="rounded-game border-2 border-border bg-card px-3 py-2">
          <option value="all">Tất cả</option>
          {view.classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      {view.rows.length === 0 ? (
        <p className="rounded-game border-2 border-dashed border-border px-4 py-6 text-center text-muted-foreground">Chưa có học sinh nào. Quản trị tạo tài khoản ở thẻ “Tài khoản”.</p>
      ) : (
        <div className="overflow-x-auto rounded-game border-2 border-border bg-card">
          <table className="w-full text-left">
            <caption className="sr-only">Hoạt động của học sinh trong 7 ngày gần nhất</caption>
            <thead className="text-sm text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-2">Học sinh</th>
                <th scope="col" className="px-4 py-2">Lượt làm (7 ngày)</th>
                <th scope="col" className="px-4 py-2">Tỷ lệ đúng</th>
                <th scope="col" className="px-4 py-2">Lần cuối</th>
                <th scope="col" className="px-4 py-2">Cần chú ý</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-border">
              {view.rows.map(({ a, act, flags }) => (
                <tr key={a.id}>
                  <th scope="row" className="px-4 py-2">
                    <Link href={`/quan-ly/hoc-sinh/${a.id}`} className="text-primary underline underline-offset-4">
                      {a.nickname ?? a.username}
                    </Link>
                    <span className="block text-sm font-normal text-muted-foreground">{a.username}</span>
                  </th>
                  <td className="px-4 py-2">{act?.answers ?? 0}</td>
                  <td className="px-4 py-2">{act?.accuracy === null || !act ? "—" : `${Math.round(act.accuracy * 100)}%`}</td>
                  <td className="px-4 py-2">{act?.lastAt ? new Date(act.lastAt).toLocaleDateString("vi-VN") : "—"}</td>
                  <td className="px-4 py-2 text-sm">{flags.length ? <span className="font-extrabold text-danger">{flags.join("; ")}</span> : <span className="text-muted-foreground">Ổn</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
