import { Suspense } from "react"
import { PracticeRound } from "@/components/exercise/practice-round"
import { listGrammarTopics } from "@/lib/content/grammar"

export const metadata = { title: "Nhức đầu" }

export function generateStaticParams() {
  return listGrammarTopics("en").map((t) => ({ topic: t.id }))
}

export default function HardPage({ params }: PageProps<"/hoc/[topic]/nhuc-dau">) {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 [&>*]:max-w-2xl">
      <Suspense fallback={<p className="text-muted-foreground">Đang tải bài tập…</p>}>
        <Round params={params} />
      </Suspense>
    </main>
  )
}

async function Round({ params }: { params: PageProps<"/hoc/[topic]/nhuc-dau">["params"] }) {
  const { topic } = await params
  return <PracticeRound topic={topic} mode="hard" />
}
