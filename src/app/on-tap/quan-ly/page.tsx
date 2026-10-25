import Link from "next/link"
import { AlgorithmPicker } from "@/components/srs/algorithm-picker"
import { NewLimitPicker } from "@/components/srs/new-limit-picker"
import { CardManager } from "@/components/srs/card-manager"
import { buildTagCatalog } from "@/lib/content/catalog"

export const metadata = { title: "Quản lý thẻ" }

export default async function CardsPage() {
  const { topicTitles } = await buildTagCatalog()
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6">
      <Link href="/on-tap" className="text-sm text-primary underline underline-offset-4">
        ← Ôn tập
      </Link>
      <h1 className="mb-3 mt-2 text-3xl font-extrabold">Quản lý thẻ</h1>
      <AlgorithmPicker />
      <NewLimitPicker />
      <CardManager topicTitles={topicTitles} />
    </main>
  )
}
