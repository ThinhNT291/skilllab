/** Đặt lại dữ liệu học tập của một học sinh (chỉ quản trị). Phần thuần: phạm vi và bảng liên quan.
 * Không có phạm vi cài đặt: bản trên trình duyệt của học sinh sẽ tự đẩy lại lên tài khoản nên xóa ở đây không có tác dụng. */
export const RESET_SCOPES = [
  { id: "answers", label: "Câu trả lời, tiến độ, chuỗi ngày, XP", tables: ["daily_activity", "answers"] },
  { id: "srs", label: "Thẻ ôn tập và lịch ôn", tables: ["srs_cards"] },
  { id: "tests", label: "Kết quả bài kiểm tra cuối chủ điểm", tables: ["topic_tests"] },
  { id: "graded", label: "Điểm Viết/Nói đã chấm", tables: ["graded_attempts"] },
  { id: "items", label: "Đồ trang trí đã mua", tables: ["player_items"] },
  { id: "placement", label: "Bài xếp trình độ tổng hợp", tables: ["placement_sessions"] },
  { id: "path", label: "Lộ trình và Phòng thử thách (kết quả, điểm bắt đầu, các lần thử)", tables: ["path_lessons", "path_state", "challenge_attempts"] },
] as const

export type ResetScope = (typeof RESET_SCOPES)[number]["id"]

/** Danh sách phạm vi hợp lệ, không trùng, giữ thứ tự chuẩn; "all" là tất cả. Không có gì hợp lệ thì trả mảng rỗng. */
export function expandScopes(input: unknown): ResetScope[] {
  const asked = Array.isArray(input) ? input.map(String) : []
  if (asked.includes("all")) return RESET_SCOPES.map((s) => s.id)
  return RESET_SCOPES.map((s) => s.id).filter((id) => asked.includes(id))
}

/** Bảng cần xóa theo thứ tự (bộ đếm theo ngày xóa trước dòng thô để việc xóa không phải cập nhật từng dòng). */
export function tablesFor(scopes: ResetScope[]): string[] {
  return RESET_SCOPES.filter((s) => scopes.includes(s.id)).flatMap((s) => [...s.tables])
}

/** Xác nhận bằng cách gõ lại tên đăng nhập của học sinh (không phân biệt hoa thường, bỏ khoảng trắng đầu/cuối). */
export function confirmMatches(typed: unknown, username: string | null | undefined): boolean {
  return !!username && typeof typed === "string" && typed.trim().toLowerCase() === username.toLowerCase()
}
