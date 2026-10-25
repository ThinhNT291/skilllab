/**
 * FSRS (Free Spaced Repetition Scheduler) qua thư viện mã nguồn mở `ts-fsrs` (MIT; FSRS-6, 21 tham số mặc định).
 * Gói mỏng để phần còn lại của ứng dụng không phụ thuộc vào chi tiết thư viện. Hàm thuần (nhận thời gian vào).
 *
 * Quy ước dự án: tắt các bước học ngắn trong ngày (enable_short_term = false) vì học sinh ôn theo ngày, nên mọi lần ôn
 * (kể cả "Lại") đều hẹn theo ngày; trong lượt ôn, thẻ "Lại" vẫn được xếp lại cuối hàng để thử lần nữa ngay.
 * Tắt "fuzz" khi cần kết quả xác định (kiểm thử); bật khi chạy thật để các thẻ không dồn cùng ngày.
 */
import { createEmptyCard, fsrs, generatorParameters, Rating, State, type Card } from "ts-fsrs"
import type { Grade, SchedState } from "./scheduler.ts"

export const RETENTION_CHOICES = [0.85, 0.9, 0.95] as const
export const DEFAULT_RETENTION = 0.9
const DAY_MS = 86_400_000

export type FsrsCardState = 0 | 1 | 2 | 3

/** Trạng thái FSRS của một thẻ, đủ để tính lần ôn kế tiếp. */
export interface FsrsState {
  stability: number
  difficulty: number
  state: FsrsCardState
  reps: number
  lapses: number
  /** Thời điểm ôn gần nhất; null nếu chưa ôn lần nào */
  lastReview: Date | null
}

const RATING: Record<Grade, Rating.Again | Rating.Hard | Rating.Good | Rating.Easy> = { again: Rating.Again, hard: Rating.Hard, good: Rating.Good, easy: Rating.Easy }

function scheduler(retention: number, fuzz: boolean) {
  return fsrs(generatorParameters({ request_retention: retention, enable_short_term: false, enable_fuzz: fuzz }))
}

function toCard(s: FsrsState | null, due: Date): Card {
  if (!s || s.state === 0) return createEmptyCard(due)
  return {
    due,
    stability: s.stability,
    difficulty: s.difficulty,
    elapsed_days: s.lastReview ? Math.max(0, Math.floor((due.getTime() - s.lastReview.getTime()) / DAY_MS)) : 0,
    scheduled_days: 0,
    reps: s.reps,
    lapses: s.lapses,
    learning_steps: 0,
    state: s.state as State,
    last_review: s.lastReview ?? undefined,
  }
}

/** Dựng trạng thái FSRS cho thẻ cũ chỉ có dữ liệu SM-2: độ bền ≈ khoảng cách hiện tại, độ khó suy từ hệ số dễ. */
export function fsrsFromSm2(sm: SchedState, lastReview: Date | null, now: Date): FsrsState {
  if (sm.reps === 0 && sm.lapses === 0) return { stability: 0, difficulty: 0, state: 0, reps: 0, lapses: 0, lastReview: null }
  const ease = Math.min(3.0, Math.max(1.3, sm.ease))
  const difficulty = 10 - ((ease - 1.3) / (3.0 - 1.3)) * 9
  return {
    stability: Math.max(0.5, sm.intervalDays),
    difficulty: Math.round(difficulty * 100) / 100,
    state: 2,
    reps: Math.max(1, sm.reps),
    lapses: sm.lapses,
    lastReview: lastReview ?? new Date(now.getTime() - Math.max(1, sm.intervalDays) * DAY_MS),
  }
}

export interface FsrsResult {
  next: FsrsState
  dueAt: Date
  /** Số ngày đến lần ôn kế tiếp */
  scheduledDays: number
}

export function scheduleFsrs(s: FsrsState | null, grade: Grade, now: Date, retention = DEFAULT_RETENTION, fuzz = true): FsrsResult {
  const rec = scheduler(retention, fuzz).repeat(toCard(s, now), now)[RATING[grade]]
  const c = rec.card
  return {
    next: { stability: c.stability, difficulty: c.difficulty, state: c.state as FsrsCardState, reps: c.reps, lapses: c.lapses, lastReview: now },
    dueAt: c.due,
    scheduledDays: Math.max(0, Math.round((c.due.getTime() - now.getTime()) / DAY_MS)),
  }
}

/** Xác suất nhớ (0–1) ngay lúc `now`; null với thẻ chưa ôn lần nào. */
export function retrievabilityNow(s: FsrsState | null, now: Date, retention = DEFAULT_RETENTION): number | null {
  if (!s || s.state === 0 || !s.lastReview) return null
  return scheduler(retention, false).get_retrievability(toCard(s, now), now, false)
}

/** Khoảng cách (ngày) cho cả bốn nút để hiện xem trước. */
export function previewFsrs(s: FsrsState | null, now: Date, retention = DEFAULT_RETENTION): Record<Grade, number> {
  const rec = scheduler(retention, false).repeat(toCard(s, now), now)
  const days = (g: Grade) => Math.max(0, Math.round((rec[RATING[g]].card.due.getTime() - now.getTime()) / DAY_MS))
  return { again: days("again"), hard: days("hard"), good: days("good"), easy: days("easy") }
}
