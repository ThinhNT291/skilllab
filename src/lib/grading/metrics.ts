/**
 * Số liệu ĐO BẰNG MÃ (không nhờ mô hình đoán) cho bài viết và bài nói. Hàm thuần.
 * Dùng để giải thích điểm bằng con số cụ thể và để mô hình không phải "ước lượng" những thứ đếm được.
 * Các mức tham khảo chỉ là ước lượng thô, không phải chuẩn chính thức.
 */

const WORD_RE = /[a-z]+(?:'[a-z]+)?/gi

export const CONNECTORS = [
  "and", "but", "so", "because", "or", "then", "also", "after that", "first", "firstly", "second", "secondly", "next", "finally", "at last",
  "however", "although", "though", "while", "when", "if", "unless", "since", "before", "after", "until", "for example", "for instance", "such as",
  "in addition", "moreover", "besides", "as well as", "therefore", "as a result", "in conclusion", "to sum up", "on the other hand", "in my opinion", "I think",
] as const

const STOP = new Set(["the", "a", "an", "and", "or", "but", "to", "of", "in", "on", "at", "is", "are", "was", "were", "be", "i", "you", "he", "she", "it", "we", "they", "my", "your", "his", "her", "our", "their", "this", "that", "with", "for", "have", "has", "had", "do", "does", "did", "not", "so", "very"])

export function wordsOf(text: string): string[] {
  return (text.match(WORD_RE) ?? []).map((w) => w.toLowerCase())
}

function sentencesOf(text: string): string[] {
  return text.split(/(?<=[.!?])\s+|\n+/).map((s) => s.trim()).filter((s) => wordsOf(s).length > 0)
}

export interface WritingMetrics {
  words: number
  sentences: number
  paragraphs: number
  avgSentenceWords: number
  longestSentenceWords: number
  /** Tỷ lệ từ khác nhau trên 100 từ đầu (0–1); cao = ít lặp từ. null nếu bài quá ngắn (< 20 từ). */
  lexicalVariety: number | null
  connectors: string[]
  repeatedWords: { word: string; count: number }[]
}

export function writingMetrics(text: string): WritingMetrics {
  const words = wordsOf(text)
  const sentences = sentencesOf(text)
  const lens = sentences.map((s) => wordsOf(s).length)
  const head = words.slice(0, 100)
  const lower = ` ${words.join(" ")} `
  const connectors = CONNECTORS.filter((c) => lower.includes(` ${c.toLowerCase()} `))
  const counts = new Map<string, number>()
  for (const w of words) if (!STOP.has(w) && w.length > 2) counts.set(w, (counts.get(w) ?? 0) + 1)
  return {
    words: words.length,
    sentences: sentences.length,
    paragraphs: text.split(/\n\s*\n/).filter((p) => p.trim()).length || (text.trim() ? 1 : 0),
    avgSentenceWords: lens.length ? Math.round((lens.reduce((a, b) => a + b, 0) / lens.length) * 10) / 10 : 0,
    longestSentenceWords: lens.length ? Math.max(...lens) : 0,
    lexicalVariety: words.length >= 20 ? Math.round((new Set(head).size / head.length) * 100) / 100 : null,
    connectors: [...new Set(connectors)],
    repeatedWords: [...counts].filter(([, n]) => n >= 3).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([word, count]) => ({ word, count })),
  }
}

export interface SpeakingMetrics {
  words: number
  durationSec: number
  /** Từ mỗi phút; null nếu không biết thời lượng */
  wpm: number | null
  fillers: number
  unclear: number
}

const FILLER_RE = /\b(?:um+|uh+|er+m?|erm|ah+|hmm+)\b|\byou know\b/gi

/** `transcript`: bản bóc băng nguyên bản. `durationSec`: thời gian ghi âm (đo ở trình duyệt). */
export function speakingMetrics(transcript: string, durationSec: number | null): SpeakingMetrics {
  const unclear = (transcript.match(/\[(?:unintelligible|nghe không rõ)\]/gi) ?? []).length
  const words = wordsOf(transcript.replace(/\[[^\]]*\]/g, " ")).length
  const d = durationSec && durationSec > 0 ? Math.min(durationSec, 600) : null
  return { words, durationSec: d ?? 0, wpm: d && d >= 5 ? Math.round((words / d) * 60) : null, fillers: (transcript.match(FILLER_RE) ?? []).length, unclear }
}

/** Nhận xét tốc độ nói, rất thô: chỉ để học sinh hình dung, không dùng để chấm điểm. */
export function paceNote(wpm: number | null): string | null {
  if (wpm === null) return null
  if (wpm < 50) return "Khá chậm hoặc ngập ngừng nhiều; hãy thử nói liền mạch hơn từng cụm."
  if (wpm < 110) return "Tốc độ phù hợp với người đang học; cố gắng giữ nhịp đều, ít dừng giữa câu."
  return "Tốc độ nhanh, gần với người bản ngữ; chú ý vẫn phát âm rõ từng từ."
}
