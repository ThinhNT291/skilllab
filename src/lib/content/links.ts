/** Đường dẫn về trang học của một "chuyên đề" trong nhật ký trả lời: ngữ pháp, từ vựng (vocab-a1) hoặc đọc hiểu (reading-b1). */
export function topicHref(topicId: string): string {
  if (topicId.startsWith("vocab-")) return `/tu-vung/${topicId.slice(6)}`
  if (topicId.startsWith("reading-b")) return `/doc/${topicId.slice(9)}`
  if (topicId.startsWith("listening-b")) return `/nghe/${topicId.slice(11)}`
  if (topicId.startsWith("colloc-")) return `/tu-vung/cum-tu/${topicId}`
  return `/hoc/${topicId}`
}

/** Có phải chuyên đề ngữ pháp (có mục lý thuyết và trang luyện riêng) không. */
export function isGrammarTopic(topicId: string): boolean {
  return !topicId.startsWith("vocab-") && !topicId.startsWith("reading-b") && !topicId.startsWith("listening-b") && !topicId.startsWith("colloc-")
}
