import { createClient } from "@/lib/supabase/client"
import { dbConfigured } from "./session"
import type { AttemptRow } from "@/lib/analytics/attempts"

type Fail = { ok: false; reason: "not_configured" | "error"; message?: string }
const fail = (e: unknown): Fail => ({ ok: false, reason: "error", message: e instanceof Error ? e.message : String(e) })
const nc: Fail = { ok: false, reason: "not_configured" }

/** Các hàm dưới đây dành cho khu quản lý. Quyền xem do RLS quyết định (giáo viên chỉ thấy lớp mình, quản trị thấy tất cả); giao diện chỉ gọi, không tự lọc quyền. */

export interface StaffProfile {
  id: string
  nickname: string | null
  username: string | null
  role: "student" | "teacher" | "admin"
  disabled_at: string | null
  created_at: string
}

export interface ClassRow {
  id: string
  name: string
  language_code: string
  archived_at: string | null
  members: string[]
  teachers: string[]
}

/** Tài khoản lớp học (có tên đăng nhập) mà người dùng hiện tại được phép thấy. Hồ sơ học thử ẩn danh không có tên đăng nhập nên không lẫn vào. */
export async function listAccounts(): Promise<{ ok: true; rows: StaffProfile[] } | Fail> {
  if (!dbConfigured()) return nc
  try {
    const { data, error } = await createClient().from("profiles").select("id, nickname, username, role, disabled_at, created_at").not("username", "is", null).order("created_at", { ascending: false }).limit(500)
    if (error) return { ok: false, reason: "error", message: error.message }
    return { ok: true, rows: (data ?? []) as StaffProfile[] }
  } catch (e) {
    return fail(e)
  }
}

export async function listClasses(): Promise<{ ok: true; rows: ClassRow[] } | Fail> {
  if (!dbConfigured()) return nc
  try {
    const supabase = createClient()
    const [cls, mem, tea] = await Promise.all([
      supabase.from("classes").select("id, name, language_code, archived_at").order("created_at", { ascending: true }),
      supabase.from("class_members").select("class_id, profile_id").limit(5000),
      supabase.from("class_teachers").select("class_id, profile_id").limit(1000),
    ])
    const err = cls.error ?? mem.error ?? tea.error
    if (err) return { ok: false, reason: "error", message: err.message }
    const rows = (cls.data ?? []).map((c) => ({
      ...(c as Omit<ClassRow, "members" | "teachers">),
      members: (mem.data ?? []).filter((m) => m.class_id === c.id).map((m) => m.profile_id as string),
      teachers: (tea.data ?? []).filter((t) => t.class_id === c.id).map((t) => t.profile_id as string),
    }))
    return { ok: true, rows }
  } catch (e) {
    return fail(e)
  }
}

export async function createClass(name: string): Promise<{ ok: true } | Fail> {
  if (!dbConfigured()) return nc
  try {
    const { error } = await createClient().from("classes").insert({ name: name.trim().slice(0, 60) })
    return error ? { ok: false, reason: "error", message: error.message } : { ok: true }
  } catch (e) {
    return fail(e)
  }
}

export async function setMembership(kind: "member" | "teacher", classId: string, profileId: string, present: boolean): Promise<{ ok: true } | Fail> {
  if (!dbConfigured()) return nc
  try {
    const table = kind === "teacher" ? "class_teachers" : "class_members"
    const q = createClient().from(table)
    const { error } = present ? await q.insert({ class_id: classId, profile_id: profileId }) : await q.delete().eq("class_id", classId).eq("profile_id", profileId)
    return error ? { ok: false, reason: "error", message: error.message } : { ok: true }
  } catch (e) {
    return fail(e)
  }
}

export interface RecentAnswer {
  profile_id: string
  correct: boolean
  created_at: string
}

/** Các lượt trả lời của mọi học sinh được phép thấy, trong N ngày gần nhất. */
export async function listRecentAnswers(days = 7): Promise<{ ok: true; rows: RecentAnswer[] } | Fail> {
  if (!dbConfigured()) return nc
  try {
    const since = new Date(Date.now() - days * 86_400_000).toISOString()
    const { data, error } = await createClient().from("answers").select("profile_id, correct, created_at").gte("created_at", since).order("created_at", { ascending: false }).limit(10000)
    if (error) return { ok: false, reason: "error", message: error.message }
    return { ok: true, rows: (data ?? []) as RecentAnswer[] }
  } catch (e) {
    return fail(e)
  }
}

/** Dữ liệu học tập của một học sinh (để dựng hồ sơ năng lực). */
export async function getStudentData(profileId: string): Promise<
  | { ok: true; profile: StaffProfile; answers: { topic: string; correct: boolean; created_at: string }[]; attempts: AttemptRow[] }
  | Fail
> {
  if (!dbConfigured()) return nc
  try {
    const supabase = createClient()
    const [p, a, g] = await Promise.all([
      supabase.from("profiles").select("id, nickname, username, role, disabled_at, created_at").eq("id", profileId).maybeSingle(),
      supabase.from("answers").select("topic, correct, created_at").eq("profile_id", profileId).order("created_at", { ascending: false }).limit(1000),
      supabase.from("graded_attempts").select("skill, task_id, target_bac, total, estimated_bac, scores, note, created_at").eq("profile_id", profileId).order("created_at", { ascending: false }).limit(60),
    ])
    const err = p.error ?? a.error ?? g.error
    if (err) return { ok: false, reason: "error", message: err.message }
    if (!p.data) return { ok: false, reason: "error", message: "not_found" }
    return { ok: true, profile: p.data as StaffProfile, answers: (a.data ?? []) as { topic: string; correct: boolean; created_at: string }[], attempts: (g.data ?? []) as AttemptRow[] }
  } catch (e) {
    return fail(e)
  }
}

export interface AuditRow {
  id: number
  actor_profile_id: string | null
  action: string
  target_profile_id: string | null
  detail: Record<string, unknown>
  created_at: string
}

export async function listAudit(limit = 100): Promise<{ ok: true; rows: AuditRow[] } | Fail> {
  if (!dbConfigured()) return nc
  try {
    const { data, error } = await createClient().from("audit_log").select("id, actor_profile_id, action, target_profile_id, detail, created_at").order("created_at", { ascending: false }).limit(limit)
    if (error) return { ok: false, reason: "error", message: error.message }
    return { ok: true, rows: (data ?? []) as AuditRow[] }
  } catch (e) {
    return fail(e)
  }
}
