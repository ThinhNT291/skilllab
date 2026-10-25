"use client"

import Link from "next/link"
import { SKILL_INFO, MIN_SAMPLE } from "@/lib/progress/profile"
import { CONFIDENCE_LABEL } from "@/lib/progress/ability"
import { useProfile } from "./use-profile"

/** Hồ sơ năng lực: sáu kỹ năng cạnh nhau để thấy chỗ mạnh, chỗ yếu. */
export function ProfilePanel() {
  const data = useProfile()
  if (!data) return null
  return (
    <section aria-labelledby="profile-heading" className="rounded-game border-2 border-border bg-card p-4">
      <h2 id="profile-heading" className="text-xl font-extrabold">
        Hồ sơ năng lực
      </h2>
      <p className="mb-3 text-sm text-muted-foreground">Dựa trên các lượt làm gần đây. Mức ước lượng tự điều chỉnh sau mỗi câu (đúng câu khó thì tăng, sai câu dễ thì giảm). Chỉ để bạn tự theo dõi, không phải xếp loại hay điểm thi.</p>
      <ul className="space-y-3">
        {data.profile.map((p) => {
          const pct = p.score === null ? 0 : Math.round(p.score * 100)
          const ab = data.abilities.find((a) => a.skill === p.skill)
          return (
            <li key={p.skill}>
              <div className="flex items-baseline justify-between gap-3">
                <Link href={SKILL_INFO[p.skill].href} className="font-extrabold underline-offset-4 hover:underline">
                  {SKILL_INFO[p.skill].label}
                </Link>
                <span className="text-sm text-muted-foreground">
                  {p.score === null ? (p.samples === 0 ? "chưa luyện" : `cần thêm ${Math.max(1, MIN_SAMPLE - p.samples)} lượt`) : `${pct}%`}
                </span>
              </div>
              {ab && ab.n > 0 && (
                <p className="text-sm text-muted-foreground">
                  Mức ước lượng: <strong className="text-foreground">{ab.bac <= 0 ? "dưới Bậc 1" : `Bậc ${ab.bac}`}</strong> · độ tin cậy {CONFIDENCE_LABEL[ab.confidence]}
                </p>
              )}
              <div className="mt-1 h-3 overflow-hidden rounded-full bg-border" role="img" aria-label={`${SKILL_INFO[p.skill].label}: ${p.score === null ? "chưa đủ dữ liệu" : `${pct} phần trăm`}`}>
                <div className="h-full rounded-full bg-primary transition-[width] duration-700" style={{ width: `${pct}%` }} />
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
