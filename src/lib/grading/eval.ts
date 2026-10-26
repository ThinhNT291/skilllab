/**
 * Đo độ khớp giữa điểm chấm của máy và điểm do người chấm trên một bộ bài mẫu (scripts/grade-eval.mjs).
 * Dùng để biết một lần sửa lời nhắc chấm làm kết quả tốt lên hay xấu đi (docs/prompt-sinh-noi-dung.md mục 8). Hàm thuần.
 */
export interface Pair {
  human: number
  machine: number
}

/** Tỷ lệ khớp hoàn toàn và lệch không quá `tol` điểm. */
export function agreement(pairs: Pair[], tol = 1): { n: number; exact: number; within: number } {
  if (!pairs.length) return { n: 0, exact: 0, within: 0 }
  return {
    n: pairs.length,
    exact: pairs.filter((p) => p.human === p.machine).length / pairs.length,
    within: pairs.filter((p) => Math.abs(p.human - p.machine) <= tol).length / pairs.length,
  }
}

/** Sai số tuyệt đối trung bình và độ lệch trung bình (máy − người; dương = máy chấm cao hơn). */
export function errors(pairs: Pair[]): { mae: number; bias: number } {
  if (!pairs.length) return { mae: 0, bias: 0 }
  const d = pairs.map((p) => p.machine - p.human)
  return { mae: d.reduce((s, x) => s + Math.abs(x), 0) / d.length, bias: d.reduce((s, x) => s + x, 0) / d.length }
}

/**
 * Quadratic weighted kappa (độ khớp có tính khoảng cách giữa các mức, 1 = khớp hoàn toàn, 0 = như ngẫu nhiên).
 * `min`/`max` là khoảng điểm. Trả null nếu không tính được (ít hơn hai mẫu, hoặc cả hai bên cùng luôn một mức). Một bên luôn cùng một mức thì kappa = 0.
 */
export function quadraticKappa(pairs: Pair[], min: number, max: number): number | null {
  const k = max - min + 1
  if (pairs.length < 2 || k < 2) return null
  const O = Array.from({ length: k }, () => Array<number>(k).fill(0))
  const a = Array<number>(k).fill(0)
  const b = Array<number>(k).fill(0)
  for (const p of pairs) {
    const i = Math.min(k - 1, Math.max(0, Math.round(p.human) - min))
    const j = Math.min(k - 1, Math.max(0, Math.round(p.machine) - min))
    O[i][j]++
    a[i]++
    b[j]++
  }
  const n = pairs.length
  let num = 0
  let den = 0
  for (let i = 0; i < k; i++) {
    for (let j = 0; j < k; j++) {
      const w = ((i - j) / (k - 1)) ** 2
      num += w * O[i][j]
      den += (w * a[i] * b[j]) / n
    }
  }
  return den === 0 ? null : 1 - num / den
}

export interface EvalSample {
  id: string
  skill: "writing"
  task: string
  targetBac: number
  text: string
  /** Điểm do người chấm: từng tiêu chí (0–4) và bậc tổng thể (0–6) */
  human: { scores: Record<string, number>; bac: number }
  /** Đánh dấu mẫu minh họa định dạng, không phải điểm thật */
  example?: boolean
}

/** Kiểm tra định dạng mẫu; trả danh sách lỗi (rỗng nếu hợp lệ). */
export function validateSamples(samples: unknown, keys: readonly string[]): string[] {
  if (!Array.isArray(samples)) return ["tệp phải là một mảng các mẫu"]
  const errs: string[] = []
  const ids = new Set<string>()
  samples.forEach((s: Partial<EvalSample>, i) => {
    const at = `mẫu ${i + 1}${s?.id ? ` (${s.id})` : ""}`
    if (!s || typeof s.id !== "string" || !s.id) return void errs.push(`${at}: thiếu id`)
    if (ids.has(s.id)) errs.push(`${at}: trùng id`)
    ids.add(s.id)
    if (s.skill !== "writing") errs.push(`${at}: chỉ hỗ trợ skill "writing" (bài nói cần tệp ghi âm)`)
    if (typeof s.task !== "string" || !s.task.trim()) errs.push(`${at}: thiếu đề bài`)
    if (typeof s.text !== "string" || s.text.trim().split(/\s+/).length < 8) errs.push(`${at}: bài viết quá ngắn`)
    if (!(typeof s.targetBac === "number" && s.targetBac >= 1 && s.targetBac <= 6)) errs.push(`${at}: targetBac phải từ 1 đến 6`)
    const h = s.human
    if (!h || typeof h.bac !== "number" || h.bac < 0 || h.bac > 6) errs.push(`${at}: human.bac phải từ 0 đến 6`)
    for (const k of keys) {
      const v = h?.scores?.[k]
      if (!(typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= 4)) errs.push(`${at}: human.scores.${k} phải là số nguyên 0–4`)
    }
  })
  return errs
}
