/** Tách bài nghe thành các đoạn đọc: lời thoại "A:", "B:" mỗi người một giọng, phần còn lại do người dẫn đọc. Hàm thuần. */
export interface SpeechPart {
  text: string
  /** 0 = người dẫn/người nói thứ nhất, 1 = người nói thứ hai, 2 = thứ ba … */
  speaker: number
}

const LABEL = /^\s*([A-Z][A-Za-z]{0,11})\s*:\s*(.+)$/

export function parseDialogue(transcript: string): SpeechPart[] {
  const parts: SpeechPart[] = []
  const speakers = new Map<string, number>()
  for (const raw of transcript.split(/\n+/)) {
    const line = raw.trim()
    if (!line) continue
    const m = LABEL.exec(line)
    if (!m) {
      parts.push({ text: line, speaker: 0 })
      continue
    }
    if (!speakers.has(m[1])) speakers.set(m[1], speakers.size)
    parts.push({ text: m[2].trim(), speaker: speakers.get(m[1])! })
  }
  return parts
}

/** Giọng Gemini TTS dùng cho từng người nói (xoay vòng nếu có nhiều người). */
export const VOICES = ["Kore", "Puck", "Zephyr", "Charon"] as const
export const voiceFor = (speaker: number): (typeof VOICES)[number] => VOICES[speaker % VOICES.length]
