/** Mật khẩu tài khoản lớp học. Hàm thuần (nhận nguồn ngẫu nhiên để test được). */
import type { Role } from "./roles.ts"

/** Học sinh nhỏ tuổi: tối thiểu 6; giáo viên và quản trị: tối thiểu 8. */
export const MIN_PASSWORD: Record<Role, number> = { student: 6, teacher: 8, admin: 8 }
export const MAX_PASSWORD = 72

/** Bỏ các ký tự dễ nhầm (0/O, 1/l/I) để học sinh chép lại không sai. */
const ALPHABET = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789"

export function generatePassword(length = 8, randomInt: (max: number) => number = defaultRandom): string {
  let out = ""
  for (let i = 0; i < length; i++) out += ALPHABET[randomInt(ALPHABET.length)]
  return out
}

function defaultRandom(max: number): number {
  const buf = new Uint32Array(1)
  // Loại bỏ độ lệch modulo bằng cách bỏ các giá trị rơi vào phần dư.
  const limit = Math.floor(0x1_0000_0000 / max) * max
  do crypto.getRandomValues(buf)
  while (buf[0] >= limit)
  return buf[0] % max
}

export function passwordProblem(password: string, role: Role): "too_short" | "too_long" | null {
  if (password.length < MIN_PASSWORD[role]) return "too_short"
  if (password.length > MAX_PASSWORD) return "too_long"
  return null
}
