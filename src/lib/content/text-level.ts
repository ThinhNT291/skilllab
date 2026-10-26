/**
 * Đo độ khó từ vựng của một đoạn văn so với bậc mục tiêu, bằng danh sách từ vựng theo cấp CEFR (CEFR-J + Octanove, nạp ở script). Hàm thuần.
 * Chỉ là CHỈ BÁO: danh sách là từ khóa gốc (không có dạng biến cách, cụm từ, tên riêng; một từ có thể có nhiều nghĩa ở nhiều cấp, ta lấy cấp thấp nhất),
 * nên mọi tỷ lệ phải đọc cùng danh sách "từ vượt bậc" để người duyệt xem, không dùng làm kết luận tự động (docs/prompt-sinh-noi-dung.md mục 10.5).
 * Lưu ý: kho từ vựng của ứng dụng (`src/content/vocab`) là tập con đã lọc cho trẻ, KHÔNG dùng làm danh sách cấp độ.
 */

/** Từ chức năng và từ rất thường gặp mà danh sách từ vựng không chứa; coi là Bậc 1. */
const FUNCTION_WORDS = new Set(
  `a an the this that these those i me my mine you your yours he him his she her hers it its we us our ours they them their theirs who whom whose which what where when why how
   am is are was were be been being have has had having do does did done doing will would shall should can could may might must
   and or but if because so than then as of in on at to from by with about into over after before between through during without within under again
   not no yes very too also just only even still already yet ever never always often there here some any all each every both few many much more most other another such own same
   one two three four five six seven eight nine ten first second third let s t d ll re ve m ok oh well`.split(/\s+/),
)

export const LEVEL_ORDER = ["a1", "a2", "b1", "b2", "c1", "c2"] as const

/** Bậc (1–6) của một cấp CEFR ("A1".."C2", không phân biệt hoa thường). 0 nếu không nhận ra. */
export function bacOfLevel(level: string): number {
  return LEVEL_ORDER.indexOf(level.toLowerCase() as (typeof LEVEL_ORDER)[number]) + 1
}

/**
 * Bảng "từ → bậc thấp nhất có từ đó" từ các cặp (từ, bậc). Mục từ nhiều dạng ghi cách nhau bằng "/" được tách ra; cụm nhiều từ bị bỏ qua.
 * Nguồn dùng trong script: CEFR-J Vocabulary Profile (A1–B2) và Octanove Vocabulary Profile (C1–C2) trong `reference/`.
 */
export function buildLevelIndex(entries: Iterable<{ word: string; bac: number }>): Map<string, number> {
  const index = new Map<string, number>()
  for (const e of entries) {
    for (const part of e.word.split("/")) {
      const w = part.trim().toLowerCase()
      if (!/^[a-z]+(?:'[a-z]+)?$/.test(w)) continue
      const cur = index.get(w)
      if (cur === undefined || e.bac < cur) index.set(w, e.bac)
    }
  }
  return index
}

/** Các dạng gốc có thể có của một từ đã biến cách (số nhiều, quá khứ, -ing, so sánh, trạng từ). */
export function baseForms(word: string): string[] {
  const out = new Set<string>([word])
  const add = (w: string) => w.length >= 3 && out.add(w)
  if (word.endsWith("ies")) add(word.slice(0, -3) + "y")
  if (word.endsWith("es")) add(word.slice(0, -2))
  if (word.endsWith("s")) add(word.slice(0, -1))
  if (word.endsWith("ied")) add(word.slice(0, -3) + "y")
  if (word.endsWith("ed")) {
    add(word.slice(0, -2))
    add(word.slice(0, -1))
    if (/(.)\1ed$/.test(word)) add(word.slice(0, -3))
  }
  if (word.endsWith("ing")) {
    add(word.slice(0, -3))
    add(word.slice(0, -3) + "e")
    if (/(.)\1ing$/.test(word)) add(word.slice(0, -4))
  }
  if (word.endsWith("ly")) add(word.slice(0, -2))
  if (word.endsWith("ier") || word.endsWith("iest")) add(word.replace(/ie(r|st)$/, "y"))
  if (word.endsWith("er")) {
    add(word.slice(0, -2))
    add(word.slice(0, -1))
  }
  if (word.endsWith("est")) {
    add(word.slice(0, -3))
    add(word.slice(0, -2))
  }
  return [...out]
}

export interface TextLevelReport {
  words: number
  sentences: number
  /** Số từ trung bình mỗi câu */
  avgSentence: number
  /** Số từ nội dung đã so được với danh sách */
  checked: number
  /** Tỷ lệ (0–1) từ đã so được mà cao hơn bậc mục tiêu */
  aboveRatio: number
  /** Từ vượt bậc, kèm bậc và số lần, nhiều lần nhất trước */
  above: { word: string; bac: number; count: number }[]
  /** Tỷ lệ (0–1) từ không có trong danh sách (tên riêng, từ chức năng hiếm, dạng biến cách chưa nhận ra): đọc cùng `unknown` */
  unknownRatio: number
  unknown: { word: string; count: number }[]
}

function tokenize(text: string): { word: string; sentenceStart: boolean }[] {
  const out: { word: string; sentenceStart: boolean }[] = []
  let start = true
  for (const raw of text.replace(/\n+/g, " . ").split(/(?<=[.!?])\s+|\s+/)) {
    for (const m of raw.matchAll(/[A-Za-z]+(?:'[A-Za-z]+)?/g)) {
      const original = m[0]
      // Tên riêng: viết hoa giữa câu thì bỏ qua (đầu câu không phân biệt được nên vẫn tính).
      if (!start && /^[A-Z][a-z]/.test(original)) {
        start = false
        continue
      }
      out.push({ word: original.toLowerCase().replace(/'.*$/, ""), sentenceStart: start })
      start = false
    }
    if (/[.!?]$/.test(raw)) start = true
  }
  return out
}

/** Bỏ nhãn người nói ở đầu dòng của lời thoại ("A:", "Anna:"). */
export function stripSpeakers(text: string): string {
  return text.replace(/^\s*[A-Z][A-Za-z]{0,14}:\s*/gm, "")
}

export function analyzeText(text: string, index: Map<string, number>, targetBac: number): TextLevelReport {
  const clean = stripSpeakers(text)
  const sentences = clean.split(/[.!?]+\s|\n+/).map((s) => s.trim()).filter(Boolean).length || 1
  const tokens = tokenize(clean)
  const words = (clean.match(/[A-Za-z]+(?:'[A-Za-z]+)?/g) ?? []).length
  const above = new Map<string, { bac: number; count: number }>()
  const unknown = new Map<string, number>()
  let checked = 0
  let aboveCount = 0
  let unknownCount = 0
  for (const { word } of tokens) {
    if (FUNCTION_WORDS.has(word)) continue
    const hit = baseForms(word).map((b) => index.get(b)).filter((b): b is number => b !== undefined)
    if (hit.length === 0) {
      unknownCount++
      unknown.set(word, (unknown.get(word) ?? 0) + 1)
      continue
    }
    checked++
    const bac = Math.min(...hit)
    if (bac > targetBac) {
      aboveCount++
      const cur = above.get(word) ?? { bac, count: 0 }
      cur.count++
      above.set(word, cur)
    }
  }
  const content = checked + unknownCount
  return {
    words,
    sentences,
    avgSentence: words / sentences,
    checked,
    aboveRatio: checked ? aboveCount / checked : 0,
    above: [...above.entries()].map(([word, v]) => ({ word, ...v })).sort((a, b) => b.count - a.count || b.bac - a.bac),
    unknownRatio: content ? unknownCount / content : 0,
    unknown: [...unknown.entries()].map(([word, count]) => ({ word, count })).sort((a, b) => b.count - a.count),
  }
}

/** Khoảng độ dài (số từ) mong đợi theo bậc, đo từ ngân hàng hiện có (docs/prompt-sinh-noi-dung.md mục 10.4). */
export const LENGTH_RANGE: Record<"reading" | "listening", Record<number, [number, number]>> = {
  reading: { 1: [45, 80], 2: [80, 125], 3: [145, 195], 4: [200, 255], 5: [275, 350], 6: [385, 450] },
  listening: { 1: [35, 60], 2: [75, 100], 3: [85, 175], 4: [185, 255], 5: [245, 310], 6: [335, 400] },
}

export interface TextFlag {
  kind: "above-level" | "too-long" | "too-short" | "long-sentences"
  detail: string
}

/** Ngưỡng khởi điểm; chỉnh theo kết quả rà ngân hàng hiện có và phản hồi người duyệt. */
/** Tỷ lệ từ vượt bậc tối đa; Bậc 1–2 nới hơn vì bài cho trẻ nhỏ cần từ cụ thể (con vật, đồ vật) mà danh sách xếp cấp cao hơn. */
export const ABOVE_RATIO_LIMIT: Record<number, number> = { 1: 0.15, 2: 0.1, 3: 0.06, 4: 0.06, 5: 0.06 }
export const AVG_SENTENCE_LIMIT: Record<number, number> = { 1: 9, 2: 12, 3: 16, 4: 20, 5: 26, 6: 32 }

export function flagsFor(kind: "reading" | "listening", bac: number, r: TextLevelReport): TextFlag[] {
  const out: TextFlag[] = []
  const [lo, hi] = LENGTH_RANGE[kind][bac] ?? [0, Infinity]
  if (r.words < lo) out.push({ kind: "too-short", detail: `${r.words} từ < ${lo}` })
  if (r.words > hi) out.push({ kind: "too-long", detail: `${r.words} từ > ${hi}` })
  if (bac < 6 && r.aboveRatio > (ABOVE_RATIO_LIMIT[bac] ?? 0.06)) out.push({ kind: "above-level", detail: `${Math.round(r.aboveRatio * 100)}% từ vượt Bậc ${bac}` })
  if (r.avgSentence > (AVG_SENTENCE_LIMIT[bac] ?? Infinity)) out.push({ kind: "long-sentences", detail: `trung bình ${r.avgSentence.toFixed(1)} từ/câu` })
  return out
}
