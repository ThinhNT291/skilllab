import { Suspense } from "react"
import Link from "next/link"
import { connection } from "next/server"
import { notFound } from "next/navigation"
import { PracticeSession } from "@/components/exercise/practice-session"
import { WordList } from "@/components/vocab/word-list"
import { findTopic, loadTopic, VOCAB_TOPICS } from "@/lib/vocab/topics"
import { pickTopicRound } from "@/lib/vocab/topic-round"

export const metadata = { title: "Từ vựng theo chủ đề" }

export function generateStaticParams() {
  return VOCAB_TOPICS.map((t) => ({ topic: t.id }))
}

export default function TopicPage({ params }: PageProps<"/tu-vung/chu-de/[topic]">) {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 [&>*]:max-w-2xl">
      <Suspense fallback={<p className="text-muted-foreground">Đang tải…</p>}>
        <Round params={params} />
      </Suspense>
    </main>
  )
}

async function Round({ params }: { params: PageProps<"/tu-vung/chu-de/[topic]">["params"] }) {
  await connection()
  const { topic } = await params
  const meta = findTopic(topic)
  const loaded = await loadTopic(topic)
  if (!meta || !loaded) notFound()
  const exercises = pickTopicRound(loaded.entries, loaded.pools)
  const words = [...loaded.entries].sort((a, b) => a.word.word.localeCompare(b.word.word))
  return (
    <>
      <Link href="/tu-vung/chu-de" className="text-sm text-primary underline underline-offset-4">
        ← Các chủ đề
      </Link>
      <h1 className="mt-2 text-3xl font-extrabold">
        <span aria-hidden="true">{meta.icon} </span>
        {meta.label}
      </h1>
      <div className="mb-4" />
      {exercises.length > 0 ? <PracticeSession exercises={exercises} /> : <p className="text-muted-foreground">Chủ đề này chưa đủ từ để tạo bài.</p>}
      <WordList entries={words} />
    </>
  )
}
