/**
 * Bài vượt cấp (chốt với chủ dự án): ở một chặng phía trên, làm một bài 20 câu đủ các kỹ năng của chặng đó;
 * ĐÚNG HẾT thì được bắt đầu Lộ trình từ chặng đó, không thì cứ tiếp tục ở chặng hiện tại. Hàm thuần.
 */
import type { LessonKind, PathStep } from "./catalog.ts"
import { LEAP_PASS_RATIO } from "./rules.ts"

export const LEAP_TOTAL = 20
/** Mỗi bài đọc/nghe có 4 câu */
export const PASSAGE_QUESTIONS = 4

export interface LeapPlan {
  grammar: number
  vocab: number
  /** 0 hoặc 1 bài đọc */
  reading: number
  /** 0 hoặc 1 bài nghe */
  listening: number
}

/**
 * Chia 20 câu theo kỹ năng mà chặng thực sự có: đọc và nghe mỗi thứ một bài (4 câu), phần còn lại chia ngữ pháp 2/3, từ vựng 1/3.
 * Thiếu kỹ năng nào thì phần của nó chuyển sang ngữ pháp/từ vựng; tổng luôn đúng 20.
 */
export function planLeap(step: Pick<PathStep, "lessons">): LeapPlan {
  const has = (k: LessonKind) => step.lessons.some((l) => l.kind === k)
  const reading = has("reading") ? 1 : 0
  const listening = has("listening") ? 1 : 0
  const rest = LEAP_TOTAL - (reading + listening) * PASSAGE_QUESTIONS
  const hasGrammar = has("grammar")
  const hasVocab = has("vocab")
  if (hasGrammar && hasVocab) {
    const vocab = Math.round(rest / 3)
    return { grammar: rest - vocab, vocab, reading, listening }
  }
  return { grammar: hasGrammar ? rest : 0, vocab: hasVocab ? rest : 0, reading, listening }
}

export const leapQuestionCount = (p: LeapPlan): number => p.grammar + p.vocab + (p.reading + p.listening) * PASSAGE_QUESTIONS

/** Đạt khi đúng hết (mặc định 100%). */
export const leapPassed = (correct: number, total: number, ratio = LEAP_PASS_RATIO): boolean => total > 0 && correct / total >= ratio
