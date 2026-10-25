import type { TagInfo } from "@/lib/analytics/progress"
import { LISTENING_BACS, listeningTopic } from "@/lib/listening/types"
import { READING_BACS, readingTopic } from "@/lib/reading/types"
import { VOCAB_LEVELS } from "@/lib/vocab/questions"
import { COLLOCATION_SETS } from "@/lib/collocations/data"
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
  // Từ vựng không có mục lý thuyết: mỗi cấp là một "chuyên đề" riêng, tag cùng mã với chuyên đề.
  for (const l of VOCAB_LEVELS) {
    const title = `Từ vựng ${l.label}`
    topicTitles[`vocab-${l.id}`] = title
    catalog[`vocab-${l.id}`] = { label: title, topicId: `vocab-${l.id}`, topicTitle: title }
  }
  for (const b of READING_BACS) {
    const title = `Đọc hiểu Bậc ${b}`
    topicTitles[readingTopic(b)] = title
    catalog[readingTopic(b)] = { label: title, topicId: readingTopic(b), topicTitle: title }
  }
  for (const b of LISTENING_BACS) {
    const title = `Nghe hiểu Bậc ${b}`
    topicTitles[listeningTopic(b)] = title
    catalog[listeningTopic(b)] = { label: title, topicId: listeningTopic(b), topicTitle: title }
  }
  for (const set of COLLOCATION_SETS) {
    const title = `Cụm từ · ${set.title}`
    topicTitles[set.id] = title
    catalog[set.id] = { label: title, topicId: set.id, topicTitle: title }
  }
  return { catalog, topicTitles }
}
