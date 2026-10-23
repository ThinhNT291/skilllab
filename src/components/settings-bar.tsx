"use client"

import { useEffect } from "react"
import { cn } from "@/lib/utils"
import { SKINS, updateSettings, useSettings } from "@/lib/settings"

/** Gắn skin lên <html> và hiện thanh chọn giao diện / bật tắt âm. */
export function SettingsBar() {
  const { skin, sound } = useSettings()

  useEffect(() => {
    document.documentElement.dataset.skin = skin
  }, [skin])

  const chip = (active: boolean) =>
    cn(
      "rounded-full border-2 px-3 py-1.5 text-sm transition-colors",
      active ? "border-primary text-primary" : "border-border bg-card text-foreground",
    )

  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Cài đặt giao diện">
      {SKINS.map((s) => (
        <button key={s.id} type="button" className={chip(skin === s.id)} aria-pressed={skin === s.id} onClick={() => updateSettings({ skin: s.id })}>
          {s.label}
        </button>
      ))}
      <button type="button" className={chip(sound)} aria-pressed={sound} onClick={() => updateSettings({ sound: !sound })}>
        {sound ? "🔊 Âm thanh" : "🔇 Âm thanh"}
      </button>
    </div>
  )
}
