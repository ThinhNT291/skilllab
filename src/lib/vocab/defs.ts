import { getVocab } from "./data"
import { VOCAB_LEVELS } from "./questions"
import { buildDefIndex, type DefIndex } from "@/lib/content/passage-extras"

let cached: Promise<DefIndex> | null = null

/**
 * Bảng "từ → định nghĩa tiếng Anh" cho câu tìm từ theo nghĩa. Chỉ gồm từ có ĐÚNG MỘT mục trong toàn kho từ vựng (mọi cấp),
 * để định nghĩa không mơ hồ giữa các nghĩa hay từ loại. Chỉ chạy phía server; nạp một lần mỗi tiến trình.
 */
export function getDefIndex(): Promise<DefIndex> {
  cached ??= (async () => {
    const entries: { word: string; def: string; vi?: string | null; reserved?: boolean; pos?: string }[] = []
    for (const l of VOCAB_LEVELS) {
      for (const w of (await getVocab(l.id)) ?? []) entries.push({ word: w.word, def: w.def, vi: w.vi, pos: w.pos })
      // Từ dành riêng cho bài xếp trình độ vẫn được đếm khi xét "chỉ một nghĩa", nhưng không dùng làm câu luyện.
      for (const w of (await getVocab(l.id, { reserved: "only" })) ?? []) entries.push({ word: w.word, def: w.def, vi: w.vi, pos: w.pos, reserved: true })
    }
    return buildDefIndex(entries)
  })()
  return cached
}
