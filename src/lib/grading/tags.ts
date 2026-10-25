import "server-only"
import { getGrammarTopic, listGrammarTopics } from "@/lib/content/grammar"

export interface TagInfo {
  label: string
  topicId: string
  topicTitle: string
}

let cache: Promise<{ list: string; byId: Map<string, TagInfo> }> | null = null

/** Danh sách mục lý thuyết (usage) cho phép làm "thẻ lỗi" khi chấm: dòng "mã | nhãn (chuyên đề)" để đưa vào lời nhắc. */
export function getTagIndex() {
  cache ??= (async () => {
    const byId = new Map<string, TagInfo>()
    const lines: string[] = []
    for (const meta of listGrammarTopics("en")) {
      const topic = await getGrammarTopic("en", meta.id)
      for (const u of topic?.theory.usages ?? []) {
        byId.set(u.id, { label: u.label, topicId: meta.id, topicTitle: meta.title })
        lines.push(`${u.id} | ${u.label} (${meta.title})`)
      }
    }
    return { list: lines.join("\n"), byId }
  })()
  return cache
}
