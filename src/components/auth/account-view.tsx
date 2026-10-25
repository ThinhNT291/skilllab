"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getAccountInfo, signOut, updateNickname, type AccountInfo } from "@/lib/db"
import { ROLE_LABEL } from "@/lib/auth/roles"
import { PasswordForm } from "./password-form"

const INPUT = "mt-1 block w-full rounded-game border-2 border-border bg-card p-3 text-lg"
const BTN = "rounded-game border-2 border-border bg-card px-4 py-2.5 font-extrabold hover:border-primary disabled:opacity-50"

export function AccountView() {
  const router = useRouter()
  const [info, setInfo] = useState<AccountInfo | null>(null)
  const [nick, setNick] = useState("")
  const [note, setNote] = useState("")

  useEffect(() => {
    let cancelled = false
    getAccountInfo().then((a) => {
      if (cancelled || !a) return
      setInfo(a)
      setNick(a.nickname ?? "")
    })
    return () => {
      cancelled = true
    }
  }, [])

  if (!info) return <p className="text-muted-foreground">Đang tải…</p>

  async function saveNick() {
    const r = await updateNickname(nick)
    setNote(r.ok ? "Đã lưu biệt danh." : "Chưa lưu được, thử lại nhé.")
  }
  async function logout() {
    await signOut()
    router.push("/")
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3 rounded-game border-2 border-border bg-card p-5">
        <p>
          <span className="text-muted-foreground">Tên đăng nhập: </span>
          <strong>{info.username ?? "(đăng nhập bằng Google)"}</strong>
        </p>
        <p>
          <span className="text-muted-foreground">Vai trò: </span>
          <strong>{ROLE_LABEL[info.role]}</strong>
        </p>
        <label className="block">
          <span className="font-extrabold">Biệt danh</span>
          <input value={nick} onChange={(e) => setNick(e.target.value)} maxLength={30} className={INPUT} />
          <span className="text-sm text-muted-foreground">Dùng biệt danh, không dùng tên thật. Tối đa 30 ký tự.</span>
        </label>
        <button type="button" onClick={saveNick} className={BTN}>
          Lưu biệt danh
        </button>
        {note && (
          <p role="status" className="text-sm font-bold">
            {note}
          </p>
        )}
      </section>
      <section>
        <h2 className="mb-2 text-xl font-extrabold">Đổi mật khẩu</h2>
        <PasswordForm forced={false} />
      </section>
      <button type="button" onClick={logout} className={BTN}>
        Đăng xuất
      </button>
    </div>
  )
}
