import itemMeta from "@/content/meta/items.json"
import { getVocab } from "@/lib/vocab/data"
import { VOCAB_LEVELS } from "@/lib/vocab/questions"
import { getReadingPassages } from "@/lib/reading/data"
import { getListeningItems } from "@/lib/listening/data"
import { READING_BACS } from "@/lib/reading/types"
import { grammarTotals, type Totals } from "./scale"
import type { ItemMeta } from "./ability"

/** Tổng nội dung hiện có theo kỹ năng và Bậc (chạy ở máy chủ). Bậc chưa có nội dung không xuất hiện (tính là 0). */
export async function getScaleTotals(): Promise<Totals> {
  const totals: Totals = { grammar: grammarTotals(itemMeta as unknown as ItemMeta), vocab: {}, reading: {}, listening: {} }
  for (const l of VOCAB_LEVELS) totals.vocab[l.bac] = (await getVocab(l.id))?.length ?? 0
  for (const bac of READING_BACS) {
    totals.reading[bac] = (await getReadingPassages(bac))?.length ?? 0
    totals.listening[bac] = (await getListeningItems(bac))?.length ?? 0
  }
  return totals
}
