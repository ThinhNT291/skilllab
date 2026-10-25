"use client"

import { useMemo } from "react"
import itemMeta from "@/content/meta/items.json"
import { buildSprintLadder, sprintRating } from "@/lib/game/sprint-ladder"
import { useStartPosition } from "@/components/exercise/use-start-position"
import type { AbilitySkill, ItemMeta } from "@/lib/progress/ability"
import type { Exercise } from "@/lib/content/types"
import { recordAnswer } from "@/lib/db"
import { SprintGame } from "./sprint-game"

/** Nối game thử thách 60 giây với kho dữ liệu: mỗi câu ghi như một lượt trả lời, câu sai thành thẻ ôn tập. */
export function SprintSession({ exercises, bestKey, backHref, intro, adaptiveSkill }: { exercises: Exercise[]; bestKey: string; backHref: string; intro?: string; /** Có thì xếp câu dễ → khó và bắt đầu theo năng lực kỹ năng này */ adaptiveSkill?: AbilitySkill }) {
  const ladder = useMemo(() => (adaptiveSkill ? buildSprintLadder(exercises, itemMeta as unknown as ItemMeta) : exercises), [exercises, adaptiveSkill])
  const start = useStartPosition(ladder, (e) => sprintRating(e, itemMeta as unknown as ItemMeta), adaptiveSkill ?? "grammar")
  if (adaptiveSkill && !start) return <p className="text-muted-foreground">Đang chọn câu vừa sức với bạn…</p>
  return <SprintGame exercises={ladder} adaptive={adaptiveSkill && start ? { start: start.position } : undefined} bestKey={bestKey} backHref={backHref} intro={intro} onAnswer={(rec, ex) => void recordAnswer(rec, ex)} />
}
