/**
 * Điều kiện nhảy sang bậc kế (docs/lo-trinh-va-xep-bac.md mục 5). Hàm thuần.
 * Đồng thời đủ ba điều kiện cho MỘT kỹ năng ở bậc đang học:
 *  1. đủ số câu ở bậc đó (độ tin cậy cao);
 *  2. tỷ lệ đúng từ 80% và giữ qua nhiều ngày khác nhau (không phải một lượt may mắn);
 *  3. thẻ ôn của bậc đó còn nhớ tốt (không có thẻ thì bỏ qua điều kiện này).
 * Chỉ trả "đã đủ điều kiện" và thanh tiến độ; Lộ trình không bao giờ hạ bậc tự động. Các con số là giá trị khởi điểm.
 */
export const JUMP = {
  minAnswers: 50,
  minAccuracy: 0.8,
  minDays: 3,
  /** Một ngày chỉ được tính khi có ít nhất ngần này câu ở bậc đó (tránh "một câu đúng" thành một ngày) */
  minPerDay: 5,
  minRetention: 0.7,
} as const

export interface JumpRow {
  correct: boolean
  /** Ngày (YYYY-MM-DD, giờ Việt Nam) */
  day: string
}

export interface JumpCheck {
  id: "answers" | "accuracy" | "days" | "retention"
  label: string
  ok: boolean
  /** Ví dụ "34/50" hoặc "76%" */
  value: string
  /** 0–1: mức đã đạt của điều kiện này */
  ratio: number
}

export interface JumpReadiness {
  ready: boolean
  /** 0–1, thanh tiến độ liên tục; chỉ bằng 1 khi đã đủ cả bốn điều kiện */
  progress: number
  checks: JumpCheck[]
}

const pct = (x: number) => `${Math.round(x * 100)}%`
const cap = (x: number) => Math.max(0, Math.min(1, x))

/** `rows`: câu trả lời của kỹ năng này ở bậc đang xét. `retention`: mức nhớ trung bình (0–1) của thẻ bậc đó, null nếu chưa có thẻ. */
export function jumpReadiness(rows: JumpRow[], retention: number | null, cfg = JUMP): JumpReadiness {
  const n = rows.length
  const accuracy = n ? rows.filter((r) => r.correct).length / n : 0
  const perDay = new Map<string, { n: number; ok: number }>()
  for (const r of rows) {
    const d = perDay.get(r.day) ?? { n: 0, ok: 0 }
    d.n++
    if (r.correct) d.ok++
    perDay.set(r.day, d)
  }
  const goodDays = [...perDay.values()].filter((d) => d.n >= cfg.minPerDay && d.ok / d.n >= cfg.minAccuracy).length
  const checks: JumpCheck[] = [
    { id: "answers", label: "Đủ số câu ở bậc này", ok: n >= cfg.minAnswers, value: `${n}/${cfg.minAnswers}`, ratio: cap(n / cfg.minAnswers) },
    { id: "accuracy", label: "Tỷ lệ đúng", ok: n > 0 && accuracy >= cfg.minAccuracy, value: pct(accuracy), ratio: cap(accuracy / cfg.minAccuracy) },
    { id: "days", label: "Giữ được qua nhiều ngày", ok: goodDays >= cfg.minDays, value: `${Math.min(goodDays, cfg.minDays)}/${cfg.minDays} ngày`, ratio: cap(goodDays / cfg.minDays) },
    {
      id: "retention",
      label: "Thẻ ôn còn nhớ",
      ok: retention === null || retention >= cfg.minRetention,
      value: retention === null ? "chưa có thẻ" : pct(retention),
      ratio: retention === null ? 1 : cap(retention / cfg.minRetention),
    },
  ]
  const ready = checks.every((c) => c.ok)
  const mean = checks.reduce((s, c) => s + c.ratio, 0) / checks.length
  return { ready, progress: ready ? 1 : Math.min(0.99, mean), checks }
}
