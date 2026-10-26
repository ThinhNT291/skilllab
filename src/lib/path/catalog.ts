/**
 * Lộ trình một con đường: danh mục "nấc" (bậc × chặng) và các bài trong nấc (docs/lo-trinh-va-xep-bac.md mục 4).
 * Hàm thuần: nhận số liệu nhẹ về nội dung có sẵn (không đọc tệp), trả danh mục cố định theo thứ tự.
 * Nội dung không viết lại: mỗi bài chỉ TRỎ vào nội dung đã có (chuyên đề × bậc, phần từ vựng, bài đọc, bài nghe).
 */

export type LessonKind = "grammar" | "vocab" | "reading" | "listening"
export const LESSON_KINDS: LessonKind[] = ["grammar", "vocab", "listening", "reading"]
export const KIND_LABEL: Record<LessonKind, string> = { grammar: "Ngữ pháp", vocab: "Từ vựng", reading: "Đọc hiểu", listening: "Nghe hiểu" }

/** Bậc 1–6 (A1–C2), mỗi bậc chia thành bấy nhiêu chặng. Giá trị khởi điểm, xem lại khi có dữ liệu thật. */
export const BACS = [1, 2, 3, 4, 5, 6] as const
export const STEPS_PER_BAC = 5
/** Một chuyên đề × bậc cần ít nhất bấy nhiêu câu mới thành một bài ngữ pháp (đủ để bốc một lượt không lặp). */
export const MIN_GRAMMAR_ITEMS = 6
/** Số bài từ vựng mỗi chặng; mỗi bậc chia kho từ của bậc đó thành `STEPS_PER_BAC × VOCAB_LESSONS_PER_STEP` phần. */
export const VOCAB_LESSONS_PER_STEP = 2

export interface LessonRef {
  /** Ngữ pháp: chuyên đề + bậc của câu */
  topic?: string
  /** Từ vựng: phần thứ `slice` (0-based) trong `slices` phần của bậc */
  slice?: number
  slices?: number
  /** Đọc/nghe: mã bài */
  itemId?: string
}

export interface PathLesson {
  /** Ổn định theo nội dung, dùng làm khóa lưu kết quả và đường dẫn: g.<chuyên đề>.b<bậc> | v.b<bậc>.p<phần> | r.<mã bài> | l.<mã bài> */
  id: string
  kind: LessonKind
  bac: number
  /** Chặng 1..STEPS_PER_BAC trong bậc */
  stepInBac: number
  title: string
  ref: LessonRef
}

export interface PathStep {
  /** "b3-s2" */
  id: string
  bac: number
  stepInBac: number
  /** Vị trí toàn cục 0.. trong toàn lộ trình */
  index: number
  lessons: PathLesson[]
}

export interface PathInput {
  grammar: { topic: string; title: string; bac: number; order: number; count: number }[]
  /** Số từ của mỗi bậc (khóa là bậc 1–6); bậc thiếu hoặc quá ít từ thì không có bài từ vựng */
  vocabWords: Partial<Record<number, number>>
  reading: { id: string; title: string; bac: number }[]
  listening: { id: string; title: string; bac: number }[]
}

export const stepId = (bac: number, stepInBac: number) => `b${bac}-s${stepInBac}`

/** Chia danh sách thành `parts` khúc liền nhau, đều nhất có thể (khúc đầu nhận phần dư). */
export function splitEven<T>(list: T[], parts: number): T[][] {
  const out: T[][] = []
  const base = Math.floor(list.length / parts)
  const extra = list.length % parts
  let at = 0
  for (let i = 0; i < parts; i++) {
    const size = base + (i < extra ? 1 : 0)
    out.push(list.slice(at, at + size))
    at += size
  }
  return out
}

/** Xen kẽ các loại bài (ngữ pháp, từ vựng, nghe, đọc…) cho nấc đỡ đơn điệu; thứ tự trong từng loại giữ nguyên. */
export function interleaveKinds(lessons: PathLesson[]): PathLesson[] {
  const byKind = LESSON_KINDS.map((k) => lessons.filter((l) => l.kind === k))
  const out: PathLesson[] = []
  for (let i = 0; byKind.some((l) => i < l.length); i++) for (const l of byKind) if (i < l.length) out.push(l[i])
  return out
}

/** Số bài từ vựng tối thiểu từ mỗi phần: phải đủ từ để bốc một lượt 10 câu. */
export const MIN_WORDS_PER_VOCAB_SLICE = 10

export function buildPath(input: PathInput): PathStep[] {
  const steps: PathStep[] = []
  for (const bac of BACS) {
    const perStep: PathLesson[][] = Array.from({ length: STEPS_PER_BAC }, () => [])
    const put = (parts: PathLesson[][]) => parts.forEach((ls, i) => perStep[i].push(...ls))

    const grammar = input.grammar
      .filter((g) => g.bac === bac && g.count >= MIN_GRAMMAR_ITEMS)
      .sort((a, b) => a.order - b.order || a.topic.localeCompare(b.topic))
      .map<PathLesson>((g) => ({ id: `g.${g.topic}.b${bac}`, kind: "grammar", bac, stepInBac: 0, title: g.title, ref: { topic: g.topic } }))
    put(splitEven(grammar, STEPS_PER_BAC))

    const slices = STEPS_PER_BAC * VOCAB_LESSONS_PER_STEP
    if ((input.vocabWords[bac] ?? 0) >= slices * MIN_WORDS_PER_VOCAB_SLICE) {
      const vocab = Array.from({ length: slices }, (_, p) => ({ id: `v.b${bac}.p${p + 1}`, kind: "vocab", bac, stepInBac: 0, title: `Phần ${p + 1}`, ref: { slice: p, slices } }) as PathLesson)
      put(splitEven(vocab, STEPS_PER_BAC))
    }

    const passages = (prefix: "r" | "l", kind: "reading" | "listening", list: { id: string; title: string; bac: number }[]) =>
      list.filter((p) => p.bac === bac).map<PathLesson>((p) => ({ id: `${prefix}.${p.id}`, kind, bac, stepInBac: 0, title: p.title, ref: { itemId: p.id } }))
    put(splitEven(passages("r", "reading", input.reading), STEPS_PER_BAC))
    put(splitEven(passages("l", "listening", input.listening), STEPS_PER_BAC))

    perStep.forEach((lessons, i) => {
      const stepInBac = i + 1
      steps.push({ id: stepId(bac, stepInBac), bac, stepInBac, index: steps.length, lessons: interleaveKinds(lessons).map((l) => ({ ...l, stepInBac })) })
    })
  }
  return steps
}

export const allLessons = (path: PathStep[]): PathLesson[] => path.flatMap((s) => s.lessons)

export const findLesson = (path: PathStep[], id: string): PathLesson | undefined => allLessons(path).find((l) => l.id === id)
