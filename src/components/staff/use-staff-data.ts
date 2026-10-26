"use client"

import { useCallback, useEffect, useState } from "react"
import { listAccounts, listClasses, listRecentActivity, type ClassRow, type StaffProfile } from "@/lib/db"
import type { DailyLite } from "@/lib/staff/summary"

export interface StaffData {
  accounts: StaffProfile[]
  classes: ClassRow[]
  /** Bộ đếm theo ngày của 7 ngày gần nhất, một dòng mỗi học sinh mỗi ngày */
  activity: DailyLite[]
  now: Date
}

type State = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; data: StaffData }

/** Tải danh sách tài khoản, lớp và hoạt động 7 ngày. `reload` dùng sau khi tạo/sửa. */
export function useStaffData(): { state: State; reload: () => void } {
  const [state, setState] = useState<State>({ status: "loading" })
  const [tick, setTick] = useState(0)
  useEffect(() => {
    let cancelled = false
    Promise.all([listAccounts(), listClasses(), listRecentActivity(7)]).then(([a, c, r]) => {
      if (cancelled) return
      if (!a.ok) return setState({ status: "error", message: a.reason === "not_configured" ? "Chưa kết nối Supabase." : `Không tải được (${a.message ?? "lỗi không rõ"}). Đã chạy migration 0007 chưa?` })
      setState({ status: "ready", data: { accounts: a.rows, classes: c.ok ? c.rows : [], activity: r.ok ? r.rows : [], now: new Date() } })
    })
    return () => {
      cancelled = true
    }
  }, [tick])
  return { state, reload: useCallback(() => setTick((t) => t + 1), []) }
}
