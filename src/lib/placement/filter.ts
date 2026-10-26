/**
 * Câu/bài dành riêng cho bài xếp trình độ tổng hợp (src/content/placement/reserved.json, chọn bằng scripts/build-placement-bank.mjs).
 * Mặc định bị loại khỏi mọi bài luyện để học sinh không gặp trước; riêng bài xếp trình độ lấy đúng tập này. Hàm thuần.
 */
export type ReservedMode = "exclude" | "only"

export function filterReserved<T extends { id: string }>(items: T[], reserved: ReadonlySet<string>, mode: ReservedMode = "exclude"): T[] {
  return items.filter((i) => (mode === "only") === reserved.has(i.id))
}
