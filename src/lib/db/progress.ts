import { createClient } from "@/lib/supabase/client"
import type { AnswerRow } from "@/lib/analytics/progress"
import { aggregateDaily, countsFromDaily, vnDayKey, type DailyRow } from "@/lib/analytics/activity"
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

export type DailyResult = { ok: true; rows: DailyRow[]; source: "daily" | "answers" } | { ok: false; reason: "not_configured" | "error"; message?: string }

/**
 * Số lượt trả lời và số lượt đúng theo ngày của học sinh hiện tại, `days` ngày gần nhất.
 * Đọc bảng `daily_activity` (migration 0011, không giới hạn số dòng thô); chưa chạy migration thì lùi về gom từ `answers` (tối đa 10.000 dòng).
 */
export async function getDailyActivity(days = 100): Promise<DailyResult> {
  if (!dbConfigured()) return { ok: false, reason: "not_configured" }
  try {
    const profile = await ensureProfile()
    const supabase = createClient()
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    const daily = await supabase.from("daily_activity").select("day, answers, correct").eq("profile_id", profile.id).gte("day", vnDayKey(since)).order("day", { ascending: true })
    if (!daily.error) return { ok: true, rows: (daily.data ?? []) as DailyRow[], source: "daily" }
    const raw = await supabase.from("answers").select("correct, created_at").eq("profile_id", profile.id).gte("created_at", since.toISOString()).order("created_at", { ascending: false }).limit(10000)
    if (raw.error) return { ok: false, reason: "error", message: raw.error.message }
    return { ok: true, rows: aggregateDaily((raw.data ?? []) as { correct: boolean; created_at: string }[]), source: "answers" }
  } catch (e) {
    return { ok: false, reason: "error", message: e instanceof Error ? e.message : String(e) }
  }
}

export type ActivityCountsResult = { ok: true; counts: Map<string, number> } | { ok: false; reason: "not_configured" | "error"; message?: string }

/**
 * Số hoạt động mỗi ngày (khóa YYYY-MM-DD) cho chuỗi ngày và bản đồ nhiệt: lượt trả lời (bộ đếm theo ngày) cộng lượt ôn thẻ và bài Viết/Nói đã chấm.
 * Ôn thẻ SRS và bài đã chấm cũng tính là có học trong ngày (theo thiết kế bản cũ). Mỗi thẻ chỉ còn lần ôn gần nhất nên đây là số đếm tối thiểu.
 */
export async function getActivityCounts(days = 100): Promise<ActivityCountsResult> {
  const daily = await getDailyActivity(days)
  if (!daily.ok) return daily
  const counts = countsFromDaily(daily.rows)
  try {
    const profile = await ensureProfile()
    const supabase = createClient()
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
    const [reviews, graded] = await Promise.all([
      supabase.from("srs_cards").select("last_reviewed_at").eq("profile_id", profile.id).gte("last_reviewed_at", since),
      supabase.from("graded_attempts").select("created_at").eq("profile_id", profile.id).gte("created_at", since),
    ])
    const extra = [...(reviews.error ? [] : (reviews.data ?? []).map((r: { last_reviewed_at: string }) => r.last_reviewed_at)), ...(graded.error ? [] : (graded.data ?? []).map((r: { created_at: string }) => r.created_at))]
    for (const t of extra) {
      const k = vnDayKey(t)
      counts.set(k, (counts.get(k) ?? 0) + 1)
    }
  } catch {
    // Chỉ thiếu phần ôn thẻ/bài chấm: vẫn trả số đếm lượt trả lời.
  }
  return { ok: true, counts }
}
