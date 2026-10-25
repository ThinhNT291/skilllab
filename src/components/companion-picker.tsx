"use client"

import { Mascot } from "@/components/game/mascot"
import { cn } from "@/lib/utils"
import { AGE_SETS, CHARACTERS, updateSettings, useSettings } from "@/lib/settings"

/** Chọn nhân vật đồng hành và bộ giao diện theo tuổi. Lưu theo máy. */
export function CompanionPicker() {
  const { character, ageSet } = useSettings()
  const opt = (active: boolean) => cn("rounded-game border-2 bg-card px-3 py-3 text-center transition-colors", active ? "border-primary" : "border-border hover:border-primary")
  return (
    <div className="space-y-4">
      <fieldset>
        <legend className="mb-2 font-extrabold">Chọn bạn đồng hành</legend>
        <div className="grid grid-cols-3 gap-2">
          {CHARACTERS.map((c) => (
            <button key={c.id} type="button" className={opt(character === c.id)} aria-pressed={character === c.id} onClick={() => updateSettings({ character: c.id })}>
              <Mascot character={c.id} mood="happy" size={72} className="mx-auto" />
              <span className="mt-1 block text-sm font-extrabold">{c.label}</span>
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-2 font-extrabold">Bạn đang học lớp mấy?</legend>
        <div className="grid grid-cols-2 gap-2">
          {AGE_SETS.map((a) => (
            <button key={a.id} type="button" className={opt(ageSet === a.id)} aria-pressed={ageSet === a.id} onClick={() => updateSettings({ ageSet: a.id })}>
              <span className="block font-extrabold">{a.label}</span>
              <span className="block text-sm text-muted-foreground">{a.hint}</span>
            </button>
          ))}
        </div>
      </fieldset>
    </div>
  )
}
