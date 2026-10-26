/**
 * Trạng thái các nấc của Lộ trình từ kết quả từng bài (docs/lo-trinh-va-xep-bac.md mục 4.2–4.3). Hàm thuần.
 *
 * - Nấc **xong** khi mọi bài đạt `PASS_RATIO`.
 * - Nấc **hiện tại** (frontier) = nấc đầu tiên chưa xong; "Học tiếp" luôn trỏ vào đây.
 * - **Thử sức**: học sinh làm được nấc cao hơn, tối đa `MAX_AHEAD` nấc phía trên nấc cao nhất đang mở; làm hết bài thì nấc đó xong,
 *   còn các nấc cũ KHÔNG tự mở: nấc chưa xong nằm dưới một nấc đã xong được đánh dấu "bỏ qua" (không bắt buộc, quay lại làm được).
 * - Thử sức không đổi bậc: chuyện nhảy bậc nằm ở `jump.ts`, không ở đây.
 */
import { PASS_RATIO, type PathLesson, type PathStep } from "./catalog.ts"

export const MAX_AHEAD = 2

export interface LessonResult {
  /** Tỷ lệ đúng cao nhất trong các lần làm (0–1) */
  bestRatio: number
}
export type ResultMap = ReadonlyMap<string, LessonResult>

export const lessonPassed = (r: LessonResult | undefined): boolean => !!r && r.bestRatio >= PASS_RATIO

export type StepStatus = "done" | "current" | "trial" | "locked"

export interface StepState {
  step: PathStep
  status: StepStatus
  passed: number
  total: number
  /** Chưa xong nhưng nằm dưới một nấc đã xong (bị bỏ qua khi thử sức) */
  skipped: boolean
  /** Xong khi còn nấc cũ chưa xong, tức là mở bằng thử sức */
  viaTrial: boolean
}

export interface PathState {
  steps: StepState[]
  /** Chỉ số nấc hiện tại; bằng số nấc nếu đã xong cả lộ trình */
  frontier: number
  /** Nấc cao nhất đã xong (có bài), -1 nếu chưa có */
  highestDone: number
  complete: boolean
}

export function computePath(path: PathStep[], results: ResultMap, maxAhead = MAX_AHEAD): PathState {
  const counts = path.map((s) => ({ total: s.lessons.length, passed: s.lessons.filter((l) => lessonPassed(results.get(l.id))).length }))
  // Nấc không có bài nào (nội dung chưa có) tính là đã qua để không chặn đường, nhưng không làm "nấc cao nhất đã xong".
  const done = counts.map((c) => c.passed === c.total)
  const frontier = done.indexOf(false) === -1 ? path.length : done.indexOf(false)
  let highestDone = -1
  path.forEach((s, i) => {
    if (done[i] && s.lessons.length > 0) highestDone = i
  })
  const highestOpen = Math.max(frontier, highestDone)
  const steps = path.map<StepState>((step, i) => {
    const status: StepStatus = done[i] ? "done" : i === frontier ? "current" : i <= highestOpen + maxAhead ? "trial" : "locked"
    return {
      step,
      status,
      passed: counts[i].passed,
      total: counts[i].total,
      skipped: !done[i] && i < highestDone,
      viaTrial: done[i] && step.lessons.length > 0 && i > frontier,
    }
  })
  return { steps, frontier, highestDone, complete: frontier === path.length }
}

/** Bài kế tiếp để "Học tiếp": bài đầu tiên chưa đạt của nấc hiện tại. */
export function nextLesson(state: PathState, results: ResultMap): PathLesson | null {
  const cur = state.steps[state.frontier]
  return cur?.step.lessons.find((l) => !lessonPassed(results.get(l.id))) ?? null
}

/** Học sinh có được làm bài thuộc nấc này không (nấc khóa thì không). */
export function canOpenStep(state: PathState, stepIndex: number): boolean {
  const s = state.steps[stepIndex]
  return !!s && s.status !== "locked"
}

/** Số nấc bị bỏ qua (gợi ý nhẹ "nên quay lại ôn"). */
export const skippedSteps = (state: PathState): StepState[] => state.steps.filter((s) => s.skipped)
