import { connection } from "next/server"
import { generateJson, GeminiError } from "@/lib/ai/gemini"
import { allow, clientKey } from "@/lib/ai/rate-limit"
import { buildGlossPrompt, parseGloss } from "@/lib/hints"

/** Giải nghĩa một từ theo ngữ cảnh câu (bấm vào từ trong bài đọc). */
export async function POST(request: Request) {
  await connection()
  if (!allow(clientKey(request), 20)) return Response.json({ error: "Bạn tra hơi nhanh, đợi một chút nhé." }, { status: 429 })
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 })
  }
  const word = typeof body.word === "string" ? body.word.replace(/[^A-Za-z' -]/g, "").slice(0, 40) : ""
  const sentence = typeof body.sentence === "string" ? body.sentence.replace(/[<>]/g, "").slice(0, 300) : ""
  if (!word.trim() || !sentence.trim()) return Response.json({ error: "Thiếu từ hoặc câu." }, { status: 400 })
  try {
    const gloss = parseGloss(await generateJson([{ text: buildGlossPrompt(word, sentence) }]))
    if (!gloss) return Response.json({ error: "Chưa giải nghĩa được." }, { status: 502 })
    return Response.json({ gloss })
  } catch (e) {
    if (e instanceof GeminiError && e.code === "not_configured") return Response.json({ error: "Chức năng tra từ chưa được bật." }, { status: 503 })
    return Response.json({ error: "Chưa giải nghĩa được." }, { status: 502 })
  }
}
