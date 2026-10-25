import Link from "next/link"
import { TodayPanel } from "@/components/home/today-panel"
import { MORE, SKILLS } from "@/components/home/shared"

function Card({ href, icon, title, desc }: { href: string; icon: string; title: string; desc: string }) {
  return (
    <li>
      <Link href={href} className="home-card flex h-full items-start gap-3 rounded-game border-2 border-border bg-card px-4 py-4 hover:border-primary">
        <span aria-hidden="true" className="text-3xl">
          {icon}
        </span>
        <span>
          <span className="block text-lg font-extrabold">{title}</span>
          <span className="block text-sm text-muted-foreground">{desc}</span>
        </span>
      </Link>
    </li>
  )
}

/** Mẫu 1: "Trung tâm" — thẻ chào + lưới thẻ lớn. */
export function HomeA() {
  return (
    <main className="mx-auto w-full max-w-5xl space-y-8 px-4 py-6">
      <div>
        <h1 className="text-3xl font-extrabold sm:text-4xl">Training Zone</h1>
        <p className="mt-1 text-muted-foreground">Luyện ngoại ngữ có chấm điểm, nhận xét và theo dõi tiến độ.</p>
      </div>
      <TodayPanel />
      <section aria-labelledby="skills-heading">
        <h2 id="skills-heading" className="mb-3 text-xl font-extrabold">
          Bốn kỹ năng và nền tảng
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SKILLS.map((s) => (
            <Card key={s.href} {...s} />
          ))}
        </ul>
      </section>
      <section aria-labelledby="more-heading">
        <h2 id="more-heading" className="mb-3 text-xl font-extrabold">
          Ôn tập, game và tiến độ
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MORE.map((s) => (
            <Card key={s.href} {...s} />
          ))}
        </ul>
      </section>
    </main>
  )
}
