/**
 * Sinh câu hỏi từ vựng từ danh sách từ (nguồn: English Vocabulary Profile, xem scripts/build-vocab.py).
 * Hàm thuần: nhận danh sách từ, trả về câu trắc nghiệm theo mô hình chung `McqExercise`.
 * Ba dạng: (1) đọc nghĩa tiếng Anh chọn từ, (2) điền từ vào câu ví dụ, (3) nghĩa tiếng Việt chọn từ (khi đã có `vi`). Từ gây nhiễu cùng từ loại và cùng cấp.
 */
import { shuffle, type Rng } from "../content/derive.ts"
import type { MatchPair } from "../content/match.ts"
import type { Bac, McqExercise, TypedExercise } from "../content/types.ts"

export type VocabLevel = "a1" | "a2" | "b1"
export const VOCAB_LEVELS: { id: VocabLevel; label: string; bac: Bac }[] = [
  { id: "a1", label: "A1", bac: 1 },
  { id: "a2", label: "A2", bac: 2 },
  { id: "b1", label: "B1", bac: 3 },
]

export interface VocabWord {
  id: string
  word: string
  pos: string
  def: string
  ex: string[]
  /** Nghĩa tiếng Việt ngắn (nếu đã có) */
  vi?: string
}

export const POS_VI: Record<string, string> = { noun: "danh từ", verb: "động từ", adjective: "tính từ", adverb: "trạng từ" }

const DISTRACTORS = 3

const viOf = (w: VocabWord) => (w.vi ? ` (${w.vi})` : "")

function pickDistractors(target: VocabWord, pool: VocabWord[], rng: Rng): VocabWord[] {
  const samePos = shuffle(pool.filter((w) => w.pos === target.pos && w.word !== target.word), rng)
  const others = shuffle(pool.filter((w) => w.pos !== target.pos && w.word !== target.word), rng)
  const seen = new Set<string>()
  const out: VocabWord[] = []
  for (const w of [...samePos, ...others]) {
    if (seen.has(w.word)) continue
    seen.add(w.word)
    out.push(w)
    if (out.length === DISTRACTORS) break
  }
  return out
}

/** Đặt đáp án đúng vào một vị trí ngẫu nhiên trong các lựa chọn và dựng lời giải thích cho từng lựa chọn. */
function build(
  id: string,
  level: VocabLevel,
  title: string,
  prompt: string,
  target: VocabWord,
  distractors: VocabWord[],
  rng: Rng,
): McqExercise {
  const bac = VOCAB_LEVELS.find((l) => l.id === level)!.bac
  const options = shuffle([target, ...distractors], rng)
  return {
    id,
    kind: "mcq",
    language: "en",
    bac,
    topic: `vocab-${level}`,
    tags: [`vocab-${level}`],
    difficulty: bac as 1 | 2 | 3,
    title,
    prompt,
    choices: options.map((o) => o.word),
    correctIndex: options.indexOf(target),
    explanation: `${target.word} (${POS_VI[target.pos] ?? target.pos})${viOf(target)}: ${target.def}.`,
    choiceExplanations: options.map((o) => (o === target ? `Đúng — ${o.word}${viOf(o)}: ${o.def}.` : `Sai — '${o.word}'${viOf(o)} nghĩa là: ${o.def}.`)),
  }
}

/** Câu ví dụ dùng cho dạng điền từ: chứa đúng từ ở dạng nguyên mẫu để thay bằng chỗ trống mà đáp án duy nhất. */
export function clozeSentence(w: VocabWord): string | null {
  const re = new RegExp(`\\b${w.word}\\b`, "i")
  const count = new RegExp(re.source, "gi")
  const sentence = w.ex.find((e) => (e.match(count) ?? []).length === 1)
  // Mạo từ a/an đứng ngay trước chỗ trống sẽ lộ chữ cái đầu của đáp án, nên bỏ câu đó.
  if (!sentence || new RegExp(`\\b(?:a|an)\\s+${w.word}\\b`, "i").test(sentence)) return null
  return sentence.replace(re, "______")
}

export function meaningQuestion(w: VocabWord, level: VocabLevel, pool: VocabWord[], rng: Rng = Math.random): McqExercise {
  return build(`vq-m-${w.id}`, level, "Chọn từ đúng nghĩa", `Which word matches this meaning?\n“${w.def}”`, w, pickDistractors(w, pool, rng), rng)
}

export function clozeQuestion(w: VocabWord, level: VocabLevel, pool: VocabWord[], rng: Rng = Math.random): McqExercise | null {
  const sentence = clozeSentence(w)
  if (!sentence) return null
  return build(`vq-c-${w.id}`, level, "Điền từ vào chỗ trống", sentence, w, pickDistractors(w, pool, rng), rng)
}

/** Từ tiếng Việt → chọn từ tiếng Anh. Chỉ dùng được khi từ đã có nghĩa tiếng Việt. */
export function viQuestion(w: VocabWord, level: VocabLevel, pool: VocabWord[], rng: Rng = Math.random): McqExercise | null {
  if (!w.vi) return null
  return build(`vq-v-${w.id}`, level, "Chọn từ tiếng Anh", `Từ nào có nghĩa “${w.vi}” (${POS_VI[w.pos] ?? w.pos})?`, w, pickDistractors(w, pool, rng), rng)
}

/** Cặp "nghĩa tiếng Việt ↔ từ tiếng Anh" cho game ghép cặp. Mỗi từ ra một câu gõ để ghi kết quả và tạo thẻ ôn tập. */
export function pickVocabMatchPairs(pool: VocabWord[], level: VocabLevel, rng: Rng = Math.random, size = 5): MatchPair[] {
  const bac = VOCAB_LEVELS.find((l) => l.id === level)!.bac
  const seenWords = new Set<string>()
  const seenVi = new Set<string>()
  const pairs: MatchPair[] = []
  for (const w of shuffle(pool, rng)) {
    if (!w.vi || seenWords.has(w.word) || seenVi.has(w.vi)) continue
    seenWords.add(w.word)
    seenVi.add(w.vi)
    const left = `${w.vi} (${POS_VI[w.pos] ?? w.pos})`
    const exercise: TypedExercise = {
      id: `vq-g-${w.id}`,
      kind: "typed",
      language: "en",
      bac,
      topic: `vocab-${level}`,
      tags: [`vocab-${level}`],
      difficulty: bac as 1 | 2 | 3,
      prompt: `Từ tiếng Anh nghĩa là “${w.vi}” (${POS_VI[w.pos] ?? w.pos})`,
      answers: [w.word],
      explanation: `${w.word} (${w.vi}): ${w.def}.`,
      card: { key: `vq-g-${w.id}`, front: `Từ tiếng Anh nghĩa là “${w.vi}” (${POS_VI[w.pos] ?? w.pos})`, answer: w.word, filled: null, explanation: `${w.word} (${w.vi}): ${w.def}.` },
    }
    pairs.push({ id: exercise.id, left, right: w.word, exercise })
    if (pairs.length === size) return pairs
  }
  return []
}

/** Một lượt 10 câu: bốc từ ngẫu nhiên, xen kẽ hai dạng câu (dạng điền từ chỉ khi từ có câu ví dụ phù hợp). */
export function pickVocabRound(pool: VocabWord[], level: VocabLevel, size = 10, rng: Rng = Math.random): McqExercise[] {
  const out: McqExercise[] = []
  for (const w of shuffle(pool, rng)) {
    if (out.length >= size) break
    // Xoay vòng ba dạng: đọc nghĩa Anh → chọn từ, điền từ vào câu, nghĩa Việt → chọn từ (dạng nào không dùng được thì rơi về dạng đọc nghĩa).
    const turn = out.length % 3
    const q = turn === 1 ? clozeQuestion(w, level, pool, rng) : turn === 2 ? viQuestion(w, level, pool, rng) : null
    out.push(q ?? meaningQuestion(w, level, pool, rng))
  }
  return out
}
