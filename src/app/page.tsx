import Link from "next/link"

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-xl px-4 py-10">
      <h1 className="text-4xl font-extrabold">Training Zone</h1>
      <p className="mt-2 text-muted-foreground">Luyện ngoại ngữ có chấm điểm, nhận xét và theo dõi tiến độ.</p>
      <Link
        href="/hoc"
        className="mt-6 inline-block rounded-game border-b-[5px] border-primary-deep bg-primary px-6 py-3 text-lg font-extrabold text-primary-foreground active:translate-y-[3px] active:border-b-2"
      >
        Học ngữ pháp
      </Link>
    </main>
  )
}
