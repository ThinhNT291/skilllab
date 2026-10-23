import { Suspense } from "react"
import Link from "next/link"
import { connection } from "next/server"
import { notFound } from "next/navigation"
import { PracticeSession } from "@/components/exercise/practice-session"
import { getExercises, getGrammarTopic, listGrammarTopics } from "@/lib/content/grammar"
import type { Exercise } from "@/lib/content/types"

const ROUND_SIZE = 10

export function generateStaticParams() {
  return listGrammarTopics("en").map((t) => ({ topic: t.id }))
}

function pickRound(all: Exercise[]): Exercise[] {
  const copy = [...all]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy.slice(0, ROUND_SIZE)
}

export default function PracticePage({ params }: PageProps<"/hoc/[topic]/luyen-tap">) {
  return (
    <main className="mx-auto w-full max-w-xl px-4 py-6">
      <Suspense fallback={<p className="text-muted-foreground">Đang tải bài tập…</p>}>
        <Round params={params} />
      </Suspense>
    </main>
  )
}

/** Mỗi lần mở là một lượt câu xáo ngẫu nhiên khác nhau (chạy lúc có yêu cầu, không dựng sẵn lúc build). */
async function Round({ params }: { params: PageProps<"/hoc/[topic]/luyen-tap">["params"] }) {
  await connection()
  const { topic } = await params
  const data = await getGrammarTopic("en", topic)
  if (!data) notFound()
  const exercises = pickRound(await getExercises("en", topic))
  if (!exercises.length) notFound()

  return (
    <>
      <Link href={`/hoc/${topic}`} className="text-sm text-primary underline underline-offset-4">
        ← {data.title}
      </Link>
      <h1 className="mb-4 mt-2 text-3xl font-extrabold">Luyện tập</h1>
      <PracticeSession exercises={exercises} theoryBase={`/hoc/${topic}`} />
    </>
  )
}
