import { createClient } from "@/lib/supabase/client"
import type { BatchInput, DraftInput, DraftKind, DraftStatus } from "@/lib/contentdraft/parse"
import { dbConfigured, ensureProfile } from "./session"

type Fail = { ok: false; reason: "not_configured" | "error"; message?: string }
const fail = (e: unknown): Fail => ({ ok: false, reason: "error", message: e instanceof Error ? e.message : String(e) })
const nc: Fail = { ok: false, reason: "not_configured" }

/** Nháp nội dung (khu quản lý, CHỈ quản trị: RLS chặn người khác). Xem supabase/migrations/0017_content_drafts.sql. */
export interface BatchRow {
  id: string
  kind: DraftKind
  topic: string | null
  bac: number
  model: string
  prompt_version: string
  blind_runs: number | null
  counts: { kept: number; rejectedByCode: number; duplicates: number }
  source: "import" | "ui"
  created_at: string
}

export interface DraftRow {
  id: string
  batch_id: string
  item_id: string
  kind: DraftKind
  topic: string
  bac: number
  data: Record<string, unknown>
  meta: Record<string, unknown> | null
  blind: { pass: boolean; why: string[]; runs: unknown } | null
  status: DraftStatus
  reject_reason: string | null
  decided_at: string | null
}

export async function listBatches(): Promise<{ ok: true; rows: BatchRow[] } | Fail> {
  if (!dbConfigured()) return nc
  try {
    const { data, error } = await createClient().from("content_batches").select("id, kind, topic, bac, model, prompt_version, blind_runs, counts, source, created_at").order("created_at", { ascending: false }).limit(200)
    if (error) return { ok: false, reason: "error", message: error.message }
    return { ok: true, rows: (data ?? []) as BatchRow[] }
  } catch (e) {
    return fail(e)
  }
}

export async function listDrafts(): Promise<{ ok: true; rows: DraftRow[] } | Fail> {
  if (!dbConfigured()) return nc
  try {
    const { data, error } = await createClient().from("content_drafts").select("id, batch_id, item_id, kind, topic, bac, data, meta, blind, status, reject_reason, decided_at").order("created_at", { ascending: false }).limit(3000)
    if (error) return { ok: false, reason: "error", message: error.message }
    return { ok: true, rows: (data ?? []) as DraftRow[] }
  } catch (e) {
    return fail(e)
  }
}

/** Nạp một lô đã được `parseBatch` kiểm tra. Lỗi giữa chừng thì xóa lô vừa tạo để không để lại lô dở dang. */
export async function importBatch(batch: BatchInput, drafts: DraftInput[]): Promise<{ ok: true; batchId: string } | Fail> {
  if (!dbConfigured()) return nc
  try {
    const supabase = createClient()
    const profile = await ensureProfile()
    const { data, error } = await supabase
      .from("content_batches")
      .insert({ kind: batch.kind, topic: batch.topic, bac: batch.bac, model: batch.model, prompt_version: batch.promptVersion, blind_runs: batch.blindRuns, counts: batch.counts, source: "import", created_by: profile.id, created_at: batch.createdAt })
      .select("id")
      .single()
    if (error || !data) return { ok: false, reason: "error", message: error?.message ?? "không tạo được lô" }
    const batchId = data.id as string
    const rows = drafts.map((d) => ({ batch_id: batchId, item_id: d.itemId, kind: d.kind, topic: d.topic, bac: d.bac, data: d.data, meta: d.meta, blind: d.blind, status: d.status }))
    const ins = await supabase.from("content_drafts").insert(rows)
    if (ins.error) {
      await supabase.from("content_batches").delete().eq("id", batchId)
      return { ok: false, reason: "error", message: ins.error.message }
    }
    return { ok: true, batchId }
  } catch (e) {
    return fail(e)
  }
}

/** Ghi quyết định duyệt/loại (hoặc mở lại về trạng thái trước đó) cho nhiều mục cùng một trạng thái đích. */
export async function setDraftStatus(ids: string[], status: DraftStatus, reason: string | null = null): Promise<{ ok: true } | Fail> {
  if (!dbConfigured()) return nc
  if (ids.length === 0) return { ok: true }
  try {
    const profile = await ensureProfile()
    const decided = status === "approved" || status === "rejected"
    const { error } = await createClient()
      .from("content_drafts")
      .update({ status, reject_reason: status === "rejected" ? (reason?.trim().slice(0, 200) || null) : null, decided_by: decided ? profile.id : null, decided_at: decided ? new Date().toISOString() : null })
      .in("id", ids)
    return error ? { ok: false, reason: "error", message: error.message } : { ok: true }
  } catch (e) {
    return fail(e)
  }
}

export async function deleteBatch(id: string): Promise<{ ok: true } | Fail> {
  if (!dbConfigured()) return nc
  try {
    const { error } = await createClient().from("content_batches").delete().eq("id", id)
    return error ? { ok: false, reason: "error", message: error.message } : { ok: true }
  } catch (e) {
    return fail(e)
  }
}
