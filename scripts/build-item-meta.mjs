// Sinh src/content/meta/items.json: mã câu bài tập → [bậc, độ khó], để tính ước lượng trình độ từ lịch sử trả lời ở trình duyệt
// mà không phải tải cả ngân hàng câu hỏi. Chạy: node scripts/build-item-meta.mjs  (bài kiểm tra tests/item-meta.test.ts báo nếu tệp cũ)
import fs from "node:fs"
import { collectItems } from "./lib/content-items.mjs"

export function buildItemMeta(root = "src/content") {
  const meta = {}
  for (const it of collectItems(root)) {
    if (it.collection !== "exercise") continue
    meta[it.id] = [it.data.bac ?? it.bac ?? 0, it.data.difficulty ?? 2]
  }
  return meta
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const meta = buildItemMeta()
  fs.mkdirSync("src/content/meta", { recursive: true })
  fs.writeFileSync("src/content/meta/items.json", JSON.stringify(meta))
  console.log(`Đã ghi ${Object.keys(meta).length} câu vào src/content/meta/items.json`)
}
