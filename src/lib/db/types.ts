export interface Profile {
  id: string
  nickname: string | null
  role: "student" | "teacher" | "admin"
}
