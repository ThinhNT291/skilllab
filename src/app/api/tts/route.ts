import { connection } from "next/server"
import { generateSpeech, GeminiError } from "@/lib/ai/gemini"
import { allow, clientKey } from "@/lib/ai/rate-limit"

const MAX_CHARS = 300

/** Đọc to một câu tiếng Anh bằng Gemini TTS; trình duyệt tự dùng giọng có sẵn nếu route này lỗi. */
export async function POST(request: Request) {
  await connection()
  if (!allow(clientKey(request), 30)) return new Response("Too many requests", { status: 429 })
  let text = ""
  try {
    const body = (await request.json()) as { text?: unknown }
    text = typeof body.text === "string" ? body.text.trim().slice(0, MAX_CHARS) : ""
  } catch {
    return new Response("Bad request", { status: 400 })
  }
  if (!text) return new Response("Bad request", { status: 400 })
  try {
    const wav = await generateSpeech(text)
    return new Response(new Uint8Array(wav), { headers: { "content-type": "audio/wav", "cache-control": "private, max-age=86400" } })
  } catch (e) {
    return new Response("TTS unavailable", { status: e instanceof GeminiError && e.code === "not_configured" ? 503 : 502 })
  }
}
