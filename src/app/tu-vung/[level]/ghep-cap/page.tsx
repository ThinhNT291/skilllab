import { Suspense } from "react"
import Link from "next/link"
import { connection } from "next/server"
import { notFound } from "next/navigation"
import { MatchSession } from "@/components/game/match-session"
import { getVocab } from "@/lib/vocab/data"
import { pickVocabMatchPairs, VOCAB_LEVELS } from "@/lib/vocab/questions"

export const metadata = { title: "Ghép từ" }

export function generateStaticParams() {
  return VOCAB_LEVELS.map((l) => ({ level: l.id }))
}

export default function VocabMatchPage({ params }: PageProps<"/tu-vung/[level]/ghep-cap">) {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 [&>*]:max-w-2xl">
      <Suspense fallback={<p className="text-muted-foreground">Đang tải…</p>}>
        <Game params={params} />
      </Suspense>
    </main>
  )
}

async function Game({ params }: { params: PageProps<"/tu-vung/[level]/ghep-cap">["params"] }) {
  await connection()
  const { level } = await params
  const meta = VOCAB_LEVELS.find((l) => l.id === level)
  const words = await getVocab(level)
  if (!meta || !words) notFound()
  const pairs = pickVocabMatchPairs(words, meta.id)
  if (!pairs.length) notFound()
  return (
    <>
      <Link href={`/tu-vung/${meta.id}`} className="text-sm text-primary underline underline-offset-4">
        ← Từ vựng {meta.label}
      </Link>
      <h1 className="mt-2 text-3xl font-extrabold">Ghép từ ⏱</h1>
      <p className="mb-4 text-muted-foreground">Ghép nghĩa tiếng Việt với từ tiếng Anh, càng nhanh càng tốt.</p>
      <MatchSession pairs={pairs} />
    </>
  )
}
