"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { signInWithGoogle, signInWithUsername } from "@/lib/db"

const INPUT = "mt-1 block w-full rounded-game border-2 border-border bg-card p-3 text-lg"
const BTN = "rounded-game border-b-[5px] border-primary-deep bg-primary px-5 py-3 text-lg font-extrabold text-primary-foreground active:translate-y-[3px] active:border-b-2 disabled:opacity-50"

/** Chỉ nhận đường dẫn nội bộ, chặn "//evil.com" và địa chỉ đầy đủ. */
function safeRedirect(v: string | null): string {
  return v && v.startsWith("/") && !v.startsWith("//") && !v.startsWith("/\\") ? v : "/"
}

const MESSAGES: Record<string, string> = {
  bad_username: "Tên đăng nhập gồm chữ thường, số, dấu chấm hoặc gạch dưới (3–30 ký tự).",
  bad_credentials: "Sai tên đăng nhập hoặc mật khẩu. Nhờ giáo viên đặt lại mật khẩu nếu bạn quên nhé.",
  not_configured: "Chưa kết nối Supabase nên chưa đăng nhập được.",
  error: "Chưa đăng nhập được, thử lại nhé.",
}

export function LoginForm() {
  const params = useSearchParams()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(params.get("error") === "google" ? "Đăng nhập Google chưa thành công, thử lại nhé." : "")
  const google = process.env.NEXT_PUBLIC_GOOGLE_LOGIN === "1"

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError("")
    const r = await signInWithUsername(username, password)
    if (!r.ok) {
      setError(MESSAGES[r.reason] ?? MESSAGES.error)
      setBusy(false)
      return
    }
    // Tải lại trang hẳn (không điều hướng mềm) để thanh trên cùng, hồ sơ và mọi dữ liệu theo phiên đều lấy lại theo tài khoản mới.
    window.location.assign(safeRedirect(params.get("redirect")))
  }

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="space-y-3 rounded-game border-2 border-border bg-card p-5">
        <label className="block">
          <span className="font-extrabold">Tên đăng nhập</span>
          <input value={username} onChange={(e) => setUsername(e.target.value)} className={INPUT} autoComplete="username" autoCapitalize="none" spellCheck={false} required />
        </label>
        <label className="block">
          <span className="font-extrabold">Mật khẩu</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={INPUT} autoComplete="current-password" required />
        </label>
        {error && (
          <p role="alert" className="font-bold text-danger">
            {error}
          </p>
        )}
        <button type="submit" disabled={busy} className={BTN}>
          {busy ? "Đang đăng nhập…" : "Đăng nhập"}
        </button>
      </form>
      {google && (
        <button type="button" onClick={() => void signInWithGoogle()} className="w-full rounded-game border-2 border-border bg-card px-5 py-3 font-extrabold hover:border-primary">
          Đăng nhập bằng Google (giáo viên)
        </button>
      )}
      <p className="text-muted-foreground">
        Chưa có tài khoản? Bạn vẫn học thử được ngay, không cần đăng nhập.{" "}
        <Link href="/" className="font-extrabold text-primary underline underline-offset-4">
          Về trang chủ
        </Link>
      </p>
    </div>
  )
}
