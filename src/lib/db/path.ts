import { createClient } from "@/lib/supabase/client"
import { PASS_RATIO } from "@/lib/path/catalog"
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
export async function recordPathLesson(lessonId: string, correct: number, total: number): Promise<{ ok: true } | Fail> {
  if (!dbConfigured()) return { ok: false, reason: "not_configured" }
  try {
    await ensureProfile()
    const { error } = await createClient().rpc("record_path_lesson", { p_lesson_id: lessonId, p_correct: correct, p_total: total, p_pass_ratio: PASS_RATIO })
    return error ? { ok: false, reason: "error", message: error.message } : { ok: true }
  } catch (e) {
    return fail(e)
  }
}
