import topicData from "@/content/vocab/topics.json"
import { getVocab } from "./data"
import { VOCAB_LEVELS, type VocabLevel, type VocabWord } from "./questions"
import type { TopicEntry } from "./topic-round"

export interface VocabTopic {
  id: string
  label: string
  icon: string
}

const data = topicData as { topics: VocabTopic[]; words: Record<string, Record<string, string[]>> }

export const VOCAB_TOPICS: VocabTopic[] = data.topics

export function findTopic(id: string): VocabTopic | undefined {
  return VOCAB_TOPICS.find((t) => t.id === id)
}

/** Số từ của mỗi chủ đề (cộng các cấp). */
export function topicCounts(): Record<string, number> {
  const out: Record<string, number> = {}
  for (const t of VOCAB_TOPICS) out[t.id] = VOCAB_LEVELS.reduce((n, l) => n + (data.words[l.id]?.[t.id]?.length ?? 0), 0)
  return out
}

/** Các từ của một chủ đề cùng danh sách từ từng cấp (để chọn từ gây nhiễu). */
export async function loadTopic(topicId: string): Promise<{ entries: TopicEntry[]; pools: Partial<Record<VocabLevel, VocabWord[]>> } | null> {
  if (!findTopic(topicId)) return null
  const entries: TopicEntry[] = []
  const pools: Partial<Record<VocabLevel, VocabWord[]>> = {}
  for (const l of VOCAB_LEVELS) {
    const words = await getVocab(l.id)
    if (!words) continue
    pools[l.id] = words
    const ids = new Set(data.words[l.id]?.[topicId] ?? [])
    for (const w of words) if (ids.has(w.id)) entries.push({ word: w, level: l.id })
  }
  return { entries, pools }
}
