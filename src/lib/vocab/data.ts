import type { VocabLevel, VocabWord } from "./questions"
import { VOCAB_LEVELS } from "./questions"
import { filterReserved, type ReservedMode } from "@/lib/placement/filter"
import { RESERVED } from "@/lib/placement/reserved"

/**
 * Nạp danh sách từ của một cấp. Chỉ nhận mã cấp có trong danh mục, không đọc đường dẫn từ người dùng.
 * Từ dành riêng cho bài xếp trình độ tổng hợp bị loại (mặc định), trừ khi lấy `reserved: "only"`.
 */
export async function getVocab(level: string, opts: { reserved?: ReservedMode } = {}): Promise<VocabWord[] | null> {
  if (!VOCAB_LEVELS.some((l) => l.id === level)) return null
  const mod = await import(`@/content/vocab/en/${level as VocabLevel}.json`)
  return filterReserved(mod.default as VocabWord[], RESERVED.vocab[level] ?? new Set<string>(), opts.reserved)
}
