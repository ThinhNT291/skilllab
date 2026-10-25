import { BossEntry } from "@/components/game/boss-entry"
import { buildTagCatalog } from "@/lib/content/catalog"

export const metadata = { title: "Trùm cuối" }

export default async function BossPage() {
  const { catalog, topicTitles } = await buildTagCatalog()
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 [&>*]:max-w-2xl">
      <h1 className="text-3xl font-extrabold">Trùm cuối 👾</h1>
      <p className="mb-4 text-muted-foreground">Trùm làm từ những mục bạn hay sai. Trả lời đúng để đánh trùm, sai mất mạng (3 mạng).</p>
      <BossEntry catalog={catalog} topicTitles={topicTitles} />
    </main>
  )
}
