import { Suspense } from "react"
import Link from "next/link"
import { connection } from "next/server"
import { FullPlacement } from "@/components/placement/full-placement"
import { buildPlacementPools } from "@/lib/placement/pools"

export const metadata = { title: "Xếp trình độ tổng hợp" }

export default function Page() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 [&>*]:max-w-4xl">
      <Link href="/xep-trinh-do" className="text-sm text-primary underline underline-offset-4">
        ← Xếp trình độ
      </Link>
      <h1 className="mt-2 mb-4 text-3xl font-extrabold">Xếp trình độ tổng hợp</h1>
      <Suspense fallback={<p className="text-muted-foreground">Đang chuẩn bị câu hỏi…</p>}>
        <Body />
      </Suspense>
    </main>
  )
}

async function Body() {
  await connection()
  const pools = await buildPlacementPools()
  return <FullPlacement pools={pools} />
}
