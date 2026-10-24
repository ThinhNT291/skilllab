import { createClient } from "@/lib/supabase/client"
import type { AnswerRow } from "@/lib/analytics/progress"
import { dbConfigured, ensureProfile } from "./session"

export type HistoryResult = { ok: true; rows: AnswerRow[] } | { ok: false; reason: "not_configured" | "error"; message?: string }

/** Lịch sử trả lời gần nhất của học sinh hiện tại (mới nhất trước). */
export async function getAnswerHistory(limit = 2000): Promise<HistoryResult> {
  if (!dbConfigured()) return { ok: false, reason: "not_configured" }
  try {
    const profile = await ensureProfile()
    const { data, error } = await createClient()
      .from("answers")
      .select("topic, tags, correct, created_at")
      .eq("profile_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(limit)
    if (error) return { ok: false, reason: "error", message: error.message }
    return { ok: true, rows: (data ?? []) as AnswerRow[] }
  } catch (e) {
    return { ok: false, reason: "error", message: e instanceof Error ? e.message : String(e) }
  }
}

/** Thời điểm các lượt trả lời trong `days` ngày gần nhất (cho chuỗi ngày và bản đồ nhiệt). */
export async function getActivityTimestamps(days = 100): Promise<{ ok: true; timestamps: string[] } | { ok: false; reason: "not_configured" | "error"; message?: string }> {
  if (!dbConfigured()) return { ok: false, reason: "not_configured" }
  try {
    const profile = await ensureProfile()
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
    const { data, error } = await createClient()
      .from("answers")
      .select("created_at")
      .eq("profile_id", profile.id)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(10000)
    if (error) return { ok: false, reason: "error", message: error.message }
    return { ok: true, timestamps: (data ?? []).map((r: { created_at: string }) => r.created_at) }
  } catch (e) {
    return { ok: false, reason: "error", message: e instanceof Error ? e.message : String(e) }
  }
}
