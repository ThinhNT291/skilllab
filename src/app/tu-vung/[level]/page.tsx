import { Suspense } from "react"
import Link from "next/link"
import { connection } from "next/server"
import { notFound } from "next/navigation"
import { PracticeSession } from "@/components/exercise/practice-session"
import { getVocab } from "@/lib/vocab/data"
import { pickVocabRound, VOCAB_LEVELS } from "@/lib/vocab/questions"
import { bacLabel } from "@/lib/content/bac"

export const metadata = { title: "Luyện từ vựng" }

export function generateStaticParams() {
  return VOCAB_LEVELS.map((l) => ({ level: l.id }))
}

export default function VocabRoundPage({ params }: PageProps<"/tu-vung/[level]">) {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 [&>*]:max-w-2xl">
      <Suspense fallback={<p className="text-muted-foreground">Đang tải bài tập…</p>}>
        <Round params={params} />
      </Suspense>
    </main>
  )
}

async function Round({ params }: { params: PageProps<"/tu-vung/[level]">["params"] }) {
  await connection()
  const { level } = await params
  const meta = VOCAB_LEVELS.find((l) => l.id === level)
  const words = await getVocab(level)
  if (!meta || !words) notFound()
  const exercises = pickVocabRound(words, meta.id)
  return (
    <>
      <Link href="/tu-vung" className="text-sm text-primary underline underline-offset-4">
        ← Từ vựng
      </Link>
      <h1 className="mt-2 text-3xl font-extrabold">Từ vựng {bacLabel(meta.bac)}</h1>
      <div className="mb-4" />
      <PracticeSession exercises={exercises} />
    </>
  )
}
