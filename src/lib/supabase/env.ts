/** Đọc biến môi trường Supabase. Trả về null khi chưa cấu hình để trang vẫn chạy được ở bước dev đầu. */
export function supabaseEnv(): { url: string; anonKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return url && anonKey ? { url, anonKey } : null
}
