import Link from "next/link"
import { KIND_LABEL } from "@/lib/path/catalog"
import { lessonPassed, type LessonResult, type StepState } from "@/lib/path/progress"

/** Danh sách bài của một chặng (dùng chung cho bản đồ và danh sách). Chặng khóa hoặc chờ lên bậc thì chỉ hiện tên, không có liên kết. */
export function LessonList({ s, map }: { s: StepState; map: ReadonlyMap<string, LessonResult> }) {
  const open = s.status !== "locked" && s.status !== "gated"
  return (
    <ul className="space-y-1 text-sm">
      {s.step.lessons.map((l) => {
        const r = map.get(l.id)
        const ok = lessonPassed(r, l.bac)
        return (
          <li key={l.id} className="flex items-center justify-between gap-2">
            {open ? (
              <Link href={`/lo-trinh/bai/${l.id}`} className="inline-block py-1 text-primary underline underline-offset-4">
                {KIND_LABEL[l.kind]} · {l.title}
              </Link>
            ) : (
              <span className="text-muted-foreground">
                {KIND_LABEL[l.kind]} · {l.title}
              </span>
            )}
            <span className={ok ? "font-bold" : "text-muted-foreground"}>{ok ? "✓" : r ? `${Math.round(r.bestRatio * 100)}%` : ""}</span>
          </li>
        )
      })}
    </ul>
  )
}

/** Nút vượt cấp tới một chặng phía trên. */
export function LeapLink({ s }: { s: StepState }) {
  return (
    <Link href={`/lo-trinh/vuot-cap/b${s.step.bac}-s${s.step.stepInBac}`} className="inline-block rounded-game border-2 border-primary px-3 py-1 text-sm font-extrabold text-primary hover:bg-primary hover:text-primary-foreground">
      🚀 Vượt cấp tới đây (20 câu)
    </Link>
  )
}
