import { connection } from "next/server"
import { generateJson, GeminiError } from "@/lib/ai/gemini"
import { allow, clientKey } from "@/lib/ai/rate-limit"
import { buildHintsPrompt, parseHints } from "@/lib/hints"

/** Gợi ý dàn ý và sơ đồ tư duy cho một đề Viết (chạy trước khi học sinh viết). */
export async function POST(request: Request) {
  await connection()
  if (!allow(clientKey(request), 8)) return Response.json({ error: "Bạn gửi hơi nhanh, đợi một chút nhé." }, { status: 429 })
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 })
  }
  const task = typeof body.task === "string" ? body.task.replace(/[<>]/g, "").slice(0, 400) : ""
  const targetBac = Math.min(6, Math.max(1, Math.round(Number(body.targetBac) || 2)))
  if (!task.trim()) return Response.json({ error: "Thiếu đề bài." }, { status: 400 })
  try {
    const hints = parseHints(await generateJson([{ text: buildHintsPrompt(task, targetBac) }]))
    if (!hints) return Response.json({ error: "Chưa tạo được gợi ý, thử lại nhé." }, { status: 502 })
    return Response.json({ hints })
  } catch (e) {
    if (e instanceof GeminiError && e.code === "not_configured") return Response.json({ error: "Chức năng gợi ý chưa được bật trên máy chủ." }, { status: 503 })
    return Response.json({ error: "Chưa tạo được gợi ý, thử lại sau nhé." }, { status: 502 })
  }
}
