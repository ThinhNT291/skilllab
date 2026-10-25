import Link from "next/link"

const TABS = [
  { href: "/quan-ly", label: "Học sinh" },
  { href: "/quan-ly/lop", label: "Lớp" },
  { href: "/quan-ly/tai-khoan", label: "Tài khoản" },
  { href: "/quan-ly/nhat-ky", label: "Nhật ký" },
]

export const metadata = { title: "Quản lý" }

export default function StaffLayout({ children }: LayoutProps<"/quan-ly">) {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6">
      <h1 className="mb-3 text-3xl font-extrabold">Khu quản lý</h1>
      <nav aria-label="Khu quản lý" className="mb-5 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Link key={t.href} href={t.href} className="rounded-full border-2 border-border bg-card px-4 py-1.5 font-extrabold hover:border-primary">
            {t.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  )
}
