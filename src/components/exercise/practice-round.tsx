import Link from "next/link"
import { connection } from "next/server"
import { notFound } from "next/navigation"
import { getExercises, getGrammarTopic } from "@/lib/content/grammar"
import { deriveDictation, mixVariants, shuffle } from "@/lib/content/derive"
import { pickMatchPairs } from "@/lib/content/match"
import { MatchSession } from "@/components/game/match-session"
import { pickHardRound, pickRound, pickRoundForTag } from "@/lib/content/rounds"
import { TestSession } from "./test-session"
import { PracticeSession } from "./practice-session"

/** Một lượt luyện của một chuyên đề. Mỗi lần mở là một lượt câu khác nhau (chạy lúc có yêu cầu, không dựng sẵn lúc build). */
export async function PracticeRound({ topic, mode = "normal", tag }: { topic: string; mode?: "normal" | "hard" | "dictation" | "match" | "test"; tag?: string }) {
  await connection()
  const data = await getGrammarTopic("en", topic)
  if (!data) notFound()
  const all = await getExercises("en", topic)
  if (!all.length) notFound()

  const tagLabel = tag ? data.theory.usages.find((u) => u.id === tag)?.label : undefined
  if (mode === "match") {
    const pairs = pickMatchPairs(all)
    if (!pairs.length) notFound()
    return (
      <>
        <Link href={`/hoc/${topic}`} className="text-sm text-primary underline underline-offset-4">
          ← {data.title}
        </Link>
        <h1 className="mt-2 text-3xl font-extrabold">Ghép cặp ⏱</h1>
        <p className="mb-4 text-muted-foreground">Ghép mỗi câu với từ điền đúng chỗ trống, càng nhanh càng tốt.</p>
        <MatchSession pairs={pairs} />
      </>
    )
  }

  if (mode === "test") {
    // Bài kiểm tra chỉ dùng câu trắc nghiệm đã kiểm định, không trộn biến thể, để chuẩn đạt công bằng giữa các lần làm.
    const questions = pickRound(all.filter((e) => e.kind === "mcq"))
    if (questions.length < 10) notFound()
    return (
      <>
        <Link href={`/hoc/${topic}`} className="text-sm text-primary underline underline-offset-4">
          ← {data.title}
        </Link>
        <h1 className="mt-2 text-3xl font-extrabold">Kiểm tra cuối chủ điểm 🏅</h1>
        <p className="mb-4 text-muted-foreground">10 câu, đúng từ 8 câu là đạt. Làm hết lượt mới biết kết quả.</p>
        <TestSession exercises={questions} topic={topic} topicTitle={data.title} />
      </>
    )
  }

  // Chế độ thường và luyện lại trộn thêm vài câu sắp xếp/gõ; nhức đầu giữ trắc nghiệm khó; nghe chép gồm toàn câu nghe.
  const exercises =
    mode === "hard"
      ? pickHardRound(all)
      : mode === "dictation"
        ? shuffle(all).flatMap((e) => (e.kind === "mcq" ? (deriveDictation(e) ?? []) : [])).slice(0, 8)
        : mixVariants(tagLabel ? pickRoundForTag(all, tag!) : pickRound(all))
  if (!exercises.length) notFound()
  const title = mode === "hard" ? "Nhức đầu 🔥" : mode === "dictation" ? "Nghe chép 🎧" : tagLabel ? "Luyện lại" : "Luyện tập"
  const subtitle = mode === "hard" ? "10 câu khó nhất của chuyên đề này." : mode === "dictation" ? "Nghe câu rồi gõ lại. Có thể nghe chậm." : tagLabel

  return (
    <>
      <Link href={`/hoc/${topic}`} className="text-sm text-primary underline underline-offset-4">
        ← {data.title}
      </Link>
      <h1 className="mt-2 text-3xl font-extrabold">{title}</h1>
      {subtitle && <p className="mb-4 text-muted-foreground">{subtitle}</p>}
      {!subtitle && <div className="mb-4" />}
      <PracticeSession exercises={exercises} theoryBase={`/hoc/${topic}`} bonusHref={pickMatchPairs(all, () => 0.5).length > 0 ? `/hoc/${topic}/ghep-cap` : undefined} />
    </>
  )
}
