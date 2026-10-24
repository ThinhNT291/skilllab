import { ReviewSession } from "@/components/srs/review-session"
import { buildTagCatalog } from "@/lib/content/catalog"

export const metadata = { title: "Ôn tập" }

export default async function ReviewPage() {
  const { topicTitles } = await buildTagCatalog()
  return (
    <main className="mx-auto w-full max-w-xl px-4 py-6">
      <h1 className="mb-1 text-3xl font-extrabold">Ôn tập</h1>
      <p className="mb-4 text-muted-foreground">Thẻ tự tạo từ những câu bạn từng trả lời sai.</p>
      <ReviewSession topicTitles={topicTitles} />
    </main>
  )
}
