import { Suspense } from "react"
import { ChallengeHome } from "@/components/path/challenge-home"
import { getPath } from "@/lib/path/data"

export const metadata = { title: "Phòng thử thách" }

export default function Page() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 [&>*]:max-w-4xl">
      <h1 className="mb-1 text-3xl font-extrabold">Phòng thử thách</h1>
      <p className="mb-4 text-muted-foreground">Bài kiểm tra tính giờ để biết mình đang ở đâu. Không bắt buộc, và không làm bạn tụt bậc.</p>
      <Suspense fallback={<p className="text-muted-foreground">Đang tải…</p>}>
        <Home />
      </Suspense>
    </main>
  )
}

async function Home() {
  return <ChallengeHome path={await getPath()} />
}
