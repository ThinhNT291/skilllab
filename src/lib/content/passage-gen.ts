/**
 * Kiểm tra và hoàn thiện bài đọc/nghe do mô hình sinh (docs/prompt-sinh-noi-dung.md mục 10.4). Hàm thuần.
 * Nguyên tắc như câu ngữ pháp: mô hình KHÔNG quyết định mã bài, vị trí đáp án đúng; mã kiểm "bằng chứng trích từ bài có thật trong bài",
 * độ dài theo bậc, câu Đúng/Sai/Không nêu giữ nguyên thứ tự cố định, các lựa chọn khác xáo cho đều.
 */
import { LENGTH_RANGE } from "./text-level.ts"
import { balancedPositions, type Rng } from "./item-gen.ts"

export type PassageKind = "reading" | "listening"
export const QUESTION_TYPES = ["detail", "main_idea", "inference", "vocab", "attitude", "tfng"] as const
export const TFNG = ["True", "False", "Not given"] as const

export interface RawQuestion {
  type?: unknown
  question?: unknown
  choices?: unknown
  answer?: unknown
  choiceExplanations?: unknown
  explanation?: unknown
  evidence?: unknown
}
export interface RawPassage {
  title?: unknown
  genre?: unknown
  text?: unknown
  facts?: unknown
  questions?: unknown
  intendedBac?: unknown
}

export interface CleanQuestion {
  type: (typeof QUESTION_TYPES)[number]
  prompt: string
  /** Câu 4 lựa chọn: đáp án đúng ở vị trí 0. Câu Đúng/Sai/Không nêu: ba lựa chọn cố định, đáp án đúng ở `tfngIndex` */
  choices: string[]
  choiceExplanations: string[]
  explanation: string
  evidence: string | null
  tfngIndex?: number
}
export interface CleanPassage {
  title: string
  genre: string
  text: string
  facts: string[]
  questions: CleanQuestion[]
}

const words = (s: string) => (s.match(/[A-Za-z]+(?:'[A-Za-z]+)?/g) ?? []).length
const squash = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()
const str = (v: unknown) => (typeof v === "string" ? v.trim() : "")

/** Lời thoại phải có nhãn người nói ở đầu dòng ("A:", "Anna:") nếu có từ hai dòng; độc thoại (một dòng/đoạn) thì không cần. */
export function speakerLabels(text: string): string[] {
  return [...new Set((text.match(/^\s*([A-Z][A-Za-z]{0,14}):\s/gm) ?? []).map((m) => m.trim().replace(/:$/, "")))]
}

export function validateRawPassage(raw: RawPassage, kind: PassageKind, bac: number, nQuestions = 4): { ok: true; passage: CleanPassage } | { ok: false; reasons: string[] } {
  const reasons: string[] = []
  const title = str(raw.title)
  const text = str(raw.text)
  if (!title) reasons.push("thiếu title")
  if (!text) reasons.push("thiếu text")
  if (/\*\*|`|#{2,}/.test(text)) reasons.push("text có ký hiệu markdown")
  const n = words(text)
  const [lo, hi] = LENGTH_RANGE[kind][bac] ?? [0, Infinity]
  if (text && (n < lo * 0.9 || n > hi * 1.1)) reasons.push(`${n} từ, ngoài khoảng ${lo}–${hi} của Bậc ${bac} (cho phép lệch 10%)`)
  if (kind === "listening") {
    const lines = text.split("\n").filter((l) => l.trim())
    const labels = speakerLabels(text)
    if (lines.length >= 2 && labels.length < 2) reasons.push("hội thoại nhiều dòng phải có nhãn người nói khác nhau (A:/B: hoặc tên)")
    if (lines.length >= 2 && lines.some((l) => !/^\s*[A-Z][A-Za-z]{0,14}:\s/.test(l))) reasons.push("mỗi dòng hội thoại phải bắt đầu bằng nhãn người nói")
  }
  const facts = Array.isArray(raw.facts) ? raw.facts.map(str).filter(Boolean) : []
  const qs = Array.isArray(raw.questions) ? (raw.questions as RawQuestion[]) : []
  if (qs.length !== nQuestions) reasons.push(`cần đúng ${nQuestions} câu hỏi, nhận ${qs.length}`)
  const clean: CleanQuestion[] = []
  const hay = squash(text)
  qs.forEach((q, i) => {
    const at = `câu ${i + 1}`
    const type = QUESTION_TYPES.find((t) => t === q?.type)
    if (!type) return void reasons.push(`${at}: type không hợp lệ`)
    const prompt = str(q.question)
    if (!prompt) reasons.push(`${at}: thiếu câu hỏi`)
    const exps = Array.isArray(q.choiceExplanations) ? q.choiceExplanations.map(str) : []
    const explanation = str(q.explanation)
    if (!explanation) reasons.push(`${at}: thiếu explanation`)
    let evidence: string | null = str(q.evidence) || null
    let choices: string[]
    let tfngIndex: number | undefined
    if (type === "tfng") {
      choices = [...TFNG]
      tfngIndex = TFNG.findIndex((t) => t === q.answer)
      if (tfngIndex < 0) reasons.push(`${at}: answer phải là True, False hoặc Not given`)
      if (exps.length !== 3 || exps.some((e) => !e)) reasons.push(`${at}: cần 3 lời giải thích (True, False, Not given theo thứ tự)`)
      else if (tfngIndex >= 0) {
        if (!exps.every((e, k) => (k === tfngIndex ? /^Đúng\s*[—-]/.test(e) : /^Sai\s*[—-]/.test(e)))) reasons.push(`${at}: giải thích phải bắt đầu "Đúng —" cho đáp án đúng và "Sai —" cho các đáp án còn lại`)
      }
      if (tfngIndex === 2) evidence = null
      else if (!evidence) reasons.push(`${at}: câu True/False cần evidence trích từ bài`)
      if (!/^(True, False, or Not given\?)/i.test(prompt)) reasons.push(`${at}: câu Đúng/Sai/Không nêu phải bắt đầu "True, False, or Not given?"`)
    } else {
      choices = Array.isArray(q.choices) ? q.choices.map(str) : []
      if (choices.length !== 4 || choices.some((c) => !c)) reasons.push(`${at}: cần đúng 4 lựa chọn không rỗng`)
      else if (new Set(choices.map((c) => c.toLowerCase())).size !== 4) reasons.push(`${at}: có lựa chọn trùng nhau`)
      if (exps.length !== 4 || exps.some((e) => !e)) reasons.push(`${at}: cần 4 lời giải thích`)
      else {
        if (!/^Đúng\s*[—-]/.test(exps[0])) reasons.push(`${at}: giải thích đáp án đúng (vị trí 0) phải bắt đầu "Đúng —"`)
        if (!exps.slice(1).every((e) => /^Sai\s*[—-]/.test(e))) reasons.push(`${at}: giải thích đáp án sai phải bắt đầu "Sai —"`)
      }
      if (!evidence) reasons.push(`${at}: thiếu evidence`)
    }
    // Bằng chứng phải là đoạn có thật trong bài (so sánh bỏ dấu câu và hoa thường).
    if (evidence && !hay.includes(squash(evidence))) reasons.push(`${at}: evidence không có trong bài: "${evidence.slice(0, 60)}"`)
    // Đáp án đúng không được chép nguyên cả cụm bằng chứng dài (phải diễn đạt lại).
    if (type !== "tfng" && choices[0] && words(choices[0]) >= 6 && hay.includes(squash(choices[0]))) reasons.push(`${at}: đáp án đúng chép nguyên văn từ bài, cần diễn đạt lại`)
    clean.push({ type, prompt, choices, choiceExplanations: exps, explanation, evidence, tfngIndex })
  })
  if (clean.length === nQuestions && clean.filter((q) => q.type === "tfng").length > 2) reasons.push("quá nhiều câu Đúng/Sai/Không nêu (tối đa 2 mỗi bài)")
  if (reasons.length) return { ok: false, reasons }
  return { ok: true, passage: { title, genre: str(raw.genre), text, facts, questions: clean } }
}

export interface QuestionJson {
  prompt: string
  choices: string[]
  correctIndex: number
  explanation: string
  choiceExplanations: string[]
}

/** Dựng câu hỏi theo lược đồ của kho bài đọc/nghe: câu bốn lựa chọn đặt đáp án đúng ở `position`; câu Đúng/Sai/Không nêu giữ thứ tự cố định. */
export function toQuestionJson(q: CleanQuestion, position: number): QuestionJson {
  if (q.type === "tfng") return { prompt: q.prompt, choices: q.choices, correctIndex: q.tfngIndex ?? 0, explanation: q.explanation, choiceExplanations: q.choiceExplanations }
  const order = [1, 2, 3]
  order.splice(position, 0, 0)
  return { prompt: q.prompt, choices: order.map((i) => q.choices[i]), correctIndex: position, explanation: q.explanation, choiceExplanations: order.map((i) => q.choiceExplanations[i]) }
}

export interface PassageJson {
  id: string
  bac: number
  title: string
  text?: string
  transcript?: string
  questions: QuestionJson[]
}

/** Dựng nhiều bài: vị trí đáp án đúng rải đều trên MỌI câu bốn lựa chọn của cả lô. */
export function toPassageJsons(passages: CleanPassage[], kind: PassageKind, bac: number, ids: string[], rng: Rng = Math.random): PassageJson[] {
  const total = passages.reduce((n, p) => n + p.questions.filter((q) => q.type !== "tfng").length, 0)
  const positions = balancedPositions(total, rng)
  let k = 0
  return passages.map((p, i) => ({
    id: ids[i],
    bac,
    title: p.title,
    [kind === "reading" ? "text" : "transcript"]: p.text,
    questions: p.questions.map((q) => toQuestionJson(q, q.type === "tfng" ? 0 : positions[k++])),
  })) as PassageJson[]
}

/** Mã bài kế tiếp theo mẫu `rd-b<bậc>-NNN` hoặc `ls-b<bậc>-NNN`. */
export function nextPassageIds(kind: PassageKind, bac: number, existingIds: string[], count: number): string[] {
  const prefix = `${kind === "reading" ? "rd" : "ls"}-b${bac}-`
  const max = existingIds.reduce((m, id) => (id.startsWith(prefix) ? Math.max(m, Number(id.slice(prefix.length)) || 0) : m), 0)
  return Array.from({ length: count }, (_, i) => `${prefix}${String(max + i + 1).padStart(3, "0")}`)
}
