import Link from "next/link"
import type { MasteryStatus, TopicStat } from "@/lib/progress/mastery"

export interface RoadStage {
  id: string
  /** Ví dụ "A1 · Bậc 1" */
  label: string
  topics: { id: string; title: string; hasExercises: boolean }[]
  /** Chặng chưa có chuyên đề nào */
  comingSoon?: boolean
}

const NODE: Record<MasteryStatus | "none", { icon: string; ring: string; label: string }> = {
  none: { icon: "", ring: "border-border bg-card", label: "" },
  new: { icon: "", ring: "border-border bg-card", label: "Chưa học" },
  learning: { icon: "…", ring: "border-accent bg-card", label: "Đang học" },
  ready: { icon: "★", ring: "border-primary bg-card", label: "Gần vững" },
  mastered: { icon: "✓", ring: "border-success bg-success-soft", label: "Đã vững" },
}

const ROW = 96
const XS = [18, 50, 82, 50]
const TITLE_COMMA = /\s*\(.*\)\s*$/

/** Đường đi một chặng: các điểm dừng uốn lượn trái–giữa–phải nối bằng một đường SVG. */
function Stage({ stage, stats, next }: { stage: RoadStage; stats: Map<string, TopicStat> | null; next: string | null }) {
  const H = stage.topics.length * ROW
  const pts = stage.topics.map((_, i) => ({ x: XS[i % XS.length], y: i * ROW + ROW / 2 }))
  const d = pts.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`
    const q = pts[i - 1]
    const my = (q.y + p.y) / 2
    return `${acc} C ${q.x} ${my}, ${p.x} ${my}, ${p.x} ${p.y}`
  }, "")
  return (
    <section aria-label={`Chặng ${stage.label}`} className="mb-8">
      <h2 className="mb-2 inline-block rounded-full border-2 border-primary bg-card px-4 py-1 font-extrabold">{stage.label}</h2>
      {stage.comingSoon ? (
        <p className="rounded-game border-2 border-dashed border-border px-4 py-5 text-center text-muted-foreground">Chặng này đang được soạn. Sắp có!</p>
      ) : (
        <div className="relative" style={{ height: H }}>
          <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 100 ${H}`} preserveAspectRatio="none" aria-hidden="true">
            <path d={d} fill="none" strokeWidth="6" strokeLinecap="round" strokeDasharray="1 14" className="stroke-border" vectorEffect="non-scaling-stroke" />
          </svg>
          <ol>
            {stage.topics.map((t, i) => {
              const s = stats?.get(t.id)
              const n = NODE[s ? s.status : "none"]
              const p = pts[i]
              const right = p.x <= 50
              const title = t.title.replace(TITLE_COMMA, "")
              return (
                <li key={t.id} className="absolute" style={right ? { top: p.y - 28, left: `${p.x}%`, transform: "translateX(-28px)" } : { top: p.y - 28, right: `${100 - p.x}%`, transform: "translateX(28px)" }}>
                  <Link href={`/hoc/${t.id}`} className="group flex items-center gap-3" aria-label={`${t.title}${n.label ? `: ${n.label}` : ""}${next === t.id ? " (gợi ý học tiếp)" : ""}`}>
                    <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-4 text-xl font-extrabold group-hover:border-primary ${n.ring} ${next === t.id ? "ring-4 ring-primary" : ""}`} aria-hidden="true">
                      {n.icon || i + 1}
                    </span>
                    <span className={`max-w-[9.5rem] text-sm font-extrabold leading-tight ${right ? "" : "order-first text-right"}`}>
                      {title}
                      {n.label && <span className="block text-xs font-normal text-muted-foreground">{n.label}</span>}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ol>
        </div>
      )}
    </section>
  )
}

/** Bản đồ chặng A1 → C2 cho khu Học. Không khóa chuyên đề nào; chuyên đề gợi ý tiếp có vòng sáng. */
export function TopicRoad({ stages, stats, next }: { stages: RoadStage[]; stats: Map<string, TopicStat> | null; next: string | null }) {
  return (
    <div>
      {stages.map((st) => (
        <Stage key={st.id} stage={st} stats={stats} next={next} />
      ))}
    </div>
  )
}
