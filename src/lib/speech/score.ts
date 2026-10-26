/**
 * Chấm câu đọc to bằng mã: so các từ trình duyệt nghe được với câu mẫu (docs/lo-trinh-va-xep-bac.md, ROADMAP "câu đọc to").
 * Chỉ đo mức "người nghe hiểu được từng từ", KHÔNG đo từng âm: nhận dạng giọng nói tự sửa theo ngữ cảnh nên có thể bỏ qua lỗi nhỏ,
 * và có thể nghe sai do micro/tiếng ồn. Vì vậy giao diện nói "đọc rõ từ nào", không gọi là điểm phát âm. Hàm thuần.
 */

/** Đạt khi nghe được từ 80% số từ của câu mẫu. */
export const SPEAK_PASS_RATIO = 0.8

const ONES = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"]
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"]

/** Số 0–99 đọc thành chữ (nhận dạng giọng nói hay trả "5" cho "five"). Ngoài khoảng thì giữ nguyên chữ số. */
function numberWords(n: number): string[] | null {
  if (n < 0 || n > 99) return null
  if (n < 20) return [ONES[n]]
  return n % 10 ? [TENS[Math.floor(n / 10)], ONES[n % 10]] : [TENS[n / 10]]
}

const IS = new Set(["it", "he", "she", "that", "what", "there", "here", "who", "where", "how"])
const IRREGULAR: Record<string, string[]> = { "won't": ["will", "not"], "can't": ["can", "not"], "cannot": ["can", "not"], "shan't": ["shall", "not"], "let's": ["let", "us"], "gonna": ["going", "to"], "wanna": ["want", "to"] }

function expand(token: string): string[] {
  if (IRREGULAR[token]) return IRREGULAR[token]
  if (/^\d+$/.test(token)) return numberWords(Number(token)) ?? [token]
  const m = /^([a-z]+)'(s|m|re|ve|ll|d|t)$/.exec(token)
  if (!m) return [token.replace(/'/g, "")]
  const [, stem, suffix] = m
  if (suffix === "s") return IS.has(stem) ? [stem, "is"] : [stem] // sở hữu cách: bỏ 's
  if (suffix === "m") return [stem, "am"]
  if (suffix === "re") return [stem, "are"]
  if (suffix === "ve") return [stem, "have"]
  if (suffix === "ll") return [stem, "will"]
  if (suffix === "d") return [stem, "would"]
  return [stem.endsWith("n") ? stem.slice(0, -1) : stem, "not"] // don't, isn't, doesn't…
}

/** Tách câu thành các từ chuẩn hóa để so sánh (chữ thường, bỏ dấu câu, mở rộng viết tắt, số thành chữ). */
export function normalizeWords(text: string): string[] {
  const clean = text.toLowerCase().replace(/[’‘`]/g, "'").replace(/[-–—]/g, " ").replace(/[^a-z0-9' ]+/g, " ")
  return clean.split(/\s+/).filter(Boolean).flatMap(expand).filter(Boolean)
}

export interface WordCheck {
  word: string
  heard: boolean
}

export interface SpeakScore {
  /** 0–1: phần các từ của câu mẫu đã nghe được theo đúng thứ tự */
  ratio: number
  /** Từng từ của câu mẫu (như viết trong câu gốc, không chuẩn hóa) và đã nghe được chưa */
  words: WordCheck[]
  passed: boolean
}

/** Các chỉ số của các từ mẫu nằm trong dãy con chung dài nhất với những gì nghe được (giữ đúng thứ tự). */
function matchedIndexes(target: string[], heard: string[]): Set<number> {
  const n = target.length
  const m = heard.length
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0))
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) dp[i][j] = target[i] === heard[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
  const out = new Set<number>()
  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (target[i] === heard[j]) {
      out.add(i)
      i++
      j++
    } else if (dp[i + 1][j] >= dp[i][j + 1]) i++
    else j++
  }
  return out
}

export function scoreSpeech(target: string, heard: string): SpeakScore {
  // Mỗi từ viết trong câu gốc có thể mở rộng thành nhiều từ chuẩn hóa (don't → do not): tính theo từ gốc, đúng khi mọi phần của nó đều nghe được.
  const original = target.trim().split(/\s+/).filter(Boolean)
  const parts = original.map((w) => normalizeWords(w))
  const flat = parts.flat()
  const owner = parts.flatMap((p, k) => p.map(() => k))
  const hit = matchedIndexes(flat, normalizeWords(heard))
  const words = original.map((word, k) => {
    const mine = owner.flatMap((o, idx) => (o === k ? [idx] : []))
    return { word, heard: mine.length === 0 || mine.every((idx) => hit.has(idx)) }
  })
  const countable = words.filter((_, k) => parts[k].length > 0)
  const ratio = countable.length ? countable.filter((w) => w.heard).length / countable.length : 0
  return { ratio, words, passed: ratio >= SPEAK_PASS_RATIO }
}

/** Chọn bản nhận dạng tốt nhất trong các cách nghe mà trình duyệt đưa ra (cho học sinh cơ hội công bằng). */
export function bestOf(target: string, alternatives: string[]): { text: string; score: SpeakScore } {
  let best = { text: alternatives[0] ?? "", score: scoreSpeech(target, alternatives[0] ?? "") }
  for (const alt of alternatives.slice(1)) {
    const s = scoreSpeech(target, alt)
    if (s.ratio > best.score.ratio) best = { text: alt, score: s }
  }
  return best
}
