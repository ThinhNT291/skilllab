// Đồng bộ nội dung học tập giữa src/content (tệp JSON) và bảng content_items trong Supabase. Chạy trên MÁY CỦA BẠN.
//
//   node scripts/content-sync.mjs status           so sánh tệp với cơ sở dữ liệu (không sửa gì)
//   node scripts/content-sync.mjs push             đưa mục mới/đã đổi từ tệp lên cơ sở dữ liệu
//   node scripts/content-sync.mjs push --prune     như trên, và ẩn (active=false) các mục có trong DB nhưng không còn trong tệp
//   node scripts/content-sync.mjs export [tệp]     xuất toàn bộ nội dung từ cơ sở dữ liệu ra một tệp JSON để sao lưu
//
// Cần NEXT_PUBLIC_SUPABASE_URL và SUPABASE_SERVICE_ROLE_KEY trong .env.local (xem .env.example), Node 20.12 trở lên, và đã chạy migration 0008.
// Giai đoạn 1: tệp JSON vẫn là nguồn khi build; cơ sở dữ liệu là bản sao để sao lưu, đối chiếu và gắn module mới.
import fs from "node:fs"
import { createClient } from "@supabase/supabase-js"
import { collectItems, summarize } from "./lib/content-items.mjs"

try {
  process.loadEnvFile(".env.local")
} catch {
  // Không có .env.local: dùng biến môi trường hiện có
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error("Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY trong .env.local.")
  process.exit(1)
}
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
const cmd = process.argv[2]
const flags = new Set(process.argv.slice(3).filter((a) => a.startsWith("--")))

async function remoteState() {
  const rows = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from("content_items").select("id, content_hash, active, collection").range(from, from + 999)
    if (error) throw new Error(`${error.message} (đã chạy migration 0008 chưa?)`)
    rows.push(...data)
    if (data.length < 1000) break
  }
  return new Map(rows.map((r) => [r.id, r]))
}

function diff(local, remote) {
  const added = [], changed = [], same = []
  const seen = new Set()
  for (const it of local) {
    seen.add(it.id)
    const r = remote.get(it.id)
    if (!r) added.push(it)
    else if (r.content_hash !== it.content_hash || !r.active) changed.push(it)
    else same.push(it)
  }
  const removed = [...remote.values()].filter((r) => !seen.has(r.id) && r.active)
  return { added, changed, same, removed }
}

const local = collectItems("src/content")

if (cmd === "status" || cmd === "push") {
  const remote = await remoteState()
  const d = diff(local, remote)
  console.log(`Tệp: ${local.length} mục ${JSON.stringify(summarize(local))}`)
  console.log(`Cơ sở dữ liệu: ${remote.size} mục`)
  console.log(`Giống nhau: ${d.same.length} · Mới: ${d.added.length} · Đã đổi: ${d.changed.length} · Chỉ có trong DB: ${d.removed.length}`)
  if (cmd === "status") {
    process.exit(d.added.length + d.changed.length + d.removed.length === 0 ? 0 : 2)
  }
  const todo = [...d.added, ...d.changed]
  for (let i = 0; i < todo.length; i += 200) {
    const batch = todo.slice(i, i + 200).map((it) => ({ ...it, active: true }))
    const { error } = await db.from("content_items").upsert(batch, { onConflict: "id" })
    if (error) {
      console.error("Lỗi khi ghi:", error.message)
      process.exit(1)
    }
    process.stdout.write(`\rĐã ghi ${Math.min(i + 200, todo.length)}/${todo.length}`)
  }
  if (todo.length) console.log()
  if (flags.has("--prune") && d.removed.length) {
    const ids = d.removed.map((r) => r.id)
    for (let i = 0; i < ids.length; i += 200) {
      const { error } = await db.from("content_items").update({ active: false }).in("id", ids.slice(i, i + 200))
      if (error) {
        console.error("Lỗi khi ẩn:", error.message)
        process.exit(1)
      }
    }
    console.log(`Đã ẩn ${ids.length} mục không còn trong tệp.`)
  } else if (d.removed.length) {
    console.log("Có mục chỉ còn trong DB; thêm --prune nếu muốn ẩn chúng.")
  }
  console.log("Xong.")
} else if (cmd === "export") {
  const out = process.argv[3] && !process.argv[3].startsWith("--") ? process.argv[3] : `content-backup-${new Date().toISOString().slice(0, 10)}.json`
  const rows = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from("content_items").select("*").order("collection").order("topic").order("sort").range(from, from + 999)
    if (error) throw new Error(error.message)
    rows.push(...data)
    if (data.length < 1000) break
  }
  fs.writeFileSync(out, JSON.stringify({ exported_at: new Date().toISOString(), count: rows.length, items: rows }))
  console.log(`Đã xuất ${rows.length} mục ra ${out}`)
} else {
  console.error("Dùng: node scripts/content-sync.mjs status | push [--prune] | export [tệp]")
  process.exit(1)
}
