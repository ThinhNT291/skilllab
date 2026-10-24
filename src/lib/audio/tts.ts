"use client"

import { useSyncExternalStore } from "react"

/** Đọc to: ưu tiên giọng Gemini TTS qua /api/tts, không được thì dùng giọng có sẵn của trình duyệt (Web Speech API). */
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

const clips = new Map<string, string>()
let geminiOff = false
let current: HTMLAudioElement | null = null

function speakWithBrowser(text: string, rate: number) {
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

async function clipFor(text: string): Promise<string | null> {
  const cached = clips.get(text)
  if (cached) return cached
  const res = await fetch("/api/tts", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text }) })
  if (res.status === 503) geminiOff = true
  if (!res.ok) return null
  const url = URL.createObjectURL(await res.blob())
  clips.set(text, url)
  return url
}

export async function speak(text: string, rate = 0.9) {
  stopSpeaking()
  if (!geminiOff && typeof Audio !== "undefined") {
    try {
      const url = await clipFor(text)
      if (url) {
        const audio = new Audio(url)
        audio.playbackRate = rate / 0.9
        current = audio
        await audio.play()
        return
      }
    } catch {
      /* rơi xuống giọng của trình duyệt */
    }
  }
  speakWithBrowser(text, rate)
}

export function stopSpeaking() {
  current?.pause()
  current = null
  if (supported()) window.speechSynthesis.cancel()
}
