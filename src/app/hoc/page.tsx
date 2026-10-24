import Link from "next/link"
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

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-6">
      <h1 className="mb-1 text-3xl font-extrabold">Học ngữ pháp</h1>
      <p className="mb-4 text-muted-foreground">Tiếng Anh · {topics.length} chuyên đề</p>
      <Link href="/xep-trinh-do" className="mb-6 flex items-center justify-between gap-3 rounded-game border-2 border-accent bg-card px-4 py-3 hover:border-primary">
        <span className="font-extrabold">🧭 Chưa biết học từ đâu? Làm bài xếp trình độ (20 câu)</span>
      </Link>

      {CATEGORIES.map((cat) => {
        const list = topics.filter((t) => t.category === cat.id)
        if (!list.length) return null
        return (
          <section key={cat.id} className="mb-6">
            <h2 className="mb-2 text-sm uppercase tracking-wide text-muted-foreground">{cat.label}</h2>
            <ul className="space-y-2">
              {list.map((t) => (
                <li key={t.id}>
                  <Link href={`/hoc/${t.id}`} className="flex items-center justify-between gap-3 rounded-game border-2 border-border bg-card px-4 py-3 hover:border-primary">
                    <span className="font-extrabold">{t.title}</span>
                    <span className="flex shrink-0 items-center gap-2 text-sm">
                      {(counts.get(t.id) ?? 0) > 0 && <span className="rounded-full bg-success-soft px-2 py-0.5 text-success">Có bài tập</span>}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </main>
  )
}
