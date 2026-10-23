import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { supabaseEnv } from "./env"

/** Client dùng ở phía server (API route, server component), đọc phiên đăng nhập từ cookie. */
export async function createClient() {
  const env = supabaseEnv()
  if (!env) throw new Error("supabase_not_configured")
  const cookieStore = await cookies()
  return createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(list) {
        try {
          list.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // Gọi từ Server Component (không ghi được cookie): bỏ qua
        }
      },
    },
  })
}
