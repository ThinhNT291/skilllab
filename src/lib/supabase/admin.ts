import "server-only"
import { createClient } from "@supabase/supabase-js"

/**
 * Client dùng khóa service_role, bỏ qua RLS. CHỈ dùng trong API route / code phía máy chủ.
 * Khóa lấy từ biến môi trường SUPABASE_SERVICE_ROLE_KEY (không có tiền tố NEXT_PUBLIC_). Thiếu thì báo lỗi, không rơi về khóa anon.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("service_role_not_configured")
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

export const serviceRoleConfigured = () => Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
