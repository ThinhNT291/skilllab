import { Suspense } from "react"
import Link from "next/link"
import { connection } from "next/server"
import { PlacementSession } from "@/components/placement/placement-session"
import { getExercises, listGrammarTopics } from "@/lib/content/grammar"
import { pickPlacement, type PlacementTopic } from "@/lib/placement"

export const metadata = { title: "Xếp trình độ" }

export default function PlacementPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 [&>*]:max-w-4xl">
      <h1 className="text-3xl font-extrabold">Xếp trình độ</h1>
      <Link href="/xep-trinh-do/tong-hop" className="mb-4 block rounded-game border-2 border-primary bg-card p-4 hover:bg-card/80">
        <span className="block text-xl font-extrabold">🧭 Bài xếp trình độ tổng hợp (khuyên dùng)</span>
        <span className="block text-muted-foreground">36 câu gồm ngữ pháp, từ vựng, đọc và nghe; ra bậc cho từng kỹ năng và bậc tổng. Đăng nhập thì lưu được phần làm dở và kết quả.</span>
      </Link>
      <p className="mb-1 font-extrabold">Hoặc làm bài ngắn từng phần</p>
      <p className="mb-3 text-muted-foreground">Bài ngữ pháp: 20 câu ngắn từ nhiều chuyên đề để biết nên bắt đầu học từ đâu. Không tính điểm xếp hạng. Làm xong, các bài luyện và game sẽ bắt đầu vừa sức với bạn.</p>
      <nav aria-label="Xếp trình độ kỹ năng khác" className="mb-5 flex flex-wrap gap-2">
        {[
          ["/xep-trinh-do/tu-vung", "📚 Từ vựng"],
          ["/xep-trinh-do/doc", "📖 Đọc hiểu"],
          ["/xep-trinh-do/nghe", "🎧 Nghe hiểu"],
        ].map(([href, label]) => (
          <Link key={href} href={href} className="rounded-game border-2 border-border bg-card px-4 py-2 font-extrabold hover:border-primary">
            {label}
          </Link>
        ))}
      </nav>
      <Suspense fallback={<p className="text-muted-foreground">Đang chọn câu hỏi…</p>}>
        <Placement />
      </Suspense>
    </main>
  )
}

/** Mỗi lần mở là một bộ câu khác nhau, nên chạy lúc có yêu cầu. */
async function Placement() {
  await connection()
  const metas = listGrammarTopics("en")
  const topics: PlacementTopic[] = metas.map((t) => ({ id: t.id, title: t.title, firstLevel: t.levels[0], order: t.order }))
  const entries = await Promise.all(topics.map(async (topic) => ({ topic, exercises: await getExercises("en", topic.id) })))
  const exercises = pickPlacement(entries)
  if (!exercises.length) {
    return (
      <p className="rounded-game border-2 border-dashed border-border px-4 py-3 text-muted-foreground">
        Chưa đủ bài tập để xếp trình độ. <Link href="/hoc" className="text-primary underline underline-offset-4">Đến khu Học</Link>
      </p>
    )
  }
  return <PlacementSession exercises={exercises} topics={topics} />
}
