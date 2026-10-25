"use client"

import { useSyncExternalStore } from "react"
import { CompanionPicker } from "@/components/companion-picker"
import { updateSettings, useSettings } from "@/lib/settings"

const noop = () => () => {}

/** Lần đầu vào trang: chọn nhân vật và bộ giao diện. Chỉ hiện sau khi trình duyệt đã nạp cài đặt để người cũ không thấy nhấp nháy. */
export function WelcomeCard() {
  const { onboarded } = useSettings()
  const mounted = useSyncExternalStore(noop, () => true, () => false)
  if (!mounted || onboarded) return null
  return (
    <section aria-labelledby="welcome-heading" className="anim-pop space-y-4 rounded-game border-2 border-primary bg-card p-5">
      <h2 id="welcome-heading" className="text-2xl font-extrabold">
        Chào mừng đến Training Zone!
      </h2>
      <CompanionPicker />
      <button
        type="button"
        onClick={() => updateSettings({ onboarded: true })}
        className="rounded-game border-b-[5px] border-primary-deep bg-primary px-6 py-2.5 text-lg font-extrabold text-primary-foreground active:translate-y-[3px] active:border-b-2"
      >
        Bắt đầu học
      </button>
      <p className="text-sm text-muted-foreground">Bạn có thể đổi lại bất cứ lúc nào ở trang Cửa hàng.</p>
    </section>
  )
}
