import Link from "next/link"
import { CONFUSABLE_GROUPS } from "@/lib/content/interleave"
import { listGrammarTopics } from "@/lib/content/grammar"

export const metadata = { title: "Luyện xen kẽ" }

/** Chọn nhóm chuyên đề dễ lẫn để luyện trộn câu (xem docs/hoc-thuat-dong-luc.md). */
export default function Page() {
  const titles = new Map(listGrammarTopics("en").map((t) => [t.id, t.title]))
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 [&>*]:max-w-2xl">
      <h1 className="text-3xl font-extrabold">Luyện xen kẽ 🔀</h1>
      <p className="mb-4 text-muted-foreground">
        Trộn câu của vài chuyên đề dễ lẫn nhau vào một lượt, để bạn tập <strong>chọn đúng cách dùng</strong> thay vì chỉ làm theo thói quen. Hơi khó hơn luyện từng chuyên đề, nên hãy làm sau khi đã học từng chuyên đề.
      </p>
      <ul className="space-y-3">
        {CONFUSABLE_GROUPS.map((g) => (
          <li key={g.id}>
            <Link href={`/luyen-xen-ke/${g.id}`} className="block rounded-game border-2 border-border bg-card p-4 hover:border-primary">
              <span className="block font-extrabold">{g.label}</span>
              <span className="block text-sm text-muted-foreground">{g.topics.map((t) => titles.get(t) ?? t).join(" · ")}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
