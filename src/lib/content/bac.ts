import type { Bac } from "./types"

/** Bậc trong khung năng lực ngoại ngữ dùng cho Việt Nam (Thông tư 33/2026/TT-BGDĐT) và cấp CEFR tương ứng. */
const CEFR: Record<Bac, string> = { 1: "A1", 2: "A2", 3: "B1", 4: "B2", 5: "C1", 6: "C2" }

export function bacLabel(bac: Bac): string {
  return `Bậc ${bac} (${CEFR[bac]})`
}

/** Nhãn cho bậc nguyên 0–6 (0 = dưới Bậc 1, tức Tiền Bậc 1 / Pre-A1); số ngoài khoảng được kẹp lại. */
export function levelLabel(bac: number): string {
  const n = Math.min(6, Math.max(0, Math.round(bac)))
  return n === 0 ? "dưới Bậc 1 (Pre-A1)" : bacLabel(n as Bac)
}
