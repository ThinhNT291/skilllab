import Link from "next/link"
import { TopicMap } from "@/components/progress/topic-map"
import type { RoadStage } from "@/components/progress/topic-road"
import { getExercises, listGrammarTopics } from "@/lib/content/grammar"
import type { GrammarCategory } from "@/lib/content/types"

export const metadata = { title: "Học ngữ pháp" }

const CATEGORIES: { id: GrammarCategory; label: string }[] = [
  { id: "tenses", label: "Các thì" },
  { id: "word-classes", label: "Từ loại" },
  { id: "sentence-structure", label: "Cấu trúc câu" },
]

export default async function LearnPage() {
  const topics = listGrammarTopics("en")
  const counts = new Map(await Promise.all(topics.map(async (t) => [t.id, (await getExercises("en", t.id)).length] as const)))

  const categories = CATEGORIES.map((cat) => ({
    id: cat.id,
    label: cat.label,
    topics: topics.filter((t) => t.category === cat.id).map((t) => ({ id: t.id, title: t.title, hasExercises: (counts.get(t.id) ?? 0) > 0 })),
  }))

  // Chặng theo cấp CEFR đầu tiên của chuyên đề (A1…C2); chặng chưa có chuyên đề hiện "sắp có".
  const STAGES = [["A1", "A1 · Bậc 1"], ["A2", "A2 · Bậc 2"], ["B1", "B1 · Bậc 3"], ["B2", "B2 · Bậc 4"], ["C1", "C1 · Bậc 5"], ["C2", "C2 · Bậc 6"]] as const
  const stages: RoadStage[] = STAGES.map(([lv, label]) => {
    const list = topics.filter((t) => t.levels[0] === lv).sort((a, b) => a.order - b.order)
    return { id: lv, label, comingSoon: list.length === 0, topics: list.map((t) => ({ id: t.id, title: t.title, hasExercises: (counts.get(t.id) ?? 0) > 0 })) }
  })

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6">
      <h1 className="mb-1 text-3xl font-extrabold">Học ngữ pháp</h1>
      <p className="mb-4 text-muted-foreground">Tiếng Anh · {topics.length} chuyên đề</p>
      <Link href="/xep-trinh-do" className="mb-6 flex items-center justify-between gap-3 rounded-game border-2 border-accent bg-card px-4 py-3 hover:border-primary">
        <span className="font-extrabold">🧭 Chưa biết học từ đâu? Làm bài xếp trình độ (20 câu)</span>
      </Link>

      <TopicMap categories={categories} stages={stages} />
    </main>
  )
}
