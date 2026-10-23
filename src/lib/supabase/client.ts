import { createBrowserClient } from "@supabase/ssr"
import { supabaseEnv } from "./env"

/** Client dùng trong component trình duyệt. Chỉ được gọi từ lớp truy cập dữ liệu (src/lib/db), không gọi trực tiếp trong component. */
export function createClient() {
  const env = supabaseEnv()
  if (!env) throw new Error("supabase_not_configured")
  return createBrowserClient(env.url, env.anonKey)
}
