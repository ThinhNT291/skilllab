import { createClient } from "@/lib/supabase/client"
import type { AttemptRow } from "@/lib/analytics/attempts"
import type { AttemptDetail } from "@/lib/grading/detail"
import { dbConfigured, ensureProfile } from "./session"

type Fail = { ok: false; reason: "not_configured" | "error"; message?: string }
const fail = (e: unknown): Fail => ({ ok: false, reason: "error", message: e instanceof Error ? e.message : String(e) })

export interface NewAttempt {
  skill: "writing" | "speaking"
  taskId: string
  targetBac: number
  total: number
  estimatedBac: number
  scores: Record<string, number>
  /** Một nhận xét ngắn (tối đa 200 ký tự) để xem lại; không lưu bài làm. */
  note?: string
  /** Chi tiết để theo dõi điểm yếu lặp lại (cần migration 0009) */
  detail?: AttemptDetail
}

/** Lưu điểm một bài Viết/Nói đã chấm. Cần chạy migration 0006. */
export async function saveAttempt(a: NewAttempt): Promise<{ ok: true } | Fail> {
  if (!dbConfigured()) return { ok: false, reason: "not_configured" }
  try {
    const profile = await ensureProfile()
    const base = {
      profile_id: profile.id,
      skill: a.skill,
      task_id: a.taskId,
      target_bac: a.targetBac,
      total: a.total,
      estimated_bac: a.estimatedBac,
      scores: a.scores,
      note: a.note?.slice(0, 200) ?? null,
    }
    const supabase = createClient()
    let { error } = await supabase.from("graded_attempts").insert({ ...base, detail: a.detail ?? null })
    // Chưa chạy migration 0009 (chưa có cột detail): vẫn lưu điểm như trước, chỉ thiếu phần theo dõi điểm yếu.
    if (error && /detail/i.test(error.message)) ({ error } = await supabase.from("graded_attempts").insert(base))
    return error ? { ok: false, reason: "error", message: error.message } : { ok: true }
  } catch (e) {
    return fail(e)
  }
}

/** Các bài đã chấm gần nhất (mới nhất trước). */
export async function getAttempts(limit = 60): Promise<{ ok: true; rows: AttemptRow[] } | Fail> {
  if (!dbConfigured()) return { ok: false, reason: "not_configured" }
  try {
    const profile = await ensureProfile()
    const supabase = createClient()
    const query = (cols: string) => supabase.from("graded_attempts").select(cols).eq("profile_id", profile.id).order("created_at", { ascending: false }).limit(limit)
    let res = await query("skill, task_id, target_bac, total, estimated_bac, scores, note, detail, created_at")
    if (res.error && /detail/i.test(res.error.message)) res = await query("skill, task_id, target_bac, total, estimated_bac, scores, note, created_at")
    if (res.error) return { ok: false, reason: "error", message: res.error.message }
    return { ok: true, rows: (res.data ?? []) as unknown as AttemptRow[] }
  } catch (e) {
    return fail(e)
  }
}
