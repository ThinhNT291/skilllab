import { Suspense } from "react"
import Link from "next/link"
import { connection } from "next/server"
import { notFound } from "next/navigation"
import { SprintSession } from "@/components/game/sprint-session"
import { getVocab } from "@/lib/vocab/data"
import { pickVocabRound, VOCAB_LEVELS } from "@/lib/vocab/questions"

export const metadata = { title: "Thử thách 60 giây" }

export function generateStaticParams() {
  return VOCAB_LEVELS.map((l) => ({ level: l.id }))
}

export default function SprintPage({ params }: PageProps<"/tu-vung/[level]/thu-thach">) {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 [&>*]:max-w-4xl">
      <Suspense fallback={<p className="text-muted-foreground">Đang tải…</p>}>
        <Game params={params} />
      </Suspense>
    </main>
  )
}

async function Game({ params }: { params: PageProps<"/tu-vung/[level]/thu-thach">["params"] }) {
  await connection()
  const { level } = await params
  const meta = VOCAB_LEVELS.find((l) => l.id === level)
  const words = await getVocab(level)
  if (!meta || !words) notFound()
  const exercises = pickVocabRound(words, meta.id, 40)
  return (
    <>
      <Link href={`/tu-vung/${meta.id}`} className="text-sm text-primary underline underline-offset-4">
        ← Từ vựng {meta.label}
      </Link>
      <h1 className="mt-2 text-3xl font-extrabold">Thử thách 60 giây ⚡</h1>
      <p className="mb-4 text-muted-foreground">Chọn nhanh nghĩa hoặc từ đúng, càng nhiều càng tốt.</p>
      <SprintSession exercises={exercises} bestKey={`skilllab.sprintBest.${meta.id}`} backHref={`/tu-vung/${meta.id}`} />
    </>
  )
}
