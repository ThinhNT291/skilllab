import { Suspense } from "react"
import Link from "next/link"
import { connection } from "next/server"
import { notFound } from "next/navigation"
import { ListeningSession } from "@/components/listening/listening-session"
import { getListeningItems, pickListening } from "@/lib/listening/data"
import { itemToExercises, LISTENING_BACS } from "@/lib/listening/types"
import { bacLabel } from "@/lib/content/bac"

export const metadata = { title: "Nghe hiểu" }

export function generateStaticParams() {
  return LISTENING_BACS.map((b) => ({ bac: String(b) }))
}

export default function ListeningPage({ params }: PageProps<"/nghe/[bac]">) {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 [&>*]:max-w-2xl">
      <Suspense fallback={<p className="text-muted-foreground">Đang tải bài nghe…</p>}>
        <Item params={params} />
      </Suspense>
    </main>
  )
}

async function Item({ params }: { params: PageProps<"/nghe/[bac]">["params"] }) {
  await connection()
  const { bac } = await params
  const items = await getListeningItems(Number(bac))
  if (!items || !items.length) notFound()
  const item = pickListening(items)
  return (
    <>
      <Link href="/nghe" className="text-sm text-primary underline underline-offset-4">
        ← Nghe hiểu
      </Link>
      <h1 className="mt-2 mb-4 text-3xl font-extrabold">Nghe hiểu {bacLabel(item.bac)}</h1>
      <ListeningSession item={item} exercises={itemToExercises(item)} />
    </>
  )
}
