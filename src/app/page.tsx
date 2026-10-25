import Link from "next/link"
import { TodayPanel } from "@/components/home/today-panel"

const SKILLS = [
  { href: "/hoc", icon: "📘", title: "Ngữ pháp", desc: "31 chuyên đề, bài tập nhiều dạng" },
  { href: "/tu-vung", icon: "🔤", title: "Từ vựng", desc: "A1–B2 theo chủ đề và game ghép từ" },
  { href: "/nghe", icon: "🎧", title: "Nghe", desc: "Hội thoại nhiều giọng, nghe chép" },
  { href: "/doc", icon: "📖", title: "Đọc", desc: "Bài đọc 4 bậc, chạm từ để xem nghĩa" },
  { href: "/viet", icon: "✍️", title: "Viết", desc: "Gợi ý dàn ý và chấm 4 tiêu chí" },
  { href: "/noi", icon: "🎙", title: "Nói", desc: "Ghi âm, nhận xét phát âm và lưu loát" },
]

const MORE = [
  { href: "/on-tap", icon: "🃏", title: "Ôn tập", desc: "Thẻ ôn cách quãng" },
  { href: "/tien-do", icon: "📈", title: "Tiến độ", desc: "Chuỗi ngày, điểm mạnh yếu" },
  { href: "/tran-cuoi", icon: "🐉", title: "Trùm cuối", desc: "Đấu với mục hay sai" },
  { href: "/cua-hang", icon: "🛍", title: "Cửa hàng", desc: "Đổi xu lấy đồ cho cú" },
  { href: "/xep-trinh-do", icon: "🧭", title: "Xếp trình độ", desc: "20 câu gợi ý chỗ bắt đầu" },
]

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

export default function Home() {
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
