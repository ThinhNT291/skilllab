/**
 * Tổng hợp tiến độ từ lịch sử trả lời. Hàm thuần (không gọi mạng) để dễ kiểm tra và dùng lại ở nơi khác.
 * Cách tính theo thiết kế bản cũ: ghi sự kiện thô, cộng dồn theo thẻ lúc đọc; thẻ yếu nhất (sai nhiều nhất) lên đầu.
 */
export interface AnswerRow {
  topic: string
  tags: string[]
  correct: boolean
  created_at: string
}

export interface TagInfo {
  label: string
  topicId: string
  topicTitle: string
}

export interface WeakTag extends TagInfo {
  tag: string
  wrong: number
  attempts: number
  lastWrong: string
}

export interface TopicProgress {
  topicId: string
  topicTitle: string
  total: number
  correct: number
}

export interface ProgressSummary {
  total: number
  correct: number
  topicsTried: number
  byTopic: TopicProgress[]
  weakTags: WeakTag[]
}

export function summarize(rows: AnswerRow[], catalog: Record<string, TagInfo>, topicTitles: Record<string, string>, maxWeak = 8): ProgressSummary {
  const topics = new Map<string, TopicProgress>()
  const tags = new Map<string, { wrong: number; attempts: number; lastWrong: string; topic: string }>()
  let correct = 0

  for (const r of rows) {
    if (r.correct) correct++
    const t = topics.get(r.topic) ?? { topicId: r.topic, topicTitle: topicTitles[r.topic] ?? r.topic, total: 0, correct: 0 }
    t.total++
    if (r.correct) t.correct++
    topics.set(r.topic, t)

    for (const tag of r.tags ?? []) {
      const s = tags.get(tag) ?? { wrong: 0, attempts: 0, lastWrong: "", topic: r.topic }
      s.attempts++
      if (!r.correct) {
        s.wrong++
        if (r.created_at > s.lastWrong) s.lastWrong = r.created_at
      }
      tags.set(tag, s)
    }
  }

  const weakTags: WeakTag[] = [...tags.entries()]
    .filter(([, s]) => s.wrong > 0)
    .map(([tag, s]) => {
      const info = catalog[tag] ?? { label: tag, topicId: s.topic, topicTitle: topicTitles[s.topic] ?? s.topic }
      return { tag, ...info, wrong: s.wrong, attempts: s.attempts, lastWrong: s.lastWrong }
    })
    // Sai nhiều nhất lên đầu; hòa thì tỷ lệ sai cao hơn, rồi lần sai gần nhất.
    .sort((a, b) => b.wrong - a.wrong || b.wrong / b.attempts - a.wrong / a.attempts || (a.lastWrong < b.lastWrong ? 1 : -1))
    .slice(0, maxWeak)

  return {
    total: rows.length,
    correct,
    topicsTried: topics.size,
    byTopic: [...topics.values()].sort((a, b) => b.total - a.total),
    weakTags,
  }
}
