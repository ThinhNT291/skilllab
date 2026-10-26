import { Suspense } from "react"
import { PracticeRound } from "@/components/exercise/practice-round"
import { listGrammarTopics } from "@/lib/content/grammar"

export function generateStaticParams() {
  return listGrammarTopics("en").map((t) => ({ topic: t.id }))
}

export default function PracticePage({ params, searchParams }: PageProps<"/hoc/[topic]/luyen-tap">) {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 [&>*]:max-w-4xl">
      <Suspense fallback={<p className="text-muted-foreground">Đang tải bài tập…</p>}>
        <Round params={params} searchParams={searchParams} />
      </Suspense>
    </main>
  )
}

async function Round({ params, searchParams }: { params: PageProps<"/hoc/[topic]/luyen-tap">["params"]; searchParams: PageProps<"/hoc/[topic]/luyen-tap">["searchParams"] }) {
  const { topic } = await params
  const { tag } = await searchParams
  return <PracticeRound topic={topic} tag={typeof tag === "string" ? tag : undefined} />
}
