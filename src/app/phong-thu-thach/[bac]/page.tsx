import { Suspense } from "react"
import Link from "next/link"
import { connection } from "next/server"
import { notFound } from "next/navigation"
import { ChallengeRun } from "@/components/path/challenge-run"
import { getChallengePayload } from "@/lib/path/data"

export const metadata = { title: "Phòng thử thách" }

export default function Page({ params }: PageProps<"/phong-thu-thach/[bac]">) {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 [&>*]:max-w-4xl">
      <Suspense fallback={<p className="text-muted-foreground">Đang chuẩn bị bài…</p>}>
        <Run params={params} />
      </Suspense>
    </main>
  )
}

async function Run({ params }: { params: PageProps<"/phong-thu-thach/[bac]">["params"] }) {
  await connection()
  const { bac } = await params
  const n = Number(bac)
  if (!Number.isInteger(n) || n < 1 || n > 6) notFound()
  const payload = await getChallengePayload(n)
  if (!payload) notFound()
  return (
    <>
      <Link href="/phong-thu-thach" className="text-sm text-primary underline underline-offset-4">
        ← Phòng thử thách
      </Link>
      <h1 className="mt-2 mb-4 text-2xl font-extrabold">Phòng thử thách</h1>
      <ChallengeRun payload={payload} />
    </>
  )
}
