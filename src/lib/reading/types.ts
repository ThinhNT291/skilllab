import type { Bac, McqExercise } from "../content/types.ts"

export interface ReadingQuestion {
  prompt: string
  choices: string[]
  correctIndex: number
  explanation: string
  choiceExplanations: string[]
}

export interface ReadingPassage {
  id: string
  bac: Bac
  title: string
  /** Các đoạn ngăn cách bằng dòng trống */
  text: string
  questions: ReadingQuestion[]
}

export const READING_BACS: Bac[] = [1, 2, 3, 4, 5, 6]
export const READING_PASS_RATIO = 0.75

/** Mã chuyên đề dùng khi ghi câu trả lời (không trùng chuyên đề ngữ pháp). */
export const readingTopic = (bac: number) => `reading-b${bac}`

/** Đổi các câu hỏi của một bài đọc thành câu trắc nghiệm dùng chung với ExerciseRunner (ghi kết quả, tạo thẻ ôn khi sai). */
export function passageToExercises(p: ReadingPassage): McqExercise[] {
  return p.questions.map((q, i) => ({
    id: `rq-${p.id}-${i + 1}`,
    kind: "mcq",
    language: "en",
    bac: p.bac,
    topic: readingTopic(p.bac),
    tags: [readingTopic(p.bac)],
    difficulty: Math.min(3, Math.max(1, p.bac)) as 1 | 2 | 3,
    title: `Đọc hiểu · ${p.title}`,
    prompt: q.prompt,
    choices: q.choices,
    correctIndex: q.correctIndex,
    explanation: q.explanation,
    choiceExplanations: q.choiceExplanations,
  }))
}

/** Đạt khi đúng từ 75% số câu của bài (cùng ngưỡng bản cũ). */
export function passedReading(correct: number, total: number): boolean {
  return total > 0 && correct / total >= READING_PASS_RATIO
}
