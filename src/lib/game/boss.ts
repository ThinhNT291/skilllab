/** Trận "trùm cuối": trùm là các điểm yếu của người học. Hàm thuần, không đọc dữ liệu. */
export const BOSS_SIZE = 10
export const BOSS_LIVES = 3

export type BossState = { hp: number; maxHp: number; lives: number; status: "fighting" | "won" | "lost" }

export function startBoss(questions: number): BossState {
  return { hp: questions, maxHp: questions, lives: BOSS_LIVES, status: "fighting" }
}

/** Trả lời đúng thì trùm mất 1 máu (hết máu là thắng); sai thì người chơi mất 1 mạng (hết mạng là thua). */
export function applyAnswer(s: BossState, correct: boolean): BossState {
  if (s.status !== "fighting") return s
  const hp = correct ? s.hp - 1 : s.hp
  const lives = correct ? s.lives : s.lives - 1
  const status = hp <= 0 ? "won" : lives <= 0 ? "lost" : "fighting"
  return { ...s, hp, lives, status }
}

export function bossStars(s: BossState): 0 | 1 | 2 | 3 {
  return s.status !== "won" ? 0 : s.lives >= 3 ? 3 : s.lives === 2 ? 2 : 1
}
