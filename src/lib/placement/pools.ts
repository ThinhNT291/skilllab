import itemMeta from "@/content/meta/items.json"
import type { Exercise } from "@/lib/content/types"
import { getExercises, listGrammarTopics } from "@/lib/content/grammar"
import { getReadingPassages, glossFor } from "@/lib/reading/data"
import { getListeningItems } from "@/lib/listening/data"
import type { ReadingPassage } from "@/lib/reading/types"
import type { ListeningItem } from "@/lib/listening/types"
import { getVocab } from "@/lib/vocab/data"
import { clozeQuestion, meaningQuestion, viQuestion, VOCAB_LEVELS } from "@/lib/vocab/questions"
import { itemRating, type ItemMeta } from "@/lib/progress/ability"

/** Tập câu/bài dành riêng cho bài xếp trình độ tổng hợp, đã dựng thành dạng giao diện dùng được. Chỉ chạy phía máy chủ. */
export interface PlacementPools {
  grammar: { exercise: Exercise; rating: number }[]
  vocab: { exercise: Exercise; rating: number }[]
  reading: { passage: ReadingPassage; gloss: Record<string, string> }[]
  listening: { item: ListeningItem }[]
}

const meta = itemMeta as unknown as ItemMeta

function fnv(s: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h
}

export async function buildPlacementPools(): Promise<PlacementPools> {
  const grammar: PlacementPools["grammar"] = []
  for (const t of listGrammarTopics("en")) {
    for (const ex of await getExercises("en", t.id, { reserved: "only" })) {
      if (ex.kind !== "mcq") continue
      const m = meta[ex.id]
      grammar.push({ exercise: ex, rating: m ? itemRating(m[0], m[1]) : itemRating(ex.bac ?? 2, ex.difficulty) })
    }
  }

  const vocab: PlacementPools["vocab"] = []
  for (const l of VOCAB_LEVELS) {
    const mine = (await getVocab(l.id, { reserved: "only" })) ?? []
    // Từ gây nhiễu lấy từ cả cấp (gồm phần dành riêng), cùng từ loại.
    const all = [...mine, ...((await getVocab(l.id)) ?? [])]
    for (const w of mine) {
      // Mỗi từ một dạng câu cố định theo mã từ (đọc nghĩa Anh, điền từ vào câu, nghĩa Việt) để mã câu ổn định giữa các lần.
      const form = fnv(w.id) % 3
      const q = (form === 1 ? clozeQuestion(w, l.id, all) : form === 2 ? viQuestion(w, l.id, all) : null) ?? meaningQuestion(w, l.id, all)
      vocab.push({ exercise: q, rating: itemRating(l.bac) })
    }
  }

  const reading: PlacementPools["reading"] = []
  const listening: PlacementPools["listening"] = []
  for (const bac of [1, 2, 3, 4, 5, 6]) {
    for (const passage of (await getReadingPassages(bac, { reserved: "only" })) ?? []) reading.push({ passage, gloss: await glossFor(passage.text) })
    for (const item of (await getListeningItems(bac, { reserved: "only" })) ?? []) listening.push({ item })
  }
  return { grammar, vocab, reading, listening }
}
