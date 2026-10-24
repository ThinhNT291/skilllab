import type { VocabLevel, VocabWord } from "./questions"
import { VOCAB_LEVELS } from "./questions"

/** Nạp danh sách từ của một cấp. Chỉ nhận mã cấp có trong danh mục, không đọc đường dẫn từ người dùng. */
export async function getVocab(level: string): Promise<VocabWord[] | null> {
  if (!VOCAB_LEVELS.some((l) => l.id === level)) return null
  const mod = await import(`@/content/vocab/en/${level as VocabLevel}.json`)
  return mod.default as VocabWord[]
}
