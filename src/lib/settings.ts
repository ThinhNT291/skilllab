"use client"

import { useSyncExternalStore } from "react"

export type Skin = "explore" | "adventure" | "space"
export const SKINS: { id: Skin; label: string }[] = [
  { id: "explore", label: "Khám phá" },
  { id: "adventure", label: "Phiêu lưu" },
  { id: "space", label: "Không gian" },
]

export interface Settings {
  skin: Skin
  sound: boolean
}

const KEY = "skilllab.settings"
const DEFAULTS: Settings = { skin: "explore", sound: true }
const listeners = new Set<() => void>()
let cache: Settings | null = null

function read(): Settings {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const p = JSON.parse(raw) as Partial<Settings>
      const skin = SKINS.some((s) => s.id === p.skin) ? (p.skin as Skin) : DEFAULTS.skin
      return { skin, sound: p.sound !== false }
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

export function useSettings(): Settings {
  return useSyncExternalStore(subscribe, getSnapshot, () => DEFAULTS)
}
