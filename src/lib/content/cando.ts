import data from "@/content/cando/vi.json"

interface Level {
  bac: number
  label: string
  cefr: string
  listening?: string | null
  speaking?: string | null
  reading?: string | null
  writing?: string | null
}

const levels = (data as { levels: Level[] }).levels

/** Mô tả năng lực "can-do" theo Thông tư 33/2026/TT-BGDĐT cho một bậc (0 = Tiền Bậc 1). Chép từ bản quét văn bản, nên hiển thị kèm ghi chú nguồn. */
export function candoFor(bac: number, skill: "listening" | "speaking" | "reading" | "writing"): { label: string; cefr: string; text: string } | null {
  const l = levels.find((x) => x.bac === bac)
  const text = l?.[skill]
  return l && text ? { label: l.label, cefr: l.cefr, text } : null
}
