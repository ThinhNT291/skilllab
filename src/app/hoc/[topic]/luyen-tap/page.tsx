import { Suspense } from "react"
import Link from "next/link"
import { connection } from "next/server"
import { notFound } from "next/navigation"
import { PracticeSession } from "@/components/exercise/practice-session"
import { getExercises, getGrammarTopic, listGrammarTopics } from "@/lib/content/grammar"
import type { Exercise } from "@/lib/content/types"

/** Mỗi lượt 10 câu: bốc ngẫu nhiên trong từng mức độ khó rồi xếp dễ → khó (chống học vẹt nhưng vẫn mạch dễ → khó). */
const ROUND_QUOTA: Record<1 | 2 | 3, number> = { 1: 4, 2: 3, 3: 3 }

export function generateStaticParams() {
  return listGrammarTopics("en").map((t) => ({ topic: t.id }))
}

function shuffle<T>(list: T[]): T[] {
  const copy = [...list]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function pickRound(all: Exercise[]): Exercise[] {
  const total = Object.values(ROUND_QUOTA).reduce((a, b) => a + b, 0)
  const byLevel = { 1: shuffle(all.filter((e) => e.difficulty === 1)), 2: shuffle(all.filter((e) => e.difficulty === 2)), 3: shuffle(all.filter((e) => e.difficulty === 3)) }
  const picked: Exercise[] = []
  const leftovers: Exercise[] = []
  for (const level of [1, 2, 3] as const) {
    picked.push(...byLevel[level].slice(0, ROUND_QUOTA[level]))
    leftovers.push(...byLevel[level].slice(ROUND_QUOTA[level]))
  }
  // Mức nào thiếu câu thì bù từ các câu còn lại, để lượt luôn đủ 10 câu khi ngân hàng đủ lớn.
  picked.push(...shuffle(leftovers).slice(0, Math.max(0, total - picked.length)))
  return picked.sort((a, b) => a.difficulty - b.difficulty)
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
