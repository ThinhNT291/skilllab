import type { Exercise } from "@/lib/content/types"

export interface CardContent {
  front: string
  answer: string
  filled: string | null
  explanation: string
}

/** Dựng nội dung thẻ từ một câu bài tập: mặt trước là đề, mặt sau là đáp án + câu hoàn chỉnh + giải thích. */
export function cardContentFromExercise(ex: Exercise): CardContent {
  const answer = ex.choices[ex.correctIndex]
  const blanks = ex.prompt.match(/_{2,}/g) ?? []
  let filled: string | null = null
  if (blanks.length > 0) {
    const parts = answer.split(" / ")
    if (parts.length === blanks.length) {
      let i = 0
      filled = ex.prompt.replace(/_{2,}/g, () => parts[i++])
      // Bỏ gợi ý động từ trong ngoặc, vd "(finish)", cho câu hoàn chỉnh gọn hơn.
      filled = filled.replace(/\s*\((?:[a-z]+\/)*[a-z]+\)/gi, "")
    }
  }
  const explanation = ex.choiceExplanations?.[ex.correctIndex]?.replace(/^Đúng — /, "") ?? ex.explanation
  return { front: ex.prompt, answer, filled, explanation }
}
