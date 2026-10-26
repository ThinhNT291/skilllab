/**
 * Nháp nội dung sinh bằng Gemini (docs/quan-ly-noi-dung-tren-giao-dien.md): đọc tệp lô do `scripts/gen-items.mjs` / `gen-passages.mjs`
 * ghi ra (kèm tệp giải mù `.reviewed.json` nếu có) thành các dòng nháp để quản trị duyệt. Hàm thuần, kiểm tra chặt dữ liệu vào
 * vì tệp do người nạp lên (không tin hình dạng).
 */
export type DraftKind = "grammar" | "reading" | "listening"
export type DraftStatus = "generated" | "review_failed" | "review_passed" | "approved" | "rejected"
export const DRAFT_STATUSES: DraftStatus[] = ["generated", "review_failed", "review_passed", "approved", "rejected"]

export const STATUS_LABEL: Record<DraftStatus, string> = {
  generated: "Chưa giải mù",
  review_failed: "Trượt giải mù",
  review_passed: "Qua giải mù",
  approved: "Đã duyệt",
  rejected: "Đã loại",
}

/** Lý do loại có sẵn (chọn nhanh khi duyệt); lý do khác ghi tự do. */
export const REJECT_REASONS = ["Sai ngữ pháp", "Hai đáp án cùng đúng", "Không tự nhiên", "Quá dễ so với bậc", "Quá khó so với bậc", "Sai số liệu/thực tế", "Giải thích sai hoặc khó hiểu", "Không hợp lứa tuổi", "Trùng ý với câu khác"] as const

export interface BlindResult {
  pass: boolean
  why: string[]
  runs: unknown
}

export interface DraftInput {
  itemId: string
  kind: DraftKind
  topic: string
  bac: number
  data: Record<string, unknown>
  meta: Record<string, unknown> | null
  blind: BlindResult | null
  status: DraftStatus
}

export interface BatchInput {
  kind: DraftKind
  topic: string | null
  bac: number
  model: string
  promptVersion: string
  blindRuns: number | null
  counts: { kept: number; rejectedByCode: number; duplicates: number }
  createdAt: string
}

const MAX_ITEMS = 100
const isObj = (x: unknown): x is Record<string, unknown> => !!x && typeof x === "object" && !Array.isArray(x)
const str = (x: unknown, max = 200): x is string => typeof x === "string" && x.length > 0 && x.length <= max

function checkGrammar(it: Record<string, unknown>): string | null {
  if (!str(it.id, 80) || !str(it.prompt, 600)) return "thiếu id hoặc đề"
  if (!Array.isArray(it.choices) || it.choices.length !== 4 || !it.choices.every((c) => str(c, 300))) return "cần đúng 4 đáp án chữ"
  if (!Number.isInteger(it.correctIndex) || (it.correctIndex as number) < 0 || (it.correctIndex as number) > 3) return "correctIndex không hợp lệ"
  if (!Array.isArray(it.choiceExplanations) || it.choiceExplanations.length !== 4) return "cần 4 giải thích riêng"
  if (new Set((it.choices as string[]).map((c) => c.trim().toLowerCase())).size !== 4) return "có đáp án trùng nhau"
  return null
}

function checkPassage(it: Record<string, unknown>): string | null {
  if (!str(it.id, 80) || !str(it.title, 200)) return "thiếu id hoặc tiêu đề"
  if (!str(it.text ?? it.transcript, 8000)) return "thiếu nội dung bài"
  if (!Array.isArray(it.questions) || it.questions.length === 0 || it.questions.length > 8) return "số câu hỏi không hợp lệ"
  for (const q of it.questions) {
    if (!isObj(q) || !str(q.prompt, 400) || !Array.isArray(q.choices) || q.choices.length < 2 || q.choices.length > 4 || !Number.isInteger(q.correctIndex) || (q.correctIndex as number) < 0 || (q.correctIndex as number) >= q.choices.length) return "câu hỏi không hợp lệ"
  }
  return null
}

/** Đọc một lô (và tệp giải mù tương ứng nếu có). Trả lỗi bằng tiếng Việt, rõ chỗ sai, nếu tệp không đúng khuôn. */
export function parseBatch(batchJson: unknown, reviewedJson?: unknown): { ok: true; batch: BatchInput; drafts: DraftInput[] } | { ok: false; error: string } {
  if (!isObj(batchJson)) return { ok: false, error: "Tệp không phải một lô do script sinh ra (cần một đối tượng JSON)." }
  const items = batchJson.items
  if (!Array.isArray(items) || items.length === 0) return { ok: false, error: "Lô không có mục nào (thiếu mảng items)." }
  if (items.length > MAX_ITEMS) return { ok: false, error: `Lô quá lớn (${items.length} mục, tối đa ${MAX_ITEMS}).` }
  const bac = Number(batchJson.bac)
  if (!Number.isInteger(bac) || bac < 1 || bac > 6) return { ok: false, error: "Bậc của lô không hợp lệ (cần 1–6)." }
  if (!str(batchJson.model, 80) || !str(batchJson.promptVersion, 80)) return { ok: false, error: "Thiếu model hoặc promptVersion (không phải tệp do script ghi)." }
  const kind: DraftKind = batchJson.kind === "reading" || batchJson.kind === "listening" ? batchJson.kind : "grammar"
  if (kind === "grammar" && !str(batchJson.topic, 80)) return { ok: false, error: "Lô ngữ pháp thiếu mã chuyên đề (topic)." }

  const topic = kind === "grammar" ? (batchJson.topic as string) : `${kind}-b${bac}`
  const metaById = new Map<string, Record<string, unknown>>()
  if (Array.isArray(batchJson.meta)) for (const m of batchJson.meta) if (isObj(m) && typeof m.id === "string") metaById.set(m.id, m)

  const blindById = new Map<string, BlindResult>()
  let blindRuns: number | null = null
  if (reviewedJson !== undefined) {
    if (!isObj(reviewedJson) || !Array.isArray(reviewedJson.reviewed)) return { ok: false, error: "Tệp giải mù không đúng khuôn (cần mảng reviewed)." }
    for (const r of reviewedJson.reviewed) {
      if (!isObj(r) || typeof r.id !== "string" || typeof r.pass !== "boolean") return { ok: false, error: "Một mục trong tệp giải mù thiếu id hoặc pass." }
      blindById.set(r.id, { pass: r.pass, why: Array.isArray(r.why) ? r.why.filter((w): w is string => typeof w === "string").slice(0, 10) : [], runs: r.runs ?? null })
    }
    blindRuns = Number.isInteger(reviewedJson.runs) ? (reviewedJson.runs as number) : null
  }

  const seen = new Set<string>()
  const drafts: DraftInput[] = []
  for (const it of items) {
    if (!isObj(it)) return { ok: false, error: "Một mục trong lô không phải đối tượng." }
    const problem = kind === "grammar" ? checkGrammar(it) : checkPassage(it)
    if (problem) return { ok: false, error: `Mục ${typeof it.id === "string" ? it.id : "(không có id)"}: ${problem}.` }
    const id = it.id as string
    if (seen.has(id)) return { ok: false, error: `Mã mục trùng trong lô: ${id}.` }
    seen.add(id)
    const blind = blindById.get(id) ?? null
    drafts.push({ itemId: id, kind, topic, bac, data: it, meta: metaById.get(id) ?? null, blind, status: blind ? (blind.pass ? "review_passed" : "review_failed") : "generated" })
  }
  const unmatched = [...blindById.keys()].filter((id) => !seen.has(id))
  if (unmatched.length) return { ok: false, error: `Tệp giải mù có mã không có trong lô (nạp nhầm cặp tệp?): ${unmatched.slice(0, 3).join(", ")}.` }

  return {
    ok: true,
    batch: {
      kind,
      topic: kind === "grammar" ? topic : null,
      bac,
      model: batchJson.model as string,
      promptVersion: batchJson.promptVersion as string,
      blindRuns,
      counts: { kept: items.length, rejectedByCode: Array.isArray(batchJson.rejected) ? batchJson.rejected.length : 0, duplicates: Array.isArray(batchJson.duplicates) ? batchJson.duplicates.length : 0 },
      createdAt: typeof batchJson.createdAt === "string" ? batchJson.createdAt : new Date().toISOString(),
    },
    drafts,
  }
}
