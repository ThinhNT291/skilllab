import type { Bac } from "./types"

/** Bậc trong khung năng lực ngoại ngữ dùng cho Việt Nam (Thông tư 33/2026/TT-BGDĐT) và cấp CEFR tương ứng. */
const CEFR: Record<Bac, string> = { 1: "A1", 2: "A2", 3: "B1", 4: "B2", 5: "C1", 6: "C2" }

export function bacLabel(bac: Bac): string {
  return `Bậc ${bac} (${CEFR[bac]})`
}
