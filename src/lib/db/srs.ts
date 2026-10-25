import { createClient } from "@/lib/supabase/client"
import type { Exercise } from "@/lib/content/types"
import { POS_VI, type VocabLevel, type VocabWord } from "@/lib/vocab/questions"
import { cardContentFromExercise } from "@/lib/srs/card-from-exercise"
import { schedule, type Grade } from "@/lib/srs/scheduler"
import { fsrsFromSm2, retrievabilityNow, scheduleFsrs, type FsrsState } from "@/lib/srs/fsrs"
import { getSettings } from "@/lib/settings"
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
  /** Trạng thái FSRS (cần migration 0010); null với thẻ chưa từng ôn bằng FSRS */
  fsrs: FsrsState | null
  lastReviewedAt: string | null
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
  stability?: number | null
  difficulty?: number | null
  fsrs_state?: number | null
  last_reviewed_at?: string | null
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
  lastReviewedAt: r.last_reviewed_at ?? null,
  fsrs:
    r.stability != null && r.difficulty != null && (r.fsrs_state ?? 0) > 0
      ? { stability: Number(r.stability), difficulty: Number(r.difficulty), state: (r.fsrs_state ?? 2) as 0 | 1 | 2 | 3, reps: r.reps, lapses: r.lapses, lastReview: r.last_reviewed_at ? new Date(r.last_reviewed_at) : null }
      : null,
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
    // Câu biến thể (sắp xếp, gõ, nghe chép) mang sẵn nội dung thẻ của câu gốc, nên sai ở bất kỳ dạng nào vẫn chỉ có một thẻ.
    const c = exercise.kind === "mcq" ? { key: exercise.id, ...cardContentFromExercise(exercise) } : exercise.card
    const sourceKey = `grammar-${exercise.topic}-${c.key}`
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

/**
 * Thêm một từ vựng vào thẻ ôn theo yêu cầu của học sinh (sổ từ riêng). Mặt trước là nghĩa, mặt sau là từ kèm ví dụ.
 * Thêm lại từ đã có thì giữ nguyên lịch ôn cũ.
 */
export function addVocabCard(word: VocabWord, level: VocabLevel): Promise<CardsResult<void>> {
  return guarded(async () => {
    const profile = await ensureProfile()
    const example = word.ex[0] ?? null
    const { error } = await createClient().from("srs_cards").upsert(
      {
        profile_id: profile.id,
        source_key: `vocab-${level}-${word.id}`,
        kind: "vocab",
        topic: `vocab-${level}`,
        front: word.vi ? `${word.vi} (${POS_VI[word.pos] ?? word.pos})` : word.def,
        answer: word.word,
        filled: example,
        explanation: word.vi ? word.def : null,
      },
      { onConflict: "profile_id,source_key", ignoreDuplicates: true },
    )
    if (error) throw new Error(error.message)
  })
}

/** Các thẻ đến hạn ôn (cũ nhất trước). */
export function getDueCards(limit = 20): Promise<CardsResult<SrsCard[]>> {
  return guarded(async () => {
    const profile = await ensureProfile()
    const supabase = createClient()
    const base = "id, topic, usage_id, front, answer, filled, explanation, interval_days, ease, reps, lapses, status, last_reviewed_at"
    const query = (cols: string) => supabase.from("srs_cards").select(cols).eq("profile_id", profile.id).eq("status", "active").lte("due_at", new Date().toISOString()).order("due_at", { ascending: true }).limit(limit)
    let res = await query(`${base}, stability, difficulty, fsrs_state`)
    // Chưa chạy migration 0010 (chưa có cột FSRS): đọc như trước, thẻ vẫn ôn được bằng SM-2.
    if (res.error && /stability|difficulty|fsrs_state/i.test(res.error.message)) res = await query(base)
    if (res.error) throw new Error(res.error.message)
    return ((res.data ?? []) as unknown as Row[]).map(fromRow)
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

/**
 * Ghi kết quả một lần ôn. Tính CẢ HAI thuật toán (SM-2 và FSRS) và lưu cả hai trạng thái; thuật toán đang chọn trong cài đặt
 * quyết định lịch ôn kế tiếp. Ghi thêm nhật ký lượt ôn (srs_reviews) để so sánh sau này. Thiếu migration 0010 thì tự lùi về SM-2.
 */
export function reviewCard(card: SrsCard, grade: Grade): Promise<CardsResult<void>> {
  return guarded(async () => {
    const now = new Date()
    const { srsAlgorithm, retention } = getSettings()
    const sm = { intervalDays: card.intervalDays, ease: card.ease, reps: card.reps, lapses: card.lapses }
    const last = card.lastReviewedAt ? new Date(card.lastReviewedAt) : null
    const prevFsrs = card.fsrs ?? fsrsFromSm2(sm, last, now)
    const sm2 = schedule(sm, grade, now)
    const f = scheduleFsrs(prevFsrs, grade, now, retention)
    const useFsrs = srsAlgorithm === "fsrs"
    const dueAt = useFsrs ? f.dueAt : sm2.dueAt
    const days = useFsrs ? f.scheduledDays : sm2.intervalDays
    const status = days >= 60 ? "mastered" : "active"
    const legacy = {
      interval_days: sm2.intervalDays,
      ease: sm2.ease,
      reps: sm2.reps,
      lapses: sm2.lapses,
      last_reviewed_at: now.toISOString(),
    }
    const supabase = createClient()
    let { error } = await supabase
      .from("srs_cards")
      .update({ ...legacy, due_at: dueAt.toISOString(), status, stability: f.next.stability, difficulty: f.next.difficulty, fsrs_state: f.next.state })
      .eq("id", card.id)
    if (error && /stability|difficulty|fsrs_state/i.test(error.message)) {
      // Chưa có cột FSRS: ghi theo SM-2 như trước.
      ;({ error } = await supabase.from("srs_cards").update({ ...legacy, due_at: sm2.dueAt.toISOString(), status: sm2.status }).eq("id", card.id))
    }
    if (error) throw new Error(error.message)
    // Nhật ký so sánh: lỗi ở đây (vd chưa chạy migration) không được làm hỏng việc ôn tập.
    const profile = await ensureProfile()
    void supabase.from("srs_reviews").insert({
      card_id: card.id,
      profile_id: profile.id,
      rating: { again: 1, hard: 2, good: 3, easy: 4 }[grade],
      algorithm: srsAlgorithm,
      elapsed_days: last ? Math.round(((now.getTime() - last.getTime()) / 86_400_000) * 100) / 100 : null,
      retrievability: retrievabilityNow(card.fsrs, now, retention),
      scheduled_days: days,
      fsrs_days: f.scheduledDays,
      sm2_days: sm2.intervalDays,
    })
  })
}

export interface SrsCardRow extends SrsCard {
  dueAt: string
}

/** Tất cả thẻ của học sinh (để xem và xóa), thẻ đến hạn gần nhất trước. */
export function listAllCards(limit = 300): Promise<CardsResult<SrsCardRow[]>> {
  return guarded(async () => {
    const profile = await ensureProfile()
    const { data, error } = await createClient()
      .from("srs_cards")
      .select("id, topic, usage_id, front, answer, filled, explanation, interval_days, ease, reps, lapses, status, due_at")
      .eq("profile_id", profile.id)
      .order("due_at", { ascending: true })
      .limit(limit)
    if (error) throw new Error(error.message)
    return ((data ?? []) as (Row & { due_at: string })[]).map((r) => ({ ...fromRow(r), dueAt: r.due_at }))
  })
}

/** Xóa một thẻ. Câu đó sai lần nữa thì thẻ sẽ được tạo lại. */
export function deleteCard(id: string): Promise<CardsResult<void>> {
  return guarded(async () => {
    const profile = await ensureProfile()
    const { error } = await createClient().from("srs_cards").delete().eq("id", id).eq("profile_id", profile.id)
    if (error) throw new Error(error.message)
  })
}
