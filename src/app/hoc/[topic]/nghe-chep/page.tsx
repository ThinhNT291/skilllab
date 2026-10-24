import { Suspense } from "react"
import { PracticeRound } from "@/components/exercise/practice-round"
import { listGrammarTopics } from "@/lib/content/grammar"

export const metadata = { title: "Nghe chép" }

export function generateStaticParams() {
  return listGrammarTopics("en").map((t) => ({ topic: t.id }))
}

export default function DictationPage({ params }: PageProps<"/hoc/[topic]/nghe-chep">) {
  return (
    <main className="mx-auto w-full max-w-xl px-4 py-6">
      <Suspense fallback={<p className="text-muted-foreground">Đang tải bài tập…</p>}>
        <Round params={params} />
      </Suspense>
    </main>
  )
}

async function Round({ params }: { params: PageProps<"/hoc/[topic]/nghe-chep">["params"] }) {
  const { topic } = await params
  return <PracticeRound topic={topic} mode="dictation" />
}
