/**
 * Hồ sơ năng lực gộp 6 kỹ năng và gợi ý "hôm nay học gì". Hàm thuần.
 * Ngữ pháp/từ vựng/đọc/nghe lấy từ tỷ lệ đúng gần đây; Viết/Nói lấy từ điểm bài chấm (thang 10).
 * Chỉ là gợi ý tham khảo, không quy đổi thành xếp loại hay bậc CEFR.
 */
import type { AttemptRow } from "@/lib/analytics/attempts"
import type { AnswerLite } from "./mastery"

export type SkillId = "grammar" | "vocab" | "reading" | "listening" | "writing" | "speaking"

export const SKILL_INFO: Record<SkillId, { label: string; href: string }> = {
  grammar: { label: "Ngữ pháp", href: "/hoc" },
  vocab: { label: "Từ vựng", href: "/tu-vung" },
  listening: { label: "Nghe", href: "/nghe" },
  reading: { label: "Đọc", href: "/doc" },
  writing: { label: "Viết", href: "/viet" },
  speaking: { label: "Nói", href: "/noi" },
}
export const SKILL_ORDER: SkillId[] = ["grammar", "vocab", "listening", "reading", "writing", "speaking"]

/** Số lượt gần nhất dùng để tính tỷ lệ đúng; cần tối thiểu `MIN_SAMPLE` mới coi là đủ dữ liệu. */
export const WINDOW = 50
export const MIN_SAMPLE = 10
/** Số ngày không luyện thì kỹ năng bị coi là "bỏ quên". */
export const NEGLECT_DAYS = 4

export function skillOfTopic(topicId: string): SkillId {
  if (topicId.startsWith("vocab-") || topicId.startsWith("colloc-")) return "vocab"
  if (topicId.startsWith("reading-b")) return "reading"
  if (topicId.startsWith("listening-b")) return "listening"
  return "grammar"
}

export interface SkillProfile {
  skill: SkillId
  /** 0–1; null nếu chưa đủ dữ liệu */
  score: number | null
  samples: number
  /** ISO của lần luyện gần nhất; null nếu chưa luyện */
  lastAt: string | null
}

export function buildProfile(rows: AnswerLite[], attempts: Pick<AttemptRow, "skill" | "total" | "created_at">[]): SkillProfile[] {
  return SKILL_ORDER.map((skill) => {
    if (skill === "writing" || skill === "speaking") {
      const mine = attempts.filter((a) => a.skill === skill).sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
      const recent = mine.slice(0, 3)
      const score = recent.length ? recent.reduce((s, a) => s + Number(a.total), 0) / recent.length / 10 : null
      return { skill, score, samples: mine.length, lastAt: mine[0]?.created_at ?? null }
    }
    const mine = rows.filter((r) => skillOfTopic(r.topic) === skill).sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    const recent = mine.slice(0, WINDOW)
    const enough = recent.length >= MIN_SAMPLE
    return { skill, score: enough ? recent.filter((r) => r.correct).length / recent.length : null, samples: mine.length, lastAt: mine[0]?.created_at ?? null }
  })
}

export interface Suggestion {
  key: string
  href: string
  title: string
  reason: string
}

function daysSince(iso: string | null, now: Date): number {
  if (!iso) return Infinity
  return Math.floor((now.getTime() - new Date(iso).getTime()) / 86_400_000)
}

/** Tối đa `max` gợi ý, theo thứ tự ưu tiên: thẻ đến hạn → kỹ năng yếu nhất → kỹ năng bị bỏ quên → bắt đầu kỹ năng mới. */
export function suggestToday(profile: SkillProfile[], dueCards: number, now: Date = new Date(), max = 3): Suggestion[] {
  const out: Suggestion[] = []
  const used = new Set<SkillId>()
  if (dueCards > 0) out.push({ key: "srs", href: "/on-tap", title: "Ôn thẻ đến hạn", reason: `${dueCards} thẻ cần ôn hôm nay, ôn đúng lúc nhớ lâu hơn` })

  const weak = profile.filter((p) => p.score !== null).sort((a, b) => a.score! - b.score!)[0]
  if (weak && weak.score! < 0.8) {
    used.add(weak.skill)
    out.push({ key: `weak-${weak.skill}`, href: SKILL_INFO[weak.skill].href, title: `Luyện ${SKILL_INFO[weak.skill].label}`, reason: `Đây là kỹ năng đang yếu nhất của bạn (${Math.round(weak.score! * 100)}%)` })
  }

  const neglected = profile
    .filter((p) => p.samples > 0 && !used.has(p.skill) && daysSince(p.lastAt, now) >= NEGLECT_DAYS)
    .sort((a, b) => daysSince(b.lastAt, now) - daysSince(a.lastAt, now))[0]
  if (neglected) {
    used.add(neglected.skill)
    out.push({ key: `neglect-${neglected.skill}`, href: SKILL_INFO[neglected.skill].href, title: `Quay lại ${SKILL_INFO[neglected.skill].label}`, reason: `Đã ${daysSince(neglected.lastAt, now)} ngày chưa luyện kỹ năng này` })
  }

  const fresh = profile.find((p) => p.samples === 0 && !used.has(p.skill))
  if (fresh) out.push({ key: `new-${fresh.skill}`, href: SKILL_INFO[fresh.skill].href, title: `Thử ${SKILL_INFO[fresh.skill].label}`, reason: "Bạn chưa thử kỹ năng này" })

  if (out.length === 0) out.push({ key: "go", href: "/hoc", title: "Học tiếp ngữ pháp", reason: "Tiếp tục chuyên đề đang học" })
  return out.slice(0, max)
}
