// Xuất bộ bài mẫu (eval/grade-samples.candidates.json) thành phiếu chấm cho giáo viên:
//   node scripts/eval-export.mjs
// Ghi eval/phieu-cham.csv (mở bằng Excel/Google Sheets; điền 5 cột điểm) và eval/huong-dan-cham.md (thang điểm lấy đúng từ src/lib/rubric.ts,
// cùng thước mà máy chấm dùng). Sau khi chấm xong: node scripts/eval-import.mjs eval/phieu-cham.csv
import fs from "node:fs"

const { buildSheet, csvStringify } = await import("../src/lib/grading/eval-sheet.ts")
const { CRITERIA, DESCRIPTORS } = await import("../src/lib/rubric.ts")
const cands = JSON.parse(fs.readFileSync("eval/grade-samples.candidates.json", "utf8"))
fs.writeFileSync("eval/phieu-cham.csv", "﻿" + csvStringify(buildSheet(cands)))

const guide = [
  "# Hướng dẫn chấm bài viết mẫu",
  "",
  `Bạn chấm ${cands.length} bài viết ngắn (file \`phieu-cham.csv\`, mở bằng Excel hoặc Google Sheets). Mỗi bài có đề, **bậc mục tiêu** của đề (Bậc 1 = A1 … Bậc 6 = C2) và bài làm. Điền 5 cột điểm cho mỗi bài:`,
  "",
  "- 4 cột `score_…`: điểm **0–4** cho từng tiêu chí, theo bảng mô tả dưới đây. **Điểm 3 = đạt đúng mức của bậc mục tiêu** của đề; 4 = vượt; 2 và thấp hơn = chưa đạt.",
  "- `bac_overall`: bạn thấy bài thể hiện năng lực ở **Bậc** nào (0 = dưới Bậc 1, tối đa 6), độc lập với bậc mục tiêu của đề.",
  "",
  "Gợi ý cách chấm: đọc cả bài, chấm từng tiêu chí riêng (đừng để ấn tượng chung ảnh hưởng cả bốn điểm), chấm theo **bằng chứng trong bài**, không theo kỳ vọng về học sinh. Bài ngắn thì khó đạt điểm cao ở bố cục và vốn từ. Nếu nhiều thầy cô cùng chấm, mỗi người một bản phiếu, đừng bàn trước; chỉ bàn lại những bài chấm lệch nhau từ 2 điểm trở lên.",
  "",
  "Máy chấm dùng đúng các mô tả này, nên nếu thấy mô tả khó áp dụng hoặc chưa hợp với học sinh của bạn, hãy ghi lại: đó là thông tin quý để chỉnh thang chấm.",
  "",
]
for (const c of CRITERIA.writing) {
  guide.push(`## ${c.label} (${c.en}), cột \`score_${c.key}\``, "")
  DESCRIPTORS[c.key].forEach((d, i) => guide.push(`- **${i}**: ${d}`))
  guide.push("")
}
fs.writeFileSync("eval/huong-dan-cham.md", guide.join("\n"))
console.log(`Đã ghi eval/phieu-cham.csv (${cands.length} bài) và eval/huong-dan-cham.md.`)
