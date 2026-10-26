/**
 * Xuất các mục đã duyệt thành các phần để đưa vào `src/content` (docs/quy-trinh nội dung trong CLAUDE.md): vì ứng dụng chạy trên Vercel
 * không ghi được vào tệp JSON trong git, nên "gộp" là tải tệp xuất này rồi gộp bằng tay/nhờ Claude, chạy `check:content`, build meta, test.
 * Hàm thuần.
 */
import type { DraftKind } from "./parse.ts"

export interface ExportDraft {
  itemId: string
  kind: DraftKind
  topic: string
  bac: number
  data: Record<string, unknown>
}

export interface ExportFile {
  /** Tệp đích trong repo mà các mục này sẽ được thêm vào cuối mảng */
  path: string
  items: Record<string, unknown>[]
}

export interface ExportResult {
  files: ExportFile[]
  warnings: string[]
}

const targetOf = (d: ExportDraft): string => (d.kind === "grammar" ? `src/content/exercises/en/${d.topic}.json` : `src/content/${d.kind}/en/bac${d.bac}.json`)

export function buildExport(drafts: ExportDraft[]): ExportResult {
  const byPath = new Map<string, ExportFile>()
  const warnings: string[] = []
  const seen = new Map<string, string>()
  for (const d of drafts) {
    const path = targetOf(d)
    const id = String(d.data.id ?? d.itemId)
    if (seen.has(id)) warnings.push(`Mã ${id} xuất hiện hai lần (${seen.get(id)} và ${path}); chỉ giữ lần đầu.`)
    else {
      seen.set(id, path)
      const file = byPath.get(path) ?? { path, items: [] }
      file.items.push(d.data)
      byPath.set(path, file)
    }
  }
  const files = [...byPath.values()].sort((a, b) => a.path.localeCompare(b.path))
  // Phân bố đáp án đúng theo từng tệp ngữ pháp: nhắc nếu lệch (chuẩn nội dung: rải đều A/B/C/D).
  for (const f of files) {
    if (!f.path.includes("/exercises/") || f.items.length < 8) continue
    const pos = [0, 0, 0, 0]
    for (const it of f.items) if (typeof it.correctIndex === "number") pos[it.correctIndex as number]++
    if (Math.max(...pos) / f.items.length > 0.4) warnings.push(`${f.path}: đáp án đúng dồn vào một vị trí (${pos.join("/")}).`)
  }
  warnings.push("Mã câu do script gán lúc sinh: nếu nội dung đã thay đổi từ đó, kiểm tra trùng mã khi gộp (npm run check:content báo lỗi nếu trùng).")
  return { files, warnings }
}
