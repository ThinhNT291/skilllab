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
    const timestamps = (data ?? []).map((r: { created_at: string }) => r.created_at)
    // Ôn thẻ SRS cũng tính là có học trong ngày (theo thiết kế bản cũ); mỗi thẻ chỉ còn lần ôn gần nhất nên đây là số đếm tối thiểu.
    const reviews = await createClient().from("srs_cards").select("last_reviewed_at").eq("profile_id", profile.id).gte("last_reviewed_at", since)
    if (!reviews.error) timestamps.push(...(reviews.data ?? []).map((r: { last_reviewed_at: string }) => r.last_reviewed_at))
    // Bài Viết/Nói đã chấm cũng tính là có học trong ngày (bảng có thể chưa tạo nếu chưa chạy migration 0006).
    const graded = await createClient().from("graded_attempts").select("created_at").eq("profile_id", profile.id).gte("created_at", since)
    if (!graded.error) timestamps.push(...(graded.data ?? []).map((r: { created_at: string }) => r.created_at))
    return { ok: true, timestamps }
  } catch (e) {
    return { ok: false, reason: "error", message: e instanceof Error ? e.message : String(e) }
  }
}

export type CountsResult = { ok: true; total: number; correct: number } | { ok: false; reason: "not_configured" | "error"; message?: string }

/** Tổng số câu đã làm và số câu đúng (đếm ở máy chủ, không bị giới hạn số dòng trả về). */
export async function getAnswerCounts(): Promise<CountsResult> {
  if (!dbConfigured()) return { ok: false, reason: "not_configured" }
  try {
    const profile = await ensureProfile()
    const supabase = createClient()
    const all = await supabase.from("answers").select("id", { count: "exact", head: true }).eq("profile_id", profile.id)
    if (all.error) return { ok: false, reason: "error", message: all.error.message }
    const right = await supabase.from("answers").select("id", { count: "exact", head: true }).eq("profile_id", profile.id).eq("correct", true)
    if (right.error) return { ok: false, reason: "error", message: right.error.message }
    return { ok: true, total: all.count ?? 0, correct: right.count ?? 0 }
  } catch (e) {
    return { ok: false, reason: "error", message: e instanceof Error ? e.message : String(e) }
  }
}

export type TopicRowsResult = { ok: true; rows: { exercise_id: string; topic: string; correct: boolean; created_at: string }[] } | { ok: false; reason: "not_configured" | "error"; message?: string }

/** Các lượt trả lời gần nhất của mọi chuyên đề (đủ để tính 20 câu gần nhất mỗi chuyên đề với người học thông thường). */
export async function getRecentTopicRows(limit = 1000): Promise<TopicRowsResult> {
  if (!dbConfigured()) return { ok: false, reason: "not_configured" }
  try {
    const profile = await ensureProfile()
    const { data, error } = await createClient()
      .from("answers")
      .select("exercise_id, topic, correct, created_at")
      .eq("profile_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(limit)
    if (error) return { ok: false, reason: "error", message: error.message }
    return { ok: true, rows: (data ?? []) as { exercise_id: string; topic: string; correct: boolean; created_at: string }[] }
  } catch (e) {
    return { ok: false, reason: "error", message: e instanceof Error ? e.message : String(e) }
  }
}
