import type { Bac, McqExercise } from "../content/types.ts"
import type { ReadingQuestion } from "../reading/types.ts"

export interface CollocationSet {
  /** Mã bộ, cũng là mã "chuyên đề" khi ghi câu trả lời (colloc-…) */
  id: string
  title: string
  desc: string
  bac: Bac
  questions: ReadingQuestion[]
}

export const isCollocTopic = (topicId: string) => topicId.startsWith("colloc-")

/** Đổi các câu của một bộ cụm từ thành câu trắc nghiệm dùng chung với ExerciseRunner. */
export function setToExercises(set: CollocationSet): McqExercise[] {
  return set.questions.map((q, i) => ({
    id: `cq-${set.id}-${i + 1}`,
    kind: "mcq",
    language: "en",
    bac: set.bac,
    topic: set.id,
    tags: [set.id],
    difficulty: Math.min(3, Math.max(1, set.bac - 1)) as 1 | 2 | 3,
    title: `Cụm từ · ${set.title}`,
    prompt: q.prompt,
    choices: q.choices,
    correctIndex: q.correctIndex,
    explanation: q.explanation,
    choiceExplanations: q.choiceExplanations,
  }))
}
