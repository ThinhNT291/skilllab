/**
 * Điều kiện nhảy sang bậc kế (docs/lo-trinh-va-xep-bac.md mục 5). Hàm thuần.
 * Đồng thời đủ bốn điều kiện ở bậc đang học:
 *  1. đủ số câu ở bậc đó (độ tin cậy cao);
 *  2. tỷ lệ đúng đạt mức yêu cầu và giữ qua nhiều ngày khác nhau (không phải một lượt may mắn);
 *  3. thẻ ôn của bậc đó còn nhớ tốt (không có thẻ thì bỏ qua điều kiện này).
 * Kiểu game: bậc thấp lên nhanh, càng lên cao càng cần nhiều câu, nhiều ngày, đúng nhiều hơn (bảng `JUMP_BY_BAC`).
 * Chỉ trả "đã đủ điều kiện" và thanh tiến độ; Lộ trình không bao giờ hạ bậc tự động. Mọi con số là giá trị khởi điểm, chỉnh dần khi có dữ liệu thật.
 */
export interface JumpConfig {
  minAnswers: number
  minAccuracy: number
  minDays: number
  /** Một ngày chỉ được tính khi có ít nhất ngần này câu ở bậc đó (tránh "một câu đúng" thành một ngày) */
  minPerDay: number
  minRetention: number
}

export const JUMP_BY_BAC: Record<number, JumpConfig> = {
  1: { minAnswers: 25, minAccuracy: 0.75, minDays: 2, minPerDay: 5, minRetention: 0.6 },
  2: { minAnswers: 35, minAccuracy: 0.78, minDays: 2, minPerDay: 5, minRetention: 0.65 },
  3: { minAnswers: 50, minAccuracy: 0.8, minDays: 3, minPerDay: 5, minRetention: 0.7 },
  4: { minAnswers: 70, minAccuracy: 0.83, minDays: 4, minPerDay: 6, minRetention: 0.72 },
  5: { minAnswers: 100, minAccuracy: 0.85, minDays: 5, minPerDay: 8, minRetention: 0.75 },
  6: { minAnswers: 150, minAccuracy: 0.88, minDays: 7, minPerDay: 10, minRetention: 0.78 },
}

export const jumpConfigFor = (bac: number): JumpConfig => JUMP_BY_BAC[Math.min(6, Math.max(1, Math.round(bac)))]

/** Mức của Bậc 3 (giữa thang), dùng làm mốc trong test. */
export const JUMP = JUMP_BY_BAC[3]

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
export function jumpReadiness(rows: JumpRow[], retention: number | null, cfg: JumpConfig = JUMP): JumpReadiness {
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

/** Như `jumpReadiness` nhưng lấy mức yêu cầu theo bậc đang học. */
export const jumpReadinessAt = (bac: number, rows: JumpRow[], retention: number | null): JumpReadiness => jumpReadiness(rows, retention, jumpConfigFor(bac))
