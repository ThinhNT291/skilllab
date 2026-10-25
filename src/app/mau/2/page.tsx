import Link from "next/link"
import { Mascot } from "@/components/game/mascot"
import { MORE, SKILLS } from "@/components/home/shared"

/** Mẫu 2: "Đường phiêu lưu" — các kỹ năng là trạm trên một con đường uốn lượn. */
export default function Page() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6">
      <div className="flex items-center gap-4">
        <Mascot mood="happy" size={80} className="mascot-float shrink-0" />
        <div>
          <h1 className="text-3xl font-extrabold">Training Zone</h1>
          <p className="text-muted-foreground">Chọn một trạm để bắt đầu chuyến đi hôm nay.</p>
        </div>
      </div>
      <ol className="relative mt-8 space-y-6 before:absolute before:left-1/2 before:top-0 before:h-full before:-translate-x-1/2 before:border-l-4 before:border-dashed before:border-border">
        {SKILLS.map((s, i) => (
          <li key={s.href} className={`relative flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
            <Link
              href={s.href}
              className="home-card relative z-10 flex w-[84%] items-center gap-3 rounded-game border-2 border-border bg-card px-4 py-3 shadow-[0_5px_0_0_var(--border)] hover:border-primary sm:w-[46%]"
            >
              <span aria-hidden="true" className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary/15 text-3xl">
                {s.icon}
              </span>
              <span>
                <span className="block text-sm text-muted-foreground">Trạm {i + 1}</span>
                <span className="block text-lg font-extrabold">{s.title}</span>
                <span className="block text-sm text-muted-foreground">{s.desc}</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
      <h2 className="mb-3 mt-10 text-xl font-extrabold">Hành trang</h2>
      <ul className="flex flex-wrap gap-2">
        {MORE.map((m) => (
          <li key={m.href}>
            <Link href={m.href} className="inline-flex items-center gap-2 rounded-full border-2 border-border bg-card px-4 py-2 hover:border-primary">
              <span aria-hidden="true">{m.icon}</span>
              {m.title}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
