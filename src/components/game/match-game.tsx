"use client"

import { useEffect, useRef, useState } from "react"
import { shuffle } from "@/lib/content/derive"
import { sfx } from "@/lib/audio/sfx"
import { useSettings } from "@/lib/settings"
import { cn } from "@/lib/utils"

export interface MatchItem {
  id: string
  left: string
  right: string
}

export interface MatchOutcome {
  mistakes: number
  seconds: number
  stars: 1 | 2 | 3
}

const now = () => Date.now()

/** Số sao theo số lần ghép nhầm. */
export function starsForMistakes(mistakes: number): 1 | 2 | 3 {
  return mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1
}

/**
 * Game mini ghép cặp bấm giờ. Độc lập với ngân hàng nội dung: nhận danh sách cặp, trả về kết quả.
 * Chạm một ô bên trái rồi một ô bên phải. `onPairDone` báo từng cặp xong, với `firstTry` = chưa nhầm lần nào ở cặp đó.
 */
export function MatchGame({ items, onPairDone, onFinish }: { items: MatchItem[]; onPairDone?: (id: string, firstTry: boolean) => void; onFinish?: (o: MatchOutcome) => void }) {
  const { sound } = useSettings()
  const [rights] = useState(() => shuffle(items))
  const [left, setLeft] = useState<string | null>(null)
  const [matched, setMatched] = useState<string[]>([])
  const [wrongRight, setWrongRight] = useState<string | null>(null)
  const [mistakes, setMistakes] = useState(0)
  const [missed, setMissed] = useState<string[]>([])
  const [seconds, setSeconds] = useState(0)
  const [outcome, setOutcome] = useState<MatchOutcome | null>(null)
  const start = useRef(0)

  useEffect(() => {
    if (outcome) return
    start.current = start.current || now()
    const t = setInterval(() => setSeconds(Math.floor((now() - start.current) / 1000)), 500)
    return () => clearInterval(t)
  }, [outcome])

  function pickRight(id: string) {
    if (!left || outcome) return
    if (left === id) {
      const next = [...matched, id]
      setMatched(next)
      setLeft(null)
      if (sound) sfx.correct()
      onPairDone?.(id, !missed.includes(id))
      if (next.length === items.length) {
        const o = { mistakes, seconds: Math.floor((now() - start.current) / 1000), stars: starsForMistakes(mistakes) }
        setOutcome(o)
        onFinish?.(o)
      }
    } else {
      setMistakes((m) => m + 1)
      setMissed((m) => (m.includes(left) ? m : [...m, left]))
      setWrongRight(id)
      if (sound) sfx.wrong()
      setTimeout(() => setWrongRight(null), 400)
    }
  }

  if (outcome) {
    return (
      <div className="anim-pop rounded-game border-2 border-border bg-card p-6 text-center">
        <p className="text-sm uppercase tracking-wide text-muted-foreground">Xong rồi!</p>
        <p className="my-2 text-5xl tracking-[0.3em]" aria-label={`${outcome.stars} trên 3 sao`}>
          {[1, 2, 3].map((k) => (k <= outcome.stars ? "⭐" : "☆"))}
        </p>
        <p className="text-2xl font-extrabold">{outcome.seconds} giây</p>
        <p className="text-muted-foreground">{outcome.mistakes === 0 ? "Không nhầm lần nào!" : `Nhầm ${outcome.mistakes} lần`}</p>
        <button type="button" onClick={() => window.location.reload()} className="mt-4 w-full rounded-game border-b-[5px] border-primary-deep bg-primary py-3 text-lg font-extrabold text-primary-foreground active:translate-y-[3px] active:border-b-2">
          Chơi lại với cặp mới
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-3 flex justify-between font-extrabold" aria-live="off">
        <span>⏱ {seconds}s</span>
        <span>
          {matched.length}/{items.length} cặp · nhầm {mistakes}
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-[3fr_2fr]">
        <ul className="space-y-2" aria-label="Câu có chỗ trống">
          {items.map((it) => {
            const done = matched.includes(it.id)
            return (
              <li key={it.id}>
                <button
                  type="button"
                  disabled={done}
                  onClick={() => setLeft(it.id)}
                  className={cn(
                    "w-full rounded-game border-2 border-b-4 bg-card px-3 py-2.5 text-left font-bold leading-snug",
                    done ? "border-success bg-success-soft opacity-70" : left === it.id ? "border-primary" : "border-border enabled:hover:border-primary",
                  )}
                >
                  {done ? it.left.replace(/_{2,}/, it.right) : it.left}
                </button>
              </li>
            )
          })}
        </ul>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-1 sm:content-start" aria-label="Từ cần điền">
          {rights.map((it) => {
            const done = matched.includes(it.id)
            return (
              <li key={it.id}>
                <button
                  type="button"
                  disabled={done || !left}
                  onClick={() => pickRight(it.id)}
                  className={cn(
                    "w-full rounded-game border-2 border-b-4 bg-card px-3 py-2.5 text-lg font-extrabold",
                    done && "invisible",
                    wrongRight === it.id ? "anim-shake border-danger bg-danger-soft" : "border-border enabled:hover:border-primary",
                    !left && !done && "opacity-60",
                  )}
                >
                  {it.right}
                </button>
              </li>
            )
          })}
        </ul>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">Chạm một câu bên trái, rồi chạm từ điền vừa chỗ trống.</p>
    </div>
  )
}
