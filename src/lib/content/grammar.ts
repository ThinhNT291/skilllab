import enIndex from "@/content/grammar/en/index.json"
import type { Exercise, GrammarTopic, GrammarTopicMeta, Language } from "./types"

/**
 * Nạp nội dung ngữ pháp từ tệp JSON trong src/content. Đây là điểm duy nhất biết nội dung nằm ở đâu:
 * sau này chuyển sang Supabase thì chỉ sửa tệp này, các trang không đổi.
 * Chỉ chạy phía server (trang server component).
 */
const INDEXES: Partial<Record<Language, GrammarTopicMeta[]>> = {
  en: enIndex as GrammarTopicMeta[],
}

export function listGrammarTopics(language: Language): GrammarTopicMeta[] {
  return INDEXES[language] ?? []
}

export function findGrammarTopicMeta(language: Language, id: string): GrammarTopicMeta | undefined {
  return listGrammarTopics(language).find((t) => t.id === id)
}

export async function getGrammarTopic(language: Language, id: string): Promise<GrammarTopic | null> {
  // Chỉ nạp id có trong danh mục: không để đường dẫn từ người dùng tự chọn tệp.
  if (!findGrammarTopicMeta(language, id)) return null
  const mod = await import(`@/content/grammar/${language}/${id}.json`)
  return mod.default as GrammarTopic
}

/** Bài tập của một chuyên đề. Chuyên đề chưa có bài tập trả về mảng rỗng. */
export async function getExercises(language: Language, topicId: string): Promise<Exercise[]> {
  if (!findGrammarTopicMeta(language, topicId)) return []
  try {
    const mod = await import(`@/content/exercises/${language}/${topicId}.json`)
    return mod.default as Exercise[]
  } catch {
    return []
  }
}
