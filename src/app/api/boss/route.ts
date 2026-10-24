import { connection } from "next/server"
import { getExercises, listGrammarTopics } from "@/lib/content/grammar"
import { shuffle } from "@/lib/content/derive"
import { BOSS_SIZE } from "@/lib/game/boss"
import type { McqExercise } from "@/lib/content/types"

const TAG = /^[a-z0-9-]{1,60}$/

/**
 * Câu hỏi cho trận "trùm cuối": các câu trắc nghiệm gắn với những mục người học hay sai.
 * Chỉ nhận mã mục dạng chữ-số-gạch ngang (tối đa 8), không đọc đường dẫn nào từ yêu cầu.
 */
export async function GET(request: Request) {
  await connection()
  const raw = new URL(request.url).searchParams.get("tags") ?? ""
  const tags = [...new Set(raw.split(",").filter((t) => TAG.test(t)))].slice(0, 8)
  if (!tags.length) return Response.json({ exercises: [] })

  const all: McqExercise[] = []
  for (const meta of listGrammarTopics("en")) {
    for (const e of await getExercises("en", meta.id)) {
      if (e.kind === "mcq" && (tags.includes(e.usageId ?? "") || e.tags.some((t) => tags.includes(t)))) all.push(e)
    }
  }
  return Response.json({ exercises: shuffle(all).slice(0, BOSS_SIZE) })
}
