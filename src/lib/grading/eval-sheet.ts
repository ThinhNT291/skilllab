/**
 * Phiếu chấm cho giáo viên: xuất bộ bài mẫu thành CSV (mở được bằng Excel/Google Sheets), nhập lại điểm đã chấm thành bộ mẫu cho
 * scripts/grade-eval.mjs. Hàm thuần. Văn bài lấy lại từ tệp bài mẫu theo mã, không lấy từ CSV, để khỏi hỏng chữ khi qua bảng tính.
 */
export interface Candidate {
  id: string
  skill: "writing"
  task: string
  targetBac: number
  text: string
}

export const SCORE_COLUMNS = ["task", "organization", "vocabulary", "grammar"] as const

export function csvEscape(v: string): string {
  return /[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v
}

export function csvStringify(rows: string[][]): string {
  return rows.map((r) => r.map(csvEscape).join(",")).join("\r\n") + "\r\n"
}

export function csvParse(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ""
  let quoted = false
  const src = text.replace(/^﻿/, "")
  for (let i = 0; i < src.length; i++) {
    const c = src[i]
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') {
        cell += '"'
        i++
      } else if (c === '"') quoted = false
      else cell += c
    } else if (c === '"') quoted = true
    else if (c === ",") {
      row.push(cell)
      cell = ""
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++
      row.push(cell)
      cell = ""
      if (row.length > 1 || row[0] !== "") rows.push(row)
      row = []
    } else cell += c
  }
  if (cell || row.length) rows.push([...row, cell])
  return rows
}

/** Phiếu chấm: mỗi bài một dòng, năm cột điểm để trống cho giáo viên điền. */
export function buildSheet(cands: Candidate[]): string[][] {
  return [["id", "targetBac", "task_prompt", "text", ...SCORE_COLUMNS.map((k) => `score_${k}`), "bac_overall"], ...cands.map((c) => [c.id, String(c.targetBac), c.task, c.text, "", "", "", "", ""])]
}

export interface Imported {
  samples: { id: string; skill: "writing"; task: string; targetBac: number; text: string; human: { scores: Record<string, number>; bac: number } }[]
  /** Mã bài giáo viên chưa chấm đủ */
  incomplete: string[]
  errors: string[]
}

/** Đọc phiếu đã chấm. Ô điểm phải là số nguyên (0–4 cho tiêu chí, 0–6 cho bậc tổng). Bài chưa chấm đủ không vào bộ mẫu. */
export function importSheet(csv: string, cands: Candidate[]): Imported {
  const rows = csvParse(csv)
  const out: Imported = { samples: [], incomplete: [], errors: [] }
  if (rows.length < 2) return { ...out, errors: ["phiếu rỗng"] }
  const head = rows[0].map((h) => h.trim())
  const col = (name: string) => head.indexOf(name)
  const idCol = col("id")
  const cols = SCORE_COLUMNS.map((k) => col(`score_${k}`))
  const bacCol = col("bac_overall")
  if (idCol < 0 || bacCol < 0 || cols.some((c) => c < 0)) return { ...out, errors: ["thiếu cột bắt buộc (id, score_task, score_organization, score_vocabulary, score_grammar, bac_overall)"] }
  const byId = new Map(cands.map((c) => [c.id, c]))
  const seen = new Set<string>()
  for (const r of rows.slice(1)) {
    const id = (r[idCol] ?? "").trim()
    const cand = byId.get(id)
    if (!cand) {
      out.errors.push(`mã không có trong bài mẫu: "${id}"`)
      continue
    }
    if (seen.has(id)) out.errors.push(`${id}: xuất hiện hai lần`)
    seen.add(id)
    const cells = [...cols, bacCol].map((c) => (r[c] ?? "").trim())
    if (cells.every((x) => x === "")) {
      out.incomplete.push(id)
      continue
    }
    const nums = cells.map((x) => (/^\d+$/.test(x) ? Number(x) : NaN))
    const bad = nums.findIndex((n, i) => Number.isNaN(n) || n < 0 || n > (i === nums.length - 1 ? 6 : 4))
    if (cells.some((x) => x === "")) out.incomplete.push(id)
    else if (bad >= 0) out.errors.push(`${id}: điểm "${cells[bad]}" ở cột ${bad === nums.length - 1 ? "bac_overall (0–6)" : `score_${SCORE_COLUMNS[bad]} (0–4)`} không hợp lệ`)
    else out.samples.push({ id, skill: "writing", task: cand.task, targetBac: cand.targetBac, text: cand.text, human: { scores: Object.fromEntries(SCORE_COLUMNS.map((k, i) => [k, nums[i]])), bac: nums[nums.length - 1] } })
  }
  for (const c of cands) if (!seen.has(c.id)) out.incomplete.push(c.id)
  return out
}
