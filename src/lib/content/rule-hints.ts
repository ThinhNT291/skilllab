/**
 * Dữ liệu để nhận xét có cấu trúc khi trả lời sai và để "ôn nhanh trước khi làm". Hàm thuần.
 * Gom từ lý thuyết của chuyên đề: mỗi mục (usage) kèm nhãn, giải thích ngắn, một ví dụ và các lỗi thường gặp đã gắn `usageIds`.
 */
import type { Exercise, GrammarTheory, McqExercise } from "./types.ts"

export interface RuleHint {
  id: string
  /** Chuyên đề chứa mục này (để dẫn về đúng trang lý thuyết/luyện riêng, kể cả khi trộn nhiều chuyên đề) */
  topicId: string
  label: string
  /** Giải thích tiếng Việt, đã rút gọn */
  explanationVi: string
  example: { en: string; vi: string } | null
  mistakes: { description: string; wrong: string; correct: string }[]
}
export type RuleHints = Record<string, RuleHint>

function shorten(text: string, max = 260): string {
  if (text.length <= max) return text
  const cut = text.slice(0, max)
  const end = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("; "))
  return (end > 80 ? cut.slice(0, end + 1) : cut.replace(/\s+\S*$/, "")) + (end > 80 ? "" : "…")
}

export function buildRuleHints(theory: GrammarTheory, topicId = ""): RuleHints {
  const out: RuleHints = {}
  for (const u of theory.usages) {
    out[u.id] = {
      id: u.id,
      topicId,
      label: u.label,
      explanationVi: shorten(u.explanationVi),
      example: u.examples[0] ? { en: u.examples[0].en, vi: u.examples[0].vi } : null,
      mistakes: theory.commonMistakes
        .filter((m) => (m.usageIds ?? []).includes(u.id) && m.examples.length > 0)
        .slice(0, 2)
        .map((m) => ({ description: m.description ?? "", wrong: m.examples[0].wrong, correct: m.examples[0].correct })),
    }
  }
  return out
}

/** Các mục lý thuyết xuất hiện trong lượt, theo thứ tự xuất hiện, tối đa `max`. */
export function usagesInRound(round: Exercise[], max = 4): string[] {
  const seen: string[] = []
  for (const e of round) if (e.usageId && !seen.includes(e.usageId)) seen.push(e.usageId)
  return seen.slice(0, max)
}

export interface WarmupItem {
  usageId: string
  /** Câu có chỗ trống (che từ đích) */
  sentence: string
  answer: string
}

const baseId = (id: string) => id.split("~")[0]

/**
 * Ví dụ "che từ đích" để khởi động: lấy câu trắc nghiệm KHÔNG nằm trong lượt sắp làm (để không lộ đáp án),
 * cùng mục lý thuyết với các câu trong lượt, chỉ nhận câu một chỗ trống.
 */
export function pickWarmup(all: Exercise[], round: Exercise[], n = 3): WarmupItem[] {
  const inRound = new Set(round.map((e) => baseId(e.id)))
  const wanted = usagesInRound(round, 6)
  const out: WarmupItem[] = []
  for (const usageId of wanted) {
    const ex = all.find(
      (e): e is McqExercise => e.kind === "mcq" && e.usageId === usageId && !inRound.has(e.id) && (e.prompt.match(/_{2,}/g) ?? []).length === 1 && !e.choices[e.correctIndex].includes(" / ") && !/\n/.test(e.prompt) && e.prompt.length <= 140,
    )
    if (!ex) continue
    out.push({ usageId, sentence: ex.prompt.replace(/\s*\((?:[a-z]+\/)*[a-z]+\)/gi, ""), answer: ex.choices[ex.correctIndex] })
    if (out.length >= n) break
  }
  return out
}

/** Phân tích khi trả lời sai: vì sao sai (theo lựa chọn đã chọn nếu có), quy tắc liên quan, lỗi thường gặp, nên ôn tiếp gì. */
export interface WrongAnalysis {
  why: string
  rule: RuleHint | null
  mistake: RuleHint["mistakes"][number] | null
}

export function analyzeWrong(ex: Exercise, choiceIndex: number | undefined, rules: RuleHints | undefined): WrongAnalysis {
  let why = ex.kind === "mcq" ? "" : ex.explanation
  if (ex.kind === "mcq") {
    const picked = choiceIndex !== undefined ? ex.choiceExplanations?.[choiceIndex] : undefined
    why = picked && choiceIndex !== ex.correctIndex ? picked.replace(/^Sai\s*[—-]\s*/, "") : ex.explanation
  }
  const rule = ex.usageId && rules ? (rules[ex.usageId] ?? null) : null
  return { why, rule, mistake: rule?.mistakes[0] ?? null }
}
