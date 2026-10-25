"use client"

import type { McqExercise } from "@/lib/content/types"
import { recordAnswer } from "@/lib/db"
import { SprintGame } from "./sprint-game"

/** Nối game thử thách 60 giây với kho dữ liệu: mỗi câu ghi như một lượt trả lời, câu sai thành thẻ ôn tập. */
export function SprintSession({ exercises, bestKey, backHref }: { exercises: McqExercise[]; bestKey: string; backHref: string }) {
  return <SprintGame exercises={exercises} bestKey={bestKey} backHref={backHref} onAnswer={(rec, ex) => void recordAnswer(rec, ex)} />
}
