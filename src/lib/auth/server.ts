import "server-only"
import { createClient } from "@/lib/supabase/server"
import { isRole, type Role } from "./roles"

export interface Caller {
  authUserId: string
  profileId: string
  role: Role
  nickname: string | null
  anonymous: boolean
  mustChangePassword: boolean
}

/** Người đang gọi (theo cookie đăng nhập). null nếu chưa đăng nhập, chưa có hồ sơ hoặc tài khoản đã bị khóa. */
export async function getCaller(): Promise<Caller | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from("profiles").select("id, role, nickname, disabled_at").eq("auth_user_id", user.id).maybeSingle()
  if (!profile || profile.disabled_at || !isRole(profile.role)) return null
  return {
    authUserId: user.id,
    profileId: profile.id,
    role: profile.role,
    nickname: profile.nickname,
    anonymous: user.is_anonymous === true,
    mustChangePassword: user.app_metadata?.must_change_password === true,
  }
}
