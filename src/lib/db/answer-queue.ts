/**
 * Hàng đợi ghi lại câu trả lời khi mạng lỗi. Phần thuần (không đụng trình duyệt hay mạng) để kiểm tra được.
 * Mỗi mục có `client_id` do trình duyệt tạo; bảng `answers` có chỉ mục duy nhất trên cột này (migration 0012), nên ghi lại hai lần không thành hai dòng.
 */
export interface PendingAnswer {
  client_id: string
  profile_id: string
  exercise_id: string
  topic: string
  tags: string[]
  correct: boolean
  choice_index: number | null
  /** Thời điểm học sinh trả lời (giữ nguyên để câu rơi đúng ngày) */
  created_at: string
  tries: number
}

export const QUEUE_CAP = 300
export const MAX_TRIES = 8
export const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000

/** Lỗi tạm thời (mạng, máy chủ bận) mới đáng thử lại; lỗi quyền hoặc dữ liệu sai thì thử lại cũng vô ích. */
export function isTransientError(message: string | undefined, status?: number): boolean {
  if (status !== undefined && status >= 500) return true
  if (status !== undefined && status >= 400) return false
  return /fetch|network|timeout|timed out|load failed|abort|offline|ECONN/i.test(message ?? "")
}

export function enqueue(list: PendingAnswer[], item: PendingAnswer, cap = QUEUE_CAP): PendingAnswer[] {
  if (list.some((p) => p.client_id === item.client_id)) return list
  const next = [...list, item]
  return next.length > cap ? next.slice(next.length - cap) : next
}

/** Mục của hồ sơ này, còn hạn và chưa hết lượt thử; phần còn lại giữ nguyên (mục quá hạn bị bỏ). */
export function splitQueue(list: PendingAnswer[], profileId: string, now = Date.now()): { flush: PendingAnswer[]; keep: PendingAnswer[] } {
  const alive = list.filter((p) => now - new Date(p.created_at).getTime() <= MAX_AGE_MS && p.tries < MAX_TRIES)
  return { flush: alive.filter((p) => p.profile_id === profileId), keep: alive.filter((p) => p.profile_id !== profileId) }
}

/** Sau một lượt gửi: mục đã gửi được thì bỏ, chưa được thì tăng số lần thử. */
export function afterFlush(flushed: PendingAnswer[], okIds: Set<string>): PendingAnswer[] {
  return flushed.filter((p) => !okIds.has(p.client_id)).map((p) => ({ ...p, tries: p.tries + 1 }))
}
