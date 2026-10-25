import { connection } from "next/server"
import { generateJson, GeminiError } from "@/lib/ai/gemini"
import { allow, clientKey } from "@/lib/ai/rate-limit"
import { getTagIndex } from "@/lib/grading/tags"
import { speakingMetrics, writingMetrics } from "@/lib/grading/metrics"
import { buildGradingPrompt, countWords, MAX_WRITING_CHARS, MIN_WORDS, parseFeedback, type Skill } from "@/lib/rubric"

const AUDIO_MIME = /^audio\/(webm|ogg|mp4|mpeg|wav)(;.*)?$/
const MAX_AUDIO_B64 = 2_000_000

/** Chấm bài viết (văn bản) hoặc bài nói (ghi âm) theo thang tiêu chí; mô hình chỉ chạy ở phía server. */
export async function POST(request: Request) {
  await connection()
  if (!allow(clientKey(request), 8)) return Response.json({ error: "Bạn gửi hơi nhanh, đợi một chút nhé." }, { status: 429 })

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 })
  }
  const skill: Skill = body.skill === "speaking" ? "speaking" : "writing"
  const task = typeof body.task === "string" ? body.task.slice(0, 400) : ""
  const targetBac = Math.min(6, Math.max(1, Math.round(Number(body.targetBac) || 2)))
  if (!task.trim()) return Response.json({ error: "Thiếu đề bài." }, { status: 400 })

  const clean = (s: string) => s.replace(/[<>]/g, "")
  const tags = await getTagIndex()
  const durationSec = Math.min(180, Math.max(0, Number(body.durationSec) || 0)) || null
  let writingText = ""
  const parts: ({ text: string } | { inlineData: { mimeType: string; data: string } })[] = []
  if (skill === "writing") {
    const text = typeof body.text === "string" ? body.text.slice(0, MAX_WRITING_CHARS) : ""
    if (countWords(text) < MIN_WORDS) return Response.json({ error: `Bài viết cần ít nhất ${MIN_WORDS} từ.` }, { status: 400 })
    writingText = text
    parts.push({ text: buildGradingPrompt(skill, clean(task), targetBac, tags.list).split("__ANSWER__").join(clean(text)) })
  } else {
    const audio = body.audio as { mime?: unknown; data?: unknown } | undefined
    if (!audio || typeof audio.mime !== "string" || typeof audio.data !== "string" || !AUDIO_MIME.test(audio.mime) || audio.data.length > MAX_AUDIO_B64) {
      return Response.json({ error: "Bản ghi âm không hợp lệ hoặc quá dài." }, { status: 400 })
    }
    parts.push({ text: buildGradingPrompt(skill, clean(task), targetBac, tags.list).split("__ANSWER__").join("(the attached audio recording)") })
    parts.push({ inlineData: { mimeType: audio.mime.split(";")[0], data: audio.data } })
  }

  try {
    const feedback = parseFeedback(await generateJson(parts), skill, new Set(tags.byId.keys()))
    if (!feedback) return Response.json({ error: "Chưa chấm được, thử lại nhé." }, { status: 502 })
    // Số liệu đo bằng mã (không nhờ mô hình đoán) kèm theo để giải thích điểm.
    const metrics = skill === "writing" ? { kind: "writing" as const, ...writingMetrics(writingText) } : { kind: "speaking" as const, ...speakingMetrics(feedback.transcript, durationSec) }
    const tagInfo = Object.fromEntries(feedback.corrections.map((c) => c.tag).filter((t): t is string => !!t).map((t) => [t, tags.byId.get(t)!]))
    return Response.json({ feedback, metrics, tagInfo })
  } catch (e) {
    if (e instanceof GeminiError && e.code === "not_configured") return Response.json({ error: "Chức năng chấm chưa được bật trên máy chủ." }, { status: 503 })
    return Response.json({ error: "Chưa chấm được, thử lại sau nhé." }, { status: 502 })
  }
}
