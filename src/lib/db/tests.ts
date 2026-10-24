import { createClient } from "@/lib/supabase/client"
import { dbConfigured, ensureProfile } from "./session"

type Fail = { ok: false; reason: "not_configured" | "error"; message?: string }
const fail = (e: unknown): Fail => ({ ok: false, reason: "error", message: e instanceof Error ? e.message : String(e) })

/** Ghi kết quả một lần làm bài kiểm tra cuối chủ điểm. */
export async function saveTopicTest(topic: string, correct: number, total: number, passed: boolean): Promise<{ ok: true } | Fail> {
  if (!dbConfigured()) return { ok: false, reason: "not_configured" }
  try {
    const profile = await ensureProfile()
    const { error } = await createClient().from("topic_tests").insert({ profile_id: profile.id, topic, correct, total, passed })
    return error ? { ok: false, reason: "error", message: error.message } : { ok: true }
  } catch (e) {
    return fail(e)
  }
}

/** Các chuyên đề đã từng vượt qua bài kiểm tra. */
export async function getPassedTopics(): Promise<{ ok: true; topics: string[] } | Fail> {
  if (!dbConfigured()) return { ok: false, reason: "not_configured" }
  try {
    const profile = await ensureProfile()
    const { data, error } = await createClient().from("topic_tests").select("topic").eq("profile_id", profile.id).eq("passed", true)
    if (error) return { ok: false, reason: "error", message: error.message }
    return { ok: true, topics: [...new Set((data ?? []).map((r: { topic: string }) => r.topic))] }
  } catch (e) {
    return fail(e)
  }
}
