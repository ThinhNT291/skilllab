import { createClient } from "@/lib/supabase/client"
import type { LessonResult } from "@/lib/path/progress"
import { dbConfigured, ensureProfile } from "./session"

type Fail = { ok: false; reason: "not_configured" | "error"; message?: string }
const fail = (e: unknown): Fail => ({ ok: false, reason: "error", message: e instanceof Error ? e.message : String(e) })

/** Kết quả từng bài của hồ sơ hiện tại (khóa là mã bài). Chưa chạy migration 0014 thì trả lỗi `error`, giao diện hiện như chưa làm bài nào. */
export async function getPathResults(): Promise<{ ok: true; results: Map<string, LessonResult> } | Fail> {
  if (!dbConfigured()) return { ok: false, reason: "not_configured" }
  try {
    const profile = await ensureProfile()
    const { data, error } = await createClient().from("path_lessons").select("lesson_id, best_ratio").eq("profile_id", profile.id)
    if (error) return { ok: false, reason: "error", message: error.message }
    const results = new Map<string, LessonResult>()
    for (const r of (data ?? []) as { lesson_id: string; best_ratio: number | string }[]) results.set(r.lesson_id, { bestRatio: Number(r.best_ratio) })
    return { ok: true, results }
  } catch (e) {
    return fail(e)
  }
}

/** Ghi kết quả một lần làm bài của Lộ trình (hàm ở cơ sở dữ liệu giữ lần tốt nhất). */
export async function recordPathLesson(lessonId: string, correct: number, total: number, passRatio: number): Promise<{ ok: true } | Fail> {
  if (!dbConfigured()) return { ok: false, reason: "not_configured" }
  try {
    await ensureProfile()
    const { error } = await createClient().rpc("record_path_lesson", { p_lesson_id: lessonId, p_correct: correct, p_total: total, p_pass_ratio: passRatio })
    return error ? { ok: false, reason: "error", message: error.message } : { ok: true }
  } catch (e) {
    return fail(e)
  }
}

export interface PathStart {
  bac: number
  step: number
  source: "placement" | "leap"
}

/** Điểm bắt đầu đã lưu của hồ sơ hiện tại (null nếu chưa có). Chưa chạy migration 0015 thì trả lỗi `error`, giao diện coi như chưa có. */
export async function getPathStart(): Promise<{ ok: true; start: PathStart | null } | Fail> {
  if (!dbConfigured()) return { ok: false, reason: "not_configured" }
  try {
    const profile = await ensureProfile()
    const { data, error } = await createClient().from("path_state").select("start_bac, start_step, source").eq("profile_id", profile.id).maybeSingle()
    if (error) return { ok: false, reason: "error", message: error.message }
    return { ok: true, start: data ? { bac: Number(data.start_bac), step: Number(data.start_step), source: data.source as PathStart["source"] } : null }
  } catch (e) {
    return fail(e)
  }
}

/** Nâng điểm bắt đầu (cơ sở dữ liệu chỉ nhận nếu cao hơn điểm đang lưu). */
export async function raisePathStart(bac: number, step: number, source: PathStart["source"]): Promise<{ ok: true } | Fail> {
  if (!dbConfigured()) return { ok: false, reason: "not_configured" }
  try {
    await ensureProfile()
    const { error } = await createClient().rpc("raise_path_start", { p_bac: bac, p_step: step, p_source: source })
    return error ? { ok: false, reason: "error", message: error.message } : { ok: true }
  } catch (e) {
    return fail(e)
  }
}
