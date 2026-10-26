"use client"

import { useEffect } from "react"
import { cn } from "@/lib/utils"
import { AccountMenu } from "@/components/auth/account-menu"
import { FONT_SIZES, SKINS, updateSettings, useSettings } from "@/lib/settings"
import { useSettingsSync } from "@/components/settings-sync"

/** Gắn skin lên <html> và hiện thanh chọn giao diện / bật tắt âm. */
export function SettingsBar() {
  const { skin, sound, fontSize, showBac, ageSet, speakQuestions } = useSettings()
  useSettingsSync()

  useEffect(() => {
    document.documentElement.dataset.skin = skin
  }, [skin])

  useEffect(() => {
    document.documentElement.dataset.age = ageSet
  }, [ageSet])

  useEffect(() => {
    document.documentElement.dataset.font = fontSize
  }, [fontSize])

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
      <div className="flex items-center gap-1" role="group" aria-label="Cỡ chữ">
        {FONT_SIZES.map((f, i) => (
          <button key={f.id} type="button" className={chip(fontSize === f.id)} aria-pressed={fontSize === f.id} aria-label={f.aria} onClick={() => updateSettings({ fontSize: f.id })}>
            <span className={i === 0 ? "text-sm" : i === 1 ? "text-base" : "text-xl"}>{f.label}</span>
          </button>
        ))}
      </div>
      <button type="button" className={chip(showBac)} aria-pressed={showBac} onClick={() => updateSettings({ showBac: !showBac })} title="Hiện bậc khung năng lực và độ khó của từng câu (dành cho người duyệt nội dung)">
        🎓 Hiện bậc
      </button>
      <button type="button" className={chip(sound)} aria-pressed={sound} onClick={() => updateSettings({ sound: !sound })}>
        {sound ? "🔊 Âm thanh" : "🔇 Âm thanh"}
      </button>
      <button type="button" className={chip(speakQuestions)} aria-pressed={speakQuestions} onClick={() => updateSettings({ speakQuestions: !speakQuestions })} title="Cho phép thỉnh thoảng có câu đọc to bằng micro trong bài. Tắt nếu bạn ngại nói hoặc đang ở nơi ồn.">
        {speakQuestions ? "🎤 Câu đọc to" : "🎤 Câu đọc to (tắt)"}
      </button>
      <span className="ml-auto">
        <AccountMenu />
      </span>
    </div>
  )
}
