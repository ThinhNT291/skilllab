/**
 * Mức nhớ của thẻ ôn theo bậc, cho điều kiện thứ ba của việc nhảy bậc (`jump.ts`): "thẻ ôn của bậc đó còn nhớ tốt".
 * Lấy xác suất nhớ hiện tại do FSRS ước lượng, trung bình trên các thẻ ĐÃ ÔN của bậc đó. Thẻ chưa ôn lần nào không tính (chưa có gì để nhớ).
 * Thẻ cũ chỉ có dữ liệu SM-2 thì quy đổi sang FSRS như khi ôn (`fsrsFromSm2`). Quá ít thẻ thì không kết luận (null = bỏ qua điều kiện). Hàm thuần.
 */
import { fsrsFromSm2, retrievabilityNow, type FsrsState } from "../srs/fsrs.ts"
import type { ItemMeta } from "../progress/ability.ts"

/** Cần ít nhất bấy nhiêu thẻ đã ôn ở một bậc thì mới tính mức nhớ của bậc đó (ít hơn thì dễ nhiễu). */
export const MIN_CARDS_FOR_RETENTION = 5

export interface RetentionCard {
  topic: string
  /** Khóa nguồn của thẻ, vd "grammar-present-simple-en-present-simple-001" hoặc "vocab-b1-<id>" */
  sourceKey: string | null
  fsrs: FsrsState | null
  sm2: { intervalDays: number; ease: number; reps: number; lapses: number }
  lastReviewedAt: string | null
}

const VOCAB_BAC: Record<string, number> = { "vocab-a1": 1, "vocab-a2": 2, "vocab-b1": 3, "vocab-b2": 4, "vocab-c1": 5, "vocab-c2": 6 }

/** Bậc của một thẻ: từ vựng theo cấp, đọc/nghe theo bậc của bài, ngữ pháp theo nhãn của câu gốc. null nếu không xác định (thẻ bị bỏ qua). */
export function cardBac(card: Pick<RetentionCard, "topic" | "sourceKey">, meta: ItemMeta): number | null {
  const t = card.topic
  if (t in VOCAB_BAC) return VOCAB_BAC[t]
  const m = /^(?:reading|listening)-b([1-6])$/.exec(t)
  if (m) return Number(m[1])
  if (t.startsWith("vocab-") || t.startsWith("colloc-")) return null
  const prefix = `grammar-${t}-`
  const key = card.sourceKey?.startsWith(prefix) ? card.sourceKey.slice(prefix.length) : null
  return key ? (meta[key.split("~")[0]]?.[0] ?? null) : null
}

/** Mức nhớ trung bình (0–1) của từng bậc; null ở bậc không đủ thẻ đã ôn. */
export function retentionByBac(cards: RetentionCard[], meta: ItemMeta, now: Date, targetRetention?: number): Map<number, number | null> {
  const sums = new Map<number, { total: number; n: number }>()
  for (const c of cards) {
    const bac = cardBac(c, meta)
    if (bac === null) continue
    const last = c.lastReviewedAt ? new Date(c.lastReviewedAt) : null
    const state = c.fsrs ?? (c.sm2.reps > 0 ? fsrsFromSm2(c.sm2, last, now) : null)
    const r = retrievabilityNow(state, now, targetRetention)
    if (r === null) continue
    const s = sums.get(bac) ?? { total: 0, n: 0 }
    s.total += r
    s.n++
    sums.set(bac, s)
  }
  const out = new Map<number, number | null>()
  for (let b = 1; b <= 6; b++) {
    const s = sums.get(b)
    out.set(b, s && s.n >= MIN_CARDS_FOR_RETENTION ? s.total / s.n : null)
  }
  return out
}
