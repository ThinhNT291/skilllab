/**
 * Bài xếp trình độ tổng hợp (36 câu: 12 ngữ pháp, 12 từ vựng, 6 đọc, 6 nghe). Hàm thuần, không đụng DB hay giao diện.
 * Thích ứng giữa các khối: mỗi khối chọn câu/bài quanh mức ước lượng hiện tại của kỹ năng đó (MAP, `estimateThetaMAP`); trong khối câu lẻ,
 * trình chạy bài tập tự lên xuống độ khó theo từng câu. Kết quả mỗi kỹ năng lấy bậc dưới khi chưa rõ (`levelFromRows`).
 * Thiết kế và con số: docs/lo-trinh-va-xep-bac.md, docs/phan-quyen.md (lưu dở), CLAUDE.md quyết định 8. Chỉ là ước lượng tham khảo của máy.
 */
import { bacFromRating, estimateThetaMAP, itemRating, startPositionFor, START_RATING } from "../progress/ability.ts"
import { levelFromRows, type Level } from "../progress/level.ts"
import { levelLabel } from "../content/bac.ts"

export type PlacementSkill = "grammar" | "vocab" | "reading" | "listening"
export const PLACEMENT_SKILLS: PlacementSkill[] = ["grammar", "vocab", "reading", "listening"]

export type Block = { skill: "grammar" | "vocab"; kind: "items"; n: number } | { skill: "reading" | "listening"; kind: "passage"; n: number }

/** Thứ tự khối: xen kẽ kỹ năng để đỡ mệt, mỗi kỹ năng chia hai nửa để nửa sau chọn theo kết quả nửa đầu. */
export const PLAN: readonly Block[] = [
  { skill: "grammar", kind: "items", n: 6 },
  { skill: "vocab", kind: "items", n: 6 },
  { skill: "reading", kind: "passage", n: 3 },
  { skill: "listening", kind: "passage", n: 3 },
  { skill: "grammar", kind: "items", n: 6 },
  { skill: "vocab", kind: "items", n: 6 },
  { skill: "reading", kind: "passage", n: 3 },
  { skill: "listening", kind: "passage", n: 3 },
]
export const TOTAL_ITEMS = PLAN.reduce((n, b) => n + b.n, 0)

/** Giãn cách tối thiểu giữa hai lần làm xong (ngày). Giá trị khởi điểm, xem lại khi có dữ liệu thật. */
export const RETAKE_GAP_DAYS = 14

export interface PlacementAnswerRec {
  id: string
  skill: PlacementSkill
  /** Độ khó của câu, cùng thang với `itemRating` */
  rating: number
  correct: boolean
}

export interface SessionState {
  v: 1
  /** Chỉ số khối đang làm (= PLAN.length khi đã xong) */
  block: number
  answers: PlacementAnswerRec[]
  /** Mã câu/bài đã dùng trong lần này */
  used: string[]
}

export const initialState = (): SessionState => ({ v: 1, block: 0, answers: [], used: [] })

export const isDone = (s: SessionState): boolean => s.block >= PLAN.length

/** Số câu đã trả lời trong khối đang làm (để tiếp tục khối dở dang). */
export function answeredInBlock(s: SessionState): number {
  let before = 0
  for (let i = 0; i < s.block && i < PLAN.length; i++) before += PLAN[i].n
  return Math.max(0, Math.min(s.answers.length - before, PLAN[s.block]?.n ?? 0))
}

/** Làm sạch trạng thái đọc từ DB (nơi không tin được). Trả null nếu hỏng. */
export function parseState(raw: unknown): SessionState | null {
  if (!raw || typeof raw !== "object") return null
  const r = raw as Partial<SessionState>
  if (r.v !== 1 || typeof r.block !== "number" || !Array.isArray(r.answers) || !Array.isArray(r.used)) return null
  const answers = r.answers.filter(
    (a): a is PlacementAnswerRec => !!a && typeof a.id === "string" && PLACEMENT_SKILLS.includes(a.skill) && typeof a.rating === "number" && Number.isFinite(a.rating) && typeof a.correct === "boolean",
  )
  return { v: 1, block: Math.max(0, Math.min(PLAN.length, Math.floor(r.block))), answers: answers.slice(0, TOTAL_ITEMS + 10), used: r.used.filter((x): x is string => typeof x === "string").slice(0, 200) }
}

const rowsOf = (s: SessionState, skill: PlacementSkill) => s.answers.filter((a) => a.skill === skill).map((a) => ({ rating: a.rating, correct: a.correct }))

/**
 * Mức ước lượng hiện tại của một kỹ năng. Chưa có câu nào của kỹ năng đó thì lấy trung bình ước lượng của các kỹ năng đã làm
 * (người giỏi ngữ pháp thường không bắt đầu đọc ở Bậc 2), chưa có gì thì mức khởi điểm.
 */
export function thetaFor(s: SessionState, skill: PlacementSkill): number {
  const own = rowsOf(s, skill)
  if (own.length > 0) return estimateThetaMAP(own)
  const others = PLACEMENT_SKILLS.filter((k) => k !== skill && rowsOf(s, k).length > 0).map((k) => estimateThetaMAP(rowsOf(s, k)))
  return others.length ? others.reduce((a, b) => a + b, 0) / others.length : START_RATING
}

export interface PoolItem {
  id: string
  /** Độ khó, cùng thang với `itemRating` */
  rating: number
}

/**
 * Thang câu cho một khối câu lẻ, xếp dễ → khó, và vị trí bắt đầu (0–1) quanh mức ước lượng.
 * Chỉ lấy câu chưa dùng và chưa gặp ở lần làm trước, TRỪ câu từng sai (được phép gặp lại). Hết câu mới thì mới lấy cả câu đã gặp.
 */
export function ladderFor(pool: PoolItem[], s: SessionState, skill: PlacementSkill, seen: ReadonlySet<string>, wrongBefore: ReadonlySet<string>, n: number): { ladder: PoolItem[]; start: number } {
  const used = new Set(s.used)
  const fresh = pool.filter((p) => !used.has(p.id) && (!seen.has(p.id) || wrongBefore.has(p.id)))
  const candidates = fresh.length >= n * 2 ? fresh : pool.filter((p) => !used.has(p.id))
  const ladder = [...candidates].sort((a, b) => a.rating - b.rating || (a.id < b.id ? -1 : 1))
  return { ladder, start: startPositionFor(ladder.map((p) => p.rating), thetaFor(s, skill)) }
}

export interface PoolPassage {
  id: string
  bac: number
}

/**
 * Chọn bài đọc/nghe cho khối bài: bậc gần mức ước lượng nhất, bằng nhau thì lấy bậc thấp hơn; ưu tiên bài chưa gặp.
 * `rng` để kiểm tra; mặc định ngẫu nhiên giữa các bài ngang nhau.
 */
export function pickPassageId(pool: PoolPassage[], s: SessionState, skill: "reading" | "listening", seen: ReadonlySet<string>, wrongBefore: ReadonlySet<string>, rng: () => number = Math.random): string | null {
  const used = new Set(s.used)
  const free = pool.filter((p) => !used.has(p.id))
  const fresh = free.filter((p) => !seen.has(p.id) || wrongBefore.has(p.id))
  const candidates = fresh.length > 0 ? fresh : free
  if (candidates.length === 0) return null
  const target = Math.min(6, Math.max(1, Math.round(bacFromRating(thetaFor(s, skill)))))
  const dist = (p: PoolPassage) => Math.abs(p.bac - target)
  const best = Math.min(...candidates.map(dist))
  const nearest = candidates.filter((p) => dist(p) === best)
  const lowest = Math.min(...nearest.map((p) => p.bac))
  const tied = nearest.filter((p) => p.bac === lowest)
  return tied[Math.floor(rng() * tied.length)].id
}

/** Các dòng đáp án của một bài đọc/nghe vừa xong, đặt theo số câu đúng/tổng (chỉ cần số đếm để ước lượng). */
export function passageAnswers(passageId: string, skill: "reading" | "listening", bac: number, correct: number, total: number): PlacementAnswerRec[] {
  return Array.from({ length: total }, (_, i) => ({ id: `${passageId}#${i + 1}`, skill, rating: itemRating(bac, 2), correct: i < correct }))
}

export interface PlacementResult {
  skills: Record<PlacementSkill, Level>
  /** Bậc tổng: trung vị bậc bốn kỹ năng (số chẵn thì trung bình hai kỹ năng ở giữa, làm tròn xuống) */
  overall: { bac: number; label: string }
  /** Từng câu/bài đã làm, để lần sau biết câu nào từng sai */
  items: { id: string; skill: PlacementSkill; correct: boolean }[]
}

export function scoreSession(s: SessionState): PlacementResult {
  const skills = Object.fromEntries(PLACEMENT_SKILLS.map((k) => [k, levelFromRows(rowsOf(s, k))])) as Record<PlacementSkill, Level>
  const bacs = PLACEMENT_SKILLS.map((k) => skills[k].bac).sort((a, b) => a - b)
  const overallBac = Math.floor((bacs[1] + bacs[2]) / 2)
  return { skills, overall: { bac: overallBac, label: levelLabel(overallBac) }, items: s.answers.map((a) => ({ id: a.id, skill: a.skill, correct: a.correct })) }
}

/** Mã đã gặp và mã từng sai trong các lần làm xong trước (từ `items` của kết quả). Mã bài đọc/nghe gộp từ "bài#k" về mã bài. */
export function seenFromResults(results: { items?: { id: string; correct: boolean }[] }[]): { seen: Set<string>; wrong: Set<string> } {
  const seen = new Set<string>()
  const wrong = new Set<string>()
  for (const r of results) {
    for (const it of r.items ?? []) {
      const id = it.id.split("#")[0]
      seen.add(id)
      if (!it.correct) wrong.add(id)
    }
  }
  return { seen, wrong }
}

/** Còn bao lâu nữa mới được làm lại (tính từ lúc làm xong gần nhất). */
export function retakeStatus(lastCompletedAt: string | null, now: Date = new Date()): { allowed: boolean; nextAt: string | null; daysLeft: number } {
  if (!lastCompletedAt) return { allowed: true, nextAt: null, daysLeft: 0 }
  const next = new Date(new Date(lastCompletedAt).getTime() + RETAKE_GAP_DAYS * 86_400_000)
  const left = next.getTime() - now.getTime()
  return left <= 0 ? { allowed: true, nextAt: null, daysLeft: 0 } : { allowed: false, nextAt: next.toISOString(), daysLeft: Math.ceil(left / 86_400_000) }
}
