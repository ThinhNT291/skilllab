import { createClient } from "@/lib/supabase/client"
import { dbConfigured, ensureProfile } from "./session"

export interface PlacementRow {
  id: string
  status: "in_progress" | "completed" | "abandoned"
  state: unknown
  result: unknown
  started_at: string
  completed_at: string | null
}

type Fail = { ok: false; reason: "not_configured" | "error" | "too_soon"; message?: string }

const COLS = "id, status, state, result, started_at, completed_at"

/** Các lần làm xong gần đây và lần đang làm dở (nếu có) của hồ sơ hiện tại. */
export async function getPlacementOverview(): Promise<{ ok: true; active: PlacementRow | null; completed: PlacementRow[] } | Fail> {
  if (!dbConfigured()) return { ok: false, reason: "not_configured" }
  try {
    const profile = await ensureProfile()
    const { data, error } = await createClient().from("placement_sessions").select(COLS).eq("profile_id", profile.id).order("started_at", { ascending: false }).limit(10)
    if (error) return { ok: false, reason: "error", message: error.message }
    const rows = (data ?? []) as PlacementRow[]
    return { ok: true, active: rows.find((r) => r.status === "in_progress") ?? null, completed: rows.filter((r) => r.status === "completed") }
  } catch (e) {
    return { ok: false, reason: "error", message: e instanceof Error ? e.message : String(e) }
  }
}

/** Bắt đầu một lần làm mới. Cách lần xong trước chưa đủ 14 ngày thì cơ sở dữ liệu từ chối (`too_soon`). */
export async function startPlacementSession(state: unknown): Promise<{ ok: true; id: string } | Fail> {
  if (!dbConfigured()) return { ok: false, reason: "not_configured" }
  try {
    const profile = await ensureProfile()
    const { data, error } = await createClient().from("placement_sessions").insert({ profile_id: profile.id, state }).select("id").single()
    if (error) return { ok: false, reason: /placement_too_soon/.test(error.message) ? "too_soon" : "error", message: error.message }
    return { ok: true, id: data.id as string }
  } catch (e) {
    return { ok: false, reason: "error", message: e instanceof Error ? e.message : String(e) }
  }
}

/** Lưu trạng thái đang làm. Không ném lỗi (không được chặn việc làm bài). */
export async function savePlacementState(id: string, state: unknown): Promise<boolean> {
  try {
    const { error } = await createClient().from("placement_sessions").update({ state, updated_at: new Date().toISOString() }).eq("id", id).eq("status", "in_progress")
    return !error
  } catch {
    return false
  }
}

export async function finishPlacementSession(id: string, state: unknown, result: unknown): Promise<boolean> {
  try {
    const now = new Date().toISOString()
    const { error } = await createClient().from("placement_sessions").update({ status: "completed", state, result, updated_at: now, completed_at: now }).eq("id", id).eq("status", "in_progress")
    return !error
  } catch {
    return false
  }
}

/** Bỏ lần đang làm dở để làm lại từ đầu (không tính là đã làm xong, nên không bị giãn cách). */
export async function abandonPlacementSession(id: string): Promise<boolean> {
  try {
    const { error } = await createClient().from("placement_sessions").update({ status: "abandoned", updated_at: new Date().toISOString() }).eq("id", id).eq("status", "in_progress")
    return !error
  } catch {
    return false
  }
}
