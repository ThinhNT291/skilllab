import { Suspense } from "react"
import Link from "next/link"
import { connection } from "next/server"
import { notFound } from "next/navigation"
import { CONFUSABLE_GROUPS, findGroup, interleave } from "@/lib/content/interleave"
import { getExercises, getGrammarTopic } from "@/lib/content/grammar"
import { pickRound } from "@/lib/content/rounds"
import { mixVariants } from "@/lib/content/derive"
import { buildRuleHints, type RuleHints } from "@/lib/content/rule-hints"
import { PracticeSession } from "@/components/exercise/practice-session"

export const metadata = { title: "Luyện xen kẽ" }

export function generateStaticParams() {
  return CONFUSABLE_GROUPS.map((g) => ({ group: g.id }))
}

export default function Page({ params }: PageProps<"/luyen-xen-ke/[group]">) {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 [&>*]:max-w-4xl">
      <Suspense fallback={<p className="text-muted-foreground">Đang tải…</p>}>
        <Round params={params} />
      </Suspense>
    </main>
  )
}

async function Round({ params }: { params: PageProps<"/luyen-xen-ke/[group]">["params"] }) {
  await connection()
  const group = findGroup((await params).group)
  if (!group) notFound()
  const parts = await Promise.all(
    group.topics.map(async (id) => ({ id, data: await getGrammarTopic("en", id), all: await getExercises("en", id) })),
  )
  const usable = parts.filter((p) => p.data && p.all.length)
  if (usable.length < 2) notFound()
  const rules: RuleHints = Object.assign({}, ...usable.map((p) => buildRuleHints(p.data!.theory, p.id)))
  // Mỗi chuyên đề góp một lượt chọn sẵn (dễ → khó), rồi trộn vòng tròn để hai câu liền nhau khác chuyên đề.
  const exercises = mixVariants(interleave(usable.map((p) => pickRound(p.all)), 12))
  return (
    <>
      <Link href="/luyen-xen-ke" className="text-sm text-primary underline underline-offset-4">
        ← Luyện xen kẽ
      </Link>
      <h1 className="mt-2 text-3xl font-extrabold">{group.label}</h1>
      <p className="mb-4 text-muted-foreground">Mỗi câu có thể thuộc một chuyên đề khác nhau. Đọc kỹ dấu hiệu trong câu để chọn đúng cách dùng.</p>
      <PracticeSession exercises={exercises} byTopic rules={rules} />
    </>
  )
}
