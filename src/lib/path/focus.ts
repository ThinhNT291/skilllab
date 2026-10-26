/**
 * Bài hôm nay và đẩy kỹ năng yếu nhất (docs/lo-trinh-va-xep-bac.md mục 6). Hàm thuần.
 * Kỹ năng yếu nhất (trong các kỹ năng đủ tin cậy) được trọng số 1,5 so với 1,0; không quá `MAX_SHARE` số bài trong ngày
 * (trừ khi chỉ còn bài của kỹ năng đó). Kỹ năng ở mức tin cậy thấp không được coi là "yếu nhất" (tránh đẩy theo nhiễu).
 */
import { LESSON_KINDS, type LessonKind, type PathLesson } from "./catalog.ts"

export const WEAK_WEIGHT = 1.5
export const MAX_SHARE = 0.4

export interface SkillStanding {
  skill: LessonKind
  /** Mức năng lực (Elo) */
  rating: number
  /** Đã đủ tin cậy (không ở mức "thấp") */
  reliable: boolean
}

/** Cần ít nhất hai kỹ năng đủ tin cậy mới so sánh được "yếu nhất"; không thì null (không đẩy ai). */
export function weakestSkill(skills: SkillStanding[]): LessonKind | null {
  const reliable = skills.filter((s) => s.reliable)
  if (reliable.length < 2) return null
  return reliable.reduce((a, b) => (b.rating < a.rating ? b : a)).skill
}

export function skillWeights(weakest: LessonKind | null): Record<LessonKind, number> {
  return Object.fromEntries(LESSON_KINDS.map((k) => [k, k === weakest ? WEAK_WEIGHT : 1])) as Record<LessonKind, number>
}

/**
 * Chọn tối đa `count` bài từ `candidates` (đã xếp theo ưu tiên; thứ tự trong từng loại được giữ).
 * Phân bổ theo phương pháp D'Hondt với trọng số kỹ năng, có trần `MAX_SHARE`; kết quả xen kẽ các loại.
 */
export function pickToday(candidates: PathLesson[], count: number, weights: Record<LessonKind, number>, maxShare = MAX_SHARE): PathLesson[] {
  const pools = new Map<LessonKind, PathLesson[]>(LESSON_KINDS.map((k) => [k, candidates.filter((c) => c.kind === k)]))
  const picked = new Map<LessonKind, PathLesson[]>(LESSON_KINDS.map((k) => [k, []]))
  const cap = Math.max(1, Math.ceil(count * maxShare))
  const total = Math.min(count, candidates.length)
  for (let n = 0; n < total; n++) {
    const avail = LESSON_KINDS.filter((k) => picked.get(k)!.length < pools.get(k)!.length)
    const capped = avail.filter((k) => picked.get(k)!.length < cap)
    const from = capped.length ? capped : avail
    const best = from.reduce((a, b) => (weights[b] / (picked.get(b)!.length + 1) > weights[a] / (picked.get(a)!.length + 1) ? b : a))
    picked.get(best)!.push(pools.get(best)![picked.get(best)!.length])
  }
  const out: PathLesson[] = []
  const lists = LESSON_KINDS.map((k) => picked.get(k)!)
  for (let i = 0; lists.some((l) => i < l.length); i++) for (const l of lists) if (i < l.length) out.push(l[i])
  return out
}
