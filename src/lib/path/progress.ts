/**
 * Trạng thái các nấc của Lộ trình từ kết quả từng bài (docs/lo-trinh-va-xep-bac.md mục 4.2–4.3). Hàm thuần.
 *
 * - Nấc **xong** khi mọi bài đạt ngưỡng của bậc đó (`passRatioFor`).
 * - **Điểm bắt đầu** (`startIndex`): từ bài xếp trình độ hoặc bài vượt cấp. Nấc nằm dưới điểm bắt đầu không bắt buộc ("ôn lại"), chỉ để quay lại.
 * - Nấc **hiện tại** (frontier) = nấc đầu tiên chưa xong từ điểm bắt đầu trở lên; "Học tiếp" luôn trỏ vào đây.
 * - **Thử sức**: làm được nấc cao hơn, tối đa `MAX_AHEAD` nấc phía trên nấc cao nhất đang mở; làm hết bài thì nấc đó xong,
 *   còn các nấc cũ KHÔNG tự mở: nấc chưa xong nằm dưới một nấc đã xong được đánh dấu "bỏ qua".
 * - **Cổng bậc** (`bacCleared`): qua hết các chặng của một bậc chưa đủ để sang bậc kế, còn phải đủ điều kiện nhảy bậc (`jump.ts`).
 *   Chưa đủ thì chặng đầu của bậc kế ở trạng thái "gated" và các nấc sau khóa. Thử sức không vượt qua được cổng.
 * - Thử sức không đổi bậc: chuyện nhảy bậc nằm ở `jump.ts`, không ở đây.
 */
import { type PathLesson, type PathStep } from "./catalog.ts"
import { passRatioFor } from "./rules.ts"

export const MAX_AHEAD = 2

export interface LessonResult {
  /** Tỷ lệ đúng cao nhất trong các lần làm (0–1) */
  bestRatio: number
}
export type ResultMap = ReadonlyMap<string, LessonResult>

/** Bài đã đạt ngưỡng của bậc `bac`. */
export const lessonPassed = (r: LessonResult | undefined, bac: number): boolean => !!r && r.bestRatio >= passRatioFor(bac)

export type StepStatus = "done" | "current" | "trial" | "locked" | "review" | "gated"

export interface StepState {
  step: PathStep
  status: StepStatus
  passed: number
  total: number
  /** Chưa xong nhưng nằm dưới một nấc đã xong (bị bỏ qua khi thử sức) */
  skipped: boolean
  /** Xong khi còn nấc cũ (từ điểm bắt đầu) chưa xong, tức là mở bằng thử sức */
  viaTrial: boolean
}

export interface PathState {
  steps: StepState[]
  /** Chỉ số nấc hiện tại; bằng số nấc nếu đã xong cả lộ trình */
  frontier: number
  /** Nấc cao nhất đã xong (có bài), -1 nếu chưa có */
  highestDone: number
  complete: boolean
  /** Bậc đã làm hết chặng nhưng chưa qua cổng nhảy bậc (null nếu không có) */
  gatedBac: number | null
}

export interface PathOptions {
  maxAhead?: number
  /** Nấc bắt đầu (từ xếp trình độ / vượt cấp); mặc định 0 */
  startIndex?: number
  /** Bậc `bac` đã qua cổng nhảy bậc chưa. Mặc định: qua hết (không có cổng). */
  bacCleared?: (bac: number) => boolean
}

export function computePath(path: PathStep[], results: ResultMap, opts: PathOptions = {}): PathState {
  const maxAhead = opts.maxAhead ?? MAX_AHEAD
  const start = Math.max(0, Math.min(opts.startIndex ?? 0, path.length))
  const counts = path.map((s) => ({ total: s.lessons.length, passed: s.lessons.filter((l) => lessonPassed(results.get(l.id), l.bac)).length }))
  // Nấc không có bài nào (nội dung chưa có) tính là đã qua để không chặn đường, nhưng không làm "nấc cao nhất đã xong".
  const done = counts.map((c) => c.passed === c.total)
  let frontier = path.length
  for (let i = start; i < path.length; i++) {
    if (!done[i]) {
      frontier = i
      break
    }
  }
  let highestDone = -1
  path.forEach((s, i) => {
    if (i >= start && done[i] && s.lessons.length > 0) highestDone = i
  })

  // Cổng: bậc nhỏ nhất (từ bậc điểm bắt đầu trở lên) chưa qua cổng thì mọi nấc của bậc lớn hơn bị chặn.
  const cleared = opts.bacCleared ?? (() => true)
  const startBac = path[start]?.bac ?? 1
  const bacs = [...new Set(path.map((s) => s.bac))].sort((a, b) => a - b)
  const blockBac = bacs.find((b) => b >= startBac && !cleared(b)) ?? null
  const blocked = (i: number) => blockBac !== null && path[i].bac > blockBac
  // Chỉ coi là "chờ cổng" khi các chặng của bậc đó đã xong hết (nấc hiện tại đã sang bậc kế).
  const gatedBac = blockBac !== null && frontier < path.length && blocked(frontier) ? blockBac : null

  const highestOpen = Math.max(frontier, highestDone)
  const steps = path.map<StepState>((step, i) => {
    let status: StepStatus
    if (i < start) status = done[i] ? "done" : "review"
    else if (done[i]) status = "done"
    else if (blocked(i)) status = i === frontier ? "gated" : "locked"
    else if (i === frontier) status = "current"
    else status = i <= highestOpen + maxAhead ? "trial" : "locked"
    return {
      step,
      status,
      passed: counts[i].passed,
      total: counts[i].total,
      skipped: i >= start && !done[i] && i < highestDone,
      viaTrial: i >= start && done[i] && step.lessons.length > 0 && i > frontier,
    }
  })
  return { steps, frontier, highestDone, complete: frontier === path.length, gatedBac }
}

/** Bài kế tiếp để "Học tiếp": bài đầu tiên chưa đạt của nấc hiện tại (không có khi đang chờ cổng bậc). */
export function nextLesson(state: PathState, results: ResultMap): PathLesson | null {
  const cur = state.steps[state.frontier]
  if (!cur || cur.status === "gated") return null
  return cur.step.lessons.find((l) => !lessonPassed(results.get(l.id), l.bac)) ?? null
}

/** Học sinh có được làm bài thuộc nấc này không (nấc khóa hoặc chờ cổng thì không). */
export function canOpenStep(state: PathState, stepIndex: number): boolean {
  const s = state.steps[stepIndex]
  return !!s && s.status !== "locked" && s.status !== "gated"
}

/** Số nấc bị bỏ qua (gợi ý nhẹ "nên quay lại ôn"). */
export const skippedSteps = (state: PathState): StepState[] => state.steps.filter((s) => s.skipped)
