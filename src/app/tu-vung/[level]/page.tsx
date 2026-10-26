import { Suspense } from "react"
import Link from "next/link"
import { connection } from "next/server"
import { notFound } from "next/navigation"
import { PracticeSession } from "@/components/exercise/practice-session"
import { getVocab } from "@/lib/vocab/data"
import { pickVocabMatchPairs, pickVocabRound, VOCAB_LEVELS } from "@/lib/vocab/questions"
import { bacLabel } from "@/lib/content/bac"

export const metadata = { title: "Luyện từ vựng" }

export function generateStaticParams() {
  return VOCAB_LEVELS.map((l) => ({ level: l.id }))
}

export default function VocabRoundPage({ params }: PageProps<"/tu-vung/[level]">) {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 [&>*]:max-w-4xl">
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
      <Link href={`/tu-vung/${meta.id}/thu-thach`} className="mb-4 mt-1 inline-block rounded-full border-2 border-accent bg-card px-4 py-1.5 font-extrabold hover:border-primary">
        ⚡ Thử thách 60 giây
      </Link>
      <PracticeSession exercises={exercises} bonusHref={pickVocabMatchPairs(words, meta.id, () => 0.5).length > 0 ? `/tu-vung/${meta.id}/ghep-cap` : undefined} />
    </>
  )
}
