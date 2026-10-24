/**
 * Chấm câu trả lời tự luận ngắn (gõ, sắp xếp, nghe chép). Hàm thuần, không phụ thuộc giao diện.
 * Nguyên tắc: bỏ qua khác biệt không phải lỗi ngữ pháp (hoa/thường, dấu câu cuối, kiểu dấu nháy),
 * nhưng đúng từng từ; chấp nhận cả dạng viết tắt lẫn đầy đủ (doesn't = does not).
 */

const CONTRACTIONS: [string, string][] = [
  ["doesn't", "does not"],
  ["don't", "do not"],
  ["didn't", "did not"],
  ["isn't", "is not"],
  ["aren't", "are not"],
  ["wasn't", "was not"],
  ["weren't", "were not"],
  ["hasn't", "has not"],
  ["haven't", "have not"],
  ["hadn't", "had not"],
  ["won't", "will not"],
  ["wouldn't", "would not"],
  ["couldn't", "could not"],
  ["shouldn't", "should not"],
  ["mustn't", "must not"],
  ["can't", "cannot"],
  ["i'm", "i am"],
  ["i'll", "i will"],
  ["i've", "i have"],
]

/** Chuẩn hóa để so sánh: thường hóa, thống nhất dấu nháy, bỏ dấu câu (trừ ' và -), gộp khoảng trắng. */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/[^a-z0-9'\- ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

/** Các dạng chấp nhận được của một đáp án: nguyên văn, mọi từ viết tắt được mở ra, mọi cụm đầy đủ được rút gọn. */
export function answerVariants(answer: string): string[] {
  const base = normalize(answer)
  const out = new Set<string>([base])
  let expanded = base
  let contracted = base
  for (const [short, long] of CONTRACTIONS) {
    expanded = expanded.replace(new RegExp(`\\b${short.replace("'", "'")}(?![a-z])`, "g"), long)
    contracted = contracted.replace(new RegExp(`\\b${long}\\b`, "g"), short)
  }
  out.add(expanded)
  out.add(contracted)
  return [...out]
}

export function gradeTyped(input: string, accepted: string[]): boolean {
  const n = normalize(input)
  if (!n) return false
  return accepted.some((a) => answerVariants(a).includes(n))
}

export function gradeReorder(selected: string[], answerWords: string[]): boolean {
  return selected.length === answerWords.length && selected.every((w, i) => w === answerWords[i])
}

/** Chạm đúng chỗ sai: chỉ số từ đã chạm nằm trong khoảng lỗi. */
export function gradeSpot(tapped: number, errorFrom: number, errorTo: number): boolean {
  return tapped >= errorFrom && tapped <= errorTo
}
