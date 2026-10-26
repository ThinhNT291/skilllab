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
import type { CardSource, DictationExercise, EvidenceExercise, Exercise, GapfillExercise, ReorderExercise, WordfindExercise } from "./types.ts"

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

/** Từ chức năng và từ quá chung: không dùng làm từ bị khuyết (nghe không nổi bật, dễ nhầm). */
const GAP_STOP = new Set(["that", "with", "this", "have", "from", "they", "them", "then", "than", "will", "would", "could", "should", "there", "their", "these", "those", "what", "when", "where", "which", "while", "your", "about", "been", "were", "just", "very", "some", "into", "also", "like", "much", "many", "more", "most", "here", "does", "doing", "being"])

/** Nghe điền chỗ trống: chọn một từ nội dung (≥4 chữ, chỉ chữ cái, không phải tên riêng, chỉ xuất hiện một lần trong câu) để khuyết. */
export function deriveListeningGapfill(item: ListeningItem, rng: Rng = Math.random, avoid: string[] = []): GapfillExercise | null {
  const topic = listeningTopic(item.bac)
  for (const line of shuffle(listeningLines(item).filter((l) => !avoid.includes(l)), rng)) {
    const tokens = line.split(/\s+/)
    const bare = tokens.map((t) => t.replace(/^[^A-Za-z]+|[^A-Za-z]+$/g, ""))
    const count = (w: string) => bare.filter((b) => b.toLowerCase() === w.toLowerCase()).length
    const cands = bare.flatMap((w, i) => (/^[A-Za-z]{4,}$/.test(w) && !GAP_STOP.has(w.toLowerCase()) && count(w) === 1 && (i === 0 ? false : w[0] === w[0].toLowerCase()) ? [i] : []))
    if (!cands.length) continue
    const i = cands[Math.floor(rng() * cands.length)]
    const word = bare[i]
    const shown = tokens.map((t, k) => (k === i ? t.replace(word, "______") : t)).join(" ")
    return {
      ...baseOf(item.bac, topic, `lq-${item.id}-x-gapfill`),
      kind: "gapfill",
      text: line,
      shown,
      answers: [word.toLowerCase()],
      explanation: `Câu đầy đủ: ${line}`,
      card: { key: `lq-${item.id}-x-gapfill`, front: `Nghe và điền từ còn thiếu: ${shown}`, answer: word, filled: line, explanation: `Câu trong bài nghe “${item.title}”` },
    }
  }
  return null
}

/** Một mục trong bảng tra nghĩa tiếng Anh của từ vựng (chỉ từ có ĐÚNG MỘT nghĩa trong kho, để định nghĩa không mơ hồ). */
export interface DefEntry {
  def: string
  vi: string | null
}
export type DefIndex = ReadonlyMap<string, DefEntry>

/** Dựng bảng tra từ các mục từ vựng: chỉ giữ danh từ/tính từ có ĐÚNG MỘT mục (mọi cấp), bỏ từ dành riêng cho bài xếp trình độ (nhưng vẫn đếm chúng khi xét "một nghĩa"). */
export function buildDefIndex(entries: { word: string; def: string; vi?: string | null; reserved?: boolean; pos?: string }[]): DefIndex {
  const seen = new Map<string, { def: string; vi: string | null; n: number; reserved: boolean; pos: string | undefined }>()
  for (const w of entries) {
    const key = w.word.toLowerCase()
    const prev = seen.get(key)
    seen.set(key, prev ? { ...prev, n: prev.n + 1, reserved: prev.reserved || !!w.reserved } : { def: w.def, vi: w.vi ?? null, n: 1, reserved: !!w.reserved, pos: w.pos })
  }
  const out = new Map<string, DefEntry>()
  // Chỉ danh từ và tính từ: động từ, trạng từ và từ chức năng có quá nhiều nghĩa tùy ngữ cảnh, định nghĩa dễ không khớp cách dùng trong bài.
  for (const [k, v] of seen) if (v.n === 1 && !v.reserved && (v.pos === "noun" || v.pos === "adjective")) out.set(k, { def: v.def, vi: v.vi })
  return out
}

const wordOnly = (t: string) => t.replace(/^[^A-Za-z]+|[^A-Za-z]+$/g, "")

/** Tìm từ theo nghĩa: chọn từ có trong `defs`, định nghĩa không chứa chính từ đó, và không từ nào khác trong bài có cùng định nghĩa. */
export function deriveWordfind(p: ReadingPassage, defs: DefIndex, rng: Rng = Math.random): WordfindExercise | null {
  const words = p.text.split(/\s+/).filter(Boolean)
  const lower = words.map((w) => wordOnly(w).toLowerCase())
  // Mọi chỗ xuất hiện của từ, kể cả dạng số nhiều đơn giản (road → roads): chạm vào dạng nào cũng đúng.
  const headOf = (w: string): string | null => {
    if (defs.has(w)) return w
    if (w.endsWith("ies") && defs.has(`${w.slice(0, -3)}y`)) return `${w.slice(0, -3)}y`
    if (w.endsWith("es") && defs.has(w.slice(0, -2))) return w.slice(0, -2)
    if (w.endsWith("s") && defs.has(w.slice(0, -1))) return w.slice(0, -1)
    return null
  }
  const found = new Map<string, number[]>()
  lower.forEach((w, i) => {
    const head = w.length >= 4 ? headOf(w) : null
    if (head && head.length >= 4) found.set(head, [...(found.get(head) ?? []), i])
  })
  const cands = [...found.keys()].filter((w) => {
    const d = defs.get(w)!
    if (d.def.toLowerCase().includes(w) || d.def.length > 120) return false
    return [...found.keys()].every((o) => o === w || defs.get(o)!.def !== d.def)
  })
  if (!cands.length) return null
  const target = cands[Math.floor(rng() * cands.length)]
  const entry = defs.get(target)!
  const topic = readingTopic(p.bac)
  return {
    ...baseOf(p.bac, topic, `rq-${p.id}-x-wordfind`),
    kind: "wordfind",
    definition: entry.def,
    vi: entry.vi,
    words,
    answerIndexes: found.get(target)!,
    target,
    explanation: `Từ cần tìm: ${target}${entry.vi ? ` (${entry.vi})` : ""}`,
    card: { key: `rq-${p.id}-x-wordfind`, front: `Từ nào có nghĩa: “${entry.def}”?`, answer: target, filled: null, explanation: `Từ trong bài đọc “${p.title}”${entry.vi ? `: ${entry.vi}` : ""}` },
  }
}

/** Câu hỏi thêm cho một bài đọc (tối đa 2): tìm căn cứ nếu có, rồi một câu ngẫu nhiên trong số tìm từ theo nghĩa / sắp xếp từ. */
export function readingExtras(p: ReadingPassage, rng: Rng = Math.random, defs?: DefIndex): Exercise[] {
  const out: Exercise[] = []
  const ev = deriveEvidence(p, rng)
  if (ev) out.push(ev)
  const rest = shuffle([deriveReadingReorder(p, rng), defs ? deriveWordfind(p, defs, rng) : null].filter((x): x is ReorderExercise | WordfindExercise => x !== null), rng)
  for (const x of rest) if (out.length < 2) out.push(x)
  return out
}

/** Câu hỏi thêm cho một bài nghe (tối đa 2): nghe gõ lại một câu và nghe điền từ ở một câu khác. */
export function listeningExtras(item: ListeningItem, rng: Rng = Math.random): Exercise[] {
  const d = deriveListeningDictation(item, rng)
  const g = deriveListeningGapfill(item, rng, d ? [d.text] : [])
  return [d, g].filter((x): x is DictationExercise | GapfillExercise => x !== null)
}
