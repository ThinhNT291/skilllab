"use client"

import Link from "next/link"
import { useProfile } from "@/components/progress/use-profile"
import { suggestToday } from "@/lib/progress/profile"

/** "Hôm nay học gì": tối đa 3 gợi ý theo hồ sơ năng lực. */
export function Suggestions() {
  const data = useProfile()
  if (!data) return null
  const items = suggestToday(data.profile, data.due, data.now)
  return (
    <section aria-labelledby="sg-heading">
      <h2 id="sg-heading" className="mb-2 text-sm uppercase tracking-wide text-muted-foreground">
        Hôm nay học gì
      </h2>
      <ol className="grid gap-2 md:grid-cols-3">
        {items.map((s, i) => (
          <li key={s.key}>
            <Link href={s.href} className="home-card flex h-full gap-3 rounded-game border-2 border-border bg-card px-4 py-3 hover:border-primary">
              <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                {i + 1}
              </span>
              <span>
                <span className="block font-extrabold">{s.title}</span>
                <span className="block text-sm text-muted-foreground">{s.reason}</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  )
}
