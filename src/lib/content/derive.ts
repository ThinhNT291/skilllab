import { answerVariants } from "../grading.ts"
import { cardContentFromExercise } from "../srs/card-from-exercise.ts"
import type { CardSource, FixExercise, DictationExercise, Exercise, McqExercise, ReorderExercise, SpeakExercise, SpotExercise, TypedExercise } from "./types.ts"

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

/** Số từ của câu đọc to: đủ ngắn để đọc một hơi, đủ dài để có nội dung. */
export const SPEAK_MIN_WORDS = 4
export const SPEAK_MAX_WORDS = 12

/** Câu đọc to từ câu hoàn chỉnh của câu trắc nghiệm gốc. Bỏ câu có số, ký hiệu hoặc chữ ngoài tiếng Anh (nhận dạng giọng nói dễ nghe sai). */
export function deriveSpeak(ex: McqExercise): SpeakExercise | null {
  const filled = filledOf(ex)
  if (!filled || NOT_A_SENTENCE.test(filled)) return null
  const text = filled.trim()
  const n = text.split(/\s+/).length
  if (n < SPEAK_MIN_WORDS || n > SPEAK_MAX_WORDS) return null
  if (!/^[A-Za-z][A-Za-z ,.'’!?-]*$/.test(text)) return null
  return {
    ...shared(ex, "speak"),
    kind: "speak",
    text,
    explanation: "Luyện đọc to: chú ý các từ bị đánh dấu chưa rõ, nghe mẫu rồi đọc lại.",
    card: cardOf(ex),
  }
}

/**
 * Đổi tối đa MỘT câu trắc nghiệm trong lượt thành câu đọc to: ở nửa sau lượt (từ `from` trở đi), chọn câu ngắn nhất.
 * Lượt đã có câu đọc to thì giữ nguyên. Gọi lúc chạy trên trình duyệt vì cần biết micro có dùng được không.
 */
export function injectSpeak(exercises: Exercise[], from = 0, rng: Rng = Math.random): Exercise[] {
  if (exercises.some((e) => e.kind === "speak")) return exercises
  const start = Math.max(from, Math.ceil(exercises.length / 2))
  const cands: { index: number; speak: SpeakExercise }[] = []
  exercises.forEach((ex, index) => {
    if (index < start || ex.kind !== "mcq" || ex.id.includes("~")) return
    const speak = deriveSpeak(ex)
    if (speak) cands.push({ index, speak })
  })
  if (!cands.length) return exercises
  const shortest = Math.min(...cands.map((c) => c.speak.text.split(/\s+/).length))
  const pool = cands.filter((c) => c.speak.text.split(/\s+/).length === shortest)
  const pick = pool[Math.floor(rng() * pool.length)]
  const out = [...exercises]
  out[pick.index] = pick.speak
  return out
}

/** Điền một đáp án sai (có lời giải thích bắt đầu bằng "Sai") vào chỗ trống duy nhất; dùng chung cho dạng tìm lỗi và sửa lỗi. */
function wrongSentenceOf(ex: McqExercise, rng: Rng) {
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
  return { filled, sentence: sentence.trim(), words, errorFrom, errorTo, explanation: ex.choiceExplanations[wi].replace(/^Sai\.?\s*[—-]?\s*/, "") }
}

/** Tìm lỗi: cho người học chạm vào chỗ sai trong câu đã điền một đáp án sai. */
export function deriveSpot(ex: McqExercise, rng: Rng = Math.random): SpotExercise | null {
  const w = wrongSentenceOf(ex, rng)
  if (!w) return null
  return {
    ...shared(ex, "spot"),
    kind: "spot",
    prompt: "Chạm vào chỗ sai trong câu",
    words: w.words,
    errorFrom: w.errorFrom,
    errorTo: w.errorTo,
    correctSentence: w.filled,
    explanation: w.explanation,
    card: cardOf(ex),
  }
}

/** Sửa lỗi: cho câu có lỗi, người học gõ lại cả câu đã sửa (khó hơn tìm lỗi vì phải tự tạo câu đúng). */
export function deriveFix(ex: McqExercise, rng: Rng = Math.random): FixExercise | null {
  const w = wrongSentenceOf(ex, rng)
  if (!w) return null
  return {
    ...shared(ex, "fix"),
    kind: "fix",
    prompt: "Câu này có một lỗi. Gõ lại cả câu đã sửa.",
    wrongSentence: w.sentence,
    answers: answerVariants(w.filled),
    explanation: w.explanation,
    card: cardOf(ex),
  }
}

/**
 * Hỗ trợ giảm dần theo vị trí trong lượt: đầu lượt có gợi ý (chữ cái đầu và số từ), giữa lượt chỉ còn số từ, cuối lượt không gợi ý.
 * Nhờ vậy độ khó thay đổi theo màn chứ không chỉ theo nội dung câu.
 */
export type Scaffold = 0 | 1 | 2
export function scaffoldFor(index: number, total: number): Scaffold {
  if (total <= 1) return 0
  const r = index / (total - 1)
  return r < 0.34 ? 2 : r < 0.67 ? 1 : 0
}

/** Kiểu câu được phép ở từng vị trí: 3 câu đầu giữ trắc nghiệm (làm quen); giữa lượt sắp xếp/tìm lỗi; cuối lượt gõ đáp án/sửa lỗi/tìm lỗi. */
function optionsFor(ex: McqExercise, index: number, total: number, rng: Rng): Exercise[] {
  const r = total <= 1 ? 1 : index / (total - 1)
  if (r < 0.3) return []
  const pool: (Exercise | null)[] = r < 0.7 ? [deriveReorder(ex, rng), deriveSpot(ex, rng)] : [deriveTyped(ex), deriveFix(ex, rng), deriveSpot(ex, rng)]
  return pool.filter((x): x is Exercise => x !== null)
}

/** Thay tối đa `max` câu trắc nghiệm trong một lượt bằng biến thể, theo vị trí: càng về cuối càng khó (xem optionsFor). */
export function mixVariants(exercises: Exercise[], rng: Rng = Math.random, max = 4): Exercise[] {
  const candidates: { index: number; options: Exercise[] }[] = []
  exercises.forEach((ex, index) => {
    if (ex.kind !== "mcq") return
    const options = optionsFor(ex, index, exercises.length, rng)
    if (options.length) candidates.push({ index, options })
  })
  const result = [...exercises]
  for (const c of shuffle(candidates, rng).slice(0, max)) {
    result[c.index] = c.options[Math.floor(rng() * c.options.length)]
  }
  return result
}
