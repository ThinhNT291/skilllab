import { Suspense } from "react"
import { PathView } from "@/components/path/path-view"
import { getPath } from "@/lib/path/data"

export const metadata = { title: "Lộ trình" }

export default function PathPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 [&>*]:max-w-5xl">
      <h1 className="mb-1 text-3xl font-extrabold">Lộ trình</h1>
      <p className="mb-4 text-muted-foreground">Một con đường từ Bậc 1 đến Bậc 6: ngữ pháp, từ vựng, đọc và nghe xen kẽ, mỗi lần một bài ngắn.</p>
      <Suspense fallback={<p className="text-muted-foreground">Đang tải Lộ trình…</p>}>
        <Path />
      </Suspense>
    </main>
  )
}

async function Path() {
  return <PathView path={await getPath()} />
}
