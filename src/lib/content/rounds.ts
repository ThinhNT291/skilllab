import type { Exercise } from "./types"
import { itemRating, targetItemRating } from "../progress/ability.ts"

/** Mỗi lượt 10 câu: bốc ngẫu nhiên trong từng mức độ khó rồi xếp dễ → khó (chống học vẹt nhưng vẫn mạch dễ → khó). */
const ROUND_QUOTA: Record<1 | 2 | 3, number> = { 1: 4, 2: 3, 3: 3 }
export const ROUND_SIZE = 10

function shuffle<T>(list: T[]): T[] {
  const copy = [...list]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

/** Lượt thường: 4 dễ / 3 vừa / 3 khó, thiếu mức nào thì bù từ câu còn lại, xếp dễ → khó. */
export function pickRound(all: Exercise[]): Exercise[] {
  const byLevel = { 1: shuffle(all.filter((e) => e.difficulty === 1)), 2: shuffle(all.filter((e) => e.difficulty === 2)), 3: shuffle(all.filter((e) => e.difficulty === 3)) }
  const picked: Exercise[] = []
  const leftovers: Exercise[] = []
  for (const level of [1, 2, 3] as const) {
    picked.push(...byLevel[level].slice(0, ROUND_QUOTA[level]))
    leftovers.push(...byLevel[level].slice(ROUND_QUOTA[level]))
  }
  picked.push(...shuffle(leftovers).slice(0, Math.max(0, ROUND_SIZE - picked.length)))
  return picked.sort((a, b) => a.difficulty - b.difficulty)
}

/** Luyện lại một mục: ưu tiên câu mang thẻ đó (kể cả câu dễ), bù bằng lượt thường nếu chưa đủ 10 câu. */
export function pickRoundForTag(all: Exercise[], tag: string): Exercise[] {
  const withTag = shuffle(all.filter((e) => e.tags.includes(tag) || e.usageId === tag)).slice(0, ROUND_SIZE)
  if (withTag.length >= ROUND_SIZE) return withTag.sort((a, b) => a.difficulty - b.difficulty)
  const ids = new Set(withTag.map((e) => e.id))
  const fill = pickRound(all.filter((e) => !ids.has(e.id))).slice(0, ROUND_SIZE - withTag.length)
  return [...withTag, ...fill].sort((a, b) => a.difficulty - b.difficulty)
}

/** Chế độ "Nhức đầu": 10 câu khó nhất của chuyên đề (thiếu thì lấy thêm câu mức vừa). */
export function pickHardRound(all: Exercise[]): Exercise[] {
  const hard = shuffle(all.filter((e) => e.difficulty === 3))
  const rest = shuffle(all.filter((e) => e.difficulty === 2))
  return [...hard, ...rest].slice(0, ROUND_SIZE)
}

/** Độ rộng của "dốc" trong một lượt: từ thấp hơn mức mục tiêu `RAMP` điểm đến cao hơn `RAMP` điểm (một bậc = 200 điểm). */
const RAMP = 80

/**
 * Lượt luyện quanh năng lực: 10 câu có độ khó tăng dần từ hơi dễ (khởi động) đến hơi khó, tâm ở mức người học làm đúng khoảng 80%.
 * Làm tốt thì năng lực tăng, lượt sau tự khó hơn. Chọn câu gần mốc từng vị trí nhất, bằng nhau thì ngẫu nhiên. Thiếu câu thì trả ít hơn 10.
 */
export function pickRoundByAbility(all: Exercise[], theta: number, rng: () => number = Math.random, size = ROUND_SIZE): Exercise[] {
  const center = targetItemRating(theta)
  const free = all.map((ex) => ({ ex, r: itemRating(ex.bac ?? 2, ex.difficulty) + (rng() - 0.5) * 30 }))
  const out: { ex: Exercise; r: number }[] = []
  for (let i = 0; i < size && free.length; i++) {
    const want = center - RAMP + (2 * RAMP * i) / Math.max(1, size - 1)
    let bi = 0
    for (let j = 1; j < free.length; j++) if (Math.abs(free[j].r - want) < Math.abs(free[bi].r - want)) bi = j
    out.push(free.splice(bi, 1)[0])
  }
  return out.sort((a, b) => a.r - b.r).map((x) => x.ex)
}
