/**
 * Kiểm tra và hoàn thiện câu ngữ pháp trắc nghiệm do mô hình sinh (docs/prompt-sinh-noi-dung.md mục 3–5). Hàm thuần.
 * Nguyên tắc: mô hình KHÔNG quyết định mã câu, vị trí đáp án đúng hay thẻ; mã làm. Mô hình đặt đáp án đúng ở vị trí 0,
 * mã xáo cho đều A/B/C/D (cả lô), giải thích đi theo đáp án.
 */
export const DISTRACTOR_TYPES = ["wrong_tense", "agreement", "wrong_form", "wrong_word", "l1_transfer", "overgeneralisation", "word_order", "missing_word"] as const

export interface RawItem {
  usageId?: unknown
  intendedBac?: unknown
  difficultyHint?: unknown
  prompt?: unknown
  choices?: unknown
  distractorTypes?: unknown
  choiceExplanations?: unknown
  explanation?: unknown
  selfCheck?: unknown
}

export interface CleanItem {
  usageId: string
  intendedBac: number
  difficultyHint: 1 | 2 | 3
  prompt: string
  /** Đáp án đúng ở vị trí 0 */
  choices: [string, string, string, string]
  choiceExplanations: [string, string, string, string]
  explanation: string
}

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean)
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9' ]+/g, " ").replace(/\s+/g, " ").trim()

/** Trả `{ ok: true, item }` hoặc `{ ok: false, reasons }` (mọi lý do, để người duyệt thấy hết). */
export function validateRawItem(raw: RawItem, allowedUsageIds: ReadonlySet<string>): { ok: true; item: CleanItem } | { ok: false; reasons: string[] } {
  const reasons: string[] = []
  const usageId = typeof raw.usageId === "string" ? raw.usageId : ""
  if (!allowedUsageIds.has(usageId)) reasons.push(`usageId không nằm trong danh sách đã dạy: "${usageId}"`)
  const prompt = typeof raw.prompt === "string" ? raw.prompt.trim() : ""
  if (!prompt) reasons.push("thiếu prompt")
  if ((prompt.match(/______/g) ?? []).length !== 1) reasons.push('prompt phải có đúng một chỗ trống "______"')
  if (/[*_]{1,}(?!_{5})/.test(prompt.replace(/______/g, "")) || /\*\*|`|#/.test(prompt)) reasons.push("prompt có ký hiệu markdown")
  const n = words(prompt).length
  if (prompt && (n < 5 || n > 40)) reasons.push(`prompt ${n} từ (cần 5–40)`)
  const choices = Array.isArray(raw.choices) ? raw.choices.map((c) => (typeof c === "string" ? c.trim() : "")) : []
  if (choices.length !== 4 || choices.some((c) => !c)) reasons.push("cần đúng 4 lựa chọn không rỗng")
  else if (new Set(choices.map((c) => c.toLowerCase())).size !== 4) reasons.push("có lựa chọn trùng nhau")
  const exps = Array.isArray(raw.choiceExplanations) ? raw.choiceExplanations.map((c) => (typeof c === "string" ? c.trim() : "")) : []
  if (exps.length !== 4 || exps.some((c) => !c)) reasons.push("cần đúng 4 lời giải thích cho từng lựa chọn")
  else {
    if (!/^Đúng\s*[—-]/.test(exps[0])) reasons.push('giải thích đáp án đúng (vị trí 0) phải bắt đầu "Đúng —"')
    if (!exps.slice(1).every((e) => /^Sai\s*[—-]/.test(e))) reasons.push('giải thích đáp án sai phải bắt đầu "Sai —"')
  }
  const types = Array.isArray(raw.distractorTypes) ? raw.distractorTypes : []
  if (types.length !== 3 || !types.every((t) => (DISTRACTOR_TYPES as readonly unknown[]).includes(t))) reasons.push("distractorTypes phải là 3 giá trị hợp lệ")
  const explanation = typeof raw.explanation === "string" ? raw.explanation.trim() : ""
  if (!explanation) reasons.push("thiếu explanation")
  const sc = raw.selfCheck as { oneAcceptable?: unknown } | undefined
  if (sc?.oneAcceptable !== true) reasons.push("mô hình không xác nhận chỉ một đáp án chấp nhận được")
  const bac = typeof raw.intendedBac === "number" ? Math.round(raw.intendedBac) : 0
  if (bac < 1 || bac > 6) reasons.push("intendedBac phải từ 1 đến 6")
  const dh = typeof raw.difficultyHint === "number" ? Math.round(raw.difficultyHint) : 0
  if (dh < 1 || dh > 3) reasons.push("difficultyHint phải 1, 2 hoặc 3")
  if (reasons.length) return { ok: false, reasons }
  return { ok: true, item: { usageId, intendedBac: bac, difficultyHint: dh as 1 | 2 | 3, prompt, choices: choices as CleanItem["choices"], choiceExplanations: exps as CleanItem["choiceExplanations"], explanation } }
}

/** Độ giống (Jaccard trên tập từ) giữa hai câu, 0–1. */
export function similarity(a: string, b: string): number {
  const x = new Set(norm(a).split(" "))
  const y = new Set(norm(b).split(" "))
  if (!x.size || !y.size) return 0
  let inter = 0
  for (const w of x) if (y.has(w)) inter++
  return inter / (x.size + y.size - inter)
}

/** Loại câu trùng hoặc gần trùng với câu đã có và với nhau trong lô (giữ câu đầu tiên). */
export function dropDuplicates<T extends { prompt: string }>(items: T[], existing: string[], threshold = 0.8): { kept: T[]; dropped: { item: T; like: string }[] } {
  const kept: T[] = []
  const dropped: { item: T; like: string }[] = []
  const seen = [...existing]
  for (const it of items) {
    const like = seen.find((p) => similarity(p, it.prompt) >= threshold)
    if (like) dropped.push({ item: it, like })
    else {
      kept.push(it)
      seen.push(it.prompt)
    }
  }
  return { kept, dropped }
}

export type Rng = () => number

/** Vị trí đáp án đúng rải đều cả lô: lần lượt các vị trí 0–3 theo thứ tự đã xáo, mỗi vòng xáo lại. */
export function balancedPositions(count: number, rng: Rng = Math.random): number[] {
  const out: number[] = []
  while (out.length < count) {
    const round = [0, 1, 2, 3]
    for (let i = round.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1))
      ;[round[i], round[j]] = [round[j], round[i]]
    }
    out.push(...round)
  }
  return out.slice(0, count)
}

export interface ExerciseJson {
  id: string
  kind: "mcq"
  language: "en"
  topic: string
  usageId: string
  tags: string[]
  difficulty: 1 | 2 | 3
  title: string
  prompt: string
  choices: string[]
  correctIndex: number
  explanation: string
  choiceExplanations: string[]
  bac: number
}

/**
 * Đặt đáp án đúng vào vị trí `position` (giải thích đi theo) và dựng câu theo lược đồ của kho bài tập.
 * `bac` do người gọi quyết định (mô hình chỉ đề xuất `intendedBac`), mặc định lấy đề xuất của mô hình để người duyệt xem.
 */
export function toExercise(item: CleanItem, opts: { id: string; topic: string; position: number; bac?: number; difficulty?: 1 | 2 | 3 }): ExerciseJson {
  const order = [1, 2, 3]
  order.splice(opts.position, 0, 0) // chỉ số gốc xếp vào vị trí mới; 0 (đáp án đúng) ở `position`
  const choices = order.map((i) => item.choices[i])
  const choiceExplanations = order.map((i) => item.choiceExplanations[i])
  return {
    id: opts.id,
    kind: "mcq",
    language: "en",
    topic: opts.topic,
    usageId: item.usageId,
    tags: [item.usageId],
    difficulty: opts.difficulty ?? item.difficultyHint,
    title: "Điền từ vào chỗ trống",
    prompt: item.prompt,
    choices,
    correctIndex: opts.position,
    explanation: item.explanation,
    choiceExplanations,
    bac: opts.bac ?? item.intendedBac,
  }
}

/** Mã câu kế tiếp theo mẫu `en-<chuyên đề>-NNN`, nối tiếp số lớn nhất đang có. */
export function nextIds(topic: string, existingIds: string[], count: number): string[] {
  const re = new RegExp(`^en-${topic.replace(/[^a-z0-9-]/g, "")}-(\\d+)$`)
  const max = existingIds.reduce((m, id) => Math.max(m, Number(re.exec(id)?.[1] ?? 0)), 0)
  return Array.from({ length: count }, (_, i) => `en-${topic}-${String(max + i + 1).padStart(3, "0")}`)
}
