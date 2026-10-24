/** Game thưởng: cứ sau mỗi N lượt luyện hoàn thành thì mời chơi một game mini. Phần tính là hàm thuần; đếm lưu theo trình duyệt. */
export const ROUNDS_PER_BONUS = 3

export function advanceRounds(count: number, every = ROUNDS_PER_BONUS): { count: number; offer: boolean } {
  const next = count + 1
  return next >= every ? { count: 0, offer: true } : { count: next, offer: false }
}

const KEY = "skilllab.rounds.sinceGame"

/** Ghi nhận một lượt vừa xong, trả về có nên mời chơi game thưởng không. Trình duyệt chặn lưu trữ thì không mời (không làm phiền). */
export function recordRoundDone(): boolean {
  try {
    const stored = Number(localStorage.getItem(KEY))
    const r = advanceRounds(Number.isFinite(stored) ? stored : 0)
    localStorage.setItem(KEY, String(r.count))
    return r.offer
  } catch {
    return false
  }
}
