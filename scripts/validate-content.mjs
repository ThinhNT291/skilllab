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
  const allUsageIds = new Set([...usageIdsByTopic.values()].flatMap((s) => [...s]))
  const seenEx = new Set()
  const seenPrompt = new Map()
  for (const f of fs.readdirSync(exDir).sort()) {
    const topic = f.replace(/\.json$/, '')
    const list = read(path.join(exDir, f))
    if (!usageIdsByTopic.has(topic)) { errors.push(`exercises ${lang}/${f}: không có chuyên đề tương ứng`); continue }
    const note = (m) => warnings.push(`${lang}/${topic}: ${m}`)
    const diff = { 1: 0, 2: 0, 3: 0 }
    const pos = [0, 0, 0, 0]
    let noUsage = 0
    let noChoiceExpl = 0
    const covered = new Set()
    list.forEach((ex, i) => {
      exerciseCount++
      const at = (m) => errors.push(`exercise ${ex.id ?? `${f}#${i + 1}`}: ${m}`)
      if (!ex.id) at('thiếu id'); else if (seenEx.has(ex.id)) at('id trùng'); else seenEx.add(ex.id)
      if (ex.kind !== 'mcq') at(`kind lạ: ${ex.kind}`)
      if (ex.language !== lang) at(`language (${ex.language}) khác thư mục (${lang})`)
      if (ex.topic !== topic) at(`topic (${ex.topic}) khác tên tệp (${topic})`)
      if (ex.level !== undefined && !LEVELS.includes(ex.level)) at(`level lạ: ${ex.level}`)
      if (ex.bac !== undefined && ![1, 2, 3, 4, 5, 6].includes(ex.bac)) at(`bac lạ: ${ex.bac} (chỉ 1–6)`)
      if (![1, 2, 3].includes(ex.difficulty)) at(`difficulty lạ: ${ex.difficulty}`); else diff[ex.difficulty]++
      if (!ex.prompt || !ex.explanation) at('thiếu prompt/explanation')
      const ch = ex.choices ?? []
      if (ch.length < 2) at('cần ≥ 2 đáp án')
      if (new Set(ch.map((c) => String(c).trim().toLowerCase())).size !== ch.length) at('có đáp án trùng nhau')
      if (!Number.isInteger(ex.correctIndex) || ex.correctIndex < 0 || ex.correctIndex >= ch.length) at(`correctIndex ngoài phạm vi: ${ex.correctIndex}`)
      else pos[ex.correctIndex]++
      if (ex.choiceExplanations) {
        if (ex.choiceExplanations.length !== ch.length) at('choiceExplanations khác số đáp án')
        if (ex.choiceExplanations.some((s) => !String(s).trim())) at('choiceExplanations có mục trống')
      } else noChoiceExpl++
      if (/_{2,}/.test(ex.prompt ?? '') && ch.some((c) => /_{2,}/.test(c))) at('đáp án chứa chỗ trống')
      if (!ex.usageId) noUsage++
      else if (!usageIdsByTopic.get(topic).has(ex.usageId)) at(`usageId không tồn tại trong chuyên đề: ${ex.usageId}`)
      else covered.add(ex.usageId)
      if (!Array.isArray(ex.tags)) at('tags phải là mảng')
      // Quy tắc 1 (docs/chuan-noi-dung.md): mọi thẻ của câu phải có mục lý thuyết dạy nó ở đâu đó
      for (const tag of ex.tags ?? []) if (!allUsageIds.has(tag)) at(`thẻ "${tag}" chưa có mục lý thuyết nào dạy (vi phạm quy tắc "không kiểm tra điều chưa dạy")`)
      const key = String(ex.prompt ?? '').trim().toLowerCase()
      if (seenPrompt.has(key)) warnings.push(`${ex.id}: đề trùng với ${seenPrompt.get(key)}`)
      else seenPrompt.set(key, ex.id)
    })
    if (list.length < 30) note(`${list.length} câu (tối thiểu 30; mục tiêu dài hạn 50–70)`)
    if (diff[1] < 4 || diff[2] < 3 || diff[3] < 3) note(`độ khó ${diff[1]}/${diff[2]}/${diff[3]}: không đủ câu cho hạn mức mỗi lượt 4 dễ/3 vừa/3 khó (lượt sẽ bù bằng câu khó khác, mạch dễ → khó yếu đi)`)
    else if (Math.max(diff[1], diff[2], diff[3]) - Math.min(diff[1], diff[2], diff[3]) > 1) note(`độ khó ${diff[1]}/${diff[2]}/${diff[3]} lệch (chuẩn: chia đều, 10/10/10 khi đủ 30 câu)`)
    const maxPos = Math.max(...pos)
    if (list.length >= 8 && maxPos / list.length > 0.4) note(`đáp án đúng dồn vào một vị trí (${pos.join('/')}) cho A/B/C/D`)
    if (noUsage) note(`${noUsage} câu chưa gắn usageId (chưa có mục lý thuyết dạy riêng; link "Xem lại lý thuyết" trỏ về đầu trang)`)
    if (noChoiceExpl) note(`${noChoiceExpl} câu chưa có choiceExplanations`)
    for (const id of usageIdsByTopic.get(topic)) if (!covered.has(id)) note(`chưa có câu nào cho mục lý thuyết ${id}`)
  }
}

console.log(`${topicCount} chuyên đề, ${exerciseCount} câu bài tập`)
if (warnings.length) console.log('\nCẢNH BÁO (' + warnings.length + '):\n' + warnings.map((w) => ' - ' + w).join('\n'))
if (errors.length) { console.log('\nLỖI (' + errors.length + '):\n' + errors.map((e) => ' - ' + e).join('\n')); process.exit(1) }
console.log('\nNội dung hợp lệ.')
