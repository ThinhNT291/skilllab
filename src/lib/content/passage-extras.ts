/**
 * Câu hỏi thêm sinh từ chính bài đọc/bài nghe có sẵn (không soạn thêm nội dung), để bài đa dạng hơn:
 *  - Bài đọc: "tìm câu làm căn cứ" (chạm vào câu trong bài) và "sắp xếp từ thành câu" (một câu trong bài).
 *  - Bài nghe: "nghe và gõ lại" một câu trong lời thoại.
 * Tất cả chấm bằng mã, đáp án cố định: chỉ sinh khi chắc chắn chỉ có một đáp án đúng. Hàm thuần.
 */
import { answerVariants } from "../grading.ts"
import { quotedFragments } from "../listening/evidence.ts"
import { listeningTopic, type ListeningItem } from "../listening/types.ts"
import { readingTopic, type ReadingPassage } from "../reading/types.ts"
import { reorderFromSentence, shuffle, type Rng } from "./derive.ts"
import type { CardSource, DictationExercise, EvidenceExercise, Exercise, ReorderExercise } from "./types.ts"

const ABBREVIATIONS = /\b(Mr|Mrs|Ms|Dr|Prof|St|Mt|Jr|Sr|vs|etc|a\.m|p\.m)\.(?=\s)/g
const DOT = "\u0001"

/** Tách văn bản thành các câu (theo dòng, rồi theo dấu kết câu, không cắt sau Mr./Ms./Dr.…); bỏ câu quá ngắn như "Yes." */
export function splitSentences(text: string): string[] {
  return text
    .replace(ABBREVIATIONS, (m) => m.slice(0, -1) + DOT)
    .split(/\n+/)
    .flatMap((p) => p.split(/(?<=[.!?])\s+/))
    .map((s) => s.replaceAll(DOT, ".").trim())
    .filter((s) => s.split(/\s+/).length >= 3)
}

/** Câu hỏi chung chung ("Which sentence is true?") không có căn cứ riêng để tìm: không dùng cho bài tìm căn cứ. */
const GENERIC_QUESTION = /\bwhich (sentence|statement)\b|\bwhat is true\b|\bwhich is true\b/i

const wordCount = (s: string) => s.trim().split(/\s+/).length

function baseOf(bac: ReadingPassage["bac"], topic: string, id: string) {
  return { id, language: "en" as const, bac, topic, tags: [topic], difficulty: Math.min(3, Math.max(1, bac)) as 1 | 2 | 3 }
}

/** Các câu hỏi có đúng MỘT câu trong bài chứa phần trích dẫn làm căn cứ (chỉ số câu hỏi, chỉ số câu trong bài). */
export function evidenceCandidates(p: ReadingPassage): { question: number; sentence: number }[] {
  const sentences = splitSentences(p.text)
  const out: { question: number; sentence: number }[] = []
  p.questions.forEach((q, qi) => {
    if (GENERIC_QUESTION.test(q.prompt)) return
    const frags = quotedFragments(q.choiceExplanations?.[q.correctIndex], q.explanation)
    if (!frags.length) return
    const hit = sentences.flatMap((s, i) => (frags.some((f) => s.toLowerCase().includes(f.toLowerCase())) ? [i] : []))
    if (hit.length === 1 && wordCount(sentences[hit[0]]) >= 4) out.push({ question: qi, sentence: hit[0] })
  })
  return sentences.length >= 3 ? out : []
}

export function deriveEvidence(p: ReadingPassage, rng: Rng = Math.random): EvidenceExercise | null {
  const cands = evidenceCandidates(p)
  if (!cands.length) return null
  const pick = cands[Math.floor(rng() * cands.length)]
  const q = p.questions[pick.question]
  const sentences = splitSentences(p.text)
  const answerText = q.choices[q.correctIndex]
  const topic = readingTopic(p.bac)
  const card: CardSource = { key: `rq-${p.id}-${pick.question + 1}`, front: q.prompt, answer: answerText, filled: null, explanation: q.choiceExplanations?.[q.correctIndex]?.replace(/^Đúng — /, "") ?? q.explanation }
  return {
    ...baseOf(p.bac, topic, `rq-${p.id}-x-evidence`),
    kind: "evidence",
    question: q.prompt,
    answerText,
    sentences,
    answerIndex: pick.sentence,
    explanation: `Căn cứ nằm ở câu: “${sentences[pick.sentence]}”`,
    card,
  }
}

/** Sắp xếp từ của một câu trong bài đọc (câu dài 4–12 từ, bỏ câu có từ chỉ thời gian đổi chỗ được). */
export function deriveReadingReorder(p: ReadingPassage, rng: Rng = Math.random): ReorderExercise | null {
  const topic = readingTopic(p.bac)
  for (const s of shuffle(splitSentences(p.text), rng)) {
    if (/["“”]/.test(s)) continue
    const card: CardSource = { key: `rq-${p.id}-x-reorder`, front: "Sắp xếp các từ thành câu trong bài đọc", answer: s, filled: s, explanation: `Câu trong bài “${p.title}”` }
    const ex = reorderFromSentence(s, baseOf(p.bac, topic, `rq-${p.id}-x-reorder`), card, rng)
    if (ex) return ex
  }
  return null
}

/** Các câu trong lời thoại (bỏ nhãn người nói), dùng cho nghe và gõ lại. */
export function listeningLines(item: ListeningItem): string[] {
  return item.transcript
    .split(/\n+/)
    .map((l) => l.replace(/^[A-Za-z][A-Za-z ]{0,19}:\s*/, ""))
    .flatMap((l) => l.split(/(?<=[.!?])\s+/))
    .map((s) => s.trim())
    .filter((s) => wordCount(s) >= 4 && wordCount(s) <= 12 && /^[A-Za-z][A-Za-z ,.'’!?-]*$/.test(s))
}

export function deriveListeningDictation(item: ListeningItem, rng: Rng = Math.random): DictationExercise | null {
  const lines = listeningLines(item)
  if (!lines.length) return null
  const text = lines[Math.floor(rng() * lines.length)]
  const topic = listeningTopic(item.bac)
  return {
    ...baseOf(item.bac, topic, `lq-${item.id}-x-dictation`),
    kind: "dictation",
    text,
    answers: answerVariants(text),
    explanation: `Câu đúng: ${text}`,
    card: { key: `lq-${item.id}-x-dictation`, front: "Nghe và gõ lại một câu trong bài nghe", answer: text, filled: text, explanation: `Câu trong bài nghe “${item.title}”` },
  }
}

/** Câu hỏi thêm cho một bài đọc (tối đa 2). */
export function readingExtras(p: ReadingPassage, rng: Rng = Math.random): Exercise[] {
  return [deriveEvidence(p, rng), deriveReadingReorder(p, rng)].filter((x): x is EvidenceExercise | ReorderExercise => x !== null)
}

/** Câu hỏi thêm cho một bài nghe (tối đa 1). */
export function listeningExtras(item: ListeningItem, rng: Rng = Math.random): Exercise[] {
  const d = deriveListeningDictation(item, rng)
  return d ? [d] : []
}
