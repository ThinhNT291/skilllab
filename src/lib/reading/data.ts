import { READING_BACS, type ReadingPassage } from "./types"
import { getVocab } from "@/lib/vocab/data"
import { VOCAB_LEVELS } from "@/lib/vocab/questions"
import { filterReserved, type ReservedMode } from "@/lib/placement/filter"
import { RESERVED } from "@/lib/placement/reserved"

/** Nạp các bài đọc của một bậc. Chỉ nhận bậc có trong danh mục. Bài dành riêng cho bài xếp trình độ tổng hợp bị loại (mặc định). */
export async function getReadingPassages(bac: number, opts: { reserved?: ReservedMode } = {}): Promise<ReadingPassage[] | null> {
  if (!READING_BACS.includes(bac as 1)) return null
  try {
    const mod = await import(`@/content/reading/en/bac${bac}.json`)
    return filterReserved(mod.default as ReadingPassage[], RESERVED.reading, opts.reserved)
  } catch {
    return []
  }
}

/** Bảng tra nghĩa nhanh cho các từ trong một bài đọc: từ (chữ thường) → nghĩa tiếng Việt ngắn, lấy từ kho từ vựng. */
export async function glossFor(text: string): Promise<Record<string, string>> {
  const words = new Set(text.toLowerCase().match(/[a-z]+/g) ?? [])
  const gloss: Record<string, string> = {}
  for (const l of VOCAB_LEVELS) {
    for (const w of (await getVocab(l.id)) ?? []) {
      if (w.vi && !gloss[w.word]) gloss[w.word] = w.vi
    }
  }
  const out: Record<string, string> = {}
  for (const word of words) {
    // Dạng biến cách đơn giản: -s, -es, -ed, -ing, -ly về dạng gốc
    const candidates = [word, word.replace(/(ies)$/, "y"), word.replace(/(es|s)$/, ""), word.replace(/(ed|d)$/, ""), word.replace(/ing$/, ""), word.replace(/ing$/, "e"), word.replace(/ly$/, "")]
    const hit = candidates.find((c) => gloss[c])
    if (hit) out[word] = gloss[hit]
  }
  return out
}

/** Chọn ngẫu nhiên một bài đọc, tránh bài vừa làm nếu còn bài khác. */
export function pickPassage(passages: ReadingPassage[], excludeId?: string): ReadingPassage {
  const pool = passages.length > 1 ? passages.filter((p) => p.id !== excludeId) : passages
  return pool[Math.floor(Math.random() * pool.length)]
}
