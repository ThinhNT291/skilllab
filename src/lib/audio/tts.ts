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

async function clipFor(text: string, voice?: string): Promise<string | null> {
  const key = `${voice ?? ""}|${text}`
  const cached = clips.get(key)
  if (cached) return cached
  const res = await fetch("/api/tts", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text, voice }) })
  if (res.status === 503) geminiOff = true
  if (!res.ok) return null
  const url = URL.createObjectURL(await res.blob())
  clips.set(key, url)
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

let sequenceId = 0

/** Đọc một bài nghe nhiều lượt lời: mỗi người một giọng Gemini, nối tiếp nhau; lỗi thì đọc cả bài bằng giọng trình duyệt. Trả về khi đọc xong hoặc bị dừng. */
export async function speakDialogue(parts: { text: string; speaker: number }[], rate = 0.9): Promise<void> {
  stopSpeaking()
  const id = ++sequenceId
  const voices = ["Kore", "Puck", "Zephyr", "Charon"]
  if (!geminiOff && typeof Audio !== "undefined") {
    try {
      for (const part of parts) {
        if (id !== sequenceId) return
        const url = await clipFor(part.text, voices[part.speaker % voices.length])
        if (!url) throw new Error("no clip")
        if (id !== sequenceId) return
        const audio = new Audio(url)
        audio.playbackRate = rate / 0.9
        current = audio
        await new Promise<void>((resolve, reject) => {
          audio.onended = () => resolve()
          audio.onerror = () => reject(new Error("play"))
          audio.play().catch(reject)
        })
        // Nghỉ ngắn giữa các lượt lời
        await new Promise((r) => setTimeout(r, 250))
      }
      return
    } catch {
      if (id !== sequenceId) return
    }
  }
  speakWithBrowser(parts.map((p) => p.text).join(" "), rate)
}

export function cancelSpeech() {
  sequenceId++
  stopSpeaking()
}
