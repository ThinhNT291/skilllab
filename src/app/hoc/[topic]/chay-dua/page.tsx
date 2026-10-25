import { Suspense } from "react"
import { PracticeRound } from "@/components/exercise/practice-round"
import { listGrammarTopics } from "@/lib/content/grammar"

export const metadata = { title: "Xếp từ chạy đua" }

export function generateStaticParams() {
  return listGrammarTopics("en").map((t) => ({ topic: t.id }))
}

export default function Page({ params }: PageProps<"/hoc/[topic]/chay-dua">) {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 [&>*]:max-w-2xl">
      <Suspense fallback={<p className="text-muted-foreground">Đang tải…</p>}>
        <Round params={params} />
      </Suspense>
    </main>
  )
}

async function Round({ params }: { params: PageProps<"/hoc/[topic]/chay-dua">["params"] }) {
  const { topic } = await params
  return <PracticeRound topic={topic} mode="race" />
}
