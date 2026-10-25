"use client"

import { useEffect, useState } from "react"
import { listAudit, type AuditRow } from "@/lib/db"

const LABEL: Record<string, string> = {
  account_create: "Tạo tài khoản",
  account_reset_password: "Đặt lại mật khẩu",
  account_lock: "Khóa tài khoản",
  account_unlock: "Mở khóa tài khoản",
  account_update: "Sửa tài khoản",
  password_changed: "Đổi mật khẩu",
}

export function AuditView() {
  const [state, setState] = useState<{ status: "loading" } | { status: "error"; message: string } | { status: "ready"; rows: AuditRow[] }>({ status: "loading" })
  useEffect(() => {
    let cancelled = false
    listAudit(100).then((r) => {
      if (!cancelled) setState(r.ok ? { status: "ready", rows: r.rows } : { status: "error", message: r.reason === "not_configured" ? "Chưa kết nối Supabase." : `Không tải được (${r.message ?? "lỗi không rõ"}).` })
    })
    return () => {
      cancelled = true
    }
  }, [])
  if (state.status === "loading") return <p className="text-muted-foreground">Đang tải…</p>
  if (state.status === "error") return <p role="alert" className="rounded-game border-2 border-dashed border-border px-4 py-3 text-muted-foreground">{state.message}</p>
  if (state.rows.length === 0) return <p className="rounded-game border-2 border-dashed border-border px-4 py-6 text-center text-muted-foreground">Chưa có thao tác nào (hoặc bạn không phải quản trị).</p>
  return (
    <div className="overflow-x-auto rounded-game border-2 border-border bg-card">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Nhật ký thao tác quản trị</caption>
        <thead className="text-muted-foreground">
          <tr>
            <th scope="col" className="px-4 py-2">Thời gian</th>
            <th scope="col" className="px-4 py-2">Thao tác</th>
            <th scope="col" className="px-4 py-2">Chi tiết</th>
          </tr>
        </thead>
        <tbody className="divide-y-2 divide-border">
          {state.rows.map((r) => (
            <tr key={r.id}>
              <td className="whitespace-nowrap px-4 py-2">{new Date(r.created_at).toLocaleString("vi-VN")}</td>
              <td className="px-4 py-2 font-extrabold">{r.action.startsWith("refused:") ? `Bị từ chối: ${LABEL[`account_${r.action.slice(8)}`] ?? r.action.slice(8)}` : (LABEL[r.action] ?? r.action)}</td>
              <td className="px-4 py-2 text-muted-foreground">{Object.entries(r.detail).map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : String(v)}`).join(" · ")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
