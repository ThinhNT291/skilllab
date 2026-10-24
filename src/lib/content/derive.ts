import { answerVariants } from "../grading.ts"
import { cardContentFromExercise } from "../srs/card-from-exercise.ts"
import type { CardSource, DictationExercise, Exercise, McqExercise, ReorderExercise, SpotExercise, TypedExercise } from "./types.ts"

/**
 * Sinh câu biến thể (sắp xếp từ, gõ đáp án, nghe chép) từ câu trắc nghiệm gốc đã được kiểm định.
 * Chỉ sinh khi chắc chắn đáp án duy nhất; không chắc thì bỏ, câu vẫn ra dạng trắc nghiệm.
 */
export type Rng = () => number

/** Từ/cụm có thể đổi chỗ trong câu mà vẫn đúng, nên không dùng cho bài sắp xếp. */
const MOVABLE =
  /\b(yesterday|tomorrow|today|tonight|now|then|always|usually|often|sometimes|never|rarely|already|just|yet|still|soon|later|recently|ago|every|last|next|once|twice|currently|eventually|finally|also|even|only|really|very|nowadays|these days|at the moment|right now|morning|afternoon|evening|night|weekend|week|weeks|month|months|year|years|summer|winter|spring|autumn|monday|tuesday|wednesday|thursday|friday|saturday|sunday|january|february|march|april|may|june|july|august|september|october|november|december|century|decade|ten minutes|hour|hours)\b/i

/** Câu đối thoại hoặc dạng "biến đổi câu" không dùng cho các biến thể. */
const NOT_A_SENTENCE = /Direct:|Reported:|Compare:|^[AB]:|\bB:|->|\?\s+[A-Z]/

/** Chuyên đề mà đáp án gõ tự do có dạng xác định (hầu như chỉ một cách đúng). */
const TYPED_TOPICS = new Set([
  "present-simple",
  "past-simple",
  "present-perfect",
  "present-perfect-continuous",
  "passive-voice",
  "prepositions",
  "articles-countable-uncountable",
  "comparatives-superlatives",
  "pronouns-determiners",
  "gerund-infinitive",
  "relative-clauses",
])
/** Các chuyên đề động từ phải có gợi ý trong ngoặc, vd "(clean)", để đáp án gõ không mơ hồ. */
const NEEDS_HINT = new Set(["present-simple", "past-simple", "present-perfect", "present-perfect-continuous", "passive-voice", "gerund-infinitive"])

export function shuffle<T>(list: T[], rng: Rng = Math.random): T[] {
  const copy = [...list]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function cardOf(ex: McqExercise): CardSource {
  const c = cardContentFromExercise(ex)
  return { key: ex.id, front: c.front, answer: c.answer, filled: c.filled, explanation: c.explanation }
}

function shared(ex: McqExercise, suffix: string) {
  return {
    id: `${ex.id}~${suffix}`,
    language: ex.language,
    level: ex.level,
    bac: ex.bac,
    topic: ex.topic,
    usageId: ex.usageId,
    tags: ex.tags,
    difficulty: ex.difficulty,
  }
}

function filledOf(ex: McqExercise): string | null {
  return cardContentFromExercise(ex).filled
}

export function deriveReorder(ex: McqExercise, rng: Rng = Math.random): ReorderExercise | null {
  const filled = filledOf(ex)
  if (!filled || NOT_A_SENTENCE.test(filled) || MOVABLE.test(filled)) return null
  const words = filled.trim().split(/\s+/)
  if (words.length < 4 || words.length > 12 || !/[.!?]$/.test(filled.trim())) return null
  let pool = shuffle(words, rng)
  for (let i = 0; i < 5 && pool.join(" ") === words.join(" "); i++) pool = shuffle(words, rng)
  if (pool.join(" ") === words.join(" ")) return null
  return {
    ...shared(ex, "reorder"),
    kind: "reorder",
    prompt: "Sắp xếp các từ thành câu đúng",
    pool,
    answerWords: words,
    explanation: `Câu đúng: ${filled}`,
    card: cardOf(ex),
  }
}

export function deriveTyped(ex: McqExercise): TypedExercise | null {
  if (!TYPED_TOPICS.has(ex.topic)) return null
  const blanks = ex.prompt.match(/_{2,}/g) ?? []
  const answer = ex.choices[ex.correctIndex]
  if (blanks.length !== 1 || answer.includes(" / ") || answer.split(/\s+/).length > 3) return null
  if (NOT_A_SENTENCE.test(ex.prompt)) return null
  if (NEEDS_HINT.has(ex.topic) && !/\([a-z/]+\)/i.test(ex.prompt)) return null
  const filled = filledOf(ex)
  return {
    ...shared(ex, "typed"),
    kind: "typed",
    prompt: ex.prompt,
    answers: answerVariants(answer),
    explanation: filled ? `Đáp án: ${answer}. ${filled}` : `Đáp án: ${answer}`,
    card: cardOf(ex),
  }
}

export function deriveDictation(ex: McqExercise): DictationExercise | null {
  const filled = filledOf(ex)
  if (!filled || NOT_A_SENTENCE.test(filled)) return null
  const n = filled.trim().split(/\s+/).length
  if (n < 3 || n > 14) return null
  return {
    ...shared(ex, "dictation"),
    kind: "dictation",
    text: filled,
    answers: answerVariants(filled),
    explanation: `Câu đúng: ${filled}`,
    card: cardOf(ex),
  }
}

/** Tìm lỗi: điền một đáp án sai (có lời giải thích bắt đầu bằng "Sai") vào chỗ trống duy nhất rồi cho người học chạm vào chỗ sai. */
export function deriveSpot(ex: McqExercise, rng: Rng = Math.random): SpotExercise | null {
  const filled = filledOf(ex)
  if (!filled || NOT_A_SENTENCE.test(ex.prompt) || !ex.choiceExplanations || ex.choiceExplanations.length !== ex.choices.length) return null
  const blank = /_{2,}/.exec(ex.prompt)
  if (!blank || (ex.prompt.match(/_{2,}/g) ?? []).length !== 1 || ex.choices[ex.correctIndex].includes(" / ")) return null
  const wrongs = ex.choices.map((_, i) => i).filter((i) => i !== ex.correctIndex && !ex.choices[i].includes(" / ") && /^Sai\b/.test(ex.choiceExplanations![i]))
  if (!wrongs.length) return null
  const wi = wrongs[Math.floor(rng() * wrongs.length)]
  const strip = (s: string) => s.replace(/\s*\((?:[a-z]+\/)*[a-z]+\)/gi, "")
  const sentence = strip(ex.prompt.replace(/_{2,}/, ex.choices[wi]))
  const words = sentence.trim().split(/\s+/)
  if (words.length < 4 || words.length > 14) return null
  const errorFrom = strip(ex.prompt.slice(0, blank.index)).trim().split(/\s+/).filter(Boolean).length
  const errorTo = errorFrom + ex.choices[wi].trim().split(/\s+/).length - 1
  if (errorTo >= words.length) return null
  return {
    ...shared(ex, "spot"),
    kind: "spot",
    prompt: "Chạm vào chỗ sai trong câu",
    words,
    errorFrom,
    errorTo,
    correctSentence: filled,
    explanation: ex.choiceExplanations[wi].replace(/^Sai\.?\s*[—-]?\s*/, ""),
    card: cardOf(ex),
  }
}

/** Thay tối đa `max` câu trắc nghiệm trong một lượt bằng biến thể (sắp xếp hoặc gõ) để lượt luyện đa dạng hơn. */
export function mixVariants(exercises: Exercise[], rng: Rng = Math.random, max = 3): Exercise[] {
  const candidates: { index: number; options: Exercise[] }[] = []
  exercises.forEach((ex, index) => {
    if (ex.kind !== "mcq") return
    const options = [deriveReorder(ex, rng), deriveTyped(ex), deriveSpot(ex, rng)].filter((x): x is ReorderExercise | TypedExercise | SpotExercise => x !== null)
    if (options.length) candidates.push({ index, options })
  })
  const result = [...exercises]
  for (const c of shuffle(candidates, rng).slice(0, max)) {
    result[c.index] = c.options[Math.floor(rng() * c.options.length)]
  }
  return result
}
