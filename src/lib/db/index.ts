// Lớp truy cập dữ liệu: component chỉ import từ đây, không gọi supabase.from() trực tiếp.
export { dbConfigured, ensureProfile } from "./session"
export { recordAnswer, type SaveResult } from "./answers"
export type { Profile } from "./types"
