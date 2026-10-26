"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { getAccountInfo, onAuthChange, signOut, type AccountInfo } from "@/lib/db"
import { canViewStaffArea } from "@/lib/auth/roles"

const CHIP = "rounded-full border-2 border-border bg-card px-3 py-1.5 text-sm font-extrabold hover:border-primary"

/** Chỗ đăng nhập / tài khoản ở đầu trang. Học sinh học thử (ẩn danh) thấy nút Đăng nhập. */
export function AccountMenu() {
  const [info, setInfo] = useState<AccountInfo | null | undefined>(undefined)
  useEffect(() => {
    let cancelled = false
    const load = () =>
      getAccountInfo().then((a) => {
        if (!cancelled) setInfo(a)
      })
    void load()
    // Thanh này nằm ở khung chung nên không tải lại khi đổi trang: lắng nghe đổi phiên để hiện đúng ngay.
    const off = onAuthChange(() => void load())
    return () => {
      cancelled = true
      off()
    }
  }, [])

  async function logout() {
    await signOut()
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- cố ý tải lại hẳn trang để mọi dữ liệu theo phiên lấy lại
    window.location.assign("/")
  }

  if (info === undefined) return null
  if (!info || info.anonymous)
    return (
      <Link href="/dang-nhap" className={CHIP}>
        Đăng nhập
      </Link>
    )
  return (
    <span className="flex items-center gap-2">
      {canViewStaffArea(info.role) && (
        <Link href="/quan-ly" className={CHIP}>
          Quản lý
        </Link>
      )}
      <Link href="/tai-khoan" className={CHIP}>
        👤 {info.nickname ?? info.username ?? "Tài khoản"}
      </Link>
      <button type="button" onClick={logout} className={CHIP}>
        Đăng xuất
      </button>
    </span>
  )
}
