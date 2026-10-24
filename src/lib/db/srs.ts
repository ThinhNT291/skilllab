import { createClient } from "@/lib/supabase/client"
import type { Exercise } from "@/lib/content/types"
import { cardContentFromExercise } from "@/lib/srs/card-from-exercise"
import { schedule, type Grade } from "@/lib/srs/scheduler"
import { dbConfigured, ensureProfile } from "./session"

export interface SrsCard {
  id: string
  topic: string
  usageId: string | null
  front: string
  answer: string
  filled: string | null
  explanation: string | null
  intervalDays: number
  ease: number
  reps: number
  lapses: number
  status: "active" | "mastered"
}

interface Row {
  id: string
  topic: string
  usage_id: string | null
  front: string
  answer: string
  filled: string | null
  explanation: string | null
  interval_days: number
  ease: number | string
  reps: number
  lapses: number
  status: "active" | "mastered"
}

const fromRow = (r: Row): SrsCard => ({
  id: r.id,
  topic: r.topic,
  usageId: r.usage_id,
  front: r.front,
  answer: r.answer,
  filled: r.filled,
  explanation: r.explanation,
  intervalDays: r.interval_days,
  ease: Number(r.ease),
  reps: r.reps,
  lapses: r.lapses,
  status: r.status,
})

export type CardsResult<T> = { ok: true; value: T } | { ok: false; reason: "not_configured" | "error"; message?: string }

async function guarded<T>(fn: () => Promise<T>): Promise<CardsResult<T>> {
  if (!dbConfigured()) return { ok: false, reason: "not_configured" }
  try {
    return { ok: true, value: await fn() }
  } catch (e) {
    return { ok: false, reason: "error", message: e instanceof Error ? e.message : String(e) }
  }
}

/**
 * Tạo thẻ ôn tập từ một câu vừa trả lời sai. Không tạo trùng: mỗi (hồ sơ, câu) chỉ có một thẻ.
 * Thẻ đã "thuộc" mà sai lại thì mở lại để ôn ngay.
 */
export function ensureCardFromError(exercise: Exercise): Promise<CardsResult<void>> {
  return guarded(async () => {
    const profile = await ensureProfile()
    const supabase = createClient()
    const sourceKey = `grammar-${exercise.topic}-${exercise.id}`
    const c = cardContentFromExercise(exercise)
    const { error } = await supabase.from("srs_cards").upsert(
      {
        profile_id: profile.id,
        source_key: sourceKey,
        kind: "grammar",
        topic: exercise.topic,
        usage_id: exercise.usageId ?? null,
        front: c.front,
        answer: c.answer,
        filled: c.filled,
        explanation: c.explanation,
      },
      { onConflict: "profile_id,source_key", ignoreDuplicates: true },
    )
    if (error) throw new Error(error.message)
    const { error: reopenError } = await supabase
      .from("srs_cards")
      .update({ status: "active", due_at: new Date().toISOString(), interval_days: 0, reps: 0 })
      .eq("profile_id", profile.id)
      .eq("source_key", sourceKey)
      .eq("status", "mastered")
    if (reopenError) throw new Error(reopenError.message)
  })
}

/** Các thẻ đến hạn ôn (cũ nhất trước). */
export function getDueCards(limit = 20): Promise<CardsResult<SrsCard[]>> {
  return guarded(async () => {
    const profile = await ensureProfile()
    const { data, error } = await createClient()
      .from("srs_cards")
      .select("id, topic, usage_id, front, answer, filled, explanation, interval_days, ease, reps, lapses, status")
      .eq("profile_id", profile.id)
      .eq("status", "active")
      .lte("due_at", new Date().toISOString())
      .order("due_at", { ascending: true })
      .limit(limit)
    if (error) throw new Error(error.message)
    return ((data ?? []) as Row[]).map(fromRow)
  })
}

/** Số thẻ đến hạn (tối đa 100, đủ để hiện nhãn). */
export function countDueCards(): Promise<CardsResult<number>> {
  return guarded(async () => {
    const profile = await ensureProfile()
    const { data, error } = await createClient()
      .from("srs_cards")
      .select("id")
      .eq("profile_id", profile.id)
      .eq("status", "active")
      .lte("due_at", new Date().toISOString())
      .limit(100)
    if (error) throw new Error(error.message)
    return (data ?? []).length
  })
}

/** Ghi kết quả một lần ôn: tính lịch mới và cập nhật thẻ. */
export function reviewCard(card: SrsCard, grade: Grade): Promise<CardsResult<void>> {
  return guarded(async () => {
    const next = schedule({ intervalDays: card.intervalDays, ease: card.ease, reps: card.reps, lapses: card.lapses }, grade)
    const { error } = await createClient()
      .from("srs_cards")
      .update({
        due_at: next.dueAt.toISOString(),
        interval_days: next.intervalDays,
        ease: next.ease,
        reps: next.reps,
        lapses: next.lapses,
        status: next.status,
        last_reviewed_at: new Date().toISOString(),
      })
      .eq("id", card.id)
    if (error) throw new Error(error.message)
  })
}
