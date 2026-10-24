/**
 * Mức nắm vững từng chuyên đề, tính từ lịch sử trả lời và kết quả bài kiểm tra cuối chủ điểm. Hàm thuần.
 * Không khóa cứng: trạng thái chỉ để học sinh thấy mình đang ở đâu và gợi ý nên học gì tiếp.
 */
export const TEST_SIZE = 10
/** Đạt bài kiểm tra cuối chủ điểm khi đúng từ 80% số câu. */
export const TEST_PASS_RATIO = 0.8
/** "Gần vững": đủ 20 câu gần nhất và đúng từ 85%, nên mời làm bài kiểm tra. */
export const RECENT_WINDOW = 20
export const NEAR_RATIO = 0.85

export type MasteryStatus = "new" | "learning" | "ready" | "mastered"

export interface AnswerLite {
  topic: string
  correct: boolean
  /** Dùng để lấy các câu gần nhất; chuỗi ISO, so sánh được theo thứ tự chữ */
  created_at: string
}

export interface TopicStat {
  topic: string
  status: MasteryStatus
  attempts: number
  correct: number
  /** Tỷ lệ đúng trong cửa sổ gần nhất (0–1); null nếu chưa có câu nào */
  recentAccuracy: number | null
}

export function passedTest(correct: number, total: number): boolean {
  return total > 0 && correct / total >= TEST_PASS_RATIO
}

/** `passedTopics`: các chuyên đề đã từng vượt qua bài kiểm tra. */
export function topicStats(rows: AnswerLite[], passedTopics: Set<string>, topicIds: string[]): Map<string, TopicStat> {
  const byTopic = new Map<string, AnswerLite[]>()
  for (const r of rows) {
    const list = byTopic.get(r.topic)
    if (list) list.push(r)
    else byTopic.set(r.topic, [r])
  }
  const out = new Map<string, TopicStat>()
  for (const id of topicIds) {
    const list = (byTopic.get(id) ?? []).sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    const recent = list.slice(0, RECENT_WINDOW)
    const recentAccuracy = recent.length ? recent.filter((r) => r.correct).length / recent.length : null
    let status: MasteryStatus = "learning"
    if (list.length === 0 && !passedTopics.has(id)) status = "new"
    else if (passedTopics.has(id)) status = "mastered"
    else if (recent.length >= RECENT_WINDOW && (recentAccuracy ?? 0) >= NEAR_RATIO) status = "ready"
    out.set(id, { topic: id, status, attempts: list.length, correct: list.filter((r) => r.correct).length, recentAccuracy })
  }
  return out
}

/** Chuyên đề nên học tiếp: chuyên đề đang học dở (ưu tiên đang học, rồi gần vững) theo thứ tự, không thì chuyên đề mới đầu tiên. */
export function nextTopic(order: string[], stats: Map<string, TopicStat>): string | null {
  const rank = (s: MasteryStatus) => (s === "learning" ? 0 : s === "ready" ? 1 : s === "new" ? 2 : 3)
  let best: string | null = null
  let bestRank = 4
  for (const id of order) {
    const s = stats.get(id)
    if (!s) continue
    const r = rank(s.status)
    if (r < bestRank) {
      best = id
      bestRank = r
    }
  }
  return bestRank === 3 ? null : best
}
