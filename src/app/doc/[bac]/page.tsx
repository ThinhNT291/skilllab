import { Suspense } from "react"
import Link from "next/link"
import { connection } from "next/server"
import { notFound } from "next/navigation"
import { ReadingSession } from "@/components/reading/reading-session"
import { glossFor, getReadingPassages, pickPassage } from "@/lib/reading/data"
import { passageToExercises, READING_BACS } from "@/lib/reading/types"
import { bacLabel } from "@/lib/content/bac"

export const metadata = { title: "Đọc hiểu" }

export function generateStaticParams() {
  return READING_BACS.map((b) => ({ bac: String(b) }))
}

export default function ReadingPage({ params }: PageProps<"/doc/[bac]">) {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 [&>*]:max-w-4xl">
      <Suspense fallback={<p className="text-muted-foreground">Đang tải bài đọc…</p>}>
        <Passage params={params} />
      </Suspense>
    </main>
  )
}

async function Passage({ params }: { params: PageProps<"/doc/[bac]">["params"] }) {
  await connection()
  const { bac } = await params
  const passages = await getReadingPassages(Number(bac))
  if (!passages || !passages.length) notFound()
  const passage = pickPassage(passages)
  const gloss = await glossFor(passage.text)
  return (
    <>
      <Link href="/doc" className="text-sm text-primary underline underline-offset-4">
        ← Đọc hiểu
      </Link>
      <h1 className="mt-2 mb-4 text-3xl font-extrabold">Đọc hiểu {bacLabel(passage.bac)}</h1>
      <ReadingSession passage={passage} exercises={passageToExercises(passage)} gloss={gloss} />
    </>
  )
}
