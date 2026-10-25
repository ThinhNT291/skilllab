"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { resetProfileCache } from "@/lib/db"

const INPUT = "mt-1 block w-full rounded-game border-2 border-border bg-card p-3 text-lg"
const BTN = "rounded-game border-b-[5px] border-primary-deep bg-primary px-5 py-3 text-lg font-extrabold text-primary-foreground active:translate-y-[3px] active:border-b-2 disabled:opacity-50"

const MESSAGES: Record<string, string> = {
  weak_password: "Mật khẩu quá ngắn (học sinh từ 6 ký tự, giáo viên từ 8 ký tự).",
  same_password: "Mật khẩu mới phải khác mật khẩu đang dùng.",
  wrong_password: "Mật khẩu hiện tại chưa đúng.",
}

/** Đổi mật khẩu. `forced`: lần đầu sau khi được cấp mật khẩu tạm (không hỏi mật khẩu cũ). */
export function PasswordForm({ forced }: { forced: boolean }) {
  const router = useRouter()
  const [current, setCurrent] = useState("")
  const [pw, setPw] = useState("")
  const [pw2, setPw2] = useState("")
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (pw !== pw2) return setMsg({ ok: false, text: "Hai mật khẩu chưa giống nhau." })
    setBusy(true)
    setMsg(null)
    const res = await fetch("/api/account/change-password", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ newPassword: pw, currentPassword: current }) })
    const json = (await res.json().catch(() => ({}))) as { error?: string }
    setBusy(false)
    if (!res.ok) return setMsg({ ok: false, text: MESSAGES[json.error ?? ""] ?? "Chưa đổi được, thử lại nhé." })
    setCurrent("")
    setPw("")
    setPw2("")
    setMsg({ ok: true, text: "Đã đổi mật khẩu." })
    resetProfileCache()
    if (forced) {
      router.push("/")
      router.refresh()
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-game border-2 border-border bg-card p-5">
      {!forced && (
        <label className="block">
          <span className="font-extrabold">Mật khẩu hiện tại</span>
          <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} className={INPUT} autoComplete="current-password" required />
        </label>
      )}
      <label className="block">
        <span className="font-extrabold">Mật khẩu mới</span>
        <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} className={INPUT} autoComplete="new-password" required />
      </label>
      <label className="block">
        <span className="font-extrabold">Nhập lại mật khẩu mới</span>
        <input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} className={INPUT} autoComplete="new-password" required />
      </label>
      {msg && (
        <p role={msg.ok ? "status" : "alert"} className={`font-bold ${msg.ok ? "text-success" : "text-danger"}`}>
          {msg.text}
        </p>
      )}
      <button type="submit" disabled={busy} className={BTN}>
        {busy ? "Đang lưu…" : "Đổi mật khẩu"}
      </button>
    </form>
  )
}
