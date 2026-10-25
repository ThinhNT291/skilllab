/** Một lượt luyện từ vựng theo chủ đề: từ có thể thuộc nhiều cấp, mỗi câu dùng từ gây nhiễu cùng cấp với từ đó. Hàm thuần. */
import { shuffle, type Rng } from "../content/derive.ts"
import type { McqExercise } from "../content/types.ts"
import { clozeQuestion, meaningQuestion, viQuestion, type VocabLevel, type VocabWord } from "./questions.ts"

export interface TopicEntry {
  word: VocabWord
  level: VocabLevel
}

export function pickTopicRound(entries: TopicEntry[], pools: Partial<Record<VocabLevel, VocabWord[]>>, size = 10, rng: Rng = Math.random): McqExercise[] {
  const out: McqExercise[] = []
  const seen = new Set<string>()
  for (const e of shuffle(entries, rng)) {
    if (out.length >= size) break
    if (seen.has(e.word.word)) continue
    const pool = pools[e.level]
    if (!pool || pool.length < 4) continue
    seen.add(e.word.word)
    const turn = out.length % 3
    const q = turn === 1 ? clozeQuestion(e.word, e.level, pool, rng) : turn === 2 ? viQuestion(e.word, e.level, pool, rng) : null
    out.push(q ?? meaningQuestion(e.word, e.level, pool, rng))
  }
  return out
}
