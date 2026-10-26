/**
 * Dữ liệu cho cổng nhảy bậc: gom các câu đã trả lời theo bậc của câu (hàm thuần).
 * Gộp cả bốn kỹ năng nhận biết; bậc của câu lấy từ nhãn câu (ngữ pháp), cấp từ (từ vựng) hoặc bậc bài (đọc/nghe).
 */
import { skillOfTopic } from "../progress/profile.ts"
import type { ItemMeta } from "../progress/ability.ts"
import type { JumpRow } from "./jump.ts"

const VOCAB_BAC: Record<string, number> = { "vocab-a1": 1, "vocab-a2": 2, "vocab-b1": 3, "vocab-b2": 4, "vocab-c1": 5, "vocab-c2": 6 }

export interface GateAnswer {
  exercise_id: string
  topic: string
  correct: boolean
  created_at: string
}

/** Bậc của một câu đã trả lời; null nếu không xác định (câu bị bỏ qua). Cụm từ kết hợp không có bậc nên không tính. */
export function answerBac(a: Pick<GateAnswer, "exercise_id" | "topic">, meta: ItemMeta): number | null {
  const skill = skillOfTopic(a.topic)
  if (skill === "grammar") return meta[a.exercise_id.split("~")[0]]?.[0] ?? null
  if (skill === "vocab") return VOCAB_BAC[a.topic] ?? null
  const n = Number(a.topic.slice(-1))
  return n >= 1 && n <= 6 ? n : null
}

/** Gom theo bậc; `dayOf` đổi thời điểm ISO thành ngày giờ Việt Nam (truyền `vnDayKey`). */
export function rowsByBac(answers: GateAnswer[], meta: ItemMeta, dayOf: (iso: string) => string): Map<number, JumpRow[]> {
  const out = new Map<number, JumpRow[]>()
  for (const a of answers) {
    const bac = answerBac(a, meta)
    if (bac === null) continue
    const list = out.get(bac) ?? []
    list.push({ correct: a.correct, day: dayOf(a.created_at) })
    out.set(bac, list)
  }
  return out
}
