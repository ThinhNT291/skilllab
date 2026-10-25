/**
 * Ôn theo ngữ cảnh: thẻ từ vựng lúc đầu hỏi "từ này nghĩa gì?" (nhận biết). Khi đã ôn được vài lần, đổi sang điền từ vào câu
 * ví dụ (dùng trong ngữ cảnh) để tránh học thuộc nghĩa rời rạc. Hàm thuần.
 */
import type { SrsCard } from "@/lib/db"

/** Thẻ từ vựng có câu ví dụ chứa đúng từ đáp án thì đổi mặt trước sang câu bị che từ, từ lần ôn thứ 2 trở đi, xen kẽ lần lẻ. */
export function contextFront(card: Pick<SrsCard, "topic" | "answer" | "filled" | "reps">): string | null {
  if (!card.topic.startsWith("vocab-") || !card.filled || card.reps < 1 || card.reps % 2 === 0) return null
  const word = card.answer.trim()
  if (!word) return null
  const re = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i")
  if (!re.test(card.filled)) return null
  return card.filled.replace(re, "_____")
}
