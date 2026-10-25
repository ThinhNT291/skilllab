"use client"

import { cn } from "@/lib/utils"
import { CHARACTERS, useSettings, type Character } from "@/lib/settings"

export type Mood = "idle" | "happy" | "cheer" | "sad"

/**
 * Linh vật: cú, cáo hoặc robot (theo cài đặt, hoặc truyền `character` để xem trước). Cả ba dùng chung vị trí mắt và đầu
 * nên mọi vật phẩm đeo (truyền qua `items`) vừa với từng nhân vật. Màu lấy từ biến của giao diện nên tự đổi theo skin.
 */
export function Mascot({ mood = "idle", items = [], size = 96, className, character }: { mood?: Mood; items?: string[]; size?: number; className?: string; character?: Character }) {
  const { character: chosen } = useSettings()
  const who = character ?? chosen
  const has = (id: string) => items.includes(id)
  const joyful = mood === "happy" || mood === "cheer"
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      role="img"
      aria-label={`Linh vật ${CHARACTERS.find((c) => c.id === who)?.label ?? ""}`}
      className={cn("shrink-0", mood === "cheer" && "anim-bounce", mood === "sad" && "anim-shake", className)}
    >
      {who === "owl" && (
        <>
      {/* cánh: giơ lên khi cổ vũ */}
      <ellipse cx="25" cy={mood === "cheer" ? 58 : 76} rx="9" ry="20" transform={mood === "cheer" ? "rotate(25 25 58)" : undefined} className="fill-primary-deep" />
      <ellipse cx="95" cy={mood === "cheer" ? 58 : 76} rx="9" ry="20" transform={mood === "cheer" ? "rotate(-25 95 58)" : undefined} className="fill-primary-deep" />
      {/* tai */}
      <polygon points="32,34 38,14 52,30" className="fill-primary" />
      <polygon points="88,34 82,14 68,30" className="fill-primary" />
      {/* thân và bụng */}
      <ellipse cx="60" cy="68" rx="34" ry="38" className="fill-primary" />
      <ellipse cx="60" cy="80" rx="21" ry="24" className="fill-card" />
      {/* chân */}
      <ellipse cx="50" cy="107" rx="8" ry="4" className="fill-accent" />
      <ellipse cx="70" cy="107" rx="8" ry="4" className="fill-accent" />
        </>
      )}
      {who === "fox" && (
        <>
          {/* đuôi vẫy khi cổ vũ */}
          <path d="M92 92 Q118 82 112 56 Q104 76 88 78 Z" transform={mood === "cheer" ? "rotate(-12 92 92)" : undefined} className="fill-accent-deep" />
          <polygon points="30,38 34,10 54,30" className="fill-accent-deep" />
          <polygon points="90,38 86,10 66,30" className="fill-accent-deep" />
          <polygon points="35,32 36,18 46,29" className="fill-card" />
          <polygon points="85,32 84,18 74,29" className="fill-card" />
          <ellipse cx="60" cy="68" rx="34" ry="38" className="fill-accent" />
          <path d="M26 70 Q44 78 60 96 Q76 78 94 70 Q80 100 60 106 Q40 100 26 70 Z" className="fill-card" />
          <ellipse cx="50" cy="108" rx="8" ry="4" className="fill-accent-deep" />
          <ellipse cx="70" cy="108" rx="8" ry="4" className="fill-accent-deep" />
        </>
      )}
      {who === "robot" && (
        <>
          <line x1="60" y1="30" x2="60" y2="12" strokeWidth="4" strokeLinecap="round" className="stroke-primary-deep" />
          <circle cx="60" cy="10" r="6" className={mood === "cheer" ? "fill-accent" : "fill-danger"} />
          <rect x="14" y="48" width="12" height="26" rx="5" className="fill-primary-deep" />
          <rect x="94" y="48" width="12" height="26" rx="5" className="fill-primary-deep" />
          <rect x="26" y="30" width="68" height="76" rx="22" className="fill-primary" />
          <rect x="40" y="76" width="40" height="24" rx="8" className="fill-card" />
          <circle cx="50" cy="88" r="4" className="fill-accent" />
          <circle cx="62" cy="88" r="4" className="fill-success" />
          <rect x="70" y="84" width="6" height="8" rx="2" className="fill-primary-deep" />
          <rect x="40" y="106" width="14" height="6" rx="3" className="fill-primary-deep" />
          <rect x="66" y="106" width="14" height="6" rx="3" className="fill-primary-deep" />
        </>
      )}
      {/* mắt */}
      <circle cx="46" cy="52" r="13" className="fill-card" />
      <circle cx="74" cy="52" r="13" className="fill-card" />
      {joyful ? (
        <>
          <path d="M38 54 Q46 44 54 54" strokeWidth="4" strokeLinecap="round" fill="none" className="stroke-foreground" />
          <path d="M66 54 Q74 44 82 54" strokeWidth="4" strokeLinecap="round" fill="none" className="stroke-foreground" />
        </>
      ) : (
        <>
          <circle cx="46" cy={mood === "sad" ? 56 : 52} r="6" className="fill-foreground" />
          <circle cx="74" cy={mood === "sad" ? 56 : 52} r="6" className="fill-foreground" />
          <circle cx="48" cy={mood === "sad" ? 54 : 50} r="2" className="fill-card" />
          <circle cx="76" cy={mood === "sad" ? 54 : 50} r="2" className="fill-card" />
        </>
      )}
      {mood === "sad" && (
        <>
          <path d="M34 38 L54 42" strokeWidth="3" strokeLinecap="round" className="stroke-foreground" />
          <path d="M86 38 L66 42" strokeWidth="3" strokeLinecap="round" className="stroke-foreground" />
        </>
      )}
      {/* mỏ / mũi / miệng */}
      {who === "owl" && <polygon points="54,62 66,62 60,72" className="fill-accent" />}
      {who === "fox" && <ellipse cx="60" cy="66" rx="5" ry="4" className="fill-foreground" />}
      {who === "robot" && <path d={joyful ? "M50 68 Q60 78 70 68" : mood === "sad" ? "M52 72 Q60 66 68 72" : "M52 69 L68 69"} strokeWidth="3.5" strokeLinecap="round" fill="none" className="stroke-foreground" />}

      {/* vật phẩm: cổ vẽ trước để mặt và đầu nằm trên */}
      {has("scarf") && (
        <>
          <path d="M33 86 Q60 100 87 86 L88 95 Q60 109 32 95 Z" className="fill-danger" />
          <rect x="76" y="94" width="9" height="18" rx="3" className="fill-danger" />
        </>
      )}
      {has("medal") && (
        <>
          <path d="M52 88 L60 100 L68 88" strokeWidth="3" fill="none" className="stroke-danger" />
          <circle cx="60" cy="103" r="6" className="fill-accent stroke-accent-deep" strokeWidth="1.5" />
        </>
      )}
      {has("glasses") && (
        <>
          <circle cx="46" cy="52" r="14" fill="none" strokeWidth="3" className="stroke-foreground" />
          <circle cx="74" cy="52" r="14" fill="none" strokeWidth="3" className="stroke-foreground" />
          <path d="M60 52 L60 52" strokeWidth="3" className="stroke-foreground" />
        </>
      )}
      {has("shades") && (
        <>
          <ellipse cx="46" cy="52" rx="14" ry="10" className="fill-foreground" />
          <ellipse cx="74" cy="52" rx="14" ry="10" className="fill-foreground" />
          <path d="M60 50 L60 50" strokeWidth="4" className="stroke-foreground" />
        </>
      )}
      {has("bow") && (
        <>
          <polygon points="44,22 60,30 44,38" className="fill-danger" />
          <polygon points="76,22 60,30 76,38" className="fill-danger" />
          <circle cx="60" cy="30" r="5" className="fill-accent" />
        </>
      )}
      {has("cap") && (
        <>
          <polygon points="60,10 100,26 60,40 20,26" className="fill-foreground" />
          <path d="M40 34 L40 44 Q60 52 80 44 L80 34 L60 42 Z" className="fill-foreground" />
          <path d="M95 28 L95 46" strokeWidth="2.5" className="stroke-accent" />
          <circle cx="95" cy="48" r="3.5" className="fill-accent" />
        </>
      )}
      {has("crown") && <polygon points="38,34 40,12 50,24 60,8 70,24 80,12 82,34" className="fill-accent stroke-accent-deep" strokeWidth="2" strokeLinejoin="round" />}
    </svg>
  )
}
