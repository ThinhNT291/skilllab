import { Suspense } from "react"
import Link from "next/link"
import { connection } from "next/server"
import { notFound } from "next/navigation"
import { PassagePlacement, VocabPlacement } from "@/components/placement/skill-placement"
import { getReadingPassages, glossFor, pickPassage } from "@/lib/reading/data"
import { getListeningItems, pickListening } from "@/lib/listening/data"
import type { ReadingPassage } from "@/lib/reading/types"
import type { ListeningItem } from "@/lib/listening/types"
import { getVocab } from "@/lib/vocab/data"
import { pickVocabRound, VOCAB_LEVELS } from "@/lib/vocab/questions"

const SKILLS = {
  "tu-vung": { title: "Xếp trình độ Từ vựng", intro: "12 câu từ cấp A1 đến B2 để biết nên bắt đầu ở cấp nào." },
  doc: { title: "Xếp trình độ Đọc hiểu", intro: "Tối đa 3 bài đọc ngắn. Làm tốt thì bài sau khó hơn, chưa tốt thì dễ lại." },
  nghe: { title: "Xếp trình độ Nghe hiểu", intro: "Tối đa 3 bài nghe ngắn. Làm tốt thì bài sau khó hơn, chưa tốt thì dễ lại. Cần bật loa." },
} as const
type SkillKey = keyof typeof SKILLS

export function generateStaticParams() {
  return (Object.keys(SKILLS) as SkillKey[]).map((skill) => ({ skill }))
}

export async function generateMetadata({ params }: PageProps<"/xep-trinh-do/[skill]">) {
  const { skill } = await params
  return { title: SKILLS[skill as SkillKey]?.title ?? "Xếp trình độ" }
}

export default function Page({ params }: PageProps<"/xep-trinh-do/[skill]">) {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 [&>*]:max-w-2xl">
      <Suspense fallback={<p className="text-muted-foreground">Đang chọn bài…</p>}>
        <Body params={params} />
      </Suspense>
    </main>
  )
}

async function Body({ params }: { params: PageProps<"/xep-trinh-do/[skill]">["params"] }) {
  await connection()
  const key = (await params).skill as SkillKey
  const meta = SKILLS[key]
  if (!meta) notFound()

  let body: React.ReactNode
  if (key === "tu-vung") {
    const parts = await Promise.all(VOCAB_LEVELS.filter((l) => l.bac <= 4).map(async (l) => pickVocabRound((await getVocab(l.id)) ?? [], l.id, 3)))
    const exercises = parts.flat()
    if (exercises.length < 8) notFound()
    body = <VocabPlacement exercises={exercises} />
  } else if (key === "doc") {
    const stages: Record<number, { kind: "reading"; passage: ReadingPassage; gloss: Record<string, string> }> = {}
    for (const bac of [1, 2, 3, 4]) {
      const list = await getReadingPassages(bac)
      if (!list?.length) continue
      const passage = pickPassage(list)
      stages[bac] = { kind: "reading", passage, gloss: await glossFor(passage.text) }
    }
    if (!stages[2]) notFound()
    body = <PassagePlacement stages={stages} />
  } else {
    const stages: Record<number, { kind: "listening"; item: ListeningItem }> = {}
    for (const bac of [1, 2, 3, 4]) {
      const list = await getListeningItems(bac)
      if (list?.length) stages[bac] = { kind: "listening", item: pickListening(list) }
    }
    if (!stages[2]) notFound()
    body = <PassagePlacement stages={stages} />
  }
  return (
    <>
      <Link href="/xep-trinh-do" className="text-sm text-primary underline underline-offset-4">
        ← Xếp trình độ
      </Link>
      <h1 className="mt-2 text-3xl font-extrabold">{meta.title}</h1>
      <p className="mb-4 text-muted-foreground">{meta.intro} Không tính điểm xếp hạng.</p>
      {body}
    </>
  )
}
