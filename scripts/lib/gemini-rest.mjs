// Gọi Gemini bằng REST từ máy của bạn (scripts sinh/phản biện nội dung). Khóa đọc từ GEMINI_API_KEY (.env.local), không in ra.
// Mã mô hình lấy từ GEMINI_TEXT_MODEL; mặc định giống ứng dụng (src/lib/ai/gemini.ts) và CẦN đối chiếu với trang Models của Google.
try {
  process.loadEnvFile(".env.local")
} catch {
  // dùng biến môi trường hiện có
}

const BASE = process.env.GEMINI_API_BASE || "https://generativelanguage.googleapis.com/v1beta/models" // đổi để thử bằng máy chủ giả
export const MODEL = process.env.GEMINI_TEXT_MODEL || "gemini-3.5-flash-lite"

export function requireKey() {
  const key = process.env.GEMINI_API_KEY
  if (!key) {
    console.error("Thiếu GEMINI_API_KEY trong .env.local (khóa chỉ đọc ở máy bạn, không đẩy lên git).")
    process.exit(1)
  }
  return key
}

/** Gọi mô hình, đọc JSON. `temperature` cao hơn cho sinh nội dung, thấp cho phản biện. Thử lại vài lần khi lỗi tạm thời. */
export async function callJson(prompt, { temperature = 0.6, tries = 3 } = {}) {
  const key = requireKey()
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(`${BASE}/${MODEL}:generateContent`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json", temperature } }),
        signal: AbortSignal.timeout(120_000),
      })
      if (!res.ok) throw new Error(`Gemini trả về lỗi ${res.status}`)
      const data = await res.json()
      const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? ""
      return JSON.parse(text)
    } catch (e) {
      if (attempt >= tries) throw e
      await new Promise((r) => setTimeout(r, 2000 * attempt))
    }
  }
}
