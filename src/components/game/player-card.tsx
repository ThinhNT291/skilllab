"use client"

import Link from "next/link"
import { ProgressBar } from "@/components/exercise/progress-bar"
import { BADGES } from "@/lib/game/badges"
import { Mascot } from "./mascot"
import { usePlayer } from "./use-player"

/** Thẻ người chơi ở đầu trang Tiến độ: linh vật, cấp độ, xu và huy hiệu. */
export function PlayerCard() {
  const { state } = usePlayer()
  if (state.status === "loading") return null
  if (state.status === "unavailable") return null
  const p = state.player
  return (
    <section aria-label="Người chơi" className="space-y-4">
      <div className="flex items-center gap-4 rounded-game border-2 border-border bg-card p-4">
        <Mascot mood="happy" items={p.equipped} size={88} />
        <div className="min-w-0 flex-1">
          <p className="text-sm uppercase tracking-wide text-muted-foreground">Cấp độ</p>
          <p className="text-3xl font-extrabold text-primary">{p.level.level}</p>
          <div className="mt-1 flex">
            <ProgressBar value={p.level.into / p.level.span} label="Tiến độ lên cấp" />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {p.level.into}/{p.level.span} XP · còn {p.level.span - p.level.into} XP để lên cấp
          </p>
        </div>
        <Link href="/cua-hang" className="shrink-0 rounded-game border-2 border-accent px-3 py-2 text-center font-extrabold hover:border-primary">
          🪙 {p.coins}
          <span className="block text-xs text-muted-foreground">Cửa hàng</span>
        </Link>
      </div>

      <div>
        <h2 className="mb-2 text-xl font-extrabold">
          Huy hiệu <span className="text-base text-muted-foreground">{p.badges.length}/{BADGES.length}</span>
        </h2>
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {BADGES.map((b) => {
            const got = p.badges.some((x) => x.id === b.id)
            return (
              <li key={b.id} className={`rounded-game border-2 px-2 py-3 text-center ${got ? "border-accent bg-card" : "border-dashed border-border"}`}>
                <p className={`text-3xl ${got ? "" : "grayscale"}`} aria-hidden>
                  {got ? b.emoji : "🔒"}
                </p>
                <p className="text-sm font-extrabold">{b.name}</p>
                <p className="text-xs text-muted-foreground">{b.hint}</p>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
