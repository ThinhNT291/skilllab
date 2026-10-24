"use client"

import { useMemo } from "react"
import type { MatchPair } from "@/lib/content/match"
import { recordAnswer } from "@/lib/db"
import { MatchGame } from "./match-game"

/** Nối game ghép cặp với kho dữ liệu: mỗi cặp ghi như một câu trả lời (đúng ngay lần đầu thì tính đúng), nhầm sẽ thành thẻ ôn tập. */
export function MatchSession({ pairs }: { pairs: MatchPair[] }) {
  const items = useMemo(() => pairs.map((p) => ({ id: p.id, left: p.left, right: p.right })), [pairs])
  return (
    <MatchGame
      items={items}
      onPairDone={(id, firstTry) => {
        const p = pairs.find((x) => x.id === id)
        if (p) void recordAnswer({ exerciseId: p.id, correct: firstTry, response: p.right }, p.exercise)
      }}
    />
  )
}
