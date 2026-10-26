import { LevelHint } from "@/components/level-hint"
import Link from "next/link"
import { getListeningItems } from "@/lib/listening/data"
import { LISTENING_BACS } from "@/lib/listening/types"
import { bacLabel } from "@/lib/content/bac"

export const metadata = { title: "Nghe hiểu" }

export default async function ListeningHome() {
  const counts = await Promise.all(LISTENING_BACS.map(async (b) => (await getListeningItems(b))?.length ?? 0))
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6">
      <h1 className="text-3xl font-extrabold">Nghe hiểu</h1>
      <p className="mb-4 text-muted-foreground">Nghe một đoạn hội thoại hoặc thông báo rồi trả lời 4 câu hỏi. Lời thoại chỉ hiện sau khi bạn làm xong. Đúng từ 75% là đạt.</p>
      <LevelHint skill="listening" placementHref="/xep-trinh-do/nghe" />
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {LISTENING_BACS.map((b, i) => (
          <li key={b}>
            {counts[i] > 0 ? (
              <Link href={`/nghe/${b}`} className="block rounded-game border-2 border-border bg-card px-4 py-4 hover:border-primary">
                <span className="text-xl font-extrabold">{bacLabel(b)}</span>
                <span className="block text-muted-foreground">{counts[i]} bài nghe</span>
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
