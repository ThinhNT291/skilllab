/** XP, cấp độ và xu. Hàm thuần: tính lại từ lịch sử trả lời nên không cần bảng riêng và không lệch số. */
export const XP_CORRECT = 10
/** Sai vẫn được ít điểm vì đã thử và đọc giải thích. */
export const XP_WRONG = 2
/** Cứ 10 XP đổi được 1 xu. */
export const XP_PER_COIN = 10

export function xpFor(correct: number, wrong: number): number {
  return correct * XP_CORRECT + wrong * XP_WRONG
}

/** XP tối thiểu để đạt cấp L (cấp 1 = 0, cấp 2 = 100, cấp 3 = 300, cấp 4 = 600…). */
export function xpForLevel(level: number): number {
  return 50 * level * (level - 1)
}

export interface LevelInfo {
  level: number
  /** XP đã có trong cấp hiện tại. */
  into: number
  /** XP cần để lên cấp kế. */
  span: number
}

export function levelFromXp(xp: number): LevelInfo {
  let level = 1
  while (xpForLevel(level + 1) <= xp) level++
  const base = xpForLevel(level)
  return { level, into: xp - base, span: xpForLevel(level + 1) - base }
}

/** Xu còn dùng được = xu kiếm được trừ giá vật phẩm đã mua. */
export function coinsAvailable(xp: number, spent: number): number {
  return Math.max(0, Math.floor(xp / XP_PER_COIN) - spent)
}
