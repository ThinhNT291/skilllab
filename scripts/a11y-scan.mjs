// Quét truy cập (axe-core, WCAG 2.2 AA) các trang chính ở cả 3 giao diện. Cần máy chủ đang chạy (npm run dev hoặc npm start, cổng 4000).
//   node scripts/a11y-scan.mjs [địa chỉ gốc, mặc định http://localhost:4000] [--skins explore,adventure,space]
// Thoát mã 1 nếu còn lỗi. Chỉ quét giao diện học sinh không cần đăng nhập; trang quản lý chỉ quét được khung ngoài (cần quản trị mới thấy nội dung).
import fs from "node:fs"
import { createRequire } from "node:module"
const require = createRequire(import.meta.url)
const { chromium } = require("playwright")

const base = process.argv.find((a, i) => i >= 2 && a.startsWith("http")) ?? "http://localhost:4000"
const skinsArg = process.argv.indexOf("--skins")
const SKINS = skinsArg >= 0 ? process.argv[skinsArg + 1].split(",") : ["explore", "adventure", "space"]
const axeSource = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8")

/** Mỗi mục: đường dẫn, chữ chờ để biết trang đã dựng xong, và bước tương tác thêm (mở một trạng thái khác của trang). */
const PAGES = [
  { path: "/", wait: "Kỹ năng" },
  { path: "/lo-trinh", wait: "Bạn đang ở", name: "lo-trinh (bản đồ)" },
  { path: "/lo-trinh", wait: "Bạn đang ở", name: "lo-trinh (chạm một chặng, mở cổng)", act: async (p) => { await p.locator("ol button:has-text('Chặng 2')").first().click(); await p.locator("summary:has-text('Cổng lên')").first().click() } },
  { path: "/lo-trinh", wait: "Bạn đang ở", name: "lo-trinh (danh sách)", act: async (p) => { await p.click("button:has-text('Danh sách')") } },
  { path: "/lo-trinh", wait: "Bạn đang ở", name: "lo-trinh (có thông báo ăn mừng)", act: async (p) => { await p.evaluate(() => localStorage.setItem("skilllab.pathSeen", JSON.stringify({ done: [], cleared: [], current: "b1-s2" }))); await p.reload({ waitUntil: "networkidle" }); await p.waitForSelector("p.anim-pop[role=status]") } },
  { path: "/lo-trinh/bai/g.present-simple.b1", wait: "Câu 1/", name: "bài trong Lộ trình" },
  { path: "/lo-trinh/vuot-cap/b3-s1", wait: "Vượt cấp tới", name: "vượt cấp (giới thiệu)" },
  { path: "/lo-trinh/vuot-cap/b3-s1", wait: "Vượt cấp tới", name: "vượt cấp (đang làm)", act: async (p) => { await p.click("button:has-text('Bắt đầu')"); await p.waitForSelector("text=Phần 1/") } },
  { path: "/phong-thu-thach", wait: "Chọn bậc để thử sức" },
  { path: "/phong-thu-thach/3", wait: "Bắt đầu tính giờ", name: "thử thách (giới thiệu)" },
  { path: "/phong-thu-thach/3", wait: "Bắt đầu tính giờ", name: "thử thách (đang làm)", act: async (p) => { await p.click("button:has-text('Bắt đầu tính giờ')"); await p.waitForSelector("[role=timer]"); await p.locator("[role=radio]").first().click() } },
  { path: "/quan-ly/noi-dung", wait: "Khu quản lý" },
  { path: "/cua-hang/phong-trung-bay", wait: "Nhân vật", name: "phòng trưng bày 3D" },
]

const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--enable-webgl"] })
let total = 0
for (const skin of SKINS) {
  for (const pg of PAGES) {
    const ctx = await browser.newContext({ viewport: { width: 1000, height: 900 } })
    const page = await ctx.newPage()
    await page.addInitScript((s) => localStorage.setItem("skilllab.settings", JSON.stringify({ skin: s, onboarded: true })), skin)
    await page.goto(base + pg.path, { waitUntil: "networkidle" })
    await page.waitForSelector(`text=${pg.wait}`, { timeout: 30000 })
    await page.waitForTimeout(800)
    if (pg.act) await pg.act(page)
    await page.waitForTimeout(300)
    await page.addScriptTag({ content: axeSource })
    const res = await page.evaluate(() => window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] } }))
    const label = `${skin} · ${pg.name ?? pg.path}`
    if (res.violations.length === 0) console.log(`OK    ${label}`)
    for (const v of res.violations) {
      total += v.nodes.length
      console.log(`LỖI   ${label}: ${v.id} (${v.impact}) ×${v.nodes.length} — ${v.help}`)
      for (const n of v.nodes.slice(0, 3)) console.log(`        ${n.target.join(" ")}  ${(n.failureSummary ?? "").split("\n")[1] ?? ""}`)
    }
    await ctx.close()
  }
}
await browser.close()
console.log(total ? `\nCòn ${total} chỗ lỗi.` : "\nKhông còn lỗi truy cập.")
process.exit(total ? 1 : 0)
