"use client"

import { useState } from "react"
import { useStaffData } from "./use-staff-data"
import { ROLE_LABEL } from "@/lib/auth/roles"
import { RESET_SCOPES } from "@/lib/auth/reset"

const INPUT = "mt-1 block w-full rounded-game border-2 border-border bg-card px-3 py-2"
const BTN = "rounded-game border-2 border-border bg-card px-3 py-1.5 text-sm font-extrabold hover:border-primary disabled:opacity-50"
const ERRORS: Record<string, string> = {
  wrong_password: "Mật khẩu của bạn chưa đúng.",
  bad_username: "Tên đăng nhập gồm chữ thường, số, dấu chấm hoặc gạch dưới (3–30 ký tự).",
  username_taken: "Tên đăng nhập này đã có người dùng.",
  bad_role: "Vai trò chưa hợp lệ.",
  self_lock: "Bạn không thể tự khóa tài khoản của mình.",
  last_admin: "Không thể khóa quản trị viên cuối cùng.",
  protected_role: "Không đổi vai trò của quản trị viên ở đây.",
  forbidden: "Chỉ quản trị mới dùng được chức năng này.",
  bad_scope: "Chọn ít nhất một loại dữ liệu cần xóa.",
  not_student: "Chỉ đặt lại dữ liệu của học sinh.",
  confirm_mismatch: "Tên đăng nhập gõ xác nhận chưa khớp.",
  reset_data_failed: "Xóa dữ liệu chưa xong (xem nhật ký). Thử lại sau.",
  server_not_configured: "Máy chủ chưa có khóa service_role (xem docs/phan-quyen.md).",
}

interface Issued {
  username: string
  password: string
  what: string
}

/** Tạo tài khoản, đặt lại mật khẩu, khóa/mở khóa. Mọi thao tác hỏi lại mật khẩu của quản trị và ghi nhật ký. */
export function AccountManager() {
  const { state, reload } = useStaffData()
  const [adminPassword, setAdminPassword] = useState("")
  const [username, setUsername] = useState("")
  const [nickname, setNickname] = useState("")
  const [role, setRole] = useState<"student" | "teacher">("student")
  const [classId, setClassId] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [issued, setIssued] = useState<Issued | null>(null)
  const [resetId, setResetId] = useState<string | null>(null)
  const [resetScopes, setResetScopes] = useState<string[]>([])
  const [resetConfirm, setResetConfirm] = useState("")
  const [resetNote, setResetNote] = useState("")

  if (state.status === "loading") return <p className="text-muted-foreground">Đang tải…</p>
  if (state.status === "error") return <p role="alert" className="rounded-game border-2 border-dashed border-border px-4 py-3 text-muted-foreground">{state.message}</p>
  const { accounts, classes } = state.data

  async function call(body: Record<string, unknown>) {
    setBusy(true)
    setError("")
    const res = await fetch("/api/admin/accounts", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...body, adminPassword }) })
    const json = (await res.json().catch(() => ({}))) as { error?: string; password?: string; username?: string }
    setBusy(false)
    if (!res.ok) {
      setError(ERRORS[json.error ?? ""] ?? "Chưa làm được, thử lại nhé.")
      return null
    }
    reload()
    return json
  }

  async function create(e: React.FormEvent) {
    e.preventDefault()
    const j = await call({ action: "create", username, nickname, role, classId: classId || undefined })
    if (j?.password) {
      setIssued({ username: j.username ?? username, password: j.password, what: "Tài khoản mới" })
      setUsername("")
      setNickname("")
    }
  }

  async function reset(id: string, name: string) {
    if (!confirm(`Đặt lại mật khẩu cho ${name}? Mật khẩu cũ sẽ không dùng được nữa.`)) return
    const j = await call({ action: "reset_password", id })
    if (j?.password) setIssued({ username: name, password: j.password, what: "Mật khẩu mới" })
  }

  async function resetData(id: string) {
    const j = await call({ action: "reset_data", id, scopes: resetScopes, confirm: resetConfirm })
    if (j) {
      setResetNote("Đã xóa dữ liệu đã chọn. Việc này được ghi vào nhật ký quản lý.")
      setResetId(null)
      setResetScopes([])
      setResetConfirm("")
    }
  }

  return (
    <div className="space-y-6">
      <label className="block max-w-sm">
        <span className="font-extrabold">Mật khẩu của bạn (để xác nhận mọi thao tác ở đây)</span>
        <input type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} className={INPUT} autoComplete="current-password" />
      </label>
      {error && (
        <p role="alert" className="font-bold text-danger">
          {error}
        </p>
      )}
      {resetNote && (
        <p role="status" className="font-bold text-success">
          {resetNote}
        </p>
      )}
      {issued && (
        <div role="status" className="space-y-1 rounded-game border-2 border-success bg-success-soft p-4">
          <p className="font-extrabold">{issued.what}: đưa thông tin này cho học sinh. Mật khẩu chỉ hiện MỘT lần.</p>
          <p>
            Tên đăng nhập: <strong>{issued.username}</strong>
          </p>
          <p>
            Mật khẩu tạm: <strong className="select-all font-mono text-xl">{issued.password}</strong>
          </p>
          <p className="text-sm">Lần đầu đăng nhập, bạn ấy sẽ được yêu cầu đặt mật khẩu của riêng mình.</p>
          <button type="button" className={BTN} onClick={() => setIssued(null)}>
            Đã ghi lại, ẩn đi
          </button>
        </div>
      )}

      <form onSubmit={create} className="space-y-3 rounded-game border-2 border-border bg-card p-4">
        <h2 className="text-xl font-extrabold">Tạo tài khoản</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label>
            <span className="font-extrabold">Tên đăng nhập</span>
            <input value={username} onChange={(e) => setUsername(e.target.value)} className={INPUT} placeholder="vd: minh.6a" autoCapitalize="none" spellCheck={false} required />
          </label>
          <label>
            <span className="font-extrabold">Biệt danh (không dùng tên thật)</span>
            <input value={nickname} onChange={(e) => setNickname(e.target.value)} maxLength={30} className={INPUT} />
          </label>
          <label>
            <span className="font-extrabold">Vai trò</span>
            <select value={role} onChange={(e) => setRole(e.target.value as "student" | "teacher")} className={INPUT}>
              <option value="student">Học sinh</option>
              <option value="teacher">Giáo viên</option>
            </select>
          </label>
          <label>
            <span className="font-extrabold">Lớp</span>
            <select value={classId} onChange={(e) => setClassId(e.target.value)} className={INPUT}>
              <option value="">(chưa xếp lớp)</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button type="submit" disabled={busy || !adminPassword} className="rounded-game border-b-[5px] border-primary-deep bg-primary px-5 py-2.5 font-extrabold text-primary-foreground active:translate-y-[3px] active:border-b-2 disabled:opacity-50">
          {busy ? "Đang tạo…" : "Tạo tài khoản"}
        </button>
      </form>

      <section aria-labelledby="ds">
        <h2 id="ds" className="mb-2 text-xl font-extrabold">
          Tài khoản ({accounts.length})
        </h2>
        <ul className="divide-y-2 divide-border overflow-hidden rounded-game border-2 border-border bg-card">
          {accounts.map((a) => {
            const name = a.nickname ?? a.username ?? ""
            return (
              <li key={a.id} className="flex flex-wrap items-center gap-2 px-4 py-3">
                <span className="min-w-0 flex-1">
                  <strong>{name}</strong> <span className="text-sm text-muted-foreground">({a.username} · {ROLE_LABEL[a.role]})</span>
                  {a.disabled_at && <span className="ml-2 rounded-full bg-danger-soft px-2 py-0.5 text-sm text-danger">đang khóa</span>}
                </span>
                <button type="button" className={BTN} disabled={busy || !adminPassword} onClick={() => reset(a.id, name)}>
                  Đặt lại mật khẩu
                </button>
                <button type="button" className={BTN} disabled={busy || !adminPassword} onClick={() => void call({ action: a.disabled_at ? "unlock" : "lock", id: a.id })}>
                  {a.disabled_at ? "Mở khóa" : "Khóa"}
                </button>
                {a.role === "student" && (
                  <button
                    type="button"
                    className={BTN}
                    disabled={busy || !adminPassword}
                    onClick={() => {
                      setResetNote("")
                      setResetId(resetId === a.id ? null : a.id)
                      setResetScopes([])
                      setResetConfirm("")
                    }}
                  >
                    Đặt lại dữ liệu học…
                  </button>
                )}
                {resetId === a.id && (
                  <div className="w-full space-y-3 rounded-game border-2 border-danger bg-danger-soft p-3">
                    <p className="font-extrabold">Xóa dữ liệu học của {name}. Không khôi phục được. Tài khoản đăng nhập vẫn giữ nguyên.</p>
                    <div className="grid gap-1 sm:grid-cols-2">
                      {RESET_SCOPES.map((s) => (
                        <label key={s.id} className="flex items-center gap-2 text-sm">
                          <input type="checkbox" checked={resetScopes.includes(s.id)} onChange={(e) => setResetScopes((cur) => (e.target.checked ? [...cur, s.id] : cur.filter((x) => x !== s.id)))} />
                          {s.label}
                        </label>
                      ))}
                    </div>
                    <button type="button" className="text-sm underline underline-offset-4" onClick={() => setResetScopes(resetScopes.length === RESET_SCOPES.length ? [] : RESET_SCOPES.map((s) => s.id))}>
                      {resetScopes.length === RESET_SCOPES.length ? "Bỏ chọn hết" : "Chọn tất cả"}
                    </button>
                    <label className="block">
                      <span className="text-sm font-extrabold">Gõ lại tên đăng nhập “{a.username}” để xác nhận</span>
                      <input value={resetConfirm} onChange={(e) => setResetConfirm(e.target.value)} className={INPUT} autoCapitalize="none" spellCheck={false} />
                    </label>
                    <button type="button" className="rounded-game border-2 border-danger bg-card px-4 py-2 font-extrabold text-danger disabled:opacity-50" disabled={busy || !adminPassword || resetScopes.length === 0 || resetConfirm.trim() === ""} onClick={() => void resetData(a.id)}>
                      {busy ? "Đang xóa…" : "Xóa dữ liệu đã chọn"}
                    </button>
                  </div>
                )}
              </li>
            )
          })}
          {accounts.length === 0 && <li className="px-4 py-6 text-center text-muted-foreground">Chưa có tài khoản nào.</li>}
        </ul>
      </section>
    </div>
  )
}
