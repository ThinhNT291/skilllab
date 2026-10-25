/** Hàng chờ ôn tập: giới hạn số thẻ mới mỗi ngày để học sinh không bị dồn một lúc. Hàm thuần. */
import type { SchedState } from "./scheduler.ts"

export const NEW_PER_DAY = 10

/** Thẻ mới = chưa từng được chấm lần nào (chưa có lần ôn, chưa quên lần nào). */
export function isNewCard(c: SchedState): boolean {
  return c.reps === 0 && c.intervalDays === 0 && c.lapses === 0
}

/** Giữ thẻ cũ đến hạn, chỉ cho thêm thẻ mới tới hạn mức trong ngày; trả cả số thẻ mới bị hoãn sang ngày sau. */
export function limitNewCards<T extends SchedState>(cards: T[], newDoneToday: number, cap = NEW_PER_DAY): { cards: T[]; deferred: number } {
  let room = Math.max(0, cap - newDoneToday)
  const kept: T[] = []
  let deferred = 0
  for (const c of cards) {
    if (!isNewCard(c)) kept.push(c)
    else if (room > 0) {
      kept.push(c)
      room--
    } else deferred++
  }
  return { cards: kept, deferred }
}

/**
 * Xen kẽ chuyên đề trong hàng chờ: thẻ liền nhau không cùng chuyên đề khi còn lựa chọn (giữ nguyên thứ tự ưu tiên trong từng chuyên đề).
 * Hàm thuần; không đổi số thẻ.
 */
export function interleaveByTopic<T extends { topic: string }>(cards: T[]): T[] {
  const rest = [...cards]
  const out: T[] = []
  while (rest.length) {
    const last = out.length ? out[out.length - 1].topic : null
    const idx = rest.findIndex((c) => c.topic !== last)
    out.push(...rest.splice(idx === -1 ? 0 : idx, 1))
  }
  return out
}
