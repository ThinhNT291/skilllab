"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { getPassedTopics, getRecentTopicRows } from "@/lib/db"
import { nextTopic, topicStats, type MasteryStatus, type TopicStat } from "@/lib/progress/mastery"

export interface MapCategory {
  id: string
  label: string
  topics: { id: string; title: string; hasExercises: boolean }[]
}

const STATUS: Record<MasteryStatus, { icon: string; label: string; style: string }> = {
  new: { icon: "⚪", label: "Chưa học", style: "border-border" },
  learning: { icon: "🟡", label: "Đang học", style: "border-accent" },
  ready: { icon: "🔵", label: "Gần vững, thử làm bài kiểm tra", style: "border-primary" },
  mastered: { icon: "🟢", label: "Đã vững", style: "border-success" },
}

/** Bản đồ chuyên đề: trạng thái từng chuyên đề và gợi ý học tiếp. Không khóa chuyên đề nào. */
export function TopicMap({ categories }: { categories: MapCategory[] }) {
  const [stats, setStats] = useState<Map<string, TopicStat> | null>(null)

  useEffect(() => {
    let cancelled = false
    const ids = categories.flatMap((c) => c.topics.map((t) => t.id))
    Promise.all([getRecentTopicRows(), getPassedTopics()]).then(([rows, passed]) => {
      if (cancelled || !rows.ok) return // chưa kết nối hoặc lỗi: hiện danh sách không có trạng thái
      setStats(topicStats(rows.rows, new Set(passed.ok ? passed.topics : []), ids))
    })
    return () => {
      cancelled = true
    }
  }, [categories])

  const order = categories.flatMap((c) => c.topics.filter((t) => t.hasExercises).map((t) => t.id))
  const next = stats ? nextTopic(order, stats) : null
  const all = categories.flatMap((c) => c.topics)
  const nextTitle = next ? all.find((t) => t.id === next)?.title : null
  const mastered = stats ? [...stats.values()].filter((s) => s.status === "mastered").length : 0

  return (
    <div>
      {stats && (
        <div className="mb-6 rounded-game border-2 border-border bg-card px-4 py-3">
          <p className="font-extrabold">
            🗺️ Đã vững {mastered}/{all.length} chuyên đề
          </p>
          {next && nextTitle && (
            <p className="mt-1">
              Gợi ý học tiếp:{" "}
              <Link href={`/hoc/${next}`} className="font-extrabold text-primary underline underline-offset-4">
                {nextTitle}
              </Link>
            </p>
          )}
        </div>
      )}
      {categories.map((cat) =>
        cat.topics.length === 0 ? null : (
          <section key={cat.id} className="mb-6">
            <h2 className="mb-2 text-sm uppercase tracking-wide text-muted-foreground">{cat.label}</h2>
            <ul className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {cat.topics.map((t) => {
                const s = stats?.get(t.id)
                const st = s ? STATUS[s.status] : null
                return (
                  <li key={t.id}>
                    <Link href={`/hoc/${t.id}`} className={`flex items-center justify-between gap-3 rounded-game border-2 bg-card px-4 py-3 hover:border-primary ${st ? st.style : "border-border"} ${next === t.id ? "ring-2 ring-primary" : ""}`}>
                      <span className="font-extrabold">
                        {st && (
                          <span aria-hidden className="mr-2">
                            {st.icon}
                          </span>
                        )}
                        {t.title}
                      </span>
                      <span className="flex shrink-0 flex-col items-end gap-0.5 text-sm">
                        {st && <span className="text-muted-foreground">{st.label}</span>}
                        {s && s.recentAccuracy !== null && s.status !== "mastered" && <span className="text-muted-foreground">{Math.round(s.recentAccuracy * 100)}% đúng gần đây</span>}
                        {!st && t.hasExercises && <span className="rounded-full bg-success-soft px-2 py-0.5 text-success">Có bài tập</span>}
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </section>
        ),
      )}
    </div>
  )
}
