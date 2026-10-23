// Lớp truy cập dữ liệu: component chỉ import từ đây, không gọi supabase.from() trực tiếp.
export { dbConfigured, ensureProfile } from "./session"
export { recordAnswer, type SaveResult } from "./answers"
export { getAnswerHistory, type HistoryResult } from "./progress"
export type { Profile } from "./types"
