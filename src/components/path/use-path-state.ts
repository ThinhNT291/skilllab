"use client"

import { useEffect, useMemo, useState } from "react"
import { getCardsForRetention, getPathResults, getPathStart, getPlacementOverview, getRecentTopicRows, raisePathStart, type PathStart, type RetentionCardRow } from "@/lib/db"
import { vnDayKey } from "@/lib/analytics/activity"
import { parseResult } from "@/lib/placement/full"
import type { PathStep } from "@/lib/path/catalog"
import { rowsByBac, type GateAnswer } from "@/lib/path/gate"
import { jumpReadinessAt, type JumpReadiness } from "@/lib/path/jump"
import { computePath, nextLesson, type LessonResult, type PathState } from "@/lib/path/progress"
import { retentionByBac } from "@/lib/path/retention"
import { bestStart, startFromPlacement, startIndexOf } from "@/lib/path/start"
import type { ItemMeta } from "@/lib/progress/ability"
import type { PathLesson } from "@/lib/path/catalog"
import itemMeta from "@/content/meta/items.json"

export interface PathData {
  /** Chưa tải xong kết quả */
  loading: boolean
  /** Lỗi đọc dữ liệu đã lưu (vd chưa chạy migration); giao diện vẫn dùng được với tiến độ trống */
  error: string | null
  results: Map<string, LessonResult>
  start: PathStart | null
  readiness: Map<number, JumpReadiness>
  state: PathState
  next: PathLesson | null
}

/**
 * Tải kết quả bài, điểm bắt đầu, bài xếp trình độ và câu đã trả lời, rồi tính trạng thái Lộ trình (`lib/path/progress.ts`).
 * Dùng chung cho trang `/lo-trinh` và nút "Học tiếp" ở trang chủ. Điểm bắt đầu từ bài xếp trình độ được nâng lên ở đây (chỉ tăng).
 */
export function usePathState(path: PathStep[]): PathData {
  const [results, setResults] = useState<Map<string, LessonResult> | null>(null)
  const [start, setStart] = useState<PathStart | null>(null)
  const [answers, setAnswers] = useState<GateAnswer[]>([])
  const [cards, setCards] = useState<RetentionCardRow[]>([])
  // Thời điểm tính mức nhớ: lấy lúc dữ liệu về (không gọi new Date() lúc dựng trang để trang chủ vẫn dựng sẵn được)
  const [loadedAt, setLoadedAt] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([getPathResults(), getPathStart(), getPlacementOverview(), getRecentTopicRows(1000), getCardsForRetention()]).then(([res, saved, placement, rows, cardRows]) => {
      if (cancelled) return
      if (res.ok) setResults(res.results)
      else {
        setResults(new Map())
        if (res.reason === "error") setError(res.message ?? "lỗi không rõ")
      }
      if (rows.ok) setAnswers(rows.rows)
      if (cardRows.ok) setCards(cardRows.value)
      setLoadedAt(new Date())
      // Điểm bắt đầu: cao nhất giữa điểm đã lưu và bài xếp trình độ gần nhất (chỉ tăng, không hạ).
      const placed = placement.ok && placement.completed[0] ? parseResult(placement.completed[0].result) : null
      const { start: best, changed } = bestStart(saved.ok ? saved.start : null, [placed ? startFromPlacement(placed.overall.bac) : null])
      setStart(best)
      if (changed && best) void raisePathStart(best.bac, best.step, best.source)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const map = useMemo(() => results ?? new Map<string, LessonResult>(), [results])
  const byBac = useMemo(() => rowsByBac(answers, itemMeta as unknown as ItemMeta, vnDayKey), [answers])
  const retention = useMemo(() => (loadedAt ? retentionByBac(cards, itemMeta as unknown as ItemMeta, loadedAt) : new Map<number, number | null>()), [cards, loadedAt])
  const readiness = useMemo(() => {
    const out = new Map<number, JumpReadiness>()
    for (let b = 1; b <= 6; b++) out.set(b, jumpReadinessAt(b, byBac.get(b) ?? [], retention.get(b) ?? null))
    return out
  }, [byBac, retention])
  const startIndex = useMemo(() => startIndexOf(path, start), [path, start])
  const state = useMemo(() => computePath(path, map, { startIndex, bacCleared: (b) => b >= 6 || (readiness.get(b)?.ready ?? false) }), [path, map, startIndex, readiness])
  const next = useMemo(() => nextLesson(state, map), [state, map])
  return { loading: results === null, error, results: map, start, readiness, state, next }
}
