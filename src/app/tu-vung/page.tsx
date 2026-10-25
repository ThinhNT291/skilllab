import Link from "next/link"
import { getVocab } from "@/lib/vocab/data"
import { VOCAB_LEVELS } from "@/lib/vocab/questions"
import { bacLabel } from "@/lib/content/bac"

export const metadata = { title: "Từ vựng" }

export default async function VocabHome() {
  const counts = await Promise.all(VOCAB_LEVELS.map(async (l) => (await getVocab(l.id))?.length ?? 0))
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6">
      <h1 className="text-3xl font-extrabold">Từ vựng</h1>
      <p className="mb-4 text-muted-foreground">Mỗi lượt 10 câu: đọc nghĩa chọn từ, hoặc điền từ vào câu. Sai thì nghĩa của từng từ hiện ngay để bạn nhớ.</p>
      <ul className="grid gap-3 sm:grid-cols-3">
        {VOCAB_LEVELS.map((l, i) => (
          <li key={l.id}>
            <Link href={`/tu-vung/${l.id}`} className="block rounded-game border-2 border-border bg-card px-4 py-4 hover:border-primary">
              <span className="text-xl font-extrabold">{bacLabel(l.bac)}</span>
              <span className="block text-muted-foreground">{counts[i]} từ</span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-sm text-muted-foreground">Danh sách từ và định nghĩa dựa trên English Vocabulary Profile (Cambridge University Press &amp; Assessment), dùng cho mục đích học tập cá nhân, phi thương mại.</p>
    </main>
  )
}
