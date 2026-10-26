import Link from "next/link"
import { topicCounts, VOCAB_TOPICS } from "@/lib/vocab/topics"

export const metadata = { title: "Từ vựng theo chủ đề" }

export default function TopicsPage() {
  const counts = topicCounts()
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6">
      <Link href="/tu-vung" className="text-sm text-primary underline underline-offset-4">
        ← Từ vựng
      </Link>
      <h1 className="mt-2 text-3xl font-extrabold">Từ vựng theo chủ đề</h1>
      <p className="mb-4 text-muted-foreground">Gom các từ A1–B2 cùng chủ đề để học và nhớ theo nhóm.</p>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {VOCAB_TOPICS.map((t) => (
          <li key={t.id}>
            <Link href={`/tu-vung/chu-de/${t.id}`} className="flex items-center gap-3 rounded-game border-2 border-border bg-card px-4 py-4 hover:border-primary">
              <span aria-hidden="true" className="text-3xl">
                {t.icon}
              </span>
              <span>
                <span className="block text-lg font-extrabold">{t.label}</span>
                <span className="block text-sm text-muted-foreground">{counts[t.id]} từ</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
