"use client"

import { useState } from "react"
import { addVocabCard } from "@/lib/db"
import { POS_VI } from "@/lib/vocab/questions"
import type { TopicEntry } from "@/lib/vocab/topic-round"

type Mark = "saved" | "failed"

/** Danh sách từ của chủ đề; mỗi từ có nút thêm vào thẻ ôn tập (sổ từ riêng, ôn theo lịch SRS). */
export function WordList({ entries }: { entries: TopicEntry[] }) {
  const [marks, setMarks] = useState<Record<string, Mark>>({})
  const [note, setNote] = useState("")

  async function add(e: TopicEntry) {
    const r = await addVocabCard(e.word, e.level)
    setMarks((m) => ({ ...m, [e.word.id]: r.ok ? "saved" : "failed" }))
    setNote(r.ok ? "" : `Chưa thêm được (${r.reason === "not_configured" ? "chưa kết nối Supabase" : (r.message ?? "lỗi không rõ")}).`)
  }

  return (
    <details className="mt-8 rounded-game border-2 border-border bg-card p-4">
      <summary className="cursor-pointer font-extrabold">Danh sách {entries.length} từ</summary>
      <p className="mt-2 text-sm text-muted-foreground">Bấm “Thêm vào thẻ ôn” để từ đó xuất hiện trong mục Ôn tập theo lịch nhắc.</p>
      {note && (
        <p role="alert" className="mt-2 text-sm font-bold text-danger">
          {note}
        </p>
      )}
      <ul className="mt-3 divide-y-2 divide-border">
        {entries.map((e) => (
          <li key={e.word.id} className="flex items-center gap-3 py-2">
            <span className="min-w-0 flex-1">
              <span lang="en" className="font-extrabold">
                {e.word.word}
              </span>{" "}
              <span className="text-sm text-muted-foreground">({POS_VI[e.word.pos] ?? e.word.pos})</span>
              <span className="block text-sm text-muted-foreground">{e.word.vi ?? e.word.def}</span>
            </span>
            <button
              type="button"
              onClick={() => add(e)}
              disabled={marks[e.word.id] === "saved"}
              className="shrink-0 rounded-full border-2 border-border px-3 py-1 text-sm font-extrabold hover:border-primary disabled:border-success disabled:text-success"
            >
              {marks[e.word.id] === "saved" ? "✓ Đã thêm" : "＋ Thêm vào thẻ ôn"}
            </button>
          </li>
        ))}
      </ul>
    </details>
  )
}
