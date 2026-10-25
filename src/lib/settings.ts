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
  /** Mức nhớ mục tiêu của FSRS (0.85 / 0.9 / 0.95) */
  retention: number
  /** Đã qua màn chọn nhân vật và bộ giao diện lần đầu chưa */
  onboarded: boolean
}

const KEY = "skilllab.settings"
const DEFAULTS: Settings = { skin: "explore", sound: true, fontSize: "md", showBac: false, dailyGoal: 10, newPerDay: 10, character: "owl", ageSet: "kids", srsAlgorithm: "fsrs", retention: 0.9, onboarded: false }
const listeners = new Set<() => void>()
let cache: Settings | null = null

function read(): Settings {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const p = JSON.parse(raw) as Partial<Settings>
      const skin = SKINS.some((s) => s.id === p.skin) ? (p.skin as Skin) : DEFAULTS.skin
      const dailyGoal = (DAILY_GOALS as readonly number[]).includes(p.dailyGoal as number) ? (p.dailyGoal as number) : DEFAULTS.dailyGoal
      const newPerDay = (NEW_CARD_LIMITS as readonly number[]).includes(p.newPerDay as number) ? (p.newPerDay as number) : DEFAULTS.newPerDay
      const fontSize = FONT_SIZES.some((f) => f.id === p.fontSize) ? (p.fontSize as FontSize) : DEFAULTS.fontSize
      const character = CHARACTERS.some((c) => c.id === p.character) ? (p.character as Character) : DEFAULTS.character
      const ageSet = AGE_SETS.some((a) => a.id === p.ageSet) ? (p.ageSet as AgeSet) : DEFAULTS.ageSet
      return { skin, sound: p.sound !== false, fontSize, showBac: p.showBac === true, dailyGoal, newPerDay, character, ageSet, srsAlgorithm: p.srsAlgorithm === "sm2" ? "sm2" : "fsrs", retention: (RETENTIONS as readonly number[]).includes(p.retention as number) ? (p.retention as number) : DEFAULTS.retention, onboarded: p.onboarded === true }
    }
  } catch {
    // Trình duyệt chặn lưu trữ: dùng mặc định
  }
  return DEFAULTS
}

export function updateSettings(patch: Partial<Settings>) {
  cache = { ...(cache ?? read()), ...patch }
  try {
    localStorage.setItem(KEY, JSON.stringify(cache))
  } catch {
    // Bỏ qua: cài đặt chỉ giữ trong phiên này
  }
  listeners.forEach((l) => l())
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
