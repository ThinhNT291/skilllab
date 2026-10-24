import Link from "next/link"
import { notFound } from "next/navigation"
import { getExercises, getGrammarTopic, listGrammarTopics } from "@/lib/content/grammar"
import { pickMatchPairs } from "@/lib/content/match"

export function generateStaticParams() {
  return listGrammarTopics("en").map((t) => ({ topic: t.id }))
}

export async function generateMetadata({ params }: PageProps<"/hoc/[topic]">) {
  const { topic } = await params
  const data = await getGrammarTopic("en", topic)
  return { title: data?.title ?? "Học ngữ pháp" }
}

export default async function TopicPage({ params }: PageProps<"/hoc/[topic]">) {
  const { topic } = await params
  const data = await getGrammarTopic("en", topic)
  if (!data) notFound()
  const exercises = await getExercises("en", topic)
  const hasExercises = exercises.length > 0
  // Chỉ hiện nút ghép cặp khi chuyên đề đủ câu để dựng cặp (kết quả không phụ thuộc may rủi vì chỉ kiểm tra có đủ hay không).
  const canMatch = pickMatchPairs(exercises, () => 0.5).length > 0
  const { theory } = data

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-6">
      <Link href="/hoc" className="text-sm text-primary underline underline-offset-4">
        ← Danh sách chuyên đề
      </Link>
      <h1 className="mt-2 text-3xl font-extrabold">{data.title}</h1>

      {hasExercises ? (
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href={`/hoc/${topic}/luyen-tap`}
            className="inline-block rounded-game border-b-[5px] border-primary-deep bg-primary px-6 py-3 text-lg font-extrabold text-primary-foreground active:translate-y-[3px] active:border-b-2"
          >
            Luyện chủ điểm này
          </Link>
          <Link
            href={`/hoc/${topic}/nhuc-dau`}
            className="inline-block rounded-game border-2 border-b-[5px] border-accent-deep bg-card px-6 py-3 text-lg font-extrabold text-foreground active:translate-y-[3px] active:border-b-2"
          >
            Nhức đầu 🔥
          </Link>
          <Link
            href={`/hoc/${topic}/nghe-chep`}
            className="inline-block rounded-game border-2 border-b-[5px] border-border bg-card px-6 py-3 text-lg font-extrabold text-foreground active:translate-y-[3px] active:border-b-2"
          >
            Nghe chép 🎧
          </Link>
          <Link
            href={`/hoc/${topic}/kiem-tra`}
            className="inline-block rounded-game border-2 border-b-[5px] border-success bg-card px-6 py-3 text-lg font-extrabold text-foreground active:translate-y-[3px] active:border-b-2"
          >
            Kiểm tra cuối chủ điểm 🏅
          </Link>
          {canMatch && (
            <Link
              href={`/hoc/${topic}/ghep-cap`}
              className="inline-block rounded-game border-2 border-b-[5px] border-border bg-card px-6 py-3 text-lg font-extrabold text-foreground active:translate-y-[3px] active:border-b-2"
            >
              Ghép cặp ⏱
            </Link>
          )}
        </div>
      ) : (
        <p className="mt-4 rounded-game border-2 border-dashed border-border px-4 py-3 text-muted-foreground">Bài tập cho chuyên đề này đang được soạn.</p>
      )}

      <h2 className="mb-2 mt-8 text-xl font-extrabold">Cách dùng</h2>
      <div className="space-y-3">
        {theory.usages.map((u, i) => (
          <section key={u.id} id={u.id} className="scroll-mt-4 rounded-game border-2 border-border bg-card p-4 target:border-primary">
            <h3 className="font-extrabold">
              {i + 1}. {u.label}
            </h3>
            <p className="mt-1 font-semibold leading-relaxed">{u.explanationVi}</p>
            <ul className="mt-2 space-y-1.5">
              {u.examples.map((e, k) => (
                <li key={k} className="border-l-4 border-accent pl-3">
                  <span className="block">{e.en}</span>
                  <span className="block text-sm text-muted-foreground">{e.vi}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {theory.formulas && (
        <>
          <h2 className="mb-2 mt-8 text-xl font-extrabold">Công thức</h2>
          <div className="space-y-3">
            {Object.entries(theory.formulas).map(([kind, text]) => (
              <section key={kind} className="rounded-game border-2 border-border bg-card p-4">
                <h3 className="text-sm uppercase tracking-wide text-muted-foreground">{FORMULA_LABELS[kind] ?? kind}</h3>
                <ul className="mt-1 space-y-1">
                  {text.split(" | ").map((line, i) => (
                    <li key={i} className="font-semibold leading-relaxed">
                      {line}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </>
      )}

      {theory.signalWords.length > 0 && (
        <>
          <h2 className="mb-2 mt-8 text-xl font-extrabold">Dấu hiệu nhận biết</h2>
          <ul className="flex flex-wrap gap-2">
            {theory.signalWords.map((s) => (
              <li key={s.word} className="max-w-full break-words rounded-2xl border-2 border-border bg-card px-3 py-1">
                <span className="font-extrabold">{s.word}</span> <span className="text-sm text-muted-foreground">{s.meaningVi}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      {theory.commonMistakes.length > 0 && (
        <>
          <h2 className="mb-2 mt-8 text-xl font-extrabold">Lỗi thường gặp</h2>
          <ul className="space-y-3">
            {theory.commonMistakes.map((m) => (
              <li key={m.id} id={m.id} className="scroll-mt-4 rounded-game border-2 border-border bg-card p-4 leading-relaxed target:border-primary">
                {m.description && <p className="font-semibold">{m.description}</p>}
                {m.examples.length > 0 && (
                  <ul className="mt-2 space-y-2">
                    {m.examples.map((e, k) => (
                      <li key={k} className="space-y-1">
                        <p className="rounded-lg bg-danger-soft px-3 py-1.5">
                          <span aria-hidden="true">❌ </span>
                          <span className="sr-only">Sai: </span>
                          {e.wrong}
                        </p>
                        <p className="rounded-lg bg-success-soft px-3 py-1.5">
                          <span aria-hidden="true">✅ </span>
                          <span className="sr-only">Đúng: </span>
                          {e.correct}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
                {m.note && <p className="mt-2 text-sm text-muted-foreground">{m.note}</p>}
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  )
}

const FORMULA_LABELS: Record<string, string> = {
  affirmative: "Khẳng định",
  negative: "Phủ định",
  question: "Nghi vấn",
}
