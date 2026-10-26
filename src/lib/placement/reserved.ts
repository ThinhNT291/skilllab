import reserved from "@/content/placement/reserved.json"

/** Tập mã dành riêng cho bài xếp trình độ tổng hợp (nạp từ tệp JSON). */
export const RESERVED = {
  grammar: new Set<string>(reserved.grammar),
  vocab: Object.fromEntries(Object.entries(reserved.vocab).map(([level, ids]) => [level, new Set<string>(ids as string[])])) as Record<string, Set<string>>,
  reading: new Set<string>(reserved.reading),
  listening: new Set<string>(reserved.listening),
}
