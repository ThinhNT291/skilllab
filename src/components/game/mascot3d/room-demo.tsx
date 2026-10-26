"use client"

import { useState } from "react"
import { itemById } from "@/lib/game/shop"
import { Mascot3D } from "./mascot-3d"
import { CHARACTERS, CHARACTER_IDS, type CharacterId } from "./characters"
import { ACCESSORY_IDS, DECOR_IDS, DECOR_LABEL } from "./scene"

const chip = (on: boolean) => `rounded-full border-2 px-3 py-1.5 text-sm font-bold ${on ? "border-primary text-primary" : "border-border bg-card"}`

/** Trang thử: bật/tắt phụ kiện và đồ trang trí trên linh vật 3D (chưa nối với kho đồ đã mua của tài khoản). */
export function RoomDemo() {
  const [who, setWho] = useState<CharacterId>("fox")
  const [items, setItems] = useState<string[]>(["glasses", "scarf"])
  const [decor, setDecor] = useState<string[]>(["plant", "lamp", "rug"])
  const toggle = (list: string[], set: (v: string[]) => void, id: string) => set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id])
  return (
    <div className="space-y-4">
      <section aria-label="Nhân vật">
        <h2 className="mb-1 font-extrabold">Nhân vật</h2>
        <div className="flex flex-wrap gap-2">
          {CHARACTER_IDS.map((id) => (
            <button key={id} type="button" aria-pressed={who === id} className={chip(who === id)} onClick={() => setWho(id)}>
              {CHARACTERS[id].name}
            </button>
          ))}
        </div>
      </section>
      <Mascot3D character={who} items={items} decor={decor} />
      <section aria-label="Phụ kiện">
        <h2 className="mb-1 font-extrabold">Phụ kiện</h2>
        <div className="flex flex-wrap gap-2">
          {ACCESSORY_IDS.map((id) => (
            <button key={id} type="button" aria-pressed={items.includes(id)} className={chip(items.includes(id))} onClick={() => toggle(items, setItems, id)}>
              <span aria-hidden="true">{itemById(id)?.emoji} </span>
              {itemById(id)?.name ?? id}
            </button>
          ))}
        </div>
      </section>
      <section aria-label="Đồ trang trí">
        <h2 className="mb-1 font-extrabold">Trang trí không gian</h2>
        <div className="flex flex-wrap gap-2">
          {DECOR_IDS.map((id) => (
            <button key={id} type="button" aria-pressed={decor.includes(id)} className={chip(decor.includes(id))} onClick={() => toggle(decor, setDecor, id)}>
              {DECOR_LABEL[id]}
            </button>
          ))}
        </div>
      </section>
      <p className="text-xs text-muted-foreground">{CHARACTERS[who].credit} Chi tiết giấy phép: /models/CREDITS.md</p>
    </div>
  )
}
