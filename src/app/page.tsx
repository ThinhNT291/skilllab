import Link from "next/link"
import { TodayPanel } from "@/components/home/today-panel"
import { WelcomeCard } from "@/components/home/welcome-card"
import { Suggestions } from "@/components/home/suggestions"
import { MORE, SKILLS } from "@/components/home/shared"

/** Trang chủ: thông tin hôm nay ở đầu, kỹ năng và game là danh sách gọn. */
export default function Page() {
  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6">
      <WelcomeCard />
      <TodayPanel />
      <Suggestions />
      <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
        <section aria-labelledby="k">
          <h2 id="k" className="mb-2 text-sm uppercase tracking-wide text-muted-foreground">
            Kỹ năng
          </h2>
          <ul className="divide-y-2 divide-border overflow-hidden rounded-game border-2 border-border bg-card">
            {SKILLS.map((s) => (
              <li key={s.href}>
                <Link href={s.href} className="flex items-center gap-3 px-4 py-3 hover:bg-background">
                  <span aria-hidden="true" className="text-2xl">
                    {s.icon}
                  </span>
                  <span className="flex-1">
                    <span className="block font-extrabold">{s.title}</span>
                    <span className="block text-sm text-muted-foreground">{s.desc}</span>
                  </span>
                  <span aria-hidden="true" className="text-muted-foreground">
                    ›
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
        <section aria-labelledby="g">
          <h2 id="g" className="mb-2 text-sm uppercase tracking-wide text-muted-foreground">
            Ôn tập và game
          </h2>
          <ul className="space-y-2">
            {MORE.map((m) => (
              <li key={m.href}>
                <Link href={m.href} className="flex items-center gap-2 rounded-game border-2 border-border bg-card px-3 py-2 hover:border-primary">
                  <span aria-hidden="true">{m.icon}</span>
                  <span className="font-extrabold">{m.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  )
}
