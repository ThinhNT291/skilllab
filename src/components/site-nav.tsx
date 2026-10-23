import Link from "next/link"

const LINKS = [
  { href: "/", label: "Trang chủ" },
  { href: "/hoc", label: "Học" },
  { href: "/tien-do", label: "Tiến độ" },
]

export function SiteNav() {
  return (
    <nav aria-label="Điều hướng chính" className="flex gap-4 text-lg font-extrabold">
      {LINKS.map((l) => (
        <Link key={l.href} href={l.href} className="underline-offset-4 hover:text-primary hover:underline">
          {l.label}
        </Link>
      ))}
    </nav>
  )
}
