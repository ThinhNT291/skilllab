import Link from "next/link"
import { ReviewSession } from "@/components/srs/review-session"
import { buildTagCatalog } from "@/lib/content/catalog"

export const metadata = { title: "Ôn tập" }

export default async function ReviewPage() {
  const { topicTitles } = await buildTagCatalog()
  return (
    <main className="mx-auto w-full max-w-xl px-4 py-6">
      <h1 className="mb-1 text-3xl font-extrabold">Ôn tập</h1>
      <p className="mb-4 text-muted-foreground">
        Thẻ tự tạo từ những câu bạn từng trả lời sai. Mỗi ngày tối đa 10 thẻ mới. <Link href="/on-tap/quan-ly" className="text-primary underline underline-offset-4">Quản lý thẻ</Link>
      </p>
      <ReviewSession topicTitles={topicTitles} />
    </main>
  )
}
