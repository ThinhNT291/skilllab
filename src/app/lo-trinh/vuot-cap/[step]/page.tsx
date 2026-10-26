import { Suspense } from "react"
import Link from "next/link"
import { connection } from "next/server"
import { notFound } from "next/navigation"
import { LeapTest } from "@/components/path/leap-test"
import { getLeapPayload } from "@/lib/path/data"
import { validStart } from "@/lib/path/start"

export const metadata = { title: "Vượt cấp" }

export default function LeapPage({ params }: PageProps<"/lo-trinh/vuot-cap/[step]">) {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 [&>*]:max-w-4xl">
      <Suspense fallback={<p className="text-muted-foreground">Đang tải bài vượt cấp…</p>}>
        <Leap params={params} />
      </Suspense>
    </main>
  )
}

/** Mã chặng dạng "b3-s2" (bậc 3, chặng 2). */
async function Leap({ params }: { params: PageProps<"/lo-trinh/vuot-cap/[step]">["params"] }) {
  await connection()
  const { step } = await params
  const m = /^b(\d)-s(\d)$/.exec(step)
  if (!m || !validStart(Number(m[1]), Number(m[2]))) notFound()
  const payload = await getLeapPayload(Number(m[1]), Number(m[2]))
  if (!payload) notFound()
  return (
    <>
      <Link href="/lo-trinh" className="text-sm text-primary underline underline-offset-4">
        ← Lộ trình
      </Link>
      <h1 className="mt-2 mb-4 text-2xl font-extrabold">Bài vượt cấp</h1>
      <LeapTest payload={payload} />
    </>
  )
}
