import Link from "next/link"
import { connection } from "next/server"
import { notFound } from "next/navigation"
import { getExercises, getGrammarTopic } from "@/lib/content/grammar"
import { pickHardRound, pickRound, pickRoundForTag } from "@/lib/content/rounds"
import { PracticeSession } from "./practice-session"

/** Một lượt luyện của một chuyên đề. Mỗi lần mở là một lượt câu khác nhau (chạy lúc có yêu cầu, không dựng sẵn lúc build). */
export async function PracticeRound({ topic, mode = "normal", tag }: { topic: string; mode?: "normal" | "hard"; tag?: string }) {
  await connection()
  const data = await getGrammarTopic("en", topic)
  if (!data) notFound()
  const all = await getExercises("en", topic)
  if (!all.length) notFound()

  const tagLabel = tag ? data.theory.usages.find((u) => u.id === tag)?.label : undefined
  const exercises = mode === "hard" ? pickHardRound(all) : tagLabel ? pickRoundForTag(all, tag!) : pickRound(all)
  const title = mode === "hard" ? "Nhức đầu 🔥" : tagLabel ? "Luyện lại" : "Luyện tập"
  const subtitle = mode === "hard" ? "10 câu khó nhất của chuyên đề này." : tagLabel

  return (
    <>
      <Link href={`/hoc/${topic}`} className="text-sm text-primary underline underline-offset-4">
        ← {data.title}
      </Link>
      <h1 className="mt-2 text-3xl font-extrabold">{title}</h1>
      {subtitle && <p className="mb-4 text-muted-foreground">{subtitle}</p>}
      {!subtitle && <div className="mb-4" />}
      <PracticeSession exercises={exercises} theoryBase={`/hoc/${topic}`} />
    </>
  )
}
