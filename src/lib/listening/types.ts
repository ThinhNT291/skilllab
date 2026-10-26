import type { Bac, McqExercise } from "../content/types.ts"
import type { ReadingQuestion } from "../reading/types.ts"

export interface ListeningItem {
  id: string
  bac: Bac
  title: string
  /** Lời thoại/độc thoại. Chỉ hiện sau khi làm xong để không mất tác dụng luyện nghe. */
  transcript: string
  questions: ReadingQuestion[]
}

export const LISTENING_BACS: Bac[] = [1, 2, 3, 4, 5, 6]
export const listeningTopic = (bac: number) => `listening-b${bac}`

export function itemToExercises(it: ListeningItem): McqExercise[] {
  return it.questions.map((q, i) => ({
    id: `lq-${it.id}-${i + 1}`,
    kind: "mcq",
    language: "en",
    bac: it.bac,
    topic: listeningTopic(it.bac),
    tags: [listeningTopic(it.bac)],
    difficulty: Math.min(3, Math.max(1, it.bac)) as 1 | 2 | 3,
    title: `Nghe hiểu · ${it.title}`,
    prompt: q.prompt,
    choices: q.choices,
    correctIndex: q.correctIndex,
    explanation: q.explanation,
    choiceExplanations: q.choiceExplanations,
  }))
}
