import { createClient } from "@/lib/supabase/client"
import { supabaseEnv } from "@/lib/supabase/env"
import { accountEmail, normalizeUsername } from "@/lib/auth/roles"
import { resetProfileCache } from "./session"

export type AuthResult = { ok: true } | { ok: false; reason: "not_configured" | "bad_username" | "bad_credentials" | "error"; message?: string }

/** Đăng nhập bằng tên đăng nhập + mật khẩu (tài khoản lớp học). Thay phiên ẩn danh hiện có. */
export async function signInWithUsername(username: string, password: string): Promise<AuthResult> {
  if (!supabaseEnv()) return { ok: false, reason: "not_configured" }
  const u = normalizeUsername(username)
  if (!u) return { ok: false, reason: "bad_username" }
  const { error } = await createClient().auth.signInWithPassword({ email: accountEmail(u), password })
  if (error) return { ok: false, reason: /invalid|credentials/i.test(error.message) ? "bad_credentials" : "error", message: error.message }
  resetProfileCache()
  return { ok: true }
}

export async function signInWithGoogle(): Promise<AuthResult> {
  if (!supabaseEnv()) return { ok: false, reason: "not_configured" }
  const { error } = await createClient().auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/auth/callback` } })
  return error ? { ok: false, reason: "error", message: error.message } : { ok: true }
}

export async function signOut(): Promise<void> {
  if (!supabaseEnv()) return
  await createClient().auth.signOut()
  resetProfileCache()
}

export interface AccountInfo {
  anonymous: boolean
  role: "student" | "teacher" | "admin"
  nickname: string | null
  username: string | null
}

/** Thông tin tài khoản đang đăng nhập (null nếu chưa có phiên hoặc chưa cấu hình). Không tạo phiên ẩn danh mới. */
export async function getAccountInfo(): Promise<AccountInfo | null> {
  if (!supabaseEnv()) return null
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from("profiles").select("role, nickname, username").eq("auth_user_id", user.id).maybeSingle()
  if (!data) return null
  return { anonymous: user.is_anonymous === true, role: data.role, nickname: data.nickname, username: data.username }
}

export async function updateNickname(nickname: string): Promise<AuthResult> {
  if (!supabaseEnv()) return { ok: false, reason: "not_configured" }
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, reason: "error", message: "unauthenticated" }
  const value = nickname.trim().slice(0, 30) || null
  const { error } = await supabase.from("profiles").update({ nickname: value }).eq("auth_user_id", user.id)
  return error ? { ok: false, reason: "error", message: error.message } : { ok: true }
}
