"use client"

import { useEffect } from "react"
import { fetchRemoteSettings, onAuthChange, pushRemoteSettings } from "@/lib/db"
import { getSettings, onLocalSettingsChange, replaceSettings, sanitizeSettings } from "@/lib/settings"

const PUSH_DELAY_MS = 1500

/**
 * Đồng bộ cài đặt giữa máy này và tài khoản. Bản có thời điểm sửa mới hơn thắng:
 *  - máy mới (chưa sửa gì) + tài khoản đã có cài đặt → nhận về (không phải chọn nhân vật lại, không mất kỷ lục);
 *  - máy có sửa mới hơn → đẩy lên tài khoản (sau khi người dùng ngừng thao tác một lúc).
 * Chỉ chạy khi đã có phiên đăng nhập; khách chỉ xem trang không bị tạo tài khoản ẩn danh. Lỗi thì im lặng, cài đặt vẫn lưu trên máy.
 */
export function useSettingsSync() {
  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined

    async function sync() {
      const remote = await fetchRemoteSettings()
      if (cancelled || !remote) return
      const local = getSettings()
      const remoteAt = remote.row ? sanitizeSettings(remote.settings).updatedAt : -1
      if (remote.row && remoteAt > local.updatedAt) replaceSettings(remote.settings)
      else if (local.updatedAt > 0 && local.updatedAt > remoteAt) await pushRemoteSettings(local)
    }

    void sync()
    const offAuth = onAuthChange(() => void sync())
    const offLocal = onLocalSettingsChange(() => {
      clearTimeout(timer)
      timer = setTimeout(() => void pushRemoteSettings(getSettings()), PUSH_DELAY_MS)
    })
    return () => {
      cancelled = true
      clearTimeout(timer)
      offAuth()
      offLocal()
    }
  }, [])
}
