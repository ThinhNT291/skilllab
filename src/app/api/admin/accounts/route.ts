import { NextResponse } from "next/server"
import { createClient as createAnonClient } from "@supabase/supabase-js"
import { createAdminClient, serviceRoleConfigured } from "@/lib/supabase/admin"
import { supabaseEnv } from "@/lib/supabase/env"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { getCaller } from "@/lib/auth/server"
import { accountEmail, normalizeUsername } from "@/lib/auth/roles"
import { generatePassword } from "@/lib/auth/password"
import { confirmMatches, expandScopes, tablesFor } from "@/lib/auth/reset"

/** ~100 năm: coi như khóa vô thời hạn; mở khóa bằng "none". */
const LOCK_FOR = "876000h"

type Body = {
  action?: "create" | "reset_password" | "lock" | "unlock" | "update" | "reset_data"
  adminPassword?: string
  id?: string
  username?: string
  nickname?: string
  role?: string
  classId?: string
  scopes?: string[]
  confirm?: string
}

const fail = (code: string, status = 400) => NextResponse.json({ error: code }, { status })

/**
 * Quản lý tài khoản (chỉ quản trị; mọi thao tác phải nhập lại mật khẩu của chính quản trị, theo cách bên `daotao`).
 *  - create: tạo tài khoản học sinh/giáo viên bằng tên đăng nhập; mật khẩu tạm do hệ thống sinh, trả về MỘT lần; bắt đổi ở lần đăng nhập đầu.
 *  - reset_password: sinh mật khẩu tạm mới, bắt đổi lại.
 *  - lock / unlock: khóa/mở khóa đăng nhập (giữ nguyên dữ liệu học tập).
 *  - update: đổi biệt danh, đổi giữa học sinh và giáo viên.
 *  - reset_data: xóa dữ liệu học tập của MỘT học sinh theo phạm vi (câu trả lời, thẻ ôn, kiểm tra, điểm Viết/Nói, đồ, xếp trình độ); phải gõ lại tên đăng nhập để xác nhận; không đụng tài khoản đăng nhập.
 * Quản trị mới chỉ tạo bằng scripts/create-admin.mjs, không qua API này. Mọi thao tác (kể cả bị từ chối) ghi vào audit_log.
 */
export async function POST(req: Request) {
  if (!serviceRoleConfigured() || !supabaseEnv()) return fail("server_not_configured", 500)
  const b = (await req.json().catch(() => ({}))) as Body
  const admin = createAdminClient()
  const caller = await getCaller()

  const audit = (action: string, target: string | null, detail: Record<string, unknown> = {}) =>
    admin.from("audit_log").insert({ actor_profile_id: caller?.profileId ?? null, action, target_profile_id: target, detail }).then(() => undefined, () => undefined)
  const refuse = async (code: string, status: number, target: string | null = null) => {
    await audit(`refused:${b.action ?? "unknown"}`, target, { code })
    return fail(code, status)
  }

  if (!caller) return refuse("unauthenticated", 401)
  if (caller.role !== "admin") return refuse("forbidden", 403)

  // Nhập lại mật khẩu của quản trị (xác minh bằng client riêng, không đụng vào phiên hiện tại).
  const env = supabaseEnv()!
  const { data: { user } } = await (await createServerClient()).auth.getUser()
  if (!b.adminPassword || !user?.email) return refuse("wrong_password", 400)
  const verifier = createAnonClient(env.url, env.anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const { error: pwErr } = await verifier.auth.signInWithPassword({ email: user.email, password: b.adminPassword })
  if (pwErr) return refuse("wrong_password", 401)

  const adminCount = async (except: string) => {
    const { count } = await admin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "admin").is("disabled_at", null).neq("id", except)
    return count ?? 0
  }
  const loadTarget = async (id: string | undefined) => {
    if (!id) return null
    const { data } = await admin.from("profiles").select("id, auth_user_id, role, nickname, username, disabled_at").eq("id", id).maybeSingle()
    return data
  }

  if (b.action === "create") {
    const username = normalizeUsername(b.username ?? "")
    if (!username) return fail("bad_username")
    if (b.role !== "student" && b.role !== "teacher") return fail("bad_role")
    const nickname = (b.nickname ?? "").trim().slice(0, 30) || null
    const { data: taken } = await admin.from("profiles").select("id").eq("username", username).maybeSingle()
    if (taken) return fail("username_taken")

    const password = generatePassword(8)
    const { data, error } = await admin.auth.admin.createUser({
      email: accountEmail(username),
      password,
      email_confirm: true,
      app_metadata: { must_change_password: true },
    })
    if (error || !data.user) return fail(error?.message?.toLowerCase().includes("already") ? "username_taken" : "create_failed", 400)

    const { data: profile, error: pe } = await admin
      .from("profiles")
      .upsert({ auth_user_id: data.user.id, role: b.role, nickname, username }, { onConflict: "auth_user_id" })
      .select("id")
      .single()
    if (pe || !profile) {
      await admin.auth.admin.deleteUser(data.user.id)   // không để lại tài khoản đăng nhập mồ côi
      return fail("profile_failed", 500)
    }
    if (b.classId) {
      const table = b.role === "teacher" ? "class_teachers" : "class_members"
      const { error: ce } = await admin.from(table).insert({ class_id: b.classId, profile_id: profile.id })
      if (ce) await audit("create_class_link_failed", profile.id, { classId: b.classId, message: ce.message })
    }
    await audit("account_create", profile.id, { username, role: b.role, classId: b.classId ?? null })
    return NextResponse.json({ id: profile.id, username, password })
  }

  const target = await loadTarget(b.id)
  if (!target) return refuse("not_found", 404, b.id ?? null)

  if (b.action === "reset_password") {
    const password = generatePassword(8)
    const { error } = await admin.auth.admin.updateUserById(target.auth_user_id, { password, app_metadata: { must_change_password: true } })
    if (error) return fail("reset_failed", 500)
    await audit("account_reset_password", target.id, { username: target.username })
    return NextResponse.json({ ok: true, password })
  }

  if (b.action === "lock" || b.action === "unlock") {
    if (b.action === "lock") {
      if (target.id === caller.profileId) return refuse("self_lock", 400, target.id)
      if (target.role === "admin" && (await adminCount(target.id)) === 0) return refuse("last_admin", 400, target.id)
    }
    const { error } = await admin.auth.admin.updateUserById(target.auth_user_id, { ban_duration: b.action === "lock" ? LOCK_FOR : "none" })
    if (error) return fail("lock_failed", 500)
    await admin.from("profiles").update({ disabled_at: b.action === "lock" ? new Date().toISOString() : null }).eq("id", target.id)
    await audit(b.action === "lock" ? "account_lock" : "account_unlock", target.id, { username: target.username })
    return NextResponse.json({ ok: true })
  }

  if (b.action === "reset_data") {
    if (target.role !== "student") return refuse("not_student", 400, target.id)
    const scopes = expandScopes(b.scopes)
    if (scopes.length === 0) return refuse("bad_scope", 400, target.id)
    if (!confirmMatches(b.confirm, target.username)) return refuse("confirm_mismatch", 400, target.id)
    const counts: Record<string, number | null> = {}
    for (const table of tablesFor(scopes)) {
      const { error, count } = await admin.from(table).delete({ count: "exact" }).eq("profile_id", target.id)
      // Bảng chưa tạo (chưa chạy migration tương ứng) thì không có gì để xóa; lỗi khác dừng lại và báo.
      if (error && !/does not exist|schema cache|could not find/i.test(error.message)) {
        await audit("data_reset_failed", target.id, { scopes, table, message: error.message, done: counts })
        return fail("reset_data_failed", 500)
      }
      counts[table] = error ? null : count
    }
    await audit("data_reset", target.id, { username: target.username, scopes, deleted: counts })
    return NextResponse.json({ ok: true, deleted: counts })
  }

  if (b.action === "update") {
    const patch: Record<string, unknown> = {}
    if (typeof b.nickname === "string") patch.nickname = b.nickname.trim().slice(0, 30) || null
    if (b.role !== undefined) {
      if (b.role !== "student" && b.role !== "teacher") return fail("bad_role")
      if (target.role === "admin") return refuse("protected_role", 400, target.id)   // đổi vai trò quản trị chỉ làm trực tiếp trong SQL
      patch.role = b.role
    }
    if (Object.keys(patch).length === 0) return fail("nothing")
    const { error } = await admin.from("profiles").update(patch).eq("id", target.id)
    if (error) return fail("update_failed", 500)
    await audit("account_update", target.id, { from: { role: target.role, nickname: target.nickname }, to: patch })
    return NextResponse.json({ ok: true })
  }

  return fail("bad_action")
}
