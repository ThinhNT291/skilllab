import { LevelHint } from "@/components/level-hint"
import Link from "next/link"
import { getReadingPassages } from "@/lib/reading/data"
import { READING_BACS } from "@/lib/reading/types"
import { bacLabel } from "@/lib/content/bac"

export const metadata = { title: "Đọc hiểu" }

export default async function ReadingHome() {
  const counts = await Promise.all(READING_BACS.map(async (b) => (await getReadingPassages(b))?.length ?? 0))
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6">
      <h1 className="text-3xl font-extrabold">Đọc hiểu</h1>
      <p className="mb-4 text-muted-foreground">Đọc một bài ngắn rồi trả lời 4 câu hỏi. Chạm vào từ gạch chân chấm để xem nghĩa. Đúng từ 75% là đạt.</p>
      <LevelHint skill="reading" placementHref="/xep-trinh-do/doc" />
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {READING_BACS.map((b, i) => (
          <li key={b}>
            {counts[i] > 0 ? (
              <Link href={`/doc/${b}`} className="block rounded-game border-2 border-border bg-card px-4 py-4 hover:border-primary">
                <span className="text-xl font-extrabold">{bacLabel(b)}</span>
                <span className="block text-muted-foreground">{counts[i]} bài đọc</span>
              </Link>
            ) : (
              <div className="rounded-game border-2 border-dashed border-border px-4 py-4 text-muted-foreground">
                <span className="text-xl font-extrabold">{bacLabel(b)}</span>
                <span className="block">Sắp có</span>
              </div>
            )}
          </li>
        ))}
      </ul>
    </main>
  )
}
