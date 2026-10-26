/**
 * Đo chất lượng nhãn độ khó của từng câu từ lịch sử trả lời. Hàm thuần.
 * Mỗi lượt trả lời có "xác suất đúng dự kiến" theo năng lực học sinh ngay trước lượt đó (cùng cách tính với `ability.ts`)
 * và nhãn của câu. So tỷ lệ đúng thật với dự kiến: lệch dương = câu dễ hơn nhãn, lệch âm = khó hơn nhãn.
 * Chỉ ĐÁNH DẤU để người duyệt; không tự đổi nhãn (docs/lo-trinh-va-xep-bac.md mục 7).
 * Hạn chế: năng lực học sinh cũng được tính từ chính nhãn này nên độ lệch bị co lại nhẹ; cần nhiều học sinh để đáng tin.
 */
import { START_RATING, expectedCorrect, itemOfAnswer, kFactor, type AnswerForAbility, type ItemMeta } from "../progress/ability.ts"
import { skillOfTopic } from "../progress/profile.ts"

/** Ngưỡng khởi điểm, xem lại sau 1 tháng có dữ liệu thật (docs/lo-trinh-va-xep-bac.md mục 11). */
export const MIN_ATTEMPTS = 30
export const MIN_LEARNERS = 8
export const FLAG_GAP = 0.15
/** Dưới mức đoán mò (0,25) kéo dài thường là đáp án gắn sai hoặc câu mơ hồ. */
export const BELOW_GUESS = 0.25

export interface QualityAnswer extends AnswerForAbility {
  profileId: string
}

export type ItemFlag = "easier-than-label" | "harder-than-label" | "below-guess"

export interface ItemQuality {
  exerciseId: string
  topic: string
  attempts: number
  learners: number
  observed: number
  expected: number
  /** observed − expected */
  gap: number
  flags: ItemFlag[]
}

/** Nhóm dạng câu để gom số liệu: vq-m/vq-c/vq-v/vq-g (từ vựng), hậu tố sau "~" (câu sinh), còn lại "gốc". */
export function familyOf(exerciseId: string): string {
  if (exerciseId.startsWith("vq-")) return exerciseId.split("-").slice(0, 2).join("-")
  const i = exerciseId.indexOf("~")
  return i >= 0 ? exerciseId.slice(i + 1).replace(/\d+/g, "") || "gốc" : "gốc"
}

interface Row {
  profileId: string
  exerciseId: string
  topic: string
  correct: boolean
  expected: number
}

/** Phát lại lịch sử từng học sinh theo từng kỹ năng, ghi xác suất dự kiến trước mỗi lượt. */
export function replayExpected(answers: QualityAnswer[], meta: ItemMeta): Row[] {
  const byKey = new Map<string, QualityAnswer[]>()
  for (const a of answers) {
    const k = `${a.profileId}|${skillOfTopic(a.topic)}`
    byKey.set(k, [...(byKey.get(k) ?? []), a])
  }
  const rows: Row[] = []
  for (const list of byKey.values()) {
    list.sort((x, y) => (x.created_at < y.created_at ? -1 : x.created_at > y.created_at ? 1 : 0))
    let theta = START_RATING
    let n = 0
    for (const a of list) {
      const b = itemOfAnswer(a, meta)
      if (b === null) continue
      const expected = expectedCorrect(theta, b)
      rows.push({ profileId: a.profileId, exerciseId: a.exerciseId, topic: a.topic, correct: a.correct, expected })
      theta += kFactor(n) * ((a.correct ? 1 : 0) - expected)
      n++
    }
  }
  return rows
}

function summarize(rows: Row[], id: string): ItemQuality {
  const attempts = rows.length
  const observed = rows.filter((r) => r.correct).length / attempts
  const expected = rows.reduce((s, r) => s + r.expected, 0) / attempts
  const gap = observed - expected
  const learners = new Set(rows.map((r) => r.profileId)).size
  const flags: ItemFlag[] = []
  if (attempts >= MIN_ATTEMPTS && learners >= MIN_LEARNERS) {
    if (gap > FLAG_GAP) flags.push("easier-than-label")
    if (gap < -FLAG_GAP) flags.push("harder-than-label")
    if (observed < BELOW_GUESS) flags.push("below-guess")
  }
  return { exerciseId: id, topic: rows[0].topic, attempts, learners, observed, expected, gap, flags }
}

export function itemQuality(answers: QualityAnswer[], meta: ItemMeta): ItemQuality[] {
  const groups = new Map<string, Row[]>()
  for (const r of replayExpected(answers, meta)) groups.set(r.exerciseId, [...(groups.get(r.exerciseId) ?? []), r])
  return [...groups.entries()].map(([id, rows]) => summarize(rows, id)).sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap))
}

export interface FamilyQuality {
  family: string
  topic: string
  items: number
  attempts: number
  observed: number
  expected: number
  gap: number
}

/** Gom theo (chủ đề, dạng câu): cho thấy cả nhóm lệch, ví dụ mọi câu "nghĩa tiếng Việt" của từ vựng cấp B2 đều dễ hơn nhãn. */
export function familyQuality(answers: QualityAnswer[], meta: ItemMeta): FamilyQuality[] {
  const groups = new Map<string, Row[]>()
  for (const r of replayExpected(answers, meta)) {
    const k = `${r.topic}|${familyOf(r.exerciseId)}`
    groups.set(k, [...(groups.get(k) ?? []), r])
  }
  return [...groups.entries()]
    .map(([k, rows]) => {
      const observed = rows.filter((r) => r.correct).length / rows.length
      const expected = rows.reduce((s, r) => s + r.expected, 0) / rows.length
      return { family: k.split("|")[1], topic: rows[0].topic, items: new Set(rows.map((r) => r.exerciseId)).size, attempts: rows.length, observed, expected, gap: observed - expected }
    })
    .sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap))
}
