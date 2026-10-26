import { Suspense } from "react"
import Link from "next/link"
import { connection } from "next/server"
import { notFound } from "next/navigation"
import { PracticeSession } from "@/components/exercise/practice-session"
import { COLLOCATION_SETS, findSet } from "@/lib/collocations/data"
import { setToExercises } from "@/lib/collocations/types"
import { shuffle } from "@/lib/content/derive"

export const metadata = { title: "Cụm từ kết hợp" }

export function generateStaticParams() {
  return COLLOCATION_SETS.map((s) => ({ set: s.id }))
}

export default function CollocationSetPage({ params }: PageProps<"/tu-vung/cum-tu/[set]">) {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 [&>*]:max-w-4xl">
      <Suspense fallback={<p className="text-muted-foreground">Đang tải…</p>}>
        <Round params={params} />
      </Suspense>
    </main>
  )
}

async function Round({ params }: { params: PageProps<"/tu-vung/cum-tu/[set]">["params"] }) {
  await connection()
  const { set: id } = await params
  const set = findSet(id)
  if (!set) notFound()
  const exercises = shuffle(setToExercises(set)).slice(0, 10)
  return (
    <>
      <Link href="/tu-vung/cum-tu" className="text-sm text-primary underline underline-offset-4">
        ← Cụm từ kết hợp
      </Link>
      <h1 className="mt-2 text-3xl font-extrabold">{set.title}</h1>
      <p className="mb-4 text-muted-foreground">{set.desc}</p>
      <PracticeSession exercises={exercises} />
    </>
  )
}
