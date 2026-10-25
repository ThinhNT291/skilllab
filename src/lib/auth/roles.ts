/** Vai trò và quyền hiển thị. Chỉ để ẩn/hiện giao diện; việc chặn thật nằm ở RLS và API route phía máy chủ. */
export type Role = "student" | "teacher" | "admin"

export const ROLE_LABEL: Record<Role, string> = { student: "Học sinh", teacher: "Giáo viên", admin: "Quản trị" }

export const isRole = (v: unknown): v is Role => v === "student" || v === "teacher" || v === "admin"

/** Được vào khu quản lý (`/quan-ly`). */
export const canViewStaffArea = (role: Role) => role === "teacher" || role === "admin"

/** Được tạo/sửa/khóa tài khoản và quản lý lớp. */
export const canManageAccounts = (role: Role) => role === "admin"

/** Tên đăng nhập của tài khoản lớp học: khớp ràng buộc `profiles_username_format` trong migration 0007. */
export const USERNAME_RE = /^[a-z0-9][a-z0-9._]{2,29}$/

export function normalizeUsername(raw: string): string | null {
  const u = raw.trim().toLowerCase()
  return USERNAME_RE.test(u) ? u : null
}

/** Supabase Auth cần email; tài khoản lớp học dùng email giả theo tên đăng nhập, người dùng không thấy. */
export const accountEmail = (username: string) => `${username}@accounts.skilllab.invalid`
