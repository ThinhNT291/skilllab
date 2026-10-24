import "server-only"

/** Giới hạn tần suất đơn giản theo địa chỉ, trong bộ nhớ của một tiến trình (đủ để chặn lạm dụng nhẹ; chưa thay cho CAPTCHA/đăng nhập). */
const hits = new Map<string, number[]>()

export function allow(key: string, max: number, windowMs = 60_000, now = Date.now()): boolean {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs)
  if (recent.length >= max) {
    hits.set(key, recent)
    return false
  }
  recent.push(now)
  hits.set(key, recent)
  if (hits.size > 5000) for (const [k, v] of hits) if (v.every((t) => now - t >= windowMs)) hits.delete(k)
  return true
}

export function clientKey(request: Request): string {
  return (request.headers.get("x-forwarded-for") ?? "local").split(",")[0].trim()
}
