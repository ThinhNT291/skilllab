"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import type { McqExercise } from "@/lib/content/types"
import { summarize, type TagInfo } from "@/lib/analytics/progress"
import { getAnswerHistory, recordAnswer } from "@/lib/db"
import { BossGame } from "./boss-game"

type State = { status: "loading" } | { status: "message"; text: string; cta?: boolean } | { status: "ready"; exercises: McqExercise[] }

/** Lấy các mục hay sai của người học, xin máy chủ các câu tương ứng rồi mở trận đánh trùm. */
export function BossEntry({ catalog, topicTitles }: { catalog: Record<string, TagInfo>; topicTitles: Record<string, string> }) {
  const [state, setState] = useState<State>({ status: "loading" })

  useEffect(() => {
    let cancelled = false
    async function load() {
      const history = await getAnswerHistory()
      if (!history.ok) return { status: "message", text: history.reason === "not_configured" ? "Chưa kết nối Supabase nên chưa biết bạn hay sai ở đâu." : `Không tải được dữ liệu (${history.message ?? "lỗi không rõ"}).` } as State
      const weak = summarize(history.rows, catalog, topicTitles).weakTags.slice(0, 5)
      if (!weak.length) return { status: "message", text: "Bạn chưa có điểm yếu nào để làm trùm. Hãy luyện tập thêm vài lượt, câu sai sẽ trở thành trùm!", cta: true } as State
      const res = await fetch(`/api/boss?tags=${encodeURIComponent(weak.map((w) => w.tag).join(","))}`)
      if (!res.ok) return { status: "message", text: "Không gọi được trùm lúc này, thử lại sau nhé." } as State
      const data = (await res.json()) as { exercises: McqExercise[] }
      if (data.exercises.length < 3) return { status: "message", text: "Chưa đủ câu cho các mục bạn hay sai. Luyện thêm vài lượt rồi quay lại nhé.", cta: true } as State
      return { status: "ready", exercises: data.exercises } as State
    }
    load().then((s) => !cancelled && setState(s))
    return () => {
      cancelled = true
    }
  }, [catalog, topicTitles])

  if (state.status === "loading") return <p className="text-muted-foreground">Đang triệu hồi trùm…</p>
  if (state.status === "message") {
    return (
      <div className="rounded-game border-2 border-dashed border-border px-4 py-6 text-center">
        <p className="text-muted-foreground">{state.text}</p>
        {state.cta && (
          <Link href="/hoc" className="mt-3 inline-block text-primary underline underline-offset-4">
            Đến khu Học
          </Link>
        )}
      </div>
    )
  }
  return <BossGame exercises={state.exercises} onAnswer={(record, ex) => void recordAnswer(record, ex)} theoryHref={(e) => `/hoc/${e.topic}${e.usageId ? `#${e.usageId}` : ""}`} />
}
