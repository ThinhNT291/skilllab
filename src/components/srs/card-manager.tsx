"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { deleteCard, listAllCards, type SrsCardRow } from "@/lib/db"

type Filter = "all" | "due" | "mastered"
type Load = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; cards: SrsCardRow[] }

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "Tất cả" },
  { id: "due", label: "Đến hạn" },
  { id: "mastered", label: "Đã thuộc" },
]

function dueLabel(c: SrsCardRow, now: number): string {
  if (c.status === "mastered") return "Đã thuộc"
  const days = Math.ceil((new Date(c.dueAt).getTime() - now) / 86400000)
  if (Number.isNaN(days)) return "Chưa rõ lịch"
  return days <= 0 ? "Đến hạn" : days === 1 ? "Ngày mai" : `Sau ${days} ngày`
}

export function CardManager({ topicTitles }: { topicTitles: Record<string, string> }) {
  const [load, setLoad] = useState<Load>({ status: "loading" })
  const [filter, setFilter] = useState<Filter>("all")
  const [note, setNote] = useState("")
  const [now, setNow] = useState(0)

  useEffect(() => {
    let cancelled = false
    listAllCards().then((res) => {
      if (cancelled) return
      setNow(Date.now())
      setLoad(res.ok ? { status: "ready", cards: res.value } : { status: "error", message: res.reason === "not_configured" ? "Chưa kết nối Supabase nên chưa có thẻ." : `Không tải được thẻ (${res.message ?? "lỗi không rõ"}).` })
    })
    return () => {
      cancelled = true
    }
  }, [])

  if (load.status === "loading") return <p className="text-muted-foreground">Đang tải thẻ…</p>
  if (load.status === "error") return <p className="rounded-game border-2 border-dashed border-border px-4 py-3 text-muted-foreground">{load.message}</p>

  const cards = load.cards
  const isDue = (c: SrsCardRow) => c.status === "active" && new Date(c.dueAt).getTime() <= now
  const shown = cards.filter((c) => (filter === "due" ? isDue(c) : filter === "mastered" ? c.status === "mastered" : true))

  async function remove(c: SrsCardRow) {
    if (!window.confirm("Xóa thẻ này? Nếu bạn sai lại câu đó, thẻ sẽ được tạo lại.")) return
    const res = await deleteCard(c.id)
    if (!res.ok) {
      setNote(`Chưa xóa được (${res.reason === "not_configured" ? "chưa kết nối Supabase" : (res.message ?? "lỗi không rõ")}). Nếu đây là lần đầu, hãy chạy tệp supabase/migrations/0004_srs_delete.sql trong Supabase.`)
      return
    }
    setNote("")
    setLoad({ status: "ready", cards: cards.filter((x) => x.id !== c.id) })
  }

  return (
    <div>
      <p className="mb-3 text-muted-foreground">
        {cards.length} thẻ · {cards.filter(isDue).length} đến hạn · {cards.filter((c) => c.status === "mastered").length} đã thuộc
      </p>
      <div className="mb-4 flex gap-2" role="group" aria-label="Lọc thẻ">
        {FILTERS.map((f) => (
          <button key={f.id} type="button" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)} className="rounded-full border-2 border-border px-3 py-1.5 font-extrabold aria-pressed:border-primary aria-pressed:text-primary">
            {f.label}
          </button>
        ))}
      </div>
      {note && (
        <p className="mb-3 text-sm text-danger" role="status">
          {note}
        </p>
      )}
      {shown.length === 0 ? (
        <p className="rounded-game border-2 border-dashed border-border px-4 py-6 text-center text-muted-foreground">Không có thẻ nào ở mục này.</p>
      ) : (
        <ul className="space-y-3">
          {shown.map((c) => (
            <li key={c.id} className="rounded-game border-2 border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  {topicTitles[c.topic]?.replace(/\s*\(.*\)\s*$/, "") ?? c.topic} · {dueLabel(c, now)}
                </p>
                <button type="button" onClick={() => void remove(c)} aria-label="Xóa thẻ" className="shrink-0 rounded-full border-2 border-border px-2.5 py-0.5 text-sm hover:border-danger hover:text-danger">
                  Xóa
                </button>
              </div>
              <p className="mt-1 font-bold leading-snug">{c.filled ?? c.front}</p>
              <p className="mt-1 text-success">
                Đáp án: <span className="font-extrabold">{c.answer}</span>
              </p>
              <Link href={`/hoc/${c.topic}${c.usageId ? `#${c.usageId}` : ""}`} className="mt-1 inline-block text-sm text-primary underline underline-offset-4">
                Xem lý thuyết
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
