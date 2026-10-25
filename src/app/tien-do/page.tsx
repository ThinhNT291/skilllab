import { ProgressView } from "@/components/progress/progress-view"
import { buildTagCatalog } from "@/lib/content/catalog"
import { getScaleTotals } from "@/lib/progress/totals"

export const metadata = { title: "Tiến độ" }

export default async function ProgressPage() {
  const { catalog, topicTitles } = await buildTagCatalog()
  const scaleTotals = await getScaleTotals()
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6">
      <h1 className="mb-4 text-3xl font-extrabold">Tiến độ của bạn</h1>
      <ProgressView catalog={catalog} topicTitles={topicTitles} scaleTotals={scaleTotals} />
    </main>
  )
}
