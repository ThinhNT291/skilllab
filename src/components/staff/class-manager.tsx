"use client"

import { useState } from "react"
import { createClass, setMembership } from "@/lib/db"
import { useStaffData } from "./use-staff-data"

const INPUT = "rounded-game border-2 border-border bg-card px-3 py-2"
const BTN = "rounded-game border-2 border-border bg-card px-3 py-2 font-extrabold hover:border-primary disabled:opacity-50"

/** Lớp và thành viên. Chỉ quản trị ghi được (RLS); giáo viên xem lớp mình. */
export function ClassManager() {
  const { state, reload } = useStaffData()
  const [name, setName] = useState("")
  const [note, setNote] = useState("")

  if (state.status === "loading") return <p className="text-muted-foreground">Đang tải…</p>
  if (state.status === "error") return <p role="alert" className="rounded-game border-2 border-dashed border-border px-4 py-3 text-muted-foreground">{state.message}</p>
  const { classes, accounts } = state.data
  const label = (id: string) => accounts.find((a) => a.id === id)?.nickname ?? accounts.find((a) => a.id === id)?.username ?? "(không rõ)"

  async function run(p: Promise<{ ok: boolean; message?: string }>) {
    const r = await p
    setNote(r.ok ? "" : `Chưa làm được (${r.message ?? "lỗi không rõ"}). Chỉ quản trị mới sửa được lớp.`)
    if (r.ok) reload()
  }

  return (
    <div className="space-y-5">
      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          if (!name.trim()) return
          void run(createClass(name)).then(() => setName(""))
        }}
      >
        <label>
          <span className="block font-extrabold">Tạo lớp mới</span>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="Ví dụ: Lớp 6A" className={INPUT} />
        </label>
        <button type="submit" className={BTN}>
          Tạo lớp
        </button>
      </form>
      {note && (
        <p role="alert" className="font-bold text-danger">
          {note}
        </p>
      )}
      {classes.length === 0 && <p className="rounded-game border-2 border-dashed border-border px-4 py-6 text-center text-muted-foreground">Chưa có lớp nào.</p>}
      <ul className="space-y-4">
        {classes.map((c) => {
          const free = accounts.filter((a) => (a.role === "student" && !c.members.includes(a.id)) || (a.role === "teacher" && !c.teachers.includes(a.id)))
          return (
            <li key={c.id} className="space-y-3 rounded-game border-2 border-border bg-card p-4">
              <h2 className="text-xl font-extrabold">
                {c.name} <span className="text-sm font-normal text-muted-foreground">({c.language_code})</span>
              </h2>
              <div>
                <p className="font-extrabold">Giáo viên</p>
                {c.teachers.length === 0 ? <p className="text-muted-foreground">Chưa có.</p> : <Chips ids={c.teachers} label={label} onRemove={(id) => run(setMembership("teacher", c.id, id, false))} />}
              </div>
              <div>
                <p className="font-extrabold">Học sinh ({c.members.length})</p>
                {c.members.length === 0 ? <p className="text-muted-foreground">Chưa có.</p> : <Chips ids={c.members} label={label} onRemove={(id) => run(setMembership("member", c.id, id, false))} />}
              </div>
              {free.length > 0 && (
                <label className="flex flex-wrap items-center gap-2">
                  <span className="font-extrabold">Thêm vào lớp</span>
                  <select
                    className={INPUT}
                    value=""
                    onChange={(e) => {
                      const a = accounts.find((x) => x.id === e.target.value)
                      if (a) void run(setMembership(a.role === "teacher" ? "teacher" : "member", c.id, a.id, true))
                    }}
                  >
                    <option value="">Chọn tài khoản…</option>
                    {free.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.nickname ?? a.username} ({a.role === "teacher" ? "giáo viên" : "học sinh"})
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function Chips({ ids, label, onRemove }: { ids: string[]; label: (id: string) => string; onRemove: (id: string) => void }) {
  return (
    <ul className="mt-1 flex flex-wrap gap-2">
      {ids.map((id) => (
        <li key={id} className="flex items-center gap-1 rounded-full border-2 border-border px-3 py-1 text-sm">
          {label(id)}
          <button type="button" onClick={() => onRemove(id)} aria-label={`Bỏ ${label(id)} khỏi lớp`} className="font-extrabold text-danger">
            ×
          </button>
        </li>
      ))}
    </ul>
  )
}
