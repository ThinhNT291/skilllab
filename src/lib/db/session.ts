import { createClient } from "@/lib/supabase/client"
import { supabaseEnv } from "@/lib/supabase/env"
import type { Profile } from "./types"

/** Có cấu hình Supabase không. Không thì mọi hàm ghi dữ liệu bỏ qua, ứng dụng vẫn chạy được. */
export function dbConfigured(): boolean {
  return supabaseEnv() !== null
}

let profilePromise: Promise<Profile> | null = null

/**
 * Bảo đảm có phiên đăng nhập và hồ sơ. Chưa có phiên thì đăng nhập ẩn danh (học sinh dùng ngay, không cần đăng ký).
 * Sau này thêm tài khoản do quản trị tạo và Google: chỉ cần thêm đường đăng nhập, hồ sơ giữ nguyên cách tạo.
 * Kết quả được nhớ trong phiên chạy; lỗi thì thử lại lần gọi sau.
 */
export function ensureProfile(): Promise<Profile> {
  profilePromise ??= load().catch((e) => {
    profilePromise = null
    throw e
  })
  return profilePromise
}

async function load(): Promise<Profile> {
  const supabase = createClient()

  let { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    const { data, error } = await supabase.auth.signInAnonymously()
    if (error || !data.user) throw new Error(`anonymous_signin_failed: ${error?.message ?? "no user"}`)
    user = data.user
  }

  // Tạo hồ sơ nếu chưa có (bỏ qua nếu đã có, an toàn khi hai tab cùng chạy).
  const { error: upsertError } = await supabase
    .from("profiles")
    .upsert({ auth_user_id: user.id }, { onConflict: "auth_user_id", ignoreDuplicates: true })
  if (upsertError) throw new Error(`profile_create_failed: ${upsertError.message}`)

  const { data: profile, error } = await supabase.from("profiles").select("id, nickname, role").eq("auth_user_id", user.id).single()
  if (error || !profile) throw new Error(`profile_load_failed: ${error?.message ?? "not found"}`)
  return profile as Profile
}
