"use client"

import type { Exercise } from "@/lib/content/types"
import { recordAnswer } from "@/lib/db"
import { SprintGame } from "./sprint-game"

/** Nối game thử thách 60 giây với kho dữ liệu: mỗi câu ghi như một lượt trả lời, câu sai thành thẻ ôn tập. */
export function SprintSession({ exercises, bestKey, backHref, intro }: { exercises: Exercise[]; bestKey: string; backHref: string; intro?: string }) {
  return <SprintGame exercises={exercises} bestKey={bestKey} backHref={backHref} intro={intro} onAnswer={(rec, ex) => void recordAnswer(rec, ex)} />
}
