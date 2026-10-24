/**
 * Lịch ôn tập ngắt quãng kiểu SM-2 rút gọn. Hàm thuần, không gọi mạng.
 * Lưu ý: đây là bản làm mới, chưa lấy từ mã SRS cũ (Controller_Srs.gs chưa có trong repo); thông số có thể chỉnh sau.
 */
export type Grade = "again" | "hard" | "good" | "easy"

export interface SchedState {
  intervalDays: number
  ease: number
  reps: number
  lapses: number
}

export interface SchedResult extends SchedState {
  dueAt: Date
  status: "active" | "mastered"
}

const MIN_EASE = 1.3
const MASTERED_AFTER_DAYS = 60
const AGAIN_DELAY_MIN = 10

const DAY_MS = 24 * 60 * 60 * 1000

export function schedule(state: SchedState, grade: Grade, now: Date = new Date()): SchedResult {
  let { intervalDays, ease, reps, lapses } = state

  if (grade === "again") {
    lapses += 1
    reps = 0
    intervalDays = 0
    ease = Math.max(MIN_EASE, ease - 0.2)
    return { intervalDays, ease, reps, lapses, dueAt: new Date(now.getTime() + AGAIN_DELAY_MIN * 60 * 1000), status: "active" }
  }

  if (grade === "hard") {
    ease = Math.max(MIN_EASE, ease - 0.15)
    intervalDays = Math.max(1, Math.round(Math.max(intervalDays, 1) * 1.2))
  } else {
    if (grade === "easy") ease = ease + 0.15
    if (reps === 0) intervalDays = grade === "easy" ? 3 : 1
    else if (reps === 1) intervalDays = grade === "easy" ? 6 : 3
    else intervalDays = Math.max(1, Math.round(intervalDays * ease * (grade === "easy" ? 1.3 : 1)))
  }
  reps += 1
  const status = intervalDays >= MASTERED_AFTER_DAYS ? "mastered" : "active"
  return { intervalDays, ease: Math.round(ease * 100) / 100, reps, lapses, dueAt: new Date(now.getTime() + intervalDays * DAY_MS), status }
}

/** Nhãn khoảng cách ôn lại cho nút chấm (xem trước kết quả). */
export function formatInterval(state: SchedState, grade: Grade): string {
  const r = schedule(state, grade)
  if (grade === "again") return `${AGAIN_DELAY_MIN} phút`
  const d = r.intervalDays
  if (d < 30) return d === 1 ? "1 ngày" : `${d} ngày`
  if (d < 365) return `${Math.round(d / 30)} tháng`
  return `${Math.round(d / 365)} năm`
}
