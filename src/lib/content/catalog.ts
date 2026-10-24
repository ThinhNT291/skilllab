import type { TagInfo } from "@/lib/analytics/progress"
import { getGrammarTopic, listGrammarTopics } from "./grammar"

/** Bảng tra: mã thẻ (= mã mục lý thuyết) → nhãn tiếng Việt và chuyên đề chứa nó. Dùng cho màn tiến độ. */
export async function buildTagCatalog(): Promise<{ catalog: Record<string, TagInfo>; topicTitles: Record<string, string> }> {
  const topics = listGrammarTopics("en")
  const catalog: Record<string, TagInfo> = {}
  const topicTitles: Record<string, string> = {}
  for (const meta of topics) {
    topicTitles[meta.id] = meta.title
    const topic = await getGrammarTopic("en", meta.id)
    for (const u of topic?.theory.usages ?? []) catalog[u.id] = { label: u.label, topicId: meta.id, topicTitle: meta.title }
  }
  return { catalog, topicTitles }
}
