/**
 * Phòng thử thách (docs/lo-trinh-va-xep-bac.md mục 2): bài chẩn đoán tính giờ, không đáp án giữa chừng, không gợi ý.
 * Chỉ ĐỀ XUẤT: một bài tốt chưa đổi gì, cần bài thứ hai (khác ngày) cũng tốt thì mới nâng điểm bắt đầu Lộ trình lên bậc kế.
 * Một bài tệ KHÔNG bao giờ hạ bậc, chỉ gợi ý ôn (vì hồi hộp có thể làm kết quả thấp hơn bình thường). Hàm thuần.
 */
import type { LessonKind } from "./catalog.ts"

/** Giới hạn thời gian cho 20 câu (kể cả nghe và đọc): khoảng 45 giây mỗi câu. Giá trị khởi điểm. */
export const CHALLENGE_SECONDS = 15 * 60
/** Số lần được nghe một bài nghe trong Phòng thử thách. */
export const CHALLENGE_LISTEN_PLAYS = 2
/** Đề xuất nâng: đúng từ ngần này tổng thể, và không kỹ năng nào dưới `SKILL_FLOOR`. */
export const UP_RATIO = 0.85
export const SKILL_FLOOR = 0.5
/** Dưới ngần này thì gợi ý ôn lại (không hạ bậc). */
export const REVIEW_RATIO = 0.5
/** Một kỹ năng chỉ được xét sàn khi có ít nhất ngần này câu. */
const MIN_FOR_FLOOR = 3

export interface ChallengeAnswer {
  skill: LessonKind
  correct: boolean
}

export interface SkillResult {
  skill: LessonKind
  correct: number
  total: number
}

export function skillBreakdown(answers: ChallengeAnswer[]): SkillResult[] {
  const out = new Map<LessonKind, SkillResult>()
  for (const a of answers) {
    const r = out.get(a.skill) ?? { skill: a.skill, correct: 0, total: 0 }
    r.total++
    if (a.correct) r.correct++
    out.set(a.skill, r)
  }
  return [...out.values()]
}

export type Verdict = "up" | "stay" | "review"

/** Kết luận của MỘT bài: nâng (đúng nhiều và đều các kỹ năng), giữ nguyên, hoặc nên ôn. Không có "hạ". */
export function verdictOf(answers: ChallengeAnswer[]): { verdict: Verdict; ratio: number; weak: LessonKind[] } {
  const total = answers.length
  const ratio = total ? answers.filter((a) => a.correct).length / total : 0
  const per = skillBreakdown(answers)
  const weak = per.filter((s) => s.total >= MIN_FOR_FLOOR && s.correct / s.total < SKILL_FLOOR).map((s) => s.skill)
  if (total > 0 && ratio >= UP_RATIO && weak.length === 0) return { verdict: "up", ratio, weak }
  if (ratio < REVIEW_RATIO) return { verdict: "review", ratio, weak }
  return { verdict: "stay", ratio, weak }
}

export interface AttemptLite {
  bac: number
  verdict: Verdict
  /** Ngày giờ Việt Nam (YYYY-MM-DD) */
  day: string
  /** ISO, để sắp thứ tự */
  at: string
}

export type Proposal =
  | { kind: "none" }
  /** Một bài tốt rồi, cần thêm một bài khác ngày để xác nhận */
  | { kind: "pending"; bac: number }
  /** Hai bài tốt liên tiếp ở hai ngày khác nhau: nâng điểm bắt đầu lên bậc kế */
  | { kind: "confirmed"; bac: number }

/**
 * Đề xuất nâng cho bậc `bac` từ các lần thử của bậc đó (cũ → mới hoặc ngược lại đều được).
 * Xác nhận khi HAI lần gần nhất ở bậc này đều "up" và rơi vào hai ngày khác nhau; lần gần nhất không "up" thì hủy đề xuất.
 * Bậc 6 là bậc cuối: không có bậc kế để nâng.
 */
export function proposalFor(bac: number, attempts: AttemptLite[]): Proposal {
  if (bac >= 6) return { kind: "none" }
  const mine = attempts.filter((a) => a.bac === bac).sort((a, b) => (a.at < b.at ? 1 : -1))
  if (!mine.length || mine[0].verdict !== "up") return { kind: "none" }
  const second = mine[1]
  if (second && second.verdict === "up" && second.day !== mine[0].day) return { kind: "confirmed", bac }
  return { kind: "pending", bac }
}
