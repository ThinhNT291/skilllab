import { NextResponse } from "next/server"
import { createClient as createAnonClient } from "@supabase/supabase-js"
import { createAdminClient, serviceRoleConfigured } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { supabaseEnv } from "@/lib/supabase/env"
import { getCaller } from "@/lib/auth/server"
import { passwordProblem } from "@/lib/auth/password"

/**
 * Đổi mật khẩu của chính mình. Đổi bắt buộc (sau khi được cấp mật khẩu tạm) không cần mật khẩu cũ vì người dùng vừa đăng nhập bằng nó;
 * đổi chủ động thì phải nhập mật khẩu hiện tại. Mật khẩu mới không được trùng mật khẩu đang dùng.
 */
export async function POST(req: Request) {
  const env = supabaseEnv()
  if (!env || !serviceRoleConfigured()) return NextResponse.json({ error: "server_not_configured" }, { status: 500 })
  const caller = await getCaller()
  if (!caller || caller.anonymous) return NextResponse.json({ error: "unauthenticated" }, { status: 401 })
  const { newPassword, currentPassword } = (await req.json().catch(() => ({}))) as { newPassword?: string; currentPassword?: string }
  if (!newPassword) return NextResponse.json({ error: "weak_password" }, { status: 400 })
  if (passwordProblem(newPassword, caller.role)) return NextResponse.json({ error: "weak_password" }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return NextResponse.json({ error: "unauthenticated" }, { status: 401 })

  const verifier = createAnonClient(env.url, env.anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
  if (!caller.mustChangePassword) {
    const { error } = await verifier.auth.signInWithPassword({ email: user.email, password: currentPassword ?? "" })
    if (error) return NextResponse.json({ error: "wrong_password" }, { status: 401 })
  }
  const { error: same } = await verifier.auth.signInWithPassword({ email: user.email, password: newPassword })
  if (!same) return NextResponse.json({ error: "same_password" }, { status: 400 })

  const admin = createAdminClient()
  const { error } = await admin.auth.admin.updateUserById(user.id, { password: newPassword, app_metadata: { must_change_password: false } })
  if (error) return NextResponse.json({ error: "change_failed" }, { status: 500 })
  await admin.from("audit_log").insert({ actor_profile_id: caller.profileId, action: "password_changed", target_profile_id: caller.profileId, detail: { forced: caller.mustChangePassword } })
  return NextResponse.json({ ok: true })
}
