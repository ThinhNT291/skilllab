import { createClient } from "@/lib/supabase/client"
import type { AnswerRecord, Exercise } from "@/lib/content/types"
import { dbConfigured, ensureProfile } from "./session"
import { ensureCardFromError } from "./srs"
import { afterFlush, enqueue, isTransientError, splitQueue, type PendingAnswer } from "./answer-queue"

export type SaveResult = { ok: true } | { ok: false; reason: "not_configured" | "error"; message?: string }

const QUEUE_KEY = "skilllab.answerQueue"
/** Cột client_id có hay chưa (chưa chạy migration 0012 thì ghi như cũ, không chống trùng). */
let hasClientId = true

function loadQueue(): PendingAnswer[] {
  try {
    const raw = JSON.parse(localStorage.getItem(QUEUE_KEY) ?? "[]")
    return Array.isArray(raw) ? (raw as PendingAnswer[]) : []
  } catch {
    return []
  }
}

function saveQueue(list: PendingAnswer[]) {
  try {
    if (list.length) localStorage.setItem(QUEUE_KEY, JSON.stringify(list))
    else localStorage.removeItem(QUEUE_KEY)
  } catch {
    // Trình duyệt chặn lưu trữ: bỏ qua, hàng đợi chỉ là lớp an toàn thêm
  }
}

type Row = Omit<PendingAnswer, "tries">

async function insertRows(rows: Row[]): Promise<{ ok: boolean; status?: number; message?: string }> {
  const supabase = createClient()
  if (hasClientId) {
    const r = await supabase.from("answers").upsert(rows, { onConflict: "client_id", ignoreDuplicates: true })
    if (!r.error) return { ok: true }
    // Chưa chạy migration 0012 (chưa có cột client_id): ghi như cũ.
    if (/client_id/i.test(r.error.message)) hasClientId = false
    else return { ok: false, status: r.status, message: r.error.message }
  }
  const plain = rows.map((r) => {
    const o: Partial<Row> = { ...r }
    delete o.client_id
    return o
  })
  const r = await supabase.from("answers").insert(plain)
  return r.error ? { ok: false, status: r.status, message: r.error.message } : { ok: true }
}

let flushing = false

/** Gửi lại các câu trả lời đang chờ của hồ sơ hiện tại. An toàn gọi nhiều lần; không ném lỗi. */
export async function flushPendingAnswers(): Promise<void> {
  if (flushing || !dbConfigured()) return
  const queue = loadQueue()
  if (queue.length === 0) return
  flushing = true
  try {
    const profile = await ensureProfile()
    const { flush, keep } = splitQueue(queue, profile.id)
    if (flush.length === 0) return saveQueue(keep)
    const r = await insertRows(flush.map((p): Row => ({ client_id: p.client_id, profile_id: p.profile_id, exercise_id: p.exercise_id, topic: p.topic, tags: p.tags, correct: p.correct, choice_index: p.choice_index, created_at: p.created_at })))
    saveQueue(r.ok ? keep : [...keep, ...afterFlush(flush, new Set())])
  } catch {
    // Vẫn không có mạng: giữ nguyên hàng đợi
  } finally {
    flushing = false
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("online", () => void flushPendingAnswers())
  // Lần tải trang đầu tiên: thử gửi lại những gì còn sót từ lần trước.
  setTimeout(() => void flushPendingAnswers(), 3000)
}

/**
 * Ghi một lượt trả lời của học sinh hiện tại. Không ném lỗi: gọi từ giao diện, lỗi mạng không được chặn việc làm bài.
 * Lỗi tạm thời (mạng, máy chủ bận) thì câu trả lời vào hàng đợi trong trình duyệt và được gửi lại sau; mỗi câu có mã riêng nên không bị ghi trùng.
 */
export async function recordAnswer(record: AnswerRecord, exercise: Exercise): Promise<SaveResult> {
  if (!dbConfigured()) return { ok: false, reason: "not_configured" }
  try {
    const profile = await ensureProfile()
    const row: Row = {
      client_id: crypto.randomUUID(),
      profile_id: profile.id,
      exercise_id: record.exerciseId,
      topic: exercise.topic,
      tags: exercise.tags,
      correct: record.correct,
      choice_index: record.choiceIndex ?? null,
      created_at: new Date().toISOString(),
    }
    const r = await insertRows([row])
    if (!r.ok) {
      if (isTransientError(r.message, r.status)) saveQueue(enqueue(loadQueue(), { ...row, tries: 0 }))
      return { ok: false, reason: "error", message: r.message }
    }
    // Câu sai tự thành thẻ ôn tập. Lỗi tạo thẻ (vd chưa chạy migration 0002) không làm hỏng việc ghi câu trả lời.
    if (!record.correct) void ensureCardFromError(exercise)
    if (loadQueue().length > 0) void flushPendingAnswers()
    return { ok: true }
  } catch (e) {
    return { ok: false, reason: "error", message: e instanceof Error ? e.message : String(e) }
  }
}
