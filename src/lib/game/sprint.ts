/** Thử thách 60 giây: trả lời càng nhiều càng tốt. Hàm thuần, không phạt khi sai (chỉ ngắt chuỗi) để không làm trẻ nản. */
export const SPRINT_SECONDS = 60
export const POINTS_PER_CORRECT = 10
/** Mỗi lần đạt bội số của chuỗi này thì được thưởng thêm. */
export const STREAK_BONUS_EVERY = 5
export const STREAK_BONUS = 15

export interface SprintState {
  correct: number
  wrong: number
  streak: number
  bestStreak: number
  score: number
}

export const initialSprint: SprintState = { correct: 0, wrong: 0, streak: 0, bestStreak: 0, score: 0 }

export function applySprint(s: SprintState, correct: boolean): SprintState {
  if (!correct) return { ...s, wrong: s.wrong + 1, streak: 0 }
  const streak = s.streak + 1
  const bonus = streak % STREAK_BONUS_EVERY === 0 ? STREAK_BONUS : 0
  return { ...s, correct: s.correct + 1, streak, bestStreak: Math.max(s.bestStreak, streak), score: s.score + POINTS_PER_CORRECT + bonus }
}

export function sprintTitle(score: number): string {
  if (score >= 250) return "Tốc độ ánh sáng!"
  if (score >= 150) return "Rất nhanh!"
  if (score >= 70) return "Khởi động tốt!"
  return "Lần sau sẽ nhanh hơn!"
}
