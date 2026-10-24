import { createClient } from "@/lib/supabase/client"
import type { AnswerRecord, Exercise } from "@/lib/content/types"
import { dbConfigured, ensureProfile } from "./session"
import { ensureCardFromError } from "./srs"

export type SaveResult = { ok: true } | { ok: false; reason: "not_configured" | "error"; message?: string }

/** Ghi một lượt trả lời của học sinh hiện tại. Không ném lỗi: gọi từ giao diện, lỗi mạng không được chặn việc làm bài. */
export async function recordAnswer(record: AnswerRecord, exercise: Exercise): Promise<SaveResult> {
  if (!dbConfigured()) return { ok: false, reason: "not_configured" }
  try {
    const profile = await ensureProfile()
    const { error } = await createClient().from("answers").insert({
      profile_id: profile.id,
      exercise_id: record.exerciseId,
      topic: exercise.topic,
      tags: exercise.tags,
      correct: record.correct,
      choice_index: record.choiceIndex,
    })
    if (error) return { ok: false, reason: "error", message: error.message }
    // Câu sai tự thành thẻ ôn tập. Lỗi tạo thẻ (vd chưa chạy migration 0002) không làm hỏng việc ghi câu trả lời.
    if (!record.correct) void ensureCardFromError(exercise)
    return { ok: true }
  } catch (e) {
    return { ok: false, reason: "error", message: e instanceof Error ? e.message : String(e) }
  }
}
