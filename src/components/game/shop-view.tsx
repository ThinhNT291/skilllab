"use client"

import { useState } from "react"
import { buyItem, saveEquipped } from "@/lib/db"
import { SHOP_ITEMS, SLOT_LABEL, toggleEquip, type Slot } from "@/lib/game/shop"
import { sfx } from "@/lib/audio/sfx"
import { getSettings } from "@/lib/settings"
import { CompanionPicker } from "@/components/companion-picker"
import { Mascot } from "./mascot"
import { usePlayer } from "./use-player"

const SLOTS: Slot[] = ["head", "face", "neck"]

export function ShopView() {
  const { state, reload } = usePlayer()
  const [equipped, setEquipped] = useState<string[] | null>(null)
  const [note, setNote] = useState("")

  if (state.status === "loading") return <p className="text-muted-foreground">Đang tải cửa hàng…</p>
  if (state.status === "unavailable") return <p className="rounded-game border-2 border-dashed border-border px-4 py-3 text-muted-foreground">{state.message}</p>

  const p = state.player
  const wearing = equipped ?? p.equipped

  async function buy(id: string) {
    const r = await buyItem(id)
    if (!r.ok) return setNote(`Chưa mua được (${r.reason === "not_configured" ? "chưa kết nối Supabase" : (r.message ?? "lỗi không rõ")}).`)
    setNote("")
    if (getSettings().sound) sfx.coin()
    reload()
  }

  async function wear(id: string) {
    const next = toggleEquip(wearing, id)
    setEquipped(next)
    const r = await saveEquipped(next)
    setNote(r.ok ? "" : `Chưa lưu được (${r.reason === "not_configured" ? "chưa kết nối Supabase" : (r.message ?? "lỗi không rõ")}).`)
  }

  return (
    <div className="space-y-6">
      <details className="rounded-game border-2 border-border bg-card p-4">
        <summary className="cursor-pointer font-extrabold">Đổi nhân vật và bộ giao diện</summary>
        <div className="mt-3">
          <CompanionPicker />
        </div>
      </details>
      <div className="flex items-center gap-4 rounded-game border-2 border-border bg-card p-4">
        <Mascot mood="happy" items={wearing} size={104} />
        <div>
          <p className="text-sm uppercase tracking-wide text-muted-foreground">Bạn đang có</p>
          <p className="text-3xl font-extrabold text-accent-deep">🪙 {p.coins} xu</p>
          <p className="text-sm text-muted-foreground">Cứ 10 XP đổi được 1 xu. Học thêm để mua đồ cho cú nhé!</p>
        </div>
      </div>
      {note && (
        <p className="text-sm text-danger" role="status">
          {note}
        </p>
      )}
      {SLOTS.map((slot) => (
        <section key={slot} aria-label={SLOT_LABEL[slot]}>
          <h2 className="mb-2 text-xl font-extrabold">{SLOT_LABEL[slot]}</h2>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {SHOP_ITEMS.filter((i) => i.slot === slot).map((i) => {
              const own = p.owned.includes(i.id)
              const on = wearing.includes(i.id)
              const afford = p.coins >= i.cost
              return (
                <li key={i.id} className={`rounded-game border-2 p-3 text-center ${on ? "border-primary bg-card" : "border-border bg-card"}`}>
                  <p className="text-4xl" aria-hidden>
                    {i.emoji}
                  </p>
                  <p className="font-extrabold">{i.name}</p>
                  {own ? (
                    <button type="button" onClick={() => wear(i.id)} className="mt-2 w-full rounded-game border-b-4 border-primary-deep bg-primary py-1.5 font-extrabold text-primary-foreground active:translate-y-[2px] active:border-b-2">
                      {on ? "Tháo ra" : "Đeo"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={!afford}
                      onClick={() => buy(i.id)}
                      className="mt-2 w-full rounded-game border-2 border-b-4 border-accent-deep bg-card py-1.5 font-extrabold enabled:active:translate-y-[2px] enabled:active:border-b-2 disabled:opacity-50"
                    >
                      🪙 {i.cost}
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}
