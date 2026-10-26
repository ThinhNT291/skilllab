/**
 * Thống kê các lô nháp: tỷ lệ qua kiểm bằng mã, qua giải mù, người duyệt đồng ý; giải mù đáng tin đến đâu (so với quyết định của người);
 * phân bố vị trí đáp án, độ khó, bậc; lý do loại. Dùng để hiệu chỉnh lời nhắc (theo phiên bản lời nhắc, mô hình). Hàm thuần.
 */
import type { DraftKind, DraftStatus } from "./parse.ts"

export interface StatDraft {
  batchId: string
  kind: DraftKind
  topic: string
  bac: number
  status: DraftStatus
  rejectReason: string | null
  blindPass: boolean | null
  data: Record<string, unknown>
}

export interface StatBatch {
  id: string
  model: string
  promptVersion: string
  counts: { kept: number; rejectedByCode: number; duplicates: number }
}

export interface Rate {
  num: number
  den: number
  /** 0–1, null khi chưa có mẫu */
  value: number | null
}
const rate = (num: number, den: number): Rate => ({ num, den, value: den ? num / den : null })

export interface GroupRow {
  key: string
  total: number
  blindPass: Rate
  humanApprove: Rate
}

export interface DraftStats {
  total: number
  byStatus: Record<DraftStatus, number>
  /** Qua kiểm bằng mã: câu giữ lại / (giữ lại + bị loại + trùng) trên mọi lô */
  codePass: Rate
  blindPass: Rate
  humanApprove: Rate
  /** Giải mù so với quyết định của người, chỉ tính các mục đã có cả hai */
  calibration: { passApproved: number; passRejected: number; failApproved: number; failRejected: number }
  positions: [number, number, number, number]
  difficulty: Record<1 | 2 | 3, number>
  bac: Record<number, number>
  rejectReasons: { reason: string; count: number }[]
  byPromptVersion: GroupRow[]
  byModel: GroupRow[]
  byTopic: GroupRow[]
  byBac: GroupRow[]
}

const decided = (s: DraftStatus) => s === "approved" || s === "rejected"

function group(drafts: StatDraft[], keyOf: (d: StatDraft) => string): GroupRow[] {
  const map = new Map<string, StatDraft[]>()
  for (const d of drafts) map.set(keyOf(d), [...(map.get(keyOf(d)) ?? []), d])
  return [...map.entries()]
    .map(([key, list]) => ({
      key,
      total: list.length,
      blindPass: rate(list.filter((d) => d.blindPass === true).length, list.filter((d) => d.blindPass !== null).length),
      humanApprove: rate(list.filter((d) => d.status === "approved").length, list.filter((d) => decided(d.status)).length),
    }))
    .sort((a, b) => b.total - a.total || a.key.localeCompare(b.key))
}

export function draftStats(drafts: StatDraft[], batches: StatBatch[]): DraftStats {
  const byStatus: Record<DraftStatus, number> = { generated: 0, review_failed: 0, review_passed: 0, approved: 0, rejected: 0 }
  for (const d of drafts) byStatus[d.status]++
  const batchOf = new Map(batches.map((b) => [b.id, b]))

  const kept = batches.reduce((n, b) => n + b.counts.kept, 0)
  const lost = batches.reduce((n, b) => n + b.counts.rejectedByCode + b.counts.duplicates, 0)

  const withBlind = drafts.filter((d) => d.blindPass !== null)
  const humanDecided = drafts.filter((d) => decided(d.status))
  const both = drafts.filter((d) => d.blindPass !== null && decided(d.status))

  const positions: [number, number, number, number] = [0, 0, 0, 0]
  const difficulty: Record<1 | 2 | 3, number> = { 1: 0, 2: 0, 3: 0 }
  const bac: Record<number, number> = {}
  for (const d of drafts) {
    bac[d.bac] = (bac[d.bac] ?? 0) + 1
    if (d.kind !== "grammar") continue
    const ci = d.data.correctIndex
    if (typeof ci === "number" && ci >= 0 && ci <= 3) positions[ci]++
    const diff = d.data.difficulty
    if (diff === 1 || diff === 2 || diff === 3) difficulty[diff]++
  }

  const reasons = new Map<string, number>()
  for (const d of drafts) if (d.status === "rejected") reasons.set(d.rejectReason?.trim() || "(không ghi lý do)", (reasons.get(d.rejectReason?.trim() || "(không ghi lý do)") ?? 0) + 1)

  return {
    total: drafts.length,
    byStatus,
    codePass: rate(kept, kept + lost),
    blindPass: rate(withBlind.filter((d) => d.blindPass).length, withBlind.length),
    humanApprove: rate(byStatus.approved, humanDecided.length),
    calibration: {
      passApproved: both.filter((d) => d.blindPass && d.status === "approved").length,
      passRejected: both.filter((d) => d.blindPass && d.status === "rejected").length,
      failApproved: both.filter((d) => !d.blindPass && d.status === "approved").length,
      failRejected: both.filter((d) => !d.blindPass && d.status === "rejected").length,
    },
    positions,
    difficulty,
    bac,
    rejectReasons: [...reasons.entries()].map(([reason, count]) => ({ reason, count })).sort((a, b) => b.count - a.count),
    byPromptVersion: group(drafts, (d) => batchOf.get(d.batchId)?.promptVersion ?? "?"),
    byModel: group(drafts, (d) => batchOf.get(d.batchId)?.model ?? "?"),
    byTopic: group(drafts, (d) => d.topic),
    byBac: group(drafts, (d) => `Bậc ${d.bac}`),
  }
}
