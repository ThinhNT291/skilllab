"use client"

import { dayKey } from "@/lib/analytics/activity"

/** Số thẻ mới đã ôn hôm nay, nhớ trên trình duyệt này (tiện ích theo máy, mất đi cũng chỉ khiến hôm nay được thêm thẻ mới). */
const KEY = "skilllab.srs.newToday"

interface Stored {
  day: string
  ids: string[]
}

function read(): Stored {
  const today = dayKey(new Date())
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const s = JSON.parse(raw) as Stored
      if (s.day === today && Array.isArray(s.ids)) return s
    }
  } catch {
    // bỏ qua: dùng mặc định
  }
  return { day: today, ids: [] }
}

export function newCardsDoneToday(): number {
  return read().ids.length
}

export function markNewCardDone(id: string) {
  const s = read()
  if (s.ids.includes(id)) return
  try {
    localStorage.setItem(KEY, JSON.stringify({ day: s.day, ids: [...s.ids, id] }))
  } catch {
    // trình duyệt chặn lưu trữ: bỏ qua
  }
}
