/**
 * Ăn mừng khi tiến độ Lộ trình vừa thay đổi kể từ lần xem trước (chặng vừa xong, cổng vừa mở, linh vật sang chặng mới). Hàm thuần:
 * so ảnh chụp trạng thái lần trước (lưu ở trình duyệt) với trạng thái hiện tại. Lần đầu xem (chưa có ảnh chụp) thì không ăn mừng gì,
 * để người mới hoặc người đổi máy không bị "pháo giấy" cho thứ đã làm từ lâu.
 */
import type { PathState } from "./progress.ts"

export interface Snapshot {
  /** Mã các chặng đã xong */
  done: string[]
  /** Các bậc đã qua cổng nhảy bậc nhờ đủ điều kiện (không tính bậc nằm dưới điểm bắt đầu) */
  cleared: number[]
  /** Mã chặng hiện tại; null nếu đã hết lộ trình */
  current: string | null
}

export interface CelebrationEvents {
  newlyDone: string[]
  gatesOpened: number[]
  movedTo: string | null
}

export const NO_EVENTS: CelebrationEvents = { newlyDone: [], gatesOpened: [], movedTo: null }
export const hasEvents = (e: CelebrationEvents): boolean => e.newlyDone.length > 0 || e.gatesOpened.length > 0 || e.movedTo !== null

export function snapshotOf(state: PathState, clearedBacs: number[]): Snapshot {
  return {
    done: state.steps.filter((s) => s.status === "done" && s.step.lessons.length > 0).map((s) => s.step.id),
    cleared: [...clearedBacs].sort((a, b) => a - b),
    current: state.steps[state.frontier]?.step.id ?? null,
  }
}

export function diffSnapshot(prev: Snapshot | null, now: Snapshot): CelebrationEvents {
  if (!prev) return NO_EVENTS
  const before = new Set(prev.done)
  const gates = new Set(prev.cleared)
  return {
    newlyDone: now.done.filter((id) => !before.has(id)),
    gatesOpened: now.cleared.filter((b) => !gates.has(b)),
    movedTo: now.current !== null && now.current !== prev.current ? now.current : null,
  }
}

/** Đọc ảnh chụp đã lưu; hỏng hoặc sai khuôn thì coi như chưa có. */
export function parseSnapshot(raw: unknown): Snapshot | null {
  if (!raw || typeof raw !== "object") return null
  const r = raw as Partial<Snapshot>
  if (!Array.isArray(r.done) || !r.done.every((x) => typeof x === "string") || r.done.length > 200) return null
  if (!Array.isArray(r.cleared) || !r.cleared.every((x) => Number.isInteger(x) && x >= 1 && x <= 6)) return null
  if (r.current !== null && typeof r.current !== "string") return null
  return { done: r.done, cleared: r.cleared, current: r.current ?? null }
}

/** Câu thông báo (cho cả người dùng đọc màn hình); null nếu không có gì. `nameOf` đổi mã chặng thành tên dễ đọc. */
export function describeEvents(e: CelebrationEvents, nameOf: (stepId: string) => string, bacName: (bac: number) => string): string | null {
  const parts: string[] = []
  if (e.gatesOpened.length) parts.push(`Cổng lên ${bacName(Math.max(...e.gatesOpened) + 1)} đã mở!`)
  if (e.newlyDone.length === 1) parts.push(`Bạn vừa hoàn thành ${nameOf(e.newlyDone[0])}!`)
  else if (e.newlyDone.length > 1) parts.push(`Bạn vừa hoàn thành ${e.newlyDone.length} chặng!`)
  if (!parts.length && e.movedTo) parts.push(`Bạn đã sang ${nameOf(e.movedTo)}.`)
  return parts.length ? parts.join(" ") : null
}
