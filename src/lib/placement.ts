/**
 * Bài xếp trình độ: một bài ngắn lấy câu từ nhiều chuyên đề để gợi ý nên bắt đầu học từ đâu.
 * Chỉ là gợi ý nội bộ theo ba nhóm chuyên đề, KHÔNG quy đổi sang thang CEFR/6 bậc (bảng quy đổi chưa được kiểm chứng).
 * Hàm thuần: không đọc dữ liệu, không ghi gì.
 */
import type { Exercise } from "./content/types.ts"
import { shuffle, type Rng } from "./content/derive.ts"

export interface PlacementTopic {
  id: string
  title: string
  /** Cấp CEFR đầu tiên của chuyên đề (nhãn nội bộ, không hiện cho người học) */
  firstLevel: string
  order: number
}

export const BAND_NAMES = ["Khởi động", "Cơ bản", "Tiến bộ"] as const
/** Số câu hỏi mỗi nhóm; nhóm sau nhiều chuyên đề hơn nên nhiều câu hơn. */
export const BAND_QUESTIONS = [4, 8, 8] as const
/** Đạt một nhóm khi đúng từ 70% số câu của nhóm. */
export const PASS_RATIO = 0.7

export function bandOf(firstLevel: string): 0 | 1 | 2 {
  if (firstLevel === "A1") return 0
  if (firstLevel === "A2") return 1
  return 2
}

/**
 * Chọn câu: mỗi nhóm bốc ngẫu nhiên, luân phiên giữa các chuyên đề của nhóm để không dồn vào một chuyên đề.
 * Chỉ lấy câu trắc nghiệm mức 1–2: bài đo xem đã học nhóm đó chưa, không phải đố mẹo. Xếp nhóm dễ trước.
 */
export function pickPlacement(entries: { topic: PlacementTopic; exercises: Exercise[] }[], rng: Rng = Math.random): Exercise[] {
  const out: Exercise[] = []
  for (const band of [0, 1, 2] as const) {
    const pools = shuffle(
      entries.filter((e) => bandOf(e.topic.firstLevel) === band).map((e) => shuffle(e.exercises.filter((x) => x.kind === "mcq" && x.difficulty <= 2), rng)),
      rng,
    ).filter((p) => p.length > 0)
    const picked: Exercise[] = []
    for (let round = 0; picked.length < BAND_QUESTIONS[band] && pools.some((p) => p.length > round); round++) {
      for (const pool of pools) {
        if (pool[round] && picked.length < BAND_QUESTIONS[band]) picked.push(pool[round])
      }
    }
    out.push(...picked)
  }
  return out
}

export interface BandResult {
  band: 0 | 1 | 2
  name: string
  correct: number
  total: number
  passed: boolean
}

export interface PlacementResult {
  bands: BandResult[]
  /** Nhóm nên bắt đầu: nhóm đầu tiên chưa đạt; null nếu đạt cả ba. */
  startBand: 0 | 1 | 2 | null
  /** Chuyên đề nên học trước, theo thứ tự ưu tiên (tối đa `limit`). */
  recommended: PlacementTopic[]
}

export function scorePlacement(
  answers: { exerciseId: string; correct: boolean }[],
  exercises: Exercise[],
  topics: PlacementTopic[],
  limit = 4,
): PlacementResult {
  const topicById = new Map(topics.map((t) => [t.id, t]))
  const exById = new Map(exercises.map((e) => [e.id, e]))
  const tally = BAND_NAMES.map(() => ({ correct: 0, total: 0 }))
  const wrongByTopic = new Map<string, number>()

  for (const a of answers) {
    const ex = exById.get(a.exerciseId)
    const topic = ex && topicById.get(ex.topic)
    if (!ex || !topic) continue
    const band = bandOf(topic.firstLevel)
    tally[band].total++
    if (a.correct) tally[band].correct++
    else wrongByTopic.set(topic.id, (wrongByTopic.get(topic.id) ?? 0) + 1)
  }

  const bands: BandResult[] = tally.map((t, i) => ({
    band: i as 0 | 1 | 2,
    name: BAND_NAMES[i],
    correct: t.correct,
    total: t.total,
    passed: t.total > 0 && t.correct / t.total >= PASS_RATIO,
  }))
  const asked = bands.filter((b) => b.total > 0)
  const startBand = asked.find((b) => !b.passed)?.band ?? null

  // Ưu tiên chuyên đề đã sai (nhóm thấp trước, sai nhiều trước), rồi bù bằng chuyên đề của nhóm xuất phát theo thứ tự học.
  const wrongTopics = topics
    .filter((t) => wrongByTopic.has(t.id))
    .sort((a, b) => bandOf(a.firstLevel) - bandOf(b.firstLevel) || (wrongByTopic.get(b.id) ?? 0) - (wrongByTopic.get(a.id) ?? 0) || a.order - b.order)
  const fill = startBand === null ? [] : topics.filter((t) => bandOf(t.firstLevel) === startBand && !wrongByTopic.has(t.id)).sort((a, b) => a.order - b.order)
  return { bands, startBand, recommended: [...wrongTopics, ...fill].slice(0, limit) }
}
