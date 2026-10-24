/** Huy hiệu tính từ số liệu học tập sẵn có, không lưu riêng: thêm huy hiệu mới là tự mở cho cả dữ liệu cũ. */
export interface GameStats {
  answers: number
  correct: number
  /** Số chuyên đề đã thử. */
  topics: number
  /** Chuỗi ngày học dài nhất. */
  bestStreak: number
  /** Số ngày có học. */
  activeDays: number
}

export interface Badge {
  id: string
  name: string
  emoji: string
  hint: string
  earned: (s: GameStats) => boolean
}

const accuracy = (s: GameStats) => (s.answers === 0 ? 0 : s.correct / s.answers)

export const BADGES: Badge[] = [
  { id: "first-step", name: "Bước đầu tiên", emoji: "👣", hint: "Trả lời câu hỏi đầu tiên", earned: (s) => s.answers >= 1 },
  { id: "answers-50", name: "Chăm chỉ", emoji: "📘", hint: "Làm 50 câu", earned: (s) => s.answers >= 50 },
  { id: "answers-200", name: "Siêu chăm", emoji: "📚", hint: "Làm 200 câu", earned: (s) => s.answers >= 200 },
  { id: "answers-500", name: "Máy học", emoji: "🚀", hint: "Làm 500 câu", earned: (s) => s.answers >= 500 },
  { id: "correct-100", name: "Trăm câu đúng", emoji: "💯", hint: "Đúng 100 câu", earned: (s) => s.correct >= 100 },
  { id: "sharp", name: "Chính xác", emoji: "🎯", hint: "Đúng từ 80% khi đã làm ít nhất 50 câu", earned: (s) => s.answers >= 50 && accuracy(s) >= 0.8 },
  { id: "streak-3", name: "Ba ngày liền", emoji: "🔥", hint: "Học 3 ngày liên tiếp", earned: (s) => s.bestStreak >= 3 },
  { id: "streak-7", name: "Tuần lửa", emoji: "🌟", hint: "Học 7 ngày liên tiếp", earned: (s) => s.bestStreak >= 7 },
  { id: "streak-30", name: "Kiên trì", emoji: "👑", hint: "Học 30 ngày liên tiếp", earned: (s) => s.bestStreak >= 30 },
  { id: "explorer-5", name: "Nhà thám hiểm", emoji: "🧭", hint: "Thử 5 chuyên đề", earned: (s) => s.topics >= 5 },
  { id: "explorer-15", name: "Bản đồ đầy đủ", emoji: "🗺️", hint: "Thử 15 chuyên đề", earned: (s) => s.topics >= 15 },
]

export function earnedBadges(stats: GameStats): Badge[] {
  return BADGES.filter((b) => b.earned(stats))
}
