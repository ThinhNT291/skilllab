"use client"

import { useSyncExternalStore } from "react"

/**
 * Nhận dạng giọng nói của trình duyệt (Web Speech API) cho câu đọc to. Ứng dụng KHÔNG ghi âm hay lưu âm thanh;
 * một số trình duyệt gửi giọng nói tới nhà cung cấp của chúng để nhận dạng (nên giao diện có ghi chú). Chrome/Edge tốt, Safari hạn chế, Firefox không có.
 */
interface RecognitionResultAlt {
  transcript: string
}
interface RecognitionEvent {
  results: ArrayLike<ArrayLike<RecognitionResultAlt>>
}
interface Recognition {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  continuous: boolean
  onresult: ((e: RecognitionEvent) => void) | null
  onerror: ((e: { error?: string }) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
  abort(): void
}
type RecognitionCtor = new () => Recognition

function ctor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export function useSttSupported(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => ctor() !== null,
    () => false,
  )
}

export type ListenError = "denied" | "no-speech" | "unavailable" | "other"

export interface Listening {
  /** Dừng nghe sớm và lấy kết quả đang có */
  stop: () => void
}

/** Nghe một lần. Gọi đúng một trong `onDone` (kèm các cách nghe, tốt nhất trước) hoặc `onError`. */
export function listenOnce(handlers: { onDone: (alternatives: string[]) => void; onError: (e: ListenError) => void }): Listening | null {
  const C = ctor()
  if (!C) {
    handlers.onError("unavailable")
    return null
  }
  const rec = new C()
  rec.lang = "en-US"
  rec.interimResults = false
  rec.continuous = false
  rec.maxAlternatives = 3
  let finished = false
  let heard: string[] = []
  const finish = (error?: ListenError) => {
    if (finished) return
    finished = true
    if (error) handlers.onError(error)
    else if (heard.length) handlers.onDone(heard)
    else handlers.onError("no-speech")
  }
  rec.onresult = (e) => {
    const first = e.results[0]
    if (first) heard = Array.from(first).map((a) => a.transcript.trim()).filter(Boolean)
  }
  rec.onerror = (e) => finish(e.error === "not-allowed" || e.error === "service-not-allowed" ? "denied" : e.error === "no-speech" || e.error === "aborted" ? "no-speech" : "other")
  rec.onend = () => finish()
  try {
    rec.start()
  } catch {
    finish("other")
    return null
  }
  return { stop: () => rec.stop() }
}
