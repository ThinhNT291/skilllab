import { LISTENING_BACS, type ListeningItem } from "./types"

/** Nạp các bài nghe của một bậc. Chỉ nhận bậc có trong danh mục. */
export async function getListeningItems(bac: number): Promise<ListeningItem[] | null> {
  if (!LISTENING_BACS.includes(bac as 1)) return null
  try {
    const mod = await import(`@/content/listening/en/bac${bac}.json`)
    return mod.default as ListeningItem[]
  } catch {
    return []
  }
}

/** Chọn ngẫu nhiên một bài, tránh bài vừa làm nếu còn bài khác. */
export function pickListening(items: ListeningItem[], excludeId?: string): ListeningItem {
  const pool = items.length > 1 ? items.filter((p) => p.id !== excludeId) : items
  return pool[Math.floor(Math.random() * pool.length)]
}
