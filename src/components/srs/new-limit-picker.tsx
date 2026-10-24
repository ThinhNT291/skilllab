"use client"

import { NEW_CARD_LIMITS, updateSettings, useSettings } from "@/lib/settings"

/** Chọn số thẻ mới tối đa mỗi ngày (lưu trên máy này). */
export function NewLimitPicker() {
  const { newPerDay } = useSettings()
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2" role="group" aria-label="Số thẻ mới mỗi ngày">
      <span className="text-muted-foreground">Thẻ mới mỗi ngày:</span>
      {NEW_CARD_LIMITS.map((n) => (
        <button key={n} type="button" aria-pressed={newPerDay === n} onClick={() => updateSettings({ newPerDay: n })} className="rounded-full border-2 border-border px-3 py-1 font-extrabold aria-pressed:border-primary aria-pressed:text-primary">
          {n}
        </button>
      ))}
    </div>
  )
}
