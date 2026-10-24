"use client"

import { useSyncExternalStore } from "react"

/** Đọc to bằng giọng có sẵn của trình duyệt (Web Speech API). Sau này có thể thay bằng TTS của Gemini ở API route. */
function supported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined"
}

export function useTtsSupported(): boolean {
  return useSyncExternalStore(
    () => () => {},
    supported,
    () => false,
  )
}

export function speak(text: string, rate = 0.9) {
  if (!supported()) return
  const synth = window.speechSynthesis
  synth.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = "en-US"
  u.rate = rate
  const voice = synth.getVoices().find((v) => v.lang.toLowerCase().startsWith("en"))
  if (voice) u.voice = voice
  synth.speak(u)
}

export function stopSpeaking() {
  if (supported()) window.speechSynthesis.cancel()
}
