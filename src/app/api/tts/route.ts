import { connection } from "next/server"
import { generateSpeech, GeminiError } from "@/lib/ai/gemini"
import { allow, clientKey } from "@/lib/ai/rate-limit"

const MAX_CHARS = 400
const VOICES = new Set(["Kore", "Puck", "Zephyr", "Charon"])

/** Đọc to một câu tiếng Anh bằng Gemini TTS; trình duyệt tự dùng giọng có sẵn nếu route này lỗi. */
export async function POST(request: Request) {
  await connection()
  if (!allow(clientKey(request), 60)) return new Response("Too many requests", { status: 429 })
  let text = ""
  let voice: string | undefined
  try {
    const body = (await request.json()) as { text?: unknown }
    text = typeof body.text === "string" ? body.text.trim().slice(0, MAX_CHARS) : ""
    if (typeof (body as { voice?: unknown }).voice === "string" && VOICES.has((body as { voice: string }).voice)) voice = (body as { voice: string }).voice
  } catch {
    return new Response("Bad request", { status: 400 })
  }
  if (!text) return new Response("Bad request", { status: 400 })
  try {
    const wav = await generateSpeech(text, voice)
    return new Response(new Uint8Array(wav), { headers: { "content-type": "audio/wav", "cache-control": "private, max-age=86400" } })
  } catch (e) {
    return new Response("TTS unavailable", { status: e instanceof GeminiError && e.code === "not_configured" ? 503 : 502 })
  }
}
