// Bảng "từ → bậc thấp nhất" từ CEFR-J (A1–B2) và Octanove (C1–C2) trong reference/. Dùng chung cho các script kiểm tra độ khó từ vựng.
import fs from "node:fs"

/** Đọc CSV có dấu ngoặc kép (đủ cho hai tệp từ vựng này). */
export function parseCsv(text) {
  const rows = []
  let row = []
  let cell = ""
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        cell += '"'
        i++
      } else if (c === '"') quoted = false
      else cell += c
    } else if (c === '"') quoted = true
    else if (c === ",") {
      row.push(cell)
      cell = ""
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++
      row.push(cell)
      cell = ""
      if (row.length > 1 || row[0] !== "") rows.push(row)
      row = []
    } else cell += c
  }
  if (cell || row.length) rows.push([...row, cell])
  return rows
}

export async function loadLevelIndex() {
  const { bacOfLevel, buildLevelIndex } = await import("../../src/lib/content/text-level.ts")
  const entries = []
  for (const file of ["reference/cefrj-vocabulary-profile-1.5.csv", "reference/octanove-vocabulary-profile-c1c2-1.0.csv"]) {
    if (!fs.existsSync(file)) throw new Error(`Thiếu ${file}`)
    const [head, ...body] = parseCsv(fs.readFileSync(file, "utf8").replace(/^﻿/, ""))
    const hw = head.indexOf("headword")
    const lv = head.indexOf("CEFR")
    for (const r of body) {
      const bac = bacOfLevel(r[lv] ?? "")
      if (bac && r[hw]) entries.push({ word: r[hw], bac })
    }
  }
  return buildLevelIndex(entries)
}
