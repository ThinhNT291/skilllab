import Link from "next/link"

const LINKS = [
  { href: "/", label: "Trang chủ" },
  { href: "/lo-trinh", label: "Lộ trình" },
  { href: "/hoc", label: "Ngữ pháp" },
  { href: "/tu-vung", label: "Từ vựng" },
  { href: "/nghe", label: "Nghe" },
  { href: "/doc", label: "Đọc" },
  { href: "/viet", label: "Viết" },
  { href: "/noi", label: "Nói" },
  { href: "/on-tap", label: "Ôn tập" },
  { href: "/tien-do", label: "Tiến độ" },
  { href: "/cua-hang", label: "Cửa hàng" },
]

export function SiteNav() {
  return (
    <nav aria-label="Điều hướng chính" className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 text-base font-extrabold sm:flex-wrap sm:text-lg">
      {LINKS.map((l) => (
        <Link key={l.href} href={l.href} className="shrink-0 rounded-full px-3 py-1 hover:bg-primary hover:text-primary-foreground">
          {l.label}
        </Link>
      ))}
    </nav>
  )
}
