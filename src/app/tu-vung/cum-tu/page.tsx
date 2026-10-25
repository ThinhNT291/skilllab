import Link from "next/link"
import { bacLabel } from "@/lib/content/bac"
import { COLLOCATION_SETS } from "@/lib/collocations/data"

export const metadata = { title: "Cụm từ kết hợp" }

export default function CollocationsPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6">
      <Link href="/tu-vung" className="text-sm text-primary underline underline-offset-4">
        ← Từ vựng
      </Link>
      <h1 className="mt-2 text-3xl font-extrabold">Cụm từ kết hợp</h1>
      <p className="mb-4 text-muted-foreground">Những từ hay đi cùng nhau, như “make a decision” hay “heavy rain”. Học theo cụm thì nói và viết tự nhiên hơn.</p>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {COLLOCATION_SETS.map((s) => (
          <li key={s.id}>
            <Link href={`/tu-vung/cum-tu/${s.id}`} className="block h-full rounded-game border-2 border-border bg-card px-4 py-4 hover:border-primary">
              <span className="text-lg font-extrabold">{s.title}</span>
              <span className="block text-sm text-muted-foreground">{s.desc}</span>
              <span className="mt-1 block text-sm text-muted-foreground">
                {bacLabel(s.bac)} · {s.questions.length} câu
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
