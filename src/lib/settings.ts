"use client"

import { useSyncExternalStore } from "react"

export type Skin = "explore" | "adventure" | "space"
export const SKINS: { id: Skin; label: string }[] = [
  { id: "explore", label: "Khám phá" },
  { id: "adventure", label: "Phiêu lưu" },
  { id: "space", label: "Không gian" },
]

export type Character = "owl" | "fox" | "robot"
export const CHARACTERS: { id: Character; label: string }[] = [
  { id: "owl", label: "Cú Thông Thái" },
  { id: "fox", label: "Cáo Lanh Lợi" },
  { id: "robot", label: "Robot Bi-Bô" },
]

/** Hai bộ giao diện theo tuổi: kids (lớp 4–6) thiên về sao/xu/sưu tầm; teens (lớp 7–9) thiên về cấp, combo, huy hiệu. */
export type AgeSet = "kids" | "teens"
export const AGE_SETS: { id: AgeSet; label: string; hint: string }[] = [
  { id: "kids", label: "Lớp 4–6", hint: "Nhiều sao, xu và nhân vật to" },
  { id: "teens", label: "Lớp 7–9", hint: "Gọn hơn, nhấn mạnh cấp độ và huy hiệu" },
]

export type FontSize = "md" | "lg" | "xl"
export const FONT_SIZES: { id: FontSize; label: string; aria: string }[] = [
  { id: "md", label: "A", aria: "Cỡ chữ vừa" },
  { id: "lg", label: "A", aria: "Cỡ chữ lớn" },
  { id: "xl", label: "A", aria: "Cỡ chữ rất lớn" },
]
export const DAILY_GOALS = [5, 10, 20, 30] as const
export const NEW_CARD_LIMITS = [5, 10, 20] as const
/** Thuật toán lập lịch ôn tập: FSRS (mặc định) hoặc SM-2 (cũ). Chọn theo máy; cả hai đều được tính mỗi lượt ôn nên đổi qua lại không mất dữ liệu. */
export type SrsAlgorithm = "fsrs" | "sm2"
/** Khi gõ/sắp xếp/sửa lỗi sai lần đầu: hiện đáp án ngay, hoặc cho gợi ý rồi thử lại một lần (lần đầu vẫn tính là sai). Mặc định hiện ngay. */
export type FeedbackMode = "immediate" | "hint-first"
export const RETENTIONS = [0.85, 0.9, 0.95] as const

export interface Settings {
  skin: Skin
  sound: boolean
  fontSize: FontSize
  /** Hiện bậc khung năng lực và độ khó của từng câu (dành cho người soạn/duyệt nội dung) */
  showBac: boolean
  /** Mục tiêu số câu mỗi ngày */
  dailyGoal: number
  /** Số thẻ ôn tập mới tối đa mỗi ngày */
  newPerDay: number
  character: Character
  ageSet: AgeSet
  srsAlgorithm: SrsAlgorithm
  feedbackMode: FeedbackMode
  /** Chế độ nhẹ nhàng: ẩn chuỗi ngày và mục tiêu hằng ngày, không nhắc nhở, giữ phần thưởng nhỏ */
  calmMode: boolean
  /** Cho phép câu đọc to (dùng micro) xuất hiện trong bài; tắt được cho trẻ ngại nói hoặc lớp học ồn */
  speakQuestions: boolean
  /** Kiểu hiển thị khu Học: bản đồ chặng hay danh sách */
  hocView: "road" | "list"
  /** Mức nhớ mục tiêu của FSRS (0.85 / 0.9 / 0.95) */
  retention: number
  /** Đã qua màn chọn nhân vật và bộ giao diện lần đầu chưa */
  onboarded: boolean
  /** Kỷ lục game theo khóa (vd điểm cao nhất mỗi game), đi theo tài khoản */
  records: Record<string, number>
  /** Thời điểm (ms) sửa lần cuối trên máy này, để so với bản lưu trên tài khoản (bản mới hơn thắng). 0 = chưa sửa gì. */
  updatedAt: number
}

const KEY = "skilllab.settings"
const DEFAULTS: Settings = { skin: "explore", sound: true, fontSize: "md", showBac: false, dailyGoal: 10, newPerDay: 10, character: "owl", ageSet: "kids", srsAlgorithm: "fsrs", feedbackMode: "immediate", calmMode: false, speakQuestions: true, hocView: "road", retention: 0.9, onboarded: false, records: {}, updatedAt: 0 }
const listeners = new Set<() => void>()
let cache: Settings | null = null

/** Làm sạch cài đặt từ nơi không tin được (bộ nhớ trình duyệt hoặc bản lưu trên tài khoản): giá trị lạ về mặc định. */
export function sanitizeSettings(raw: unknown): Settings {
  const p = (raw && typeof raw === "object" ? raw : {}) as Partial<Settings>
  const skin = SKINS.some((s) => s.id === p.skin) ? (p.skin as Skin) : DEFAULTS.skin
  const dailyGoal = (DAILY_GOALS as readonly number[]).includes(p.dailyGoal as number) ? (p.dailyGoal as number) : DEFAULTS.dailyGoal
  const newPerDay = (NEW_CARD_LIMITS as readonly number[]).includes(p.newPerDay as number) ? (p.newPerDay as number) : DEFAULTS.newPerDay
  const fontSize = FONT_SIZES.some((f) => f.id === p.fontSize) ? (p.fontSize as FontSize) : DEFAULTS.fontSize
  const character = CHARACTERS.some((c) => c.id === p.character) ? (p.character as Character) : DEFAULTS.character
  const ageSet = AGE_SETS.some((a) => a.id === p.ageSet) ? (p.ageSet as AgeSet) : DEFAULTS.ageSet
  const records: Record<string, number> = {}
  if (p.records && typeof p.records === "object") {
    for (const [k, v] of Object.entries(p.records).slice(0, 100)) {
      if (k.length <= 80 && typeof v === "number" && Number.isFinite(v) && v >= 0) records[k] = v
    }
  }
  const updatedAt = typeof p.updatedAt === "number" && Number.isFinite(p.updatedAt) && p.updatedAt > 0 ? p.updatedAt : 0
  return { skin, sound: p.sound !== false, fontSize, showBac: p.showBac === true, dailyGoal, newPerDay, character, ageSet, srsAlgorithm: p.srsAlgorithm === "sm2" ? "sm2" : "fsrs", feedbackMode: p.feedbackMode === "hint-first" ? "hint-first" : "immediate", calmMode: p.calmMode === true, speakQuestions: p.speakQuestions !== false, hocView: p.hocView === "list" ? "list" : "road", retention: (RETENTIONS as readonly number[]).includes(p.retention as number) ? (p.retention as number) : DEFAULTS.retention, onboarded: p.onboarded === true, records, updatedAt }
}

function read(): Settings {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return sanitizeSettings(JSON.parse(raw))
  } catch {
    // Trình duyệt chặn lưu trữ: dùng mặc định
  }
  return DEFAULTS
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(cache))
  } catch {
    // Bỏ qua: cài đặt chỉ giữ trong phiên này
  }
}

const localChangeListeners = new Set<() => void>()

/** Đăng ký nhận báo khi NGƯỜI DÙNG sửa cài đặt (không báo khi nhận bản từ tài khoản), để đẩy lên tài khoản. */
export function onLocalSettingsChange(cb: () => void): () => void {
  localChangeListeners.add(cb)
  return () => {
    localChangeListeners.delete(cb)
  }
}

export function updateSettings(patch: Partial<Omit<Settings, "updatedAt">>) {
  cache = { ...(cache ?? read()), ...patch, updatedAt: Date.now() }
  persist()
  listeners.forEach((l) => l())
  localChangeListeners.forEach((l) => l())
}

/** Thay cài đặt bằng bản nhận từ tài khoản (đã làm sạch), giữ nguyên thời điểm sửa của bản đó. Không đẩy ngược lên. */
export function replaceSettings(next: unknown) {
  cache = sanitizeSettings(next)
  persist()
  listeners.forEach((l) => l())
}

/** Kỷ lục theo khóa (điểm cao nhất của một game). 0 nếu chưa có. */
export function getRecord(key: string): number {
  return getSnapshot().records[key] ?? 0
}

/** Ghi kỷ lục mới nếu cao hơn kỷ lục cũ; đi theo tài khoản. */
export function setRecord(key: string, value: number) {
  if (value > getRecord(key)) updateSettings({ records: { ...getSnapshot().records, [key]: value } })
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}

function getSnapshot(): Settings {
  return (cache ??= read())
}

/** Đọc cài đặt hiện tại ngoài React (trong effect hoặc hàm xử lý), luôn là giá trị đã lưu của máy này. */
export function getSettings(): Settings {
  return getSnapshot()
}

export function useSettings(): Settings {
  return useSyncExternalStore(subscribe, getSnapshot, () => DEFAULTS)
}
