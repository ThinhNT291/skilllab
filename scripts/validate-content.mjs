// Kiểm tra nội dung trong src/content: chạy `npm run check:content`. Thoát mã 1 nếu có lỗi.
import fs from 'node:fs'
import path from 'node:path'

const root = path.join(process.cwd(), 'src', 'content')
const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
const errors = []
const warnings = []
const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'))

let topicCount = 0
let exerciseCount = 0
for (const lang of fs.readdirSync(path.join(root, 'grammar'))) {
  const index = read(path.join(root, 'grammar', lang, 'index.json'))
  const usageIdsByTopic = new Map()
  const seenUsage = new Set()
  const seenMistake = new Set()

  for (const meta of index) {
    topicCount++
    const file = path.join(root, 'grammar', lang, `${meta.id}.json`)
    if (!fs.existsSync(file)) { errors.push(`${lang}/${meta.id}: thiếu tệp ${meta.id}.json`); continue }
    const t = read(file)
    const at = (m) => errors.push(`grammar ${lang}/${meta.id}: ${m}`)
    if (t.id !== meta.id) at(`id trong tệp (${t.id}) khác index`)
    if (!(t.levels ?? []).length || !t.levels.every((l) => LEVELS.includes(l))) at(`levels không hợp lệ: ${t.levels}`)
    if (!t.theory?.usages?.length) at('không có usage')
    const ids = new Set()
    for (const u of t.theory?.usages ?? []) {
      if (!u.id || !u.label || !u.explanationVi) at(`usage thiếu trường: ${u.id ?? u.label}`)
      if (!(u.examples ?? []).length) at(`usage ${u.id} không có ví dụ`)
      for (const e of u.examples ?? []) if (!e.en || !e.vi) at(`usage ${u.id} có ví dụ thiếu en/vi`)
      if (seenUsage.has(u.id)) at(`usage id trùng: ${u.id}`)
      seenUsage.add(u.id); ids.add(u.id)
    }
    for (const m of t.theory?.commonMistakes ?? []) {
      if (typeof m !== 'object' || !m.id) { at(`commonMistakes phải là đối tượng có id: ${JSON.stringify(m).slice(0, 60)}`); continue }
      if (seenMistake.has(m.id)) at(`mistake id trùng: ${m.id}`)
      seenMistake.add(m.id)
      if (!m.description && !m.note && !(m.examples ?? []).length) at(`mistake ${m.id} rỗng`)
      for (const e of m.examples ?? []) if (!e.wrong || !e.correct || e.wrong === e.correct) at(`mistake ${m.id}: ví dụ thiếu hoặc sai trùng đúng`)
    }
    if (meta.usageCount !== (t.theory?.usages ?? []).length) at(`index.usageCount (${meta.usageCount}) khác số usage thực`)
    usageIdsByTopic.set(meta.id, ids)
  }

  const exDir = path.join(root, 'exercises', lang)
  if (!fs.existsSync(exDir)) continue
  const seenEx = new Set()
  for (const f of fs.readdirSync(exDir)) {
    const topic = f.replace(/\.json$/, '')
    const list = read(path.join(exDir, f))
    if (!usageIdsByTopic.has(topic)) { errors.push(`exercises ${lang}/${f}: không có chuyên đề tương ứng`); continue }
    if (list.length < 10) warnings.push(`exercises ${lang}/${f}: chỉ có ${list.length} câu (nên ≥ 10 để mỗi lượt không lặp)`)
    const covered = new Set()
    list.forEach((ex, i) => {
      exerciseCount++
      const at = (m) => errors.push(`exercise ${ex.id ?? `${f}#${i + 1}`}: ${m}`)
      if (!ex.id) at('thiếu id'); else if (seenEx.has(ex.id)) at('id trùng'); else seenEx.add(ex.id)
      if (ex.kind !== 'mcq') at(`kind lạ: ${ex.kind}`)
      if (ex.language !== lang) at(`language (${ex.language}) khác thư mục (${lang})`)
      if (ex.topic !== topic) at(`topic (${ex.topic}) khác tên tệp (${topic})`)
      if (!LEVELS.includes(ex.level)) at(`level lạ: ${ex.level}`)
      if (![1, 2, 3].includes(ex.difficulty)) at(`difficulty lạ: ${ex.difficulty}`)
      if (!ex.prompt || !ex.title || !ex.explanation) at('thiếu prompt/title/explanation')
      const ch = ex.choices ?? []
      if (ch.length < 2) at('cần ≥ 2 đáp án')
      if (new Set(ch.map((c) => String(c).trim().toLowerCase())).size !== ch.length) at('có đáp án trùng nhau')
      if (!Number.isInteger(ex.correctIndex) || ex.correctIndex < 0 || ex.correctIndex >= ch.length) at(`correctIndex ngoài phạm vi: ${ex.correctIndex}`)
      if (ex.choiceExplanations && ex.choiceExplanations.length !== ch.length) at('choiceExplanations khác số đáp án')
      if (ex.choiceExplanations?.some((s) => !String(s).trim())) at('choiceExplanations có mục trống')
      if (ex.prompt.includes('____') && ch.some((c) => c.includes('____'))) at('đáp án chứa chỗ trống')
      if (!ex.usageId) warnings.push(`${ex.id}: chưa gắn usageId (không có link "Xem lại lý thuyết")`)
      else if (!usageIdsByTopic.get(topic).has(ex.usageId)) at(`usageId không tồn tại trong chuyên đề: ${ex.usageId}`)
      else covered.add(ex.usageId)
      if (!Array.isArray(ex.tags)) at('tags phải là mảng')
    })
    for (const id of usageIdsByTopic.get(topic)) if (!covered.has(id)) warnings.push(`exercises ${lang}/${f}: chưa có câu cho mục lý thuyết ${id}`)
  }
}

console.log(`${topicCount} chuyên đề, ${exerciseCount} câu bài tập`)
if (warnings.length) console.log('\nCẢNH BÁO (' + warnings.length + '):\n' + warnings.map((w) => ' - ' + w).join('\n'))
if (errors.length) { console.log('\nLỖI (' + errors.length + '):\n' + errors.map((e) => ' - ' + e).join('\n')); process.exit(1) }
console.log('\nNội dung hợp lệ.')
