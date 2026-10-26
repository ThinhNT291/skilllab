/**
 * Nạp nội dung cho Lộ trình (chỉ chạy phía server): dựng danh mục nấc từ nội dung có sẵn và chuẩn bị câu cho từng bài.
 * Câu dành riêng cho bài xếp trình độ bị loại như mọi nơi luyện tập khác (các hàm nạp lo việc đó).
 */
import { getExercises, listGrammarTopics } from "@/lib/content/grammar"
import { pickRound } from "@/lib/content/rounds"
import type { Exercise } from "@/lib/content/types"
import { getListeningItems } from "@/lib/listening/data"
import { itemToExercises, type ListeningItem } from "@/lib/listening/types"
import { getReadingPassages, glossFor } from "@/lib/reading/data"
import { passageToExercises, type ReadingPassage } from "@/lib/reading/types"
import { getVocab } from "@/lib/vocab/data"
import { pickVocabRound, VOCAB_LEVELS, type VocabLevel } from "@/lib/vocab/questions"
import { shuffle } from "@/lib/content/derive"
import { BACS, buildPath, findLesson, type PathLesson, type PathStep } from "./catalog"
import { planLeap, type LeapPlan } from "./leap"

let cached: Promise<PathStep[]> | null = null

/** Danh mục Lộ trình (giống nhau cho mọi học sinh, nên nạp một lần mỗi tiến trình). */
export function getPath(): Promise<PathStep[]> {
  cached ??= (async () => {
    const topics = listGrammarTopics("en")
    const grammar = (
      await Promise.all(
        topics.map(async (t) => {
          const items = await getExercises("en", t.id)
          return BACS.map((bac) => ({ topic: t.id, title: t.title, bac, order: t.order, count: items.filter((e) => e.bac === bac).length }))
        }),
      )
    ).flat()
    const vocabWords: Record<number, number> = {}
    for (const l of VOCAB_LEVELS) vocabWords[l.bac] = (await getVocab(l.id))?.length ?? 0
    const reading = (await Promise.all(BACS.map(async (bac) => ((await getReadingPassages(bac)) ?? []).map((p) => ({ id: p.id, title: p.title, bac }))))).flat()
    const listening = (await Promise.all(BACS.map(async (bac) => ((await getListeningItems(bac)) ?? []).map((p) => ({ id: p.id, title: p.title, bac }))))).flat()
    return buildPath({ grammar, vocabWords, reading, listening })
  })()
  return cached
}

export type LessonPayload =
  | { kind: "grammar"; lessonId: string; title: string; exercises: Exercise[]; topic: string; theoryBase: string }
  | { kind: "vocab"; lessonId: string; title: string; exercises: Exercise[]; level: VocabLevel }
  | { kind: "reading"; lessonId: string; title: string; passage: ReadingPassage; exercises: Exercise[]; gloss: Record<string, string> }
  | { kind: "listening"; lessonId: string; title: string; item: ListeningItem; exercises: Exercise[] }

/** Chuẩn bị câu cho một bài; null nếu mã bài không có trong danh mục hoặc nội dung đã đổi. */
export async function getLessonPayload(lessonId: string): Promise<{ lesson: PathLesson; payload: LessonPayload } | null> {
  const lesson = findLesson(await getPath(), lessonId)
  if (!lesson) return null
  const base = { lessonId: lesson.id, title: lesson.title }
  if (lesson.kind === "grammar" && lesson.ref.topic) {
    const items = (await getExercises("en", lesson.ref.topic)).filter((e) => e.bac === lesson.bac)
    if (!items.length) return null
    return { lesson, payload: { ...base, kind: "grammar", exercises: pickRound(items), topic: lesson.ref.topic, theoryBase: `/hoc/${lesson.ref.topic}` } }
  }
  if (lesson.kind === "vocab" && lesson.ref.slices !== undefined && lesson.ref.slice !== undefined) {
    const level = VOCAB_LEVELS.find((l) => l.bac === lesson.bac)
    const words = level ? await getVocab(level.id) : null
    if (!level || !words) return null
    const from = Math.floor((lesson.ref.slice * words.length) / lesson.ref.slices)
    const to = Math.floor(((lesson.ref.slice + 1) * words.length) / lesson.ref.slices)
    const exercises = pickVocabRound(words, level.id, 10, Math.random, words.slice(from, to))
    return exercises.length ? { lesson, payload: { ...base, kind: "vocab", exercises, level: level.id } } : null
  }
  if (lesson.kind === "reading" && lesson.ref.itemId) {
    const passage = ((await getReadingPassages(lesson.bac)) ?? []).find((p) => p.id === lesson.ref.itemId)
    if (!passage) return null
    return { lesson, payload: { ...base, kind: "reading", passage, exercises: passageToExercises(passage), gloss: await glossFor(passage.text) } }
  }
  if (lesson.kind === "listening" && lesson.ref.itemId) {
    const item = ((await getListeningItems(lesson.bac)) ?? []).find((p) => p.id === lesson.ref.itemId)
    if (!item) return null
    return { lesson, payload: { ...base, kind: "listening", item, exercises: itemToExercises(item) } }
  }
  return null
}

export interface LeapPayload {
  bac: number
  stepInBac: number
  plan: LeapPlan
  /** Ngữ pháp + từ vựng, xếp dễ → khó trong từng kỹ năng */
  items: Exercise[]
  reading: { passage: ReadingPassage; exercises: Exercise[]; gloss: Record<string, string> } | null
  listening: { item: ListeningItem; exercises: Exercise[] } | null
}

/** Chuẩn bị bài vượt cấp 20 câu cho một chặng: câu lấy từ chính nội dung của chặng đó. null nếu chặng không có nội dung. */
export async function getLeapPayload(bac: number, stepInBac: number): Promise<LeapPayload | null> {
  const step = (await getPath()).find((s) => s.bac === bac && s.stepInBac === stepInBac)
  if (!step || step.lessons.length === 0) return null
  const plan = planLeap(step)

  const topics = [...new Set(step.lessons.filter((l) => l.kind === "grammar").map((l) => l.ref.topic!))]
  const grammarPool = (await Promise.all(topics.map((t) => getExercises("en", t)))).flat().filter((e) => e.bac === bac)
  const grammar = shuffle(grammarPool).slice(0, plan.grammar).sort((a, b) => a.difficulty - b.difficulty)

  let vocab: Exercise[] = []
  const level = VOCAB_LEVELS.find((l) => l.bac === bac)
  const words = level ? await getVocab(level.id) : null
  if (level && words && plan.vocab > 0) {
    const targets = step.lessons
      .filter((l) => l.kind === "vocab" && l.ref.slices !== undefined && l.ref.slice !== undefined)
      .flatMap((l) => words.slice(Math.floor((l.ref.slice! * words.length) / l.ref.slices!), Math.floor(((l.ref.slice! + 1) * words.length) / l.ref.slices!)))
    vocab = pickVocabRound(words, level.id, plan.vocab, Math.random, targets)
  }

  const pickId = (kind: "reading" | "listening") => {
    const ids = step.lessons.filter((l) => l.kind === kind && l.ref.itemId).map((l) => l.ref.itemId!)
    return ids.length ? ids[Math.floor(Math.random() * ids.length)] : null
  }
  let reading: LeapPayload["reading"] = null
  const readingId = plan.reading ? pickId("reading") : null
  if (readingId) {
    const passage = ((await getReadingPassages(bac)) ?? []).find((p) => p.id === readingId)
    if (passage) reading = { passage, exercises: passageToExercises(passage), gloss: await glossFor(passage.text) }
  }
  let listening: LeapPayload["listening"] = null
  const listeningId = plan.listening ? pickId("listening") : null
  if (listeningId) {
    const item = ((await getListeningItems(bac)) ?? []).find((p) => p.id === listeningId)
    if (item) listening = { item, exercises: itemToExercises(item) }
  }
  return { bac, stepInBac, plan, items: [...grammar, ...vocab], reading, listening }
}
